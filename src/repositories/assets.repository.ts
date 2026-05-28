import { supabase } from '../lib/supabase';
import { fromSupabaseError, type Result, type SupabaseError } from '../utils/result';
import type { Asset, AssetType } from '../types';

export interface CreateAssetRequest {
  user_id: string;
  name: string;
  type: AssetType;
  icon?: string;
  current_value: number;
  monthly_income?: number;
  date_acquired?: string;
  note?: string;
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
        monthly_income: req.monthly_income ?? 0,
        date_acquired: req.date_acquired,
        note: req.note,
      })
      .select()
      .single();
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as Asset };
  },

  async update(id: string, patch: Partial<Asset>): Promise<Result<Asset, SupabaseError>> {
    const { data, error } = await supabase
      .from('assets')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as Asset };
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