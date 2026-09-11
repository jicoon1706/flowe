import type { Transaction } from '../types/database.types';

/**
 * Today's spending against a daily budget — the numbers behind the live
 * update Flowe shows when it files a payment.
 *
 * Pure on purpose: the same arithmetic runs in Kotlin when a payment is
 * answered from the shade with the app closed, and keeping this side trivial
 * is what keeps the two from disagreeing.
 */

/** Total of the expenses dated `ymd` (local 'YYYY-MM-DD'). */
export function spentOn(transactions: Pick<Transaction, 'type' | 'amount' | 'date'>[], ymd: string): number {
  let total = 0;
  for (const tx of transactions) {
    if (tx.type !== 'expense') continue;
    // Dates are stored as plain calendar days, but a joined row may carry a
    // timestamp — compare the day only.
    if (tx.date.slice(0, 10) !== ymd) continue;
    total += Number(tx.amount) || 0;
  }
  return Math.round(total * 100) / 100;
}

export interface BudgetProgress {
  /** 0–100, capped: a blown budget is a full bar, not a longer one. */
  percent: number;
  /** Positive while there's budget left; negative once it's overspent. */
  remaining: number;
  over: boolean;
}

export function budgetProgress(budget: number, spent: number): BudgetProgress {
  if (budget <= 0) return { percent: 0, remaining: 0, over: spent > 0 };
  const remaining = Math.round((budget - spent) * 100) / 100;
  return {
    percent: Math.max(0, Math.min(100, Math.round((spent / budget) * 100))),
    remaining,
    over: remaining < 0,
  };
}

/** Accepts what a user might type — "100", "RM 100", "1,250.50" — or nothing. */
export function parseBudgetInput(raw: string): number | null {
  // A negative budget is nonsense, not a typo to be rescued by dropping the sign.
  if (raw.trim().startsWith('-')) return null;
  const cleaned = raw.replace(/[^0-9.]/g, '');
  if (!cleaned) return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * 100) / 100;
}
