import { supabase } from '../lib/supabase';
import type { Result } from '../utils/result';
import { fromSupabaseError } from '../utils/result';
import type { SupabaseError } from '../utils/result';
import type { Transaction, TransactionDetail, TransactionType } from '../types';

export interface CreateTransactionRequest {
  user_id: string;
  type: TransactionType;
  name: string;
  amount: number;
  category?: string;
  from_account_id?: string;
  to_account_id?: string;
  date: string;
  note?: string;
  receipt_url?: string;
  is_recurring?: boolean;
  recurring_id?: string;
}

export const transactionsRepository = {
  async fetchByMonth(year: number, month: number): Promise<Result<Transaction[], SupabaseError>> {
    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const end = new Date(year, month, 0).toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('transactions')
      .select()
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: false });
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as Transaction[] };
  },

  async fetchByAccount(accountId: string): Promise<Result<Transaction[], SupabaseError>> {
    const { data, error } = await supabase
      .from('transactions')
      .select()
      .or(`from_account_id.eq.${accountId},to_account_id.eq.${accountId}`)
      .order('date', { ascending: false });
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as Transaction[] };
  },

  async fetchDetail(id: string): Promise<Result<TransactionDetail, SupabaseError>> {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        from_account:accounts!from_account_id(id, name, type),
        to_account:accounts!to_account_id(id, name, type),
        recurring:recurring_rules(frequency, start_date, end_date, reminder_enabled)
      `)
      .eq('id', id)
      .single();
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as TransactionDetail };
  },

  async create(req: CreateTransactionRequest): Promise<Result<Transaction, SupabaseError>> {
    const { data: tx, error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id: req.user_id,
        type: req.type,
        name: req.name,
        amount: req.amount,
        category: req.category,
        from_account_id: req.from_account_id,
        to_account_id: req.to_account_id,
        date: req.date,
        note: req.note,
        receipt_url: req.receipt_url,
        is_recurring: req.is_recurring ?? false,
        recurring_id: req.recurring_id,
      })
      .select()
      .single();
    if (txError) return { ok: false, error: fromSupabaseError(txError) };

    if (req.type === 'tabung_topup' && req.to_account_id) {
      const { data: tabung } = await supabase
        .from('tabung_accounts')
        .select('saved_amount')
        .eq('account_id', req.to_account_id)
        .single();
      if (tabung) {
        await supabase
          .from('tabung_accounts')
          .update({ saved_amount: tabung.saved_amount + req.amount })
          .eq('account_id', req.to_account_id);
      }
    } else if (req.type === 'tabung_withdraw' && req.to_account_id) {
      const { data: tabung } = await supabase
        .from('tabung_accounts')
        .select('saved_amount')
        .eq('account_id', req.to_account_id)
        .single();
      if (tabung) {
        await supabase
          .from('tabung_accounts')
          .update({ saved_amount: tabung.saved_amount - req.amount })
          .eq('account_id', req.to_account_id);
      }
    }

    return { ok: true, data: tx as Transaction };
  },

  async update(id: string, patch: Partial<Transaction>): Promise<Result<Transaction, SupabaseError>> {
    const { data, error } = await supabase
      .from('transactions')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as Transaction };
  },

  async delete(id: string): Promise<Result<void, SupabaseError>> {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: undefined };
  },
};