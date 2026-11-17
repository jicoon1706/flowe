import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { localYMD } from '../utils/date';
import { onTransactionsChanged, transactionsRepository } from '../repositories/transactions.repository';
import { affirmationsRepository } from '../repositories/affirmations.repository';
import { edgeFunctionsService } from './edgeFunctions';
import { getNotificationSettings } from './notificationPrefs';
import { cancelScheduledWithPrefix, formatRM, notify, scheduleLocalNotificationAt } from './notifications';
import { scheduleRecurringReminders } from './recurring';
import {
  budgetThresholdsToSend,
  milestoneToSend,
  parseReminderTime,
  previousMonth,
} from '../lib/notificationRules';

/**
 * The notifications Settings › Notifications promises beyond write-time
 * events (journey §5.5.9, §6.7): budget alerts at 80 % / 100 % of the daily
 * limit, Tabung milestones every 20 %, the monthly summary on the 1st and the
 * daily affirmation. Recurring reminders live in services/recurring.ts.
 *
 * All of them run on the phone (see docs/V2_GAPS.md, "Notification
 * delivery"): there is no push transport, and every input is already here.
 * Each one is gated by its settings.notif_* switch, and announced once:
 * what was sent is remembered on the device under STORE_KEY.
 */

const STORE_KEY = 'flowe.alerts.v1';
const AFFIRMATION_PREFIX = 'flowe-affirmation-';
const SUMMARY_PREFIX = 'flowe-summary-';
/** Affirmations scheduled ahead; the set is rebuilt every time the app opens. */
const AFFIRMATION_DAYS = 7;
const SUMMARY_HOUR = 9;

interface SentStore {
  budget?: { date: string; sent: number[] };
  milestones?: Record<string, number[]>;
  summaryMonth?: string;
}

async function readStore(): Promise<SentStore> {
  try {
    const raw = await AsyncStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as SentStore) : {};
  } catch {
    return {};
  }
}

async function writeStore(next: SentStore): Promise<void> {
  try {
    await AsyncStorage.setItem(STORE_KEY, JSON.stringify(next));
  } catch {
    // Losing the record only risks one repeated alert.
  }
}

/** Budget alert at 80 % and 100 % of today's limit. Runs after every transaction write. */
export async function checkBudgetAlerts(): Promise<void> {
  const prefs = await getNotificationSettings();
  if (prefs?.notif_alert === false) return;
  const limit = prefs?.daily_budget === null || prefs?.daily_budget === undefined ? null : Number(prefs.daily_budget);
  if (!limit) return;
  const today = localYMD(new Date());
  const spent = await transactionsRepository.sumExpensesOn(today);
  if (!spent.ok) return;
  const store = await readStore();
  const already = store.budget?.date === today ? store.budget.sent : [];
  const toSend = budgetThresholdsToSend(spent.data, limit, already);
  if (toSend.length === 0) return;
  // Record first, so two writes in quick succession can't both announce it.
  await writeStore({ ...store, budget: { date: today, sent: [...already, ...toSend] } });
  const top = toSend[0];
  // Canvas "push · android · all 8 types": Budget 80 % / Budget 100 %, action View.
  const title = top >= 100 ? 'Today’s budget is used up' : `${top}% of today’s budget used`;
  const body = top >= 100
    ? `${formatRM(spent.data)} spent of ${formatRM(limit)}. Resets at midnight.`
    : `${formatRM(Math.max(0, limit - spent.data))} left of ${formatRM(limit)} today.`;
  await notify({
    type: 'alert',
    emoji: top >= 100 ? '⛔' : '⚠️',
    message: title,
    sub_text: body,
    push: { title, body, categoryId: 'view' },
  });
}

/** Tabung milestone every 20 % toward the goal. Called when a Tabung's progress changes. */
export async function checkTabungMilestone(tabung: { id: string; name: string; percent: number; target: number; counted: number }): Promise<void> {
  if (tabung.target <= 0) return;
  const prefs = await getNotificationSettings();
  if (prefs?.notif_milestone === false || prefs?.notif_tabung === false) return;
  const store = await readStore();
  const already = store.milestones?.[tabung.id] ?? [];
  if (!store.milestones?.[tabung.id]) {
    // First look at this Tabung on this device: record where it is, so opening
    // it doesn't announce progress made long ago.
    await primeTabungMilestone(tabung.id, tabung.percent);
    return;
  }
  const step = milestoneToSend(tabung.percent, already);
  if (step === null) return;
  await writeStore({ ...store, milestones: { ...store.milestones, [tabung.id]: [...already, step] } });
  // Canvas: "Emergency Fund passed 20%" / "RM 1,053.34 of RM 5,000.00. Keep going." · Open.
  const title = step >= 100 ? `${tabung.name} reached its goal` : `${tabung.name} passed ${step}%`;
  const body = `${formatRM(tabung.counted)} of ${formatRM(tabung.target)}.${step >= 100 ? '' : ' Keep going.'}`;
  await notify({
    type: 'milestone',
    emoji: step >= 100 ? '🎉' : '🎯',
    message: title,
    sub_text: body,
    related_entity_id: tabung.id,
    push: { title, body, categoryId: 'open' },
  });
}

