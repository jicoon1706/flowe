/** Cashflow maths for the bubbles and cashflow/info. Pure; shared with desktop. */
import { roundCents } from './money';

export interface CategoryShare {
  category: string;
  amount: number;
  /** 0..1 of total spend. */
  share: number;
}

/** Expenses grouped by category, largest first. */
export function spendByCategory(rows: { type: string; amount: number; category?: string | null }[]): { total: number; items: CategoryShare[] } {
  const totals = new Map<string, number>();
  for (const r of rows) {
    if (r.type !== 'expense') continue;
    const key = r.category || 'others';
    totals.set(key, (totals.get(key) ?? 0) + Number(r.amount));
  }
  const total = roundCents([...totals.values()].reduce((s, v) => s + v, 0));
  const items = [...totals.entries()]
    .map(([category, amount]) => ({ category, amount: roundCents(amount), share: total > 0 ? amount / total : 0 }))
    .sort((a, b) => b.amount - a.amount);
  return { total, items };
}

export type FinancialClass = 'poor' | 'middle' | 'rich';

/**
 * The cashflow pattern (Rich Dad): rich when asset income covers expenses,
 * poor with no assets at all, middle otherwise.
 */
export function financialClass(totalAssets: number, passiveIncome: number, expenses: number): FinancialClass {
  if (totalAssets <= 0) return 'poor';
  if (passiveIncome >= expenses && expenses > 0) return 'rich';
  return 'middle';
}

/** "assets cover 2.5× debts" — null without debts. */
export function coverRatio(assets: number, liabilities: number): number | null {
  if (liabilities <= 0) return null;
  return Math.round((assets / liabilities) * 10) / 10;
}

export const CLASS_LABEL: Record<FinancialClass, string> = { poor: 'Poor', middle: 'Middle class', rich: 'Rich' };

/** The fields of a transaction that decide how it moves account balances. */
export interface BalanceRow {
  type: string;
  amount: number | string;
  from_account_id?: string | null;
  to_account_id?: string | null;
}

/**
 * The "x% this month" chip: how far the bank + wallet balance moved since the
 * month began, as a percentage of where it began. Null when it can't be told
 * (no movement, or a starting balance of zero or less).
 *
 * The start is `balance − net`, where net counts every leg that touched one of
 * the `spendableIds` accounts — the same legs `applyBalanceEffect` moves. Top-ups
 * and pay-outs (funding leg) and investments (a transfer with no destination)
 * move that balance too; counting only income − expense left them out
 * (AUDIT-2026-11 B5).
 */
export function monthChangePct(balance: number, rows: BalanceRow[], spendableIds: Iterable<string>): number | null {
  const ids = new Set(spendableIds);
  let net = 0;
  for (const t of rows) {
    const amount = Number(t.amount) || 0;
    const from = !!t.from_account_id && ids.has(t.from_account_id);
    const to = !!t.to_account_id && ids.has(t.to_account_id);
    if (t.type === 'income') { if (to) net += amount; }
    else if (t.type === 'expense') { if (from) net -= amount; }
    else if (t.type === 'transfer' || t.type === 'tabung_topup') { if (from) net -= amount; if (to) net += amount; }
    else if (t.type === 'tabung_withdraw') { if (from) net += amount; }
  }
  net = roundCents(net);
  const start = balance - net;
  if (start <= 0 || net === 0) return null;
  return (net / start) * 100;
}
