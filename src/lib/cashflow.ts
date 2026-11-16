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