/** Seeds a Tabung's milestone record without announcing anything (used before the first check). */
export async function primeTabungMilestone(id: string, percent: number): Promise<void> {
  const store = await readStore();
  if (store.milestones?.[id]) return;
  const seen = Math.min(100, Math.floor(percent / 20) * 20);
  await writeStore({ ...store, milestones: { ...store.milestones, [id]: seen >= 20 ? [seen] : [] } });
}

function monthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-MY', { month: 'long' });
}

/**
 * Monthly summary on the 1st: on the first open on or after the 1st, the
 * previous month's income and spend are announced; a reminder is also put on
 * the calendar for 09:00 on the next 1st.
 */
export async function runMonthlySummary(now: Date = new Date()): Promise<void> {
  await cancelScheduledWithPrefix(SUMMARY_PREFIX);
  const prefs = await getNotificationSettings();
  if (prefs?.notif_cashflow === false) return;

  const thisMonth = localYMD(now).slice(0, 7);
  const nextFirst = new Date(now.getFullYear(), now.getMonth() + 1, 1, SUMMARY_HOUR, 0, 0, 0);
  await scheduleLocalNotificationAt(
    nextFirst,
    `Your ${monthLabel(thisMonth)} summary`,
    'Open Flowe to see where it went.',
    `${SUMMARY_PREFIX}${thisMonth}`,
    { categoryId: 'open', href: '/home/analysis' },
  );

  const last = previousMonth(thisMonth);
  const store = await readStore();
  if (store.summaryMonth === undefined) {
    // First run on this install: don't announce a month the user never tracked here.
    await writeStore({ ...store, summaryMonth: last });
    return;
  }
  if (store.summaryMonth >= last) return;
  const res = await edgeFunctionsService.getAnalysis(last);
  if (!res.ok) return;
  await writeStore({ ...store, summaryMonth: last });
  // Canvas: "Your October summary" / "Spent RM 2,710.40 · kept 39% of income." · Open.
  const title = `Your ${monthLabel(last)} summary`;
  const body = res.data.income > 0
    ? `Spent ${formatRM(res.data.expenses)} · kept ${Math.max(0, res.data.savings_rate)}% of income.`
    : `Spent ${formatRM(res.data.expenses)}.`;
  await notify({
    type: 'cashflow',
    emoji: '📊',
    message: title,
    sub_text: body,
    push: { title, body, categoryId: 'open', href: '/home/analysis' },
  });
}

/**
 * Daily affirmation at settings.daily_reminder_time, for the next week, each
 * day a different line (the user's own first, then the stock ones). Cleared
 * when affirmations or their notification are switched off.
 */
export async function scheduleDailyAffirmations(userId: string | undefined, now: Date = new Date()): Promise<void> {
  await cancelScheduledWithPrefix(AFFIRMATION_PREFIX);
  const prefs = await getNotificationSettings();
  if (prefs?.show_affirmations === false || prefs?.notif_affirmation === false) return;
  const time = parseReminderTime(prefs?.daily_reminder_time);
  if (!time) return;

  const [own, stock] = await Promise.all([
    userId ? affirmationsRepository.fetchUserAffirmations(userId) : Promise.resolve(null),
    affirmationsRepository.fetchActive(),
  ]);
  const lines = [
    ...(own?.ok ? own.data.map((a) => a.text) : []),
    ...(stock.ok ? stock.data.map((a) => a.quote) : []),
  ].filter((t): t is string => typeof t === 'string' && t.length > 0);
  if (lines.length === 0) return;

  const start = Math.floor(now.getTime() / 86_400_000);
  for (let i = 0; i < AFFIRMATION_DAYS; i++) {
    const when = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, time.hour, time.minute, 0, 0);
    // Canvas: "Today's affirmation" / the line, no action; a tap opens Settings › Affirmations.
    await scheduleLocalNotificationAt(when, 'Today’s affirmation', lines[(start + i) % lines.length], `${AFFIRMATION_PREFIX}${i}`, { href: '/settings/affirmations' });
  }
}

/**
 * Starts the alert checks for the signed-in phone session. Called once from the
 * protected layout; returns the cleanup. Budget alerts run after every
 * transaction write (coalesced) and on every return to the foreground, which
 * also catches writes made on Flowe Desktop. The summary and affirmation
 * schedule are refreshed on each foreground.
 */
export function startAlerts(getUserId: () => Promise<string | undefined>): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const stopChanges = onTransactionsChanged(() => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      checkBudgetAlerts();
    }, 400);
  });

  const onForeground = async () => {
    checkBudgetAlerts();
    runMonthlySummary();
    scheduleDailyAffirmations(await getUserId());
  };
  onForeground();
  const sub = AppState.addEventListener('change', (state) => {
    if (state === 'active') onForeground();
  });

  return () => {
    if (timer) clearTimeout(timer);
    stopChanges();
    sub.remove();
  };
}

/** Re-applies the schedules after Settings › Notifications or Affirmations change. */
export async function rescheduleAfterSettingsChange(userId: string): Promise<void> {
  await Promise.all([scheduleDailyAffirmations(userId), runMonthlySummary(), scheduleRecurringReminders()]);
}
