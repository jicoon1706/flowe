import { supabase } from '../lib/supabase';
import { fromSupabaseError, type Result, type SupabaseError } from '../utils/result';
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

/**
 * Adjusts an account's stored balance by `delta`, writing to whichever
 * balance table matches the account's type:
 *   - bank   → bank_accounts.current_balance
 *   - wallet → wallet_accounts.current_balance
 *   - tabung → tabung_accounts.saved_amount
 */
async function adjustAccountBalance(accountId: string, delta: number) {
  const { data: account } = await supabase
    .from('accounts')
    .select('type')
    .eq('id', accountId)
    .single();
  if (!account) return;

  if (account.type === 'bank') {
    const { data: bank } = await supabase
      .from('bank_accounts')
      .select('current_balance')
      .eq('account_id', accountId)
      .single();
    if (bank) {
      await supabase
        .from('bank_accounts')
        .update({ current_balance: Number(bank.current_balance) + delta })
        .eq('account_id', accountId);
    }
  } else if (account.type === 'wallet') {
    const { data: wallet } = await supabase
      .from('wallet_accounts')
      .select('current_balance')
      .eq('account_id', accountId)
      .single();
    if (wallet) {
      await supabase
        .from('wallet_accounts')
        .update({ current_balance: Number(wallet.current_balance) + delta })
        .eq('account_id', accountId);
    }
  } else if (account.type === 'tabung') {
    const { data: tabung } = await supabase
      .from('tabung_accounts')
      .select('saved_amount')
      .eq('account_id', accountId)
      .single();
    if (tabung) {
      await supabase
        .from('tabung_accounts')
        .update({ saved_amount: Number(tabung.saved_amount) + delta })
        .eq('account_id', accountId);
    }
  }
}

/**
 * Applies (or, with sign = -1, reverses) the balance impact of a transaction.
 * sign = 1 mirrors the effect of creating the transaction; sign = -1 undoes it.
 */
async function applyBalanceEffect(
  tx: Pick<Transaction, 'type' | 'amount' | 'from_account_id' | 'to_account_id'>,
  sign: 1 | -1,
) {
  const amount = Number(tx.amount) * sign;
  if (tx.type === 'expense' && tx.from_account_id) {
    await adjustAccountBalance(tx.from_account_id, -amount);
  } else if (tx.type === 'income' && tx.to_account_id) {
    await adjustAccountBalance(tx.to_account_id, amount);
  } else if (tx.type === 'transfer' && tx.from_account_id && tx.to_account_id) {
    await adjustAccountBalance(tx.from_account_id, -amount);
    await adjustAccountBalance(tx.to_account_id, amount);
  } else if (tx.type === 'tabung_topup' && tx.to_account_id) {
    await adjustAccountBalance(tx.to_account_id, amount);
  } else if (tx.type === 'tabung_withdraw' && tx.to_account_id) {
    await adjustAccountBalance(tx.to_account_id, -amount);
  }
}

export const transactionsRepository = {
  async fetchByMonth(year: number, month: number): Promise<Result<Transaction[], SupabaseError>> {
    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        from_account:accounts!from_account_id(id, name, type),
        to_account:accounts!to_account_id(id, name, type)
      `)
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as Transaction[] };
  },

  async fetchByAccount(accountId: string): Promise<Result<Transaction[], SupabaseError>> {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        from_account:accounts!from_account_id(id, name, type),
        to_account:accounts!to_account_id(id, name, type)
      `)
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

    await applyBalanceEffect(
      {
        type: req.type,
        amount: req.amount,
        from_account_id: req.from_account_id ?? null,
        to_account_id: req.to_account_id ?? null,
      },
      1,
    );

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

  /**
   * Updates a transaction while keeping account balances consistent: the old
   * transaction's balance impact is reversed before the new values are written,
   * then the new impact is applied. Use this (not `update`) when amount, type,
   * or accounts may change.
   */
  async updateWithBalance(
    id: string,
    req: CreateTransactionRequest,
  ): Promise<Result<Transaction, SupabaseError>> {
    // Load the existing row so we can reverse its balance impact first.
    const { data: old, error: fetchError } = await supabase
      .from('transactions')
      .select('type, amount, from_account_id, to_account_id')
      .eq('id', id)
      .single();
    if (fetchError) return { ok: false, error: fromSupabaseError(fetchError) };

    await applyBalanceEffect(old as Pick<Transaction, 'type' | 'amount' | 'from_account_id' | 'to_account_id'>, -1);

    const { data, error } = await supabase
      .from('transactions')
      .update({
        type: req.type,
        name: req.name,
        amount: req.amount,
        category: req.category,
        from_account_id: req.from_account_id ?? null,
        to_account_id: req.to_account_id ?? null,
        date: req.date,
        note: req.note ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    if (error) return { ok: false, error: fromSupabaseError(error) };

    await applyBalanceEffect(
      {
        type: req.type,
        amount: req.amount,
        from_account_id: req.from_account_id ?? null,
        to_account_id: req.to_account_id ?? null,
      },
      1,
    );

    return { ok: true, data: data as Transaction };
  },

  async delete(id: string): Promise<Result<void, SupabaseError>> {
    // Load the transaction first so we can reverse its balance impact.
    const { data: tx, error: fetchError } = await supabase
      .from('transactions')
      .select('type, amount, from_account_id, to_account_id')
      .eq('id', id)
      .single();
    if (fetchError) return { ok: false, error: fromSupabaseError(fetchError) };

    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) return { ok: false, error: fromSupabaseError(error) };

    await applyBalanceEffect(tx as Pick<Transaction, 'type' | 'amount' | 'from_account_id' | 'to_account_id'>, -1);

    return { ok: true, data: undefined };
  },
};