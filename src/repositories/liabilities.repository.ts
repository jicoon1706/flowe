import { supabase } from '../lib/supabase';
import type { Result } from '../utils/result';
import { fromSupabaseError } from '../utils/result';
import type { SupabaseError } from '../utils/result';
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
    return { ok: true, data: data as Liability };
  },

  async update(id: string, patch: Partial<Liability>): Promise<Result<Liability, SupabaseError>> {
    const { data, error } = await supabase
      .from('liabilities')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as Liability };
  },

  async softDelete(id: string): Promise<Result<void, SupabaseError>> {
    const { error } = await supabase
      .from('liabilities')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: undefined };
  },
};