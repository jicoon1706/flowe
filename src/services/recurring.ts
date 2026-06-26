import { supabase } from '../lib/supabase';
import { recurringRepository } from '../repositories/recurring.repository';
import { transactionsRepository } from '../repositories/transactions.repository';
import { notify, formatRM } from './notifications';
import type { RecurringFrequency } from '../types';

/** Local 'YYYY-MM-DD' for a Date (avoids UTC shift from toISOString). */
function toYMD(dt: Date): string {
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Today as a local 'YYYY-MM-DD' string. */
function todayYMD(): string {
  return toYMD(new Date());
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

    const today = todayYMD();
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
