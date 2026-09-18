import { supabase } from '../lib/supabase';
import { fromSupabaseError, type Result, type SupabaseError } from '../utils/result';
import { monthStart, monthStartOfIso } from '../utils/monthStart';
import type { Asset, AssetType } from '../types';

export interface CreateAssetRequest {
  user_id: string;
  name: string;
  type: AssetType;
  icon?: string;
  current_value: number;
  /** Physical amount held (grams of gold, say). Omitted for unitless assets. */
  quantity?: number;
  /** Unit for `quantity`, e.g. 'g'. */
  unit?: string;
  monthly_income?: number;
  date_acquired?: string;
  note?: string;
  /**
   * Month ('YYYY-MM-01') the opening value is recorded against in the value
   * history. Defaults to the month acquired, else the current month.
   */
  as_of_month?: string;
}

/**
 * Writes "this asset was worth `value` as of `month`" into the history,
 * replacing any earlier entry for the same month.
 */
async function recordValue(
  assetId: string,
  userId: string,
  month: string,
  value: number,
  quantity?: number | null,
): Promise<Result<void, SupabaseError>> {
  const { error } = await supabase
    .from('asset_values')
    .upsert(
      { asset_id: assetId, user_id: userId, month, value, quantity: quantity ?? null, updated_at: new Date().toISOString() },
      { onConflict: 'asset_id,month' },
    );
  if (error) return { ok: false, error: fromSupabaseError(error) };
  return { ok: true, data: undefined };
}

/** Whether the history already holds a value for a month after `month`. */
async function hasLaterValue(assetId: string, month: string): Promise<Result<boolean, SupabaseError>> {
  const { count, error } = await supabase
    .from('asset_values')
    .select('id', { count: 'exact', head: true })
    .eq('asset_id', assetId)
    .gt('month', month);
  if (error) return { ok: false, error: fromSupabaseError(error) };
  return { ok: true, data: (count ?? 0) > 0 };
}

export const assetsRepository = {
  async fetchAll(): Promise<Result<Asset[], SupabaseError>> {
    const { data, error } = await supabase
      .from('assets')
      .select()
      .eq('is_active', true)
      .order('current_value', { ascending: false });
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as Asset[] };
  },

  async create(req: CreateAssetRequest): Promise<Result<Asset, SupabaseError>> {
    const { data, error } = await supabase
      .from('assets')
      .insert({
        user_id: req.user_id,
        name: req.name,
        type: req.type,
        icon: req.icon,
        current_value: req.current_value,
        quantity: req.quantity ?? null,
        unit: req.unit ?? null,
        monthly_income: req.monthly_income ?? 0,
        date_acquired: req.date_acquired,
        note: req.note,
      })
      .select()
      .single();
    if (error) return { ok: false, error: fromSupabaseError(error) };
    const asset = data as Asset;

    // Opening entry in the history, so the trend shows the asset from the
    // month it was acquired — not from whenever it happened to be typed in.
    const month =
      req.as_of_month ??
      (req.date_acquired ? monthStartOfIso(req.date_acquired) : monthStart(new Date()));
    const hist = await recordValue(asset.id, req.user_id, month, req.current_value, req.quantity);
    if (!hist.ok) return hist;
    return { ok: true, data: asset };
  },

  /**
   * Updates an asset. When `asOfMonth` is given and the patch carries a value,
   * that value is also recorded in the history for that month. The asset's own
   * `current_value` only follows when no later month has been recorded, so
   * filling in August after September is already known leaves September alone.
   */
  async update(id: string, patch: Partial<Asset>, asOfMonth?: string): Promise<Result<Asset, SupabaseError>> {
    let rowPatch: Partial<Asset> = patch;

    if (asOfMonth && patch.current_value != null) {
      const later = await hasLaterValue(id, asOfMonth);
      if (!later.ok) return later;
      if (later.data) {
        const { current_value: _v, quantity: _q, ...rest } = patch;
        rowPatch = rest;
      }
    }

    const { data, error } = await supabase
      .from('assets')
      .update({ ...rowPatch, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) return { ok: false, error: fromSupabaseError(error) };
    const asset = data as Asset;

    if (asOfMonth && patch.current_value != null) {
      const hist = await recordValue(id, asset.user_id, asOfMonth, patch.current_value, patch.quantity);
      if (!hist.ok) return hist;
    }
    return { ok: true, data: asset };
  },

  async softDelete(id: string): Promise<Result<void, SupabaseError>> {
    const { error } = await supabase
      .from('assets')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: undefined };
  },

  async softDeleteAll(): Promise<Result<void, SupabaseError>> {
    const { error } = await supabase
      .from('assets')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('is_active', true);
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: undefined };
  },
};
