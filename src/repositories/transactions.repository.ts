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
 * Moves an account's stored balance by `delta`, in one server-side statement.
 *
 * This used to be a read-modify-write from the client: select the balance, add
 * the delta in JS, write it back. Auto-detect broke that. Every captured bank
 * alert starts its own headless JS task, and the foreground app files from the
 * same queue, so two payments seconds apart would both read the pre-payment
 * balance and the second write would silently discard the first. Both
 * transactions were there; the account had only moved by one of them.
 *
 * `adjust_account_balance` (see `supabase/migrations/20260925_atomic_balance.sql`)
 * does the addition inside a single UPDATE, so Postgres' row lock serialises
 * concurrent writers and no delta can be lost. It also picks the right column
 * for the account type: bank/wallet `current_balance`, tabung `saved_amount`.
 */
async function adjustAccountBalance(accountId: string, delta: number): Promise<SupabaseError | null> {
  if (!delta) return null;
  const { error } = await supabase.rpc('adjust_account_balance', {
    p_account_id: accountId,
    p_delta: delta,
  });
  return error ? fromSupabaseError(error) : null;
}

/** The fields a balance adjustment reads. Supabase hands these back as null. */
type BalanceShape = {
  type: Transaction['type'];
  amount: number;
  from_account_id?: string | null;
  to_account_id?: string | null;
};

/**
 * Applies (or, with sign = -1, reverses) the balance impact of a transaction.
 * sign = 1 mirrors the effect of creating the transaction; sign = -1 undoes it.
 *
 * Returns the first error, or null. A failure here is not cosmetic — the
 * transaction row exists and the balance no longer matches it — so callers
 * report it rather than letting the account quietly drift.
 */
async function applyBalanceEffect(
  tx: BalanceShape,
  sign: 1 | -1,
): Promise<SupabaseError | null> {
  const amount = Number(tx.amount) * sign;
  const legs: [string, number][] = [];

  if (tx.type === 'expense' && tx.from_account_id) {
    legs.push([tx.from_account_id, -amount]);
  } else if (tx.type === 'income' && tx.to_account_id) {
    legs.push([tx.to_account_id, amount]);
  } else if (tx.type === 'transfer') {
    // A transfer with no destination account is an investment: the money leaves
    // the account for an asset, which lives outside the accounts tables and is
    // adjusted by the caller. Still not an expense — it just isn't spent.
    if (tx.from_account_id) legs.push([tx.from_account_id, -amount]);
    if (tx.to_account_id) legs.push([tx.to_account_id, amount]);
  } else if (tx.type === 'tabung_topup') {
    if (tx.to_account_id) legs.push([tx.to_account_id, amount]);
    // The jar is fed from a real account, and that account's balance drops with
    // it — money in a tabung has left the bank. Only rows that name the funding
    // account carry this leg, so a top-up against an unlinked jar behaves
    // exactly as it did before.
    if (tx.from_account_id) legs.push([tx.from_account_id, -amount]);
  } else if (tx.type === 'tabung_withdraw') {
    if (tx.to_account_id) legs.push([tx.to_account_id, -amount]);
    // The mirror of a top-up: the jar empties and the money lands back in the
    // account that funded it.
    if (tx.from_account_id) legs.push([tx.from_account_id, amount]);
  }

  for (const [accountId, delta] of legs) {
    const error = await adjustAccountBalance(accountId, delta);
    if (error) return error;
  }
  return null;
}

/**
 * Reports a balance leg that failed.
 *
 * The transaction row is already written at this point, so the account is now
 * out of step with it — the exact drift that used to happen silently. It is not
 * worth failing the whole save over (the user's payment did happen), but it must
 * be visible, and Settings → Data → Recalculate balances is the repair.
 */
function reportBalanceFailure(error: SupabaseError) {
  console.error('[balance] account balance was not moved for a saved transaction:', error.message);
}

// ─── Change notification ───────────────────────────────────────────────

// Anything that depends on the set of transactions rather than on one screen's
// state — the daily-budget home-screen widget, above all — needs to hear about
// every write, wherever it came from: the add screen, a tabung top-up, a
// recurring rule, or auto-detect filing a bank alert with the app closed.
// Watching Home's month query missed most of those.
//
// Kept as a plain listener list so this file stays free of anything native:
// `services/dailyBudget.ts` subscribes and does the pushing.
const changeListeners = new Set<() => void>();

