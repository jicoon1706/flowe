/**
 * Budget totals (sections G budget, O live updates). Pure; shared with desktop
 * and mirrored by the native live-update notification.
 */
import { roundCents } from './money';

export type LiveBudgetMode = 'off' | 'daily' | 'monthly' | 'both';

export interface SpendRow {
  type: string;
  amount: number;
  /** 'YYYY-MM-DD' */
  date: string;
}

/** Σ expenses on a day. */
export function spentOnDay(rows: SpendRow[], ymd: string): number {
  return roundCents(rows.reduce((s, r) => (r.type === 'expense' && r.date.slice(0, 10) === ymd ? s + Number(r.amount) : s), 0));
}

/** Σ expenses in a month ('YYYY-MM'). */
export function spentInMonth(rows: SpendRow[], ym: string): number {
  return roundCents(rows.reduce((s, r) => (r.type === 'expense' && r.date.slice(0, 7) === ym ? s + Number(r.amount) : s), 0));
}

export interface BudgetStatus {
  limit: number;
  spent: number;
  /** Negative once overspent. */
  left: number;
  /** 0..1 of the limit used, capped. */
  used: number;
  over: boolean;
}

export function budgetStatus(limit: number, spent: number): BudgetStatus {
  const left = roundCents(limit - spent);
  return { limit, spent: roundCents(spent), left, used: limit > 0 ? Math.max(0, Math.min(1, spent / limit)) : 0, over: left < 0 };
}

export function daysInMonth(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

/** Daily limit pre-filled from a monthly one: monthly ÷ days in the month. */
export function dailyFromMonthly(monthly: number, d: Date = new Date()): number {
  return roundCents(monthly / daysInMonth(d));
}

/** Default live mode: Both when a monthly limit exists, else Daily (o-settings-live-updates). */
export function defaultLiveMode(monthlyBudget: number | null): LiveBudgetMode {
  return monthlyBudget && monthlyBudget > 0 ? 'both' : 'daily';
}

/** What the live notification can actually show, given which limits exist. */
export function effectiveLiveMode(mode: LiveBudgetMode, daily: number | null, monthly: number | null): LiveBudgetMode {
  const hasD = !!daily && daily > 0;
  const hasM = !!monthly && monthly > 0;
  if (mode === 'off') return 'off';
  if (mode === 'both') return hasD && hasM ? 'both' : hasD ? 'daily' : hasM ? 'monthly' : 'off';
  if (mode === 'monthly') return hasM ? 'monthly' : hasD ? 'daily' : 'off';
  return hasD ? 'daily' : 'off';
}
