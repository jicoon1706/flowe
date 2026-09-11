import * as FloweNotifications from '../../modules/flowe-notifications';
import { localYMD } from '../utils/date';
import { spentOn } from '../utils/dailyBudget';
import type { Transaction } from '../types/database.types';

/**
 * Hands the native side what it needs to show the daily-budget live update on
 * its own: the budget, and how much of today is already spent.
 *
 * The listener service can't reach Supabase, so when a payment is answered
 * from the notification shade with Flowe closed, the figure it adds to is
 * whatever this last pushed. Home calls it whenever the month's transactions
 * are (re)loaded, which keeps the copy at most one app-open stale.
 */
export function syncDailyBudget(
  budget: number | null,
  transactions: Pick<Transaction, 'type' | 'amount' | 'date'>[]
): void {
  if (!FloweNotifications.isAvailable) return;
  const today = localYMD(new Date());
  FloweNotifications.setDailyBudget(budget);
  FloweNotifications.setSpentToday(spentOn(transactions, today), today);
}
