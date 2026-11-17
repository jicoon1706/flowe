import type { NotificationType, Settings } from '../types';

/**
 * Which settings.notif_* column governs each notification type
 * (Settings › Notifications, journey §5.5.9). Notes and projects have no
 * toggle and always notify.
 */
export type NotifFlag = keyof Pick<
  Settings,
  | 'notif_expense' | 'notif_income' | 'notif_transfer' | 'notif_recurring' | 'notif_alert'
  | 'notif_tabung' | 'notif_milestone' | 'notif_asset' | 'notif_cashflow' | 'notif_affirmation'
>;

const FLAG_FOR_TYPE: Record<NotificationType, NotifFlag | null> = {
  expense: 'notif_expense',
  income: 'notif_income',
  transfer: 'notif_transfer',
  recurring: 'notif_recurring',
  alert: 'notif_alert',
  tabung: 'notif_tabung',
  milestone: 'notif_milestone',
  asset: 'notif_asset',
  liability: 'notif_asset',
  cashflow: 'notif_cashflow',
  affirmation: 'notif_affirmation',
  note: null,
  project: null,
};

export type NotificationPrefs = Partial<Pick<Settings, NotifFlag | 'show_affirmations'>>;

export function flagForType(type: NotificationType): NotifFlag | null {
  return FLAG_FOR_TYPE[type];
}

/**
 * Whether a notification of `type` may show as an OS banner. A flag that is
 * missing (settings not loaded yet) counts as on, matching the column default.
 */
export function bannerAllowed(type: NotificationType, prefs: NotificationPrefs | null): boolean {
  const flag = flagForType(type);
  if (!flag || !prefs) return true;
  if (type === 'affirmation' && prefs.show_affirmations === false) return false;
  return prefs[flag] !== false;
}

export const BUDGET_THRESHOLDS = [80, 100] as const;
export type BudgetThreshold = (typeof BUDGET_THRESHOLDS)[number];

/**
 * Budget thresholds (80 % / 100 % of the daily limit) that today's spend has
 * reached and that haven't been announced yet. Highest first, so a single
 * write that jumps past both only produces the 100 % alert's wording first.
 */
export function budgetThresholdsToSend(
  spentToday: number,
  dailyLimit: number | null,
  alreadySent: readonly number[],
): BudgetThreshold[] {
  if (!dailyLimit || dailyLimit <= 0) return [];
  const pct = (spentToday / dailyLimit) * 100;
  return BUDGET_THRESHOLDS.filter((t) => pct >= t && !alreadySent.includes(t)).sort((a, b) => b - a);
}

/** Tabung milestones are announced every 20 % toward the goal (journey §5.5.9). */
export const MILESTONE_STEP = 20;

/**
 * The highest 20 % step `percent` has reached that is above every step
 * already announced, or null. Only one alert per change: going 15 % → 65 %
 * announces 60 %, not 20, 40 and 60.
 */
export function milestoneToSend(percent: number, alreadySent: readonly number[]): number | null {
  const reached = Math.min(100, Math.floor(percent / MILESTONE_STEP) * MILESTONE_STEP);
  if (reached < MILESTONE_STEP) return null;
  const highest = alreadySent.length ? Math.max(...alreadySent) : 0;
  return reached > highest ? reached : null;
}

/** 'YYYY-MM' of the month before `ym`. */
export function previousMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** 'YYYY-MM-DD' one day before `ymd` (local calendar). */
export function dayBefore(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const prev = new Date(y, m - 1, d - 1);
  return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}-${String(prev.getDate()).padStart(2, '0')}`;
}

/** Parses settings.daily_reminder_time ('HH:MM' or 'HH:MM:SS'); null when unset or malformed. */
export function parseReminderTime(value: string | null | undefined): { hour: number; minute: number } | null {
  const match = /^(\d{1,2}):(\d{2})/.exec(value ?? '');
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return { hour, minute };
}
