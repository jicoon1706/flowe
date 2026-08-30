import { supabase } from '../lib/supabase';
import { recurringRepository } from '../repositories/recurring.repository';
import { transactionsRepository } from '../repositories/transactions.repository';
import {
  notify,
  formatRM,
  scheduleLocalNotificationAt,
  cancelScheduledWithPrefix,
} from './notifications';
import type { RecurringFrequency, RecurringRule } from '../types';
import type { Result, SupabaseError } from '../utils/result';

/** Local 'YYYY-MM-DD' for a Date (avoids UTC shift from toISOString). */
function toYMD(dt: Date): string {
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * The hour a recurring payment comes due, in the phone's own timezone.
 *
 * Every date in this app is a local calendar date (see utils/date.ts) and every
 * clock reading comes from the device, so for a phone set to Malaysia this is
 * 5am MYT. Five in the morning is early enough that the charge is already
 * there when the day starts, and late enough that opening the app at midnight
 * doesn't post tomorrow's bills into tonight.
 */
export const RECURRING_HOUR = 5;

/**
 * The last date whose occurrences have actually come due.
 *
 * Normally today — but before {@link RECURRING_HOUR} today hasn't arrived yet
 * as far as recurring rules are concerned, so the cutoff is yesterday. Without
 * this a rule dated the 1st fires the instant the calendar flips at midnight.
 */
export function dueThroughYMD(now: Date = new Date()): string {
  const cutoff = new Date(now);
  if (cutoff.getHours() < RECURRING_HOUR) cutoff.setDate(cutoff.getDate() - 1);
  return toYMD(cutoff);
}

/** 05:00 local on a 'YYYY-MM-DD' date. */
function dueMoment(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, RECURRING_HOUR, 0, 0, 0);
}

/** Identifier prefix for the reminders this module schedules. */
const REMINDER_PREFIX = 'flowe-recurring-';

/**
 * Put a 5am reminder on the calendar for every active rule's next occurrence.
 *
 * The whole set is cleared and rebuilt each run, which is what keeps a paused,
 * edited or deleted rule from still firing tomorrow morning. Only the next
 * occurrence of each rule is scheduled: the app re-runs this every time it
 * opens, which is well before the one after that comes around.
 */
export async function scheduleRecurringReminders(): Promise<void> {
  try {
    await cancelScheduledWithPrefix(REMINDER_PREFIX);

    const rules = await recurringRepository.fetchAllActive();
    if (!rules.ok) return;

    await Promise.all(
      rules.data
        .filter((rule) => rule.status === 'active')
        .map((rule) => {
          const occurrence = rule.next_date ?? rule.start_date;
          if (rule.end_date && occurrence > rule.end_date) return Promise.resolve();
          return scheduleLocalNotificationAt(
            dueMoment(occurrence),
            `🔁 ${rule.name} is due`,
            `${formatRM(Number(rule.amount))} • open Flowe to confirm it`,
            `${REMINDER_PREFIX}${rule.id}`
          );
        })
    );
  } catch (e) {
    console.warn('[recurring] failed to schedule reminders:', e);
  }
}

/**
 * Advance a 'YYYY-MM-DD' date by one period.
 *  - weekly  → +7 days
 *  - yearly  → +1 year
 *  - monthly → +1 month, re-anchored to `anchorDay` (the rule's original
 *    day-of-month) and clamped to the last day of short months. This keeps a
 *    rule set for the 31st on the 31st (or month-end), not drifting earlier.
 */
export function addInterval(dateStr: string, frequency: RecurringFrequency, anchorDay: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (frequency === 'weekly') return toYMD(new Date(y, m - 1, d + 7));
  if (frequency === 'yearly') return toYMD(new Date(y + 1, m - 1, d));
  // monthly: m is 1-based, so the 0-based index of the *next* month is `m`.
  const year = y + Math.floor(m / 12);
  const monthIndex = m % 12;
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return toYMD(new Date(year, monthIndex, Math.min(anchorDay, lastDay)));
}

// Prevents overlapping runs (e.g. a re-mount firing the effect twice).
let running = false;

/**
 * Materialize every due recurring rule into real, dated transactions and roll
 * its `next_date` forward. Safe to call on every app open: a rule is only
 * picked up while its `next_date` is on or before today, and advancing past
 * today removes it from the next run — so re-running the same day is a no-op.
 * Missed periods (app not opened for a while) are caught up in order.
 *
 * Best-effort: failures are swallowed so this can never block app startup.
 * Returns the number of transactions created.
 */
