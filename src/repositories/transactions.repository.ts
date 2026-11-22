import { supabase } from '../lib/supabase';
import { fromSupabaseError, type Result, type SupabaseError } from '../utils/result';
import type { Transaction, TransactionDetail, TransactionType } from '../types';
import { assetsRepository } from './assets.repository';
import { monthStart } from '../utils/monthStart';

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
  /** The asset an investment feeds (transfer with no destination account). */
  asset_id?: string | null;
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

// ─── Paging ─────────────────────────────────────────────────────────────

/**
 * Rows per request. PostgREST silently truncates a response at the project's
 * Max Rows (Supabase default 1,000), so any read that must see every row asks
 * for pages of this size until a short page comes back (AUDIT-2026-11 B4).
 */
const PAGE_SIZE = 1000;

/**
 * Reads every row of a query, a page at a time. `page` must build a fresh,
 * fully ordered query (with a unique tie-break such as `id`) for the given
 * inclusive range, so pages neither overlap nor skip rows.
 */
export async function fetchAllPages<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<{ data: T[]; error: unknown }> {
  const out: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await page(from, from + PAGE_SIZE - 1);
    if (error) return { data: out, error };
    const rows = data ?? [];
    out.push(...rows);
    if (rows.length < PAGE_SIZE) return { data: out, error: null };
  }
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
 * For writes that insert transactions outside this repository, i.e. inside a
 * database function (`approve_recurring_occurrence`). Listeners such as the
 * daily-budget widget still need to hear about them.
 */
export function notifyTransactionsChanged(): void {
  emitTransactionsChanged();
}

/**
 * Takes a deleted investment back out of the asset it fed.
 *
 * An investment is stored as a transfer with no destination account, with the
 * asset's name in the category column (see add-transaction.tsx). The account
 * side is reversed by `applyBalanceEffect` like any other transfer; this is the
 * other half, so deleting one doesn't leave the asset permanently inflated.
 *
 * The value moves through `adjust_asset_value` (AUDIT #18): one atomic
 * statement that also records this month's point on the trend chart, which
 * the old read-modify-write here never did.
 */
async function reverseInvestment(
  tx: Pick<Transaction, 'type' | 'amount' | 'category' | 'to_account_id' | 'asset_id'>,
) {
  if (tx.type !== 'transfer' || tx.to_account_id) return;

  // The asset is linked by id since migration 20261116 (AUDIT #18 part 2).
  // Rows the backfill couldn't place still carry only the name.
  let assetId = tx.asset_id ?? null;
  if (!assetId) {
    if (!tx.category) return;
    const { data: asset } = await supabase
      .from('assets')
      .select('id')
      .eq('name', tx.category)
      .eq('is_active', true)
      .maybeSingle();
    if (!asset) return;
    assetId = asset.id as string;
  }

  const res = await assetsRepository.adjustValue(assetId, -Number(tx.amount), monthStart(new Date()));
  if (!res.ok) {
    console.error('[investment] asset value was not reduced for a deleted investment:', res.error.message);
  }
}

export const transactionsRepository = {
  /**
   * The balance-moving fields of every transaction dated on or after `startYmd`
   * (Cashflow net worth trend: rolls account balances back month by month).
   */
  async fetchLegsSince(startYmd: string): Promise<Result<{ type: string; amount: number; from_account_id: string | null; to_account_id: string | null; date: string }[], SupabaseError>> {
    const { data, error } = await fetchAllPages<{ type: string; amount: number; from_account_id: string | null; to_account_id: string | null; date: string }>((from, to) => supabase
      .from('transactions')
      .select('id, type, amount, from_account_id, to_account_id, date')
      .gte('date', startYmd)
      .order('date', { ascending: true })
      .order('id')
      .range(from, to));
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data };
  },

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

  /**
   * Total of the expenses dated from `startYmd` to `endYmd` inclusive (local
   * 'YYYY-MM-DD'). The monthly figure behind the Budget widget and the live
   * budget notification; narrow for the same reason as `sumExpensesOn`.
   */
  async sumExpensesBetween(startYmd: string, endYmd: string): Promise<Result<number, SupabaseError>> {
    const { data, error } = await supabase
      .from('transactions')
      .select('amount')
      .eq('type', 'expense')
      .gte('date', startYmd)
      .lte('date', endYmd);
    if (error) return { ok: false, error: fromSupabaseError(error) };
    const total = (data ?? []).reduce((sum, row: { amount: number | string }) => sum + (Number(row.amount) || 0), 0);
    return { ok: true, data: Math.round(total * 100) / 100 };
  },

  /** Every transaction, newest first, with account names joined (Settings › Data › Export). */
  async fetchAll(): Promise<Result<Transaction[], SupabaseError>> {
    const { data, error } = await fetchAllPages<Transaction>((from, to) => supabase
      .from('transactions')
      .select(`
        *,
        from_account:accounts!from_account_id(id, name, type),
        to_account:accounts!to_account_id(id, name, type)
      `)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .order('id')
      .range(from, to));
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data };
  },

  /** How many transactions the user has (reset confirmation copy). */
  async countAll(): Promise<Result<number, SupabaseError>> {
    const { count, error } = await supabase.from('transactions').select('id', { count: 'exact', head: true });
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: count ?? 0 };
  },

  /** 'YYYY-MM-DD' of the earliest transaction, or null with none (Income split's first month). */
  async fetchFirstDate(): Promise<Result<string | null, SupabaseError>> {
    const { data, error } = await supabase.from('transactions').select('date').order('date', { ascending: true }).limit(1).maybeSingle();
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data?.date ?? null };
  },

  async fetchByAccount(accountId: string): Promise<Result<Transaction[], SupabaseError>> {
    const { data, error } = await fetchAllPages<Transaction>((from, to) => supabase
      .from('transactions')
      .select(`
        *,
        from_account:accounts!from_account_id(id, name, type),
        to_account:accounts!to_account_id(id, name, type)
      `)
      .or(`from_account_id.eq.${accountId},to_account_id.eq.${accountId}`)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .order('id')
      .range(from, to));
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data };
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
        // Only sent when set, so ordinary transactions don't depend on the
        // 20261116 migration having added the column.
        ...(req.asset_id !== undefined ? { asset_id: req.asset_id } : {}),
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

    // The row is written first: if that fails nothing has moved, whereas
    // reversing the old effect before a failed write left the account off by
    // the original amount.
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
        ...(req.asset_id !== undefined ? { asset_id: req.asset_id } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    if (error) return { ok: false, error: fromSupabaseError(error) };

    const reverseError = await applyBalanceEffect(
      old as BalanceShape,
      -1,
    );
    if (reverseError) reportBalanceFailure(reverseError);

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
      // '*' rather than naming asset_id: works before and after the 20261116
      // migration adds that column.
      .select('*')
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
    await reverseInvestment(tx as Pick<Transaction, 'type' | 'amount' | 'category' | 'to_account_id' | 'asset_id'>);

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