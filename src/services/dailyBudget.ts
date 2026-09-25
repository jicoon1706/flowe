import * as FloweNotifications from '../../modules/flowe-notifications';
import { localYMD } from '../utils/date';
import {
  transactionsRepository,
  onTransactionsChanged,
} from '../repositories/transactions.repository';

/**
 * Keeping the daily-budget home-screen widget honest.
 *
 * The widget draws entirely from the native side's own copy of two figures —
 * the budget, and how much of today is spent — because the listener service has
 * no Supabase session and has to keep drawing with Flowe closed. Everything here
 * exists to keep that copy in step with the real transactions.
 *
 * It used to be pushed from exactly one place: the Home screen, whenever its
 * month query reloaded. That left the widget stale after every write that didn't
 * end on Home — an expense saved back to an account screen, a tabung top-up, a
 * recurring rule firing, a transaction deleted from its detail sheet — and it
 * computed today's total from the month Home happened to have loaded, which is
 * the wrong month for the first day of a new one. So the push now hangs off the
 * repository's change event, and today's total is read back from Supabase.
 */

/** Pushes the budget and re-reads today's spend. Called when Home loads. */
export function syncDailyBudget(budget: number | null): void {
  if (!FloweNotifications.isAvailable) return;
  FloweNotifications.setDailyBudget(budget);
  refreshSpentToday();
}

/**
 * Re-reads today's expenses from Supabase and pushes the total.
 *
 * One narrow query, so it can run after any write from anywhere — including
 * inside the headless task, where no screen has a month of transactions loaded
 * to add up. It deliberately doesn't touch the budget: the native copy of that
 * only changes when the user edits it.
 */
export async function refreshSpentToday(): Promise<void> {
  if (!FloweNotifications.isAvailable) return;
  const today = localYMD(new Date());
  const result = await transactionsRepository.sumExpensesOn(today);
  // Offline, or signed out: leave the stored figure alone rather than drawing a
  // zero the user would read as "nothing spent today". What the native side has
  // is whatever the last successful read plus any shade answers since left it.
  if (!result.ok) return;
  FloweNotifications.setSpentToday(result.data, today);
}

let unsubscribe: (() => void) | null = null;

/**
 * Makes every transaction write redraw the widget. Called once, from the
 * protected layout, and safe to call again — a second call replaces the first
 * subscription rather than adding one.
 *
 * Only the net effect matters, and a burst of writes (auto-detect emptying a
 * queue, a month of recurring rules catching up) would otherwise mean one query
 * each, so the refresh is coalesced onto the end of the burst.
 */
export function startDailyBudgetSync(): () => void {
  stopDailyBudgetSync();
  if (!FloweNotifications.isAvailable) return () => {};

  // Anything filed while the app was closed — by the headless task, or answered
  // straight from the shade — and any day that has turned over since.
  refreshSpentToday();

  let timer: ReturnType<typeof setTimeout> | null = null;
  const stop = onTransactionsChanged(() => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      refreshSpentToday();
    }, 400);
  });

  unsubscribe = () => {
    if (timer) clearTimeout(timer);
    stop();
  };
  return stopDailyBudgetSync;
}

export function stopDailyBudgetSync(): void {
  unsubscribe?.();
  unsubscribe = null;
}
