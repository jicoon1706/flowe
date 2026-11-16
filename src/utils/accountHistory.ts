import type { Transaction } from '../types/database.types';

/**
 * Income and expense totals for one calendar month, from an account's history.
 *
 * The account pages now list the account's whole history (AUDIT #8), but their
 * Income / Expense tiles have always been this month's figures, so they are
 * worked out from the month's rows only. `ym` is 'YYYY-MM'; dates are compared
 * as stored calendar days, never parsed through `Date` (which is UTC for a
 * bare 'YYYY-MM-DD').
 */
export function monthTotals(
  transactions: Pick<Transaction, 'type' | 'amount' | 'date'>[],
  ym: string,
): { income: number; expense: number } {
  let income = 0;
  let expense = 0;
  for (const tx of transactions) {
    if (tx.date.slice(0, 7) !== ym) continue;
    if (tx.type === 'income') income += Number(tx.amount) || 0;
    else if (tx.type === 'expense') expense += Number(tx.amount) || 0;
  }
  return {
    income: Math.round(income * 100) / 100,
    expense: Math.round(expense * 100) / 100,
  };
}
