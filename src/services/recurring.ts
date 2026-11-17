import { localYMD } from '../utils/date';
import { recurringRepository, type CreateRecurringRuleRequest } from '../repositories/recurring.repository';
import { notifyTransactionsChanged } from '../repositories/transactions.repository';
import {
  notify,
  formatRM,
  scheduleLocalNotificationAt,
  cancelScheduledWithPrefix,
} from './notifications';
import { getNotificationSettings } from './notificationPrefs';
import { dayBefore } from '../lib/notificationRules';
import type { RecurringFrequency, RecurringRule, ReminderOffset, TransactionType } from '../types';
import type { Result, SupabaseError } from '../utils/result';

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

/** The day-before reminder fires at 9am, not at the 5am due hour. */
const DAY_BEFORE_HOUR = 9;

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
  return localYMD(cutoff);
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

    // Settings › Notifications › Recurring reminders ("Day before and on the day").
    const prefs = await getNotificationSettings();
    if (prefs?.notif_recurring === false) return;

    const rules = await recurringRepository.fetchAllActive();
    if (!rules.ok) return;

    await Promise.all(
      rules.data
        .filter((rule) => rule.status === 'active')
        .flatMap((rule) => {
          const occurrence = rule.next_date ?? rule.start_date;
          if (rule.end_date && occurrence > rule.end_date) return [];
          const amount = formatRM(Number(rule.amount));
          const [y, m, d] = dayBefore(occurrence).split('-').map(Number);
          return [
            scheduleLocalNotificationAt(
              new Date(y, m - 1, d, DAY_BEFORE_HOUR, 0, 0, 0),
              `🔁 ${rule.name} is due tomorrow`,
              `${amount} • Flowe asks you to confirm it on the day`,
              `${REMINDER_PREFIX}before-${rule.id}`
            ),
            scheduleLocalNotificationAt(
              dueMoment(occurrence),
              `🔁 ${rule.name} is due`,
              `${amount} • open Flowe to confirm it`,
              `${REMINDER_PREFIX}${rule.id}`
            ),
          ];
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
  if (frequency === 'weekly') return localYMD(new Date(y, m - 1, d + 7));
  if (frequency === 'yearly') return localYMD(new Date(y + 1, m - 1, d));
  // monthly: m is 1-based, so the 0-based index of the *next* month is `m`.
  const year = y + Math.floor(m / 12);
  const monthIndex = m % 12;
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return localYMD(new Date(year, monthIndex, Math.min(anchorDay, lastDay)));
}

const REMINDER_OFFSETS: ReminderOffset[] = ['none', 'same_day', '1_day', '3_days', '1_week'];

export interface RuleFromTransactionInput {
  userId: string;
  type: TransactionType;
  name: string;
  amount: number;
  category?: string;
  /** The account the payment leaves (expense) or lands in (income). */
  accountId: string;
  /** 'YYYY-MM-DD' of the transaction being saved alongside the rule. */
  transactionDate: string;
  frequency: RecurringFrequency;
  /** 'YYYY-MM-DD' the user picked as the rule's start. */
  startDate: string;
  endDate?: string | null;
  /** Reminder option id from the form ('none', 'same_day', '1_day', ...). */
  reminder: string;
}

/**
 * The recurring rule to save when "Recurring" is switched on while adding a
 * transaction (AUDIT #4: the form collected these fields and dropped them).
 *
 * The transaction being saved is the occurrence the user just recorded, so the
 * rule's `next_date` is the first occurrence *after* it. Starting it on the
 * same day would put the same payment straight back in front of the user for
 * approval. Returns null for types a rule can't hold (only expense and income
 * are supported by `recurring_rules`).
 */
export function ruleFromTransaction(input: RuleFromTransactionInput): CreateRecurringRuleRequest | null {
  if (input.type !== 'expense' && input.type !== 'income') return null;

  const anchorDay = Number(input.startDate.split('-')[2]) || 1;
  let next = input.startDate;
  let guard = 0;
  while (next <= input.transactionDate && guard < 1000) {
    next = addInterval(next, input.frequency, anchorDay);
    guard++;
  }

  const offset = (REMINDER_OFFSETS as string[]).includes(input.reminder)
    ? (input.reminder as ReminderOffset)
    : 'none';

  return {
    user_id: input.userId,
    type: input.type,
    name: input.name,
    amount: input.amount,
    category: input.category,
    from_account_id: input.type === 'expense' ? input.accountId : undefined,
    to_account_id: input.type === 'income' ? input.accountId : undefined,
    frequency: input.frequency,
    start_date: input.startDate,
    end_date: input.endDate ?? undefined,
    next_date: next,
    reminder_enabled: offset !== 'none',
    reminder_offset: offset,
  };
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
 * roll the rule's next_date forward one interval. Returns the Result so
 * callers can surface failures (and refresh balances/transactions on success).
 *
 * All three writes (rule advance, transaction, balance) happen in one
 * database transaction via `approve_recurring_occurrence` (AUDIT #21). Doing
 * them as separate requests could create the transaction and then fail to
 * advance the rule, so the same occurrence was offered and approved again.
 * The next date is still computed here by the tested `addInterval`.
 */
export async function approveRecurring(rule: RecurringRule): Promise<Result<unknown, SupabaseError>> {
  const occurrence = occurrenceDate(rule);
  const res = await recurringRepository.approveOccurrence(rule.id, occurrence, rolledNextDate(rule));
  if (!res.ok) return res;

  // null: this occurrence was already approved or skipped (e.g. a second tap,
  // or another device). Nothing was written, which is the point; the caller
  // still drops it from the pending list.
  if (res.data === null) return res;

  notifyTransactionsChanged();
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
  const moved = await recurringRepository.skipOccurrence(rule.id, occurrence, rolledNextDate(rule));
  if (!moved.ok) return moved;
  const res: Result<void, SupabaseError> = { ok: true, data: undefined };
  if (moved.data) {
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
