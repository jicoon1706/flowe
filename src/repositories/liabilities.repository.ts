import { supabase } from '../lib/supabase';
import { fromSupabaseError, type Result, type SupabaseError } from '../utils/result';
import { monthStart } from '../utils/monthStart';
import type { Liability, LiabilityType } from '../types';

export interface CreateLiabilityRequest {
  user_id: string;
  name: string;
  type: LiabilityType;
  icon?: string;
  amount_owed: number;
  monthly_payment: number;
  interest_rate?: number;
  note?: string;
  /**
   * Month ('YYYY-MM-01') the opening balance is recorded against in the value
   * history. Defaults to the current month.
   */
  as_of_month?: string;
}

/**
 * Writes "this much was owed as of `month`" into the history, replacing any
 * earlier entry for the same month.
 */
async function recordValue(
  liabilityId: string,
  userId: string,
  month: string,
  amountOwed: number,
): Promise<Result<void, SupabaseError>> {
  const { error } = await supabase
    .from('liability_values')
    .upsert(
      { liability_id: liabilityId, user_id: userId, month, amount_owed: amountOwed, updated_at: new Date().toISOString() },
      { onConflict: 'liability_id,month' },
    );
  if (error) return { ok: false, error: fromSupabaseError(error) };
  return { ok: true, data: undefined };
}

/** Whether the history already holds a balance for a month after `month`. */
async function hasLaterValue(liabilityId: string, month: string): Promise<Result<boolean, SupabaseError>> {
  const { count, error } = await supabase
    .from('liability_values')
    .select('id', { count: 'exact', head: true })
    .eq('liability_id', liabilityId)
    .gt('month', month);
  if (error) return { ok: false, error: fromSupabaseError(error) };
  return { ok: true, data: (count ?? 0) > 0 };
}

export const liabilitiesRepository = {
  async fetchAll(): Promise<Result<Liability[], SupabaseError>> {
    const { data, error } = await supabase
      .from('liabilities')
      .select()
      .eq('is_active', true)
      .order('amount_owed', { ascending: false });
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as Liability[] };
  },

  async create(req: CreateLiabilityRequest): Promise<Result<Liability, SupabaseError>> {
    const { data, error } = await supabase
      .from('liabilities')
      .insert({
        user_id: req.user_id,
        name: req.name,
        type: req.type,
        icon: req.icon,
        amount_owed: req.amount_owed,
        monthly_payment: req.monthly_payment,
        interest_rate: req.interest_rate ?? 0,
        note: req.note,
      })
      .select()
      .single();
    if (error) return { ok: false, error: fromSupabaseError(error) };
    const liability = data as Liability;

    const hist = await recordValue(
      liability.id,
      req.user_id,
      req.as_of_month ?? monthStart(new Date()),
      req.amount_owed,
    );
    if (!hist.ok) return hist;
    return { ok: true, data: liability };
  },

  /**
   * Updates a liability. When `asOfMonth` is given and the patch carries a
   * balance, it is also recorded in the history for that month. The row's own
   * `amount_owed` only follows when no later month has been recorded, so
   * filling in August after September is already known leaves September alone.
   */
  async update(id: string, patch: Partial<Liability>, asOfMonth?: string): Promise<Result<Liability, SupabaseError>> {
    let rowPatch: Partial<Liability> = patch;

    if (asOfMonth && patch.amount_owed != null) {
      const later = await hasLaterValue(id, asOfMonth);
      if (!later.ok) return later;
      if (later.data) {
        const { amount_owed: _a, ...rest } = patch;
        rowPatch = rest;
      }
    }

    const { data, error } = await supabase
      .from('liabilities')
      .update({ ...rowPatch, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) return { ok: false, error: fromSupabaseError(error) };
    const liability = data as Liability;

    if (asOfMonth && patch.amount_owed != null) {
      const hist = await recordValue(id, liability.user_id, asOfMonth, patch.amount_owed);
      if (!hist.ok) return hist;
    }
    return { ok: true, data: liability };
  },

  async softDelete(id: string): Promise<Result<void, SupabaseError>> {
    const { error } = await supabase
      .from('liabilities')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: undefined };
  },

  async softDeleteAll(): Promise<Result<void, SupabaseError>> {
    const { error } = await supabase
      .from('liabilities')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('is_active', true);
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: undefined };
  },
};
