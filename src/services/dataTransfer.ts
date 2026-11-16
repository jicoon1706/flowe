import { transactionsRepository } from '../repositories/transactions.repository';
import { parseCsv, toCsv, type CsvRow } from '../lib/csv';
import type { Account, Transaction } from '../types';
import type { Result, SupabaseError } from '../utils/result';

type WithNames = Transaction & { from_account?: { name: string } | null; to_account?: { name: string } | null };

/** Every transaction as Flowe CSV text. */
export async function exportTransactionsCsv(): Promise<Result<{ csv: string; count: number }, SupabaseError>> {
  const res = await transactionsRepository.fetchAll();
  if (!res.ok) return res;
  const rows: CsvRow[] = (res.data as WithNames[]).map((t) => ({
    date: t.date.slice(0, 10),
    type: t.type,
    name: t.name,
    category: t.category ?? '',
    amount: Number(t.amount),
    from_account: t.from_account?.name ?? '',
    to_account: t.to_account?.name ?? '',
    note: t.note ?? '',
  }));
  return { ok: true, data: { csv: toCsv(rows), count: rows.length } };
}

export interface ImportSummary {
  imported: number;
  /** Lines skipped as unreadable, plus rows whose account isn't one of the user's. */
  skipped: number;
}

/**
 * Imports a Flowe CSV. Accounts are matched by name (case-insensitive); a row
 * naming an account the user doesn't have is skipped rather than filed into a
 * guess. Each row goes through the normal create, so balances move with it.
 */
export async function importTransactionsCsv(userId: string, text: string, accounts: Account[]): Promise<Result<ImportSummary, SupabaseError>> {
  let parsed;
  try {
    parsed = parseCsv(text);
  } catch {
    return { ok: false, error: { code: 'BAD_FILE', message: 'Not a Flowe CSV' } };
  }
  const byName = new Map(accounts.map((a) => [a.name.trim().toLowerCase(), a.id]));
  const idFor = (name: string) => (name ? byName.get(name.trim().toLowerCase()) : undefined);
  let imported = 0;
  let skipped = parsed.skipped.length;
  for (const r of parsed.rows) {
    const from = idFor(r.from_account);
    const to = idFor(r.to_account);
    if ((r.from_account && !from) || (r.to_account && !to)) { skipped += 1; continue; }
    const res = await transactionsRepository.create({
      user_id: userId,
      type: r.type,
      name: r.name,
      amount: r.amount,
      category: r.category || undefined,
      from_account_id: from,
      to_account_id: to,
      date: r.date,
      note: r.note || undefined,
    });
    if (res.ok) imported += 1;
    else skipped += 1;
  }
  return { ok: true, data: { imported, skipped } };
}
