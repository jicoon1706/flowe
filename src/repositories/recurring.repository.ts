import { supabase } from '../lib/supabase';
import { fromSupabaseError, type Result, type SupabaseError } from '../utils/result';
import type { RecurringRule, RecurringStatus, RecurringFrequency } from '../types';

export interface CreateRecurringRuleRequest {
  user_id: string;
  type: 'expense' | 'income';
  name: string;
  amount: number;
  category?: string;
  from_account_id?: string;
  to_account_id?: string;
  frequency: RecurringFrequency;
  start_date: string;
  end_date?: string;
  next_date?: string;
  reminder_enabled?: boolean;
  reminder_offset?: 'none' | 'same_day' | '1_day' | '3_days' | '1_week';
  status?: RecurringStatus;
}

export const recurringRepository = {
  async fetchAllActive(): Promise<Result<RecurringRule[], SupabaseError>> {
    const { data, error } = await supabase
      .from('recurring_rules')
      .select()
      .in('status', ['active', 'paused'])
      .order('created_at', { ascending: false });
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as RecurringRule[] };
  },

  async create(req: CreateRecurringRuleRequest): Promise<Result<RecurringRule, SupabaseError>> {
    const { data, error } = await supabase
      .from('recurring_rules')
      .insert({
        user_id: req.user_id,
        type: req.type,
        name: req.name,
        amount: req.amount,
        category: req.category,
        from_account_id: req.from_account_id,
        to_account_id: req.to_account_id,
        frequency: req.frequency,
        start_date: req.start_date,
        end_date: req.end_date,
        next_date: req.next_date ?? req.start_date,
        reminder_enabled: req.reminder_enabled ?? false,
        reminder_offset: req.reminder_offset ?? 'none',
        status: req.status ?? 'active',
      })
      .select()
      .single();
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as RecurringRule };
  },

  async updateStatus(id: string, status: RecurringStatus): Promise<Result<void, SupabaseError>> {
    const { error } = await supabase
      .from('recurring_rules')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: undefined };
  },

  async delete(id: string): Promise<Result<void, SupabaseError>> {
    const { error } = await supabase.from('recurring_rules').delete().eq('id', id);
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: undefined };
  },
};