/** Called after every transaction create / update / delete. */
export function onTransactionsChanged(listener: () => void): () => void {
  changeListeners.add(listener);
  return () => { changeListeners.delete(listener); };
}

function emitTransactionsChanged() {
  changeListeners.forEach((listener) => { try { listener(); } catch {} });
}

/**
 * Takes a deleted investment back out of the asset it fed.
 *
 * An investment is stored as a transfer with no destination account, with the
 * asset's name in the category column (see add-transaction.tsx). The account
 * side is reversed by `applyBalanceEffect` like any other transfer; this is the
 * other half, so deleting one doesn't leave the asset permanently inflated.
 */
async function reverseInvestment(
  tx: Pick<Transaction, 'type' | 'amount' | 'category' | 'to_account_id'>,
) {
  if (tx.type !== 'transfer' || tx.to_account_id || !tx.category) return;

  const { data: asset } = await supabase
    .from('assets')
    .select('id, current_value')
    .eq('name', tx.category)
    .eq('is_active', true)
    .maybeSingle();
  if (!asset) return;

  await supabase
    .from('assets')
    .update({
      current_value: Math.max(0, Number(asset.current_value) - Number(tx.amount)),
      updated_at: new Date().toISOString(),
    })
    .eq('id', asset.id);
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

  /**
   * Total of the expenses dated `ymd` (a local 'YYYY-MM-DD').
   *
   * Narrow on purpose: it is what the daily-budget widget draws, and it has to
   * be answerable right after a write from anywhere — including the headless
   * task that files a bank alert with the app closed, where no screen has a
   * month of transactions loaded to add up.
   */
  async sumExpensesOn(ymd: string): Promise<Result<number, SupabaseError>> {
    const { data, error } = await supabase
      .from('transactions')
      .select('amount')
      .eq('type', 'expense')
      .eq('date', ymd);
    if (error) return { ok: false, error: fromSupabaseError(error) };
    const total = (data ?? []).reduce((sum, row: any) => sum + (Number(row.amount) || 0), 0);
    return { ok: true, data: Math.round(total * 100) / 100 };
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

    const balanceError = await applyBalanceEffect(
      {
        type: req.type,
        amount: req.amount,
        from_account_id: req.from_account_id ?? null,
        to_account_id: req.to_account_id ?? null,
      },
      1,
    );
    if (balanceError) reportBalanceFailure(balanceError);

    emitTransactionsChanged();
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

    const reverseError = await applyBalanceEffect(
      old as BalanceShape,
      -1,
    );
    if (reverseError) reportBalanceFailure(reverseError);

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

    const applyError = await applyBalanceEffect(
      {
        type: req.type,
        amount: req.amount,
        from_account_id: req.from_account_id ?? null,
        to_account_id: req.to_account_id ?? null,
      },
      1,
    );
    if (applyError) reportBalanceFailure(applyError);

    emitTransactionsChanged();
    return { ok: true, data: data as Transaction };
  },

  async delete(id: string): Promise<Result<void, SupabaseError>> {
    // Load the transaction first so we can reverse its balance impact.
    const { data: tx, error: fetchError } = await supabase
      .from('transactions')
      .select('type, amount, category, from_account_id, to_account_id')
      .eq('id', id)
      .single();
    if (fetchError) return { ok: false, error: fromSupabaseError(fetchError) };

    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) return { ok: false, error: fromSupabaseError(error) };

    const balanceError = await applyBalanceEffect(
      tx as BalanceShape,
      -1,
    );
    if (balanceError) reportBalanceFailure(balanceError);
    await reverseInvestment(tx as Pick<Transaction, 'type' | 'amount' | 'category' | 'to_account_id'>);

    emitTransactionsChanged();
    return { ok: true, data: undefined };
  },

  /**
   * Rebuilds every account's stored balance from its opening balance plus the
   * effect of every transaction that touches it.
   *
   * The repair for an account that already drifted — which, before the balance
   * arithmetic moved into Postgres, is any account that took two auto-detected
   * payments at once. Resolves to the number of accounts rewritten.
   */
  async recalculateBalances(): Promise<Result<number, SupabaseError>> {
    const { data, error } = await supabase.rpc('recalculate_account_balances');
    if (error) return { ok: false, error: fromSupabaseError(error) };
    emitTransactionsChanged();
    return { ok: true, data: Number(data) || 0 };
  },
};