export async function processDueRecurring(): Promise<number> {
  if (running) return 0;
  running = true;
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return 0;

    // Not `todayYMD()`: an occurrence dated today isn't due until 5am local,
    // so before then the cutoff is yesterday.
    const today = dueThroughYMD();
    const due = await recurringRepository.fetchDue(today);
    if (!due.ok) return 0;

    let created = 0;
    for (const rule of due.data) {
      const anchorDay = Number(rule.start_date.split('-')[2]) || 1;
      let nextDate = rule.next_date ?? rule.start_date;
      let guard = 0;

      // Catch up every occurrence from next_date through today.
      while (nextDate <= today && guard < 400) {
        guard++;
        if (rule.end_date && nextDate > rule.end_date) break;

        const res = await transactionsRepository.create({
          user_id: userId,
          type: rule.type,
          name: rule.name,
          amount: Number(rule.amount),
          category: rule.category ?? (rule.type === 'expense' ? 'bills' : 'others'),
          from_account_id: rule.type === 'expense' ? rule.from_account_id : undefined,
          to_account_id: rule.type === 'income' ? rule.to_account_id : undefined,
          date: nextDate,
          is_recurring: true,
          recurring_id: rule.id,
        });
        if (!res.ok) break; // leave next_date where it is; retry next run

        created++;
        await notify({
          type: 'recurring',
          emoji: '🔁',
          message: `${rule.name} charged`,
          sub_text: `${formatRM(Number(rule.amount))} • ${nextDate}`,
          related_entity_id: rule.id,
        });

        nextDate = addInterval(nextDate, rule.frequency, anchorDay);
      }

      // Persist the rolled-forward date even if no tx was created (e.g. ended).
      if (nextDate !== (rule.next_date ?? rule.start_date)) {
        await recurringRepository.advance(rule.id, nextDate);
      }
    }
    return created;
  } catch (e) {
    console.warn('[recurring] processDueRecurring failed:', e);
    return 0;
  } finally {
    running = false;
  }
}

/** The occurrence date currently awaiting the user's decision. */
export function occurrenceDate(rule: RecurringRule): string {
  return rule.next_date ?? rule.start_date;
}

/** Roll a rule's next_date one interval past its current occurrence. */
function rolledNextDate(rule: RecurringRule): string {
  const anchorDay = Number(rule.start_date.split('-')[2]) || 1;
  return addInterval(occurrenceDate(rule), rule.frequency, anchorDay);
}

/**
 * Approve one due occurrence: materialize it into a real dated transaction and
 * roll the rule's next_date forward one interval. Returns the create Result so
 * callers can surface failures (and refresh balances/transactions on success).
 */
export async function approveRecurring(rule: RecurringRule): Promise<Result<unknown, SupabaseError>> {
  const occurrence = occurrenceDate(rule);
  const res = await transactionsRepository.create({
    user_id: rule.user_id,
    type: rule.type,
    name: rule.name,
    amount: Number(rule.amount),
    category: rule.category ?? (rule.type === 'expense' ? 'bills' : 'others'),
    from_account_id: rule.type === 'expense' ? rule.from_account_id : undefined,
    to_account_id: rule.type === 'income' ? rule.to_account_id : undefined,
    date: occurrence,
    is_recurring: true,
    recurring_id: rule.id,
  });
  if (!res.ok) return res;

  await recurringRepository.advance(rule.id, rolledNextDate(rule));
  await notify({
    type: 'recurring',
    emoji: '🔁',
    message: `${rule.name} charged`,
    sub_text: `${formatRM(Number(rule.amount))} • ${occurrence}`,
    related_entity_id: rule.id,
  });
  return res;
}

/**
 * Reject one due occurrence: roll next_date forward one interval WITHOUT
 * creating a transaction, so this period is skipped and the rule stays on
 * schedule for the next one.
 */
export async function skipRecurring(rule: RecurringRule): Promise<Result<void, SupabaseError>> {
  const occurrence = occurrenceDate(rule);
  const res = await recurringRepository.advance(rule.id, rolledNextDate(rule));
  if (res.ok) {
    await notify({
      type: 'recurring',
      emoji: '⏭️',
      message: `${rule.name} skipped`,
      sub_text: `${occurrence}`,
      related_entity_id: rule.id,
    });
  }
  return res;
}
