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
  const net = legNet(rows, spendableIds);
  const start = balance - net;
  if (start <= 0 || net === 0) return null;
  return (net / start) * 100;
}

/**
 * Net change the rows made to the given accounts: every leg that touched one
 * of them, the way `applyBalanceEffect` moves it.
 */
export function legNet(rows: BalanceRow[], accountIds: Iterable<string>): number {
  const ids = new Set(accountIds);
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
  return roundCents(net);
}

// ─── Cashflow tab: net worth over time ─────────────────────────────────

/** 'YYYY-MM-01' keys for the `count` months ending at `endMonth` ('YYYY-MM-01'), oldest first. */
export function monthsEnding(endMonth: string, count: number): string[] {
  const [y, m] = endMonth.split('-').map(Number);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(Date.UTC(y, m - 1 - (count - 1 - i), 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-01`;
  });
}

/** An asset or liability as the trend sees it. */
export interface BalanceEntity {
  id: string;
  name: string;
  /** Value now (assets.current_value / liabilities.amount_owed). */
  amount: number;
  /** Month it was first owned, 'YYYY-MM-01' (date acquired, else created). */
  since: string;
  /** Monthly income (assets) or repayment (liabilities). */
  monthly: number;
}

/** One "worth X as of month M" row from asset_values / liability_values. */
export interface ValuePoint {
  id: string;
  month: string;
  amount: number;
}

/** A dated transaction leg, for rolling cash back. */
export interface DatedBalanceRow extends BalanceRow {
  date: string;
}

export interface NetWorthPoint {
  month: string;
  assets: number;
  liabilities: number;
  netWorth: number;
}

/**
 * Each entity's value as of `month`: its live value from `liveMonth` on; before
 * that, the latest history row at or before the month (none yet → 0). An entity
 * with no history at all counts its live value once it existed — the same rule
 * as the cashflow-summary edge function.
 */
export function entityValuesAsOf(entities: BalanceEntity[], history: ValuePoint[], month: string, liveMonth: string): Map<string, number> {
  const byId = new Map<string, ValuePoint[]>();
  for (const p of history) byId.set(p.id, [...(byId.get(p.id) ?? []), p]);
  const out = new Map<string, number>();
  for (const e of entities) {
    if (month >= liveMonth) { out.set(e.id, Number(e.amount)); continue; }
    const rows = (byId.get(e.id) ?? []).sort((a, b) => a.month.localeCompare(b.month));
    let value = 0;
    if (rows.length) {
      for (const r of rows) { if (r.month > month) break; value = Number(r.amount); }
    } else if (e.since <= month) value = Number(e.amount);
    out.set(e.id, value);
  }
  return out;
}

/** Last day of a 'YYYY-MM-01' month, as 'YYYY-MM-DD'. */
function monthEnd(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return `${month.slice(0, 7)}-${String(new Date(Date.UTC(y, m, 0)).getUTCDate()).padStart(2, '0')}`;
}

/**
 * Cash in accounts at the end of `month`: today's balance with every later leg
 * rolled back. Balances have no stored history, so this is the only one cash has.
 */
export function cashAtMonthEnd(cashNow: number, legs: DatedBalanceRow[], accountIds: Iterable<string>, month: string, liveMonth: string): number {
  if (month >= liveMonth) return roundCents(cashNow);
  const end = monthEnd(month);
  return roundCents(cashNow - legNet(legs.filter((l) => l.date > end), accountIds));
}

export interface NetWorthInput {
  months: string[];
  /** The current month: from here on, live values are used. */
  liveMonth: string;
  cashNow: number;
  accountIds: string[];
  /** Every leg dated after the first month began. */
  legs: DatedBalanceRow[];
  assets: BalanceEntity[];
  assetHistory: ValuePoint[];
  liabilities: BalanceEntity[];
  liabilityHistory: ValuePoint[];
}

const sumValues = (m: Map<string, number>) => [...m.values()].reduce((s, v) => s + v, 0);

/** Assets (cash + the assets table), liabilities and net worth for each month. */
export function netWorthTrend(i: NetWorthInput): NetWorthPoint[] {
  return i.months.map((month) => {
    const cash = cashAtMonthEnd(i.cashNow, i.legs, i.accountIds, month, i.liveMonth);
    const assets = roundCents(cash + sumValues(entityValuesAsOf(i.assets, i.assetHistory, month, i.liveMonth)));
    const liabilities = roundCents(sumValues(entityValuesAsOf(i.liabilities, i.liabilityHistory, month, i.liveMonth)));
    return { month, assets, liabilities, netWorth: roundCents(assets - liabilities) };
  });
}

/**
 * Monthly income (assets) or repayments (liabilities) of the entities held in
 * `month` (worth more than 0 then), with their names, largest first.
 */
export function monthlyFlows(entities: BalanceEntity[], history: ValuePoint[], month: string, liveMonth: string): { total: number; items: { name: string; amount: number }[] } {
  const values = entityValuesAsOf(entities, history, month, liveMonth);
  const items = entities
    .filter((e) => (values.get(e.id) ?? 0) > 0 && Number(e.monthly) > 0)
    .map((e) => ({ name: e.name, amount: roundCents(Number(e.monthly)) }))
    .sort((a, b) => b.amount - a.amount);
  return { total: roundCents(items.reduce((s, x) => s + x.amount, 0)), items };
}

/** Passive income as a whole percentage of expenses; null when there are no expenses. */
export function passiveCoveragePct(passiveIncome: number, expenses: number): number | null {
  if (expenses <= 0) return null;
  return Math.round((passiveIncome / expenses) * 100);
}

/** How many months of the trend hold any value (assets or liabilities). */
export function monthsWithValue(points: NetWorthPoint[]): number {
  return points.filter((p) => p.assets !== 0 || p.liabilities !== 0).length;
}

/** The three cash-flow patterns, in track order (Poor → Middle class → Rich). */
export const PATTERNS: { key: FinancialClass; steps: string[]; body: string }[] = [
  { key: 'poor', steps: ['Job', 'Expenses'], body: 'Every ringgit earned is spent.' },
  { key: 'middle', steps: ['Job', 'Liabilities', 'Assets'], body: 'Income pays debts first; some flows into assets.' },
  { key: 'rich', steps: ['Assets', 'Income', 'Expenses'], body: 'Assets produce the income that pays expenses.' },
];
