/**
 * Edit Tabung (d-tabung-edit · t-n-tabung-edit · n-tabung-edit): the form's
 * values, validation and dirty check. Shared, byte-identical, by flowe-desktop
 * and flowe-akmal. The server (update_tabung, migration 20261124) runs the same
 * rules and is authoritative; `fieldOfServerError` maps its messages back onto
 * the field they belong to.
 */
import { formatRM, roundCents } from './money';
import { endOfMonth, targetMonthFor } from './tabungPlan';
import type { TabungProgressMode } from './tabungProgress';

export const TABUNG_GOAL_TYPES = ['emergency', 'travel', 'raya', 'education', 'home', 'custom'] as const;
export type TabungGoalType = (typeof TABUNG_GOAL_TYPES)[number];

export const TABUNG_NAME_MAX = 40;

export interface TabungEditValues {
  goalType: TabungGoalType | null;
  name: string;
  /** null while the field is empty or unparseable. */
  target: number | null;
  monthlyTopup: number | null;
  /** 'YYYY-MM-DD'. */
  fromDate: string;
  /** 'YYYY-MM-DD'. Follows target ÷ monthly top-up (`followTargetDate`). */
  toDate: string;
  /** Object path in the tabung-covers bucket, or null for no cover. */
  coverPath: string | null;
}

export type TabungEditField = 'goalType' | 'name' | 'target' | 'monthlyTopup' | 'dates';
export type TabungEditErrors = Partial<Record<TabungEditField, string>>;

export function isGoalType(value: string | null | undefined): value is TabungGoalType {
  return !!value && (TABUNG_GOAL_TYPES as readonly string[]).includes(value);
}

/** The form's starting values from the stored rows. */
export function tabungEditValues(row: {
  name: string;
  template_type?: string | null;
  target_amount: number;
  monthly_topup?: number | null;
  from_date: string;
  to_date: string;
  cover_path?: string | null;
}): TabungEditValues {
  return {
    goalType: isGoalType(row.template_type) ? row.template_type : 'custom',
    name: row.name,
    target: roundCents(Number(row.target_amount)),
    monthlyTopup: row.monthly_topup == null ? null : roundCents(Number(row.monthly_topup)),
    fromDate: row.from_date,
    toDate: row.to_date,
    coverPath: row.cover_path ?? null,
  };
}

/**
 * "Saved toward goal", the figure the target can't go below: what the Tabung
 * card shows. Σ top-ups since the start date by default, the balance in
 * 'balance' mode.
 */
export function savedTowardGoal(mode: TabungProgressMode, contributed: number, balance: number): number {
  return roundCents(mode === 'balance' ? Math.max(0, balance) : contributed);
}

/** "Target date follows target ÷ monthly top-up": the end of the month the goal is reached. */
export function followTargetDate(values: Pick<TabungEditValues, 'target' | 'monthlyTopup' | 'fromDate' | 'toDate'>): string {
  const month = targetMonthFor(values.target ?? 0, values.monthlyTopup ?? 0, values.fromDate);
  return month ? endOfMonth(month) : values.toDate;
}

/** Field errors with the copy from d-tabung-edit-error. Empty object = valid. */
export function validateTabungEdit(values: TabungEditValues, saved: number): TabungEditErrors {
  const errors: TabungEditErrors = {};
  const name = values.name.trim();
  if (!values.goalType) errors.goalType = 'Choose a goal type';
  if (!name) errors.name = 'Give your Tabung a name';
  else if (name.length > TABUNG_NAME_MAX) errors.name = `Keep the name to ${TABUNG_NAME_MAX} characters`;
  if (values.target === null || !(values.target > 0)) errors.target = 'Enter a target above RM 0.00';
  else if (roundCents(values.target) < roundCents(saved)) errors.target = `Can't be lower than ${formatRM(saved)} saved so far`;
  if (values.monthlyTopup === null || !(values.monthlyTopup > 0)) errors.monthlyTopup = 'Enter a monthly top-up above RM 0.00';
  if (!values.fromDate || !values.toDate || values.toDate < values.fromDate) errors.dates = "Target date can't be before the start date";
  return errors;
}

/** True when the form differs from what was loaded (the Discard prompt and the "Edited" tag). */
export function isTabungEditDirty(initial: TabungEditValues, current: TabungEditValues): boolean {
  return (
    initial.goalType !== current.goalType ||
    initial.name.trim() !== current.name.trim() ||
    initial.target !== current.target ||
    initial.monthlyTopup !== current.monthlyTopup ||
    initial.fromDate !== current.fromDate ||
    initial.toDate !== current.toDate ||
    initial.coverPath !== current.coverPath
  );
}

/** Which field a server validation message belongs to (update_tabung raises these). */
export function fieldOfServerError(message: string): TabungEditField | null {
  if (/name/i.test(message)) return 'name';
  if (/goal type/i.test(message)) return 'goalType';
  if (/monthly top-up/i.test(message)) return 'monthlyTopup';
  if (/target date|start date/i.test(message)) return 'dates';
  if (/target|saved so far/i.test(message)) return 'target';
  return null;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** '2026-10-31' → 'Oct 2026' (the Target date pill). */
export function monthLabel(ymd: string): string {
  const [y, m] = ymd.split('-').map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

/**
 * The Discard prompt's body (d-tabung-edit-discard): "Your new target of RM
 * 8,000.00 and target date of Oct 2026 won’t be saved. Tabung Rumah stays at
 * RM 5,000.00." Other edits get the general line.
 */
export function discardCopy(initial: TabungEditValues, current: TabungEditValues): string {
  const targetMoved = current.target !== null && current.target !== initial.target;
  const dateMoved = current.toDate.slice(0, 7) !== initial.toDate.slice(0, 7);
  if (targetMoved) {
    const date = dateMoved ? ` and target date of ${monthLabel(current.toDate)}` : '';
    return `Your new target of ${formatRM(current.target ?? 0)}${date} won’t be saved. ${initial.name} stays at ${formatRM(initial.target ?? 0)}.`;
  }
  return `Your changes to ${initial.name} won’t be saved.`;
}

/** Whole % of the target already saved (the "Progress: 80% → 50%" preview). */
export function progressPct(saved: number, target: number | null): number {
  return target && target > 0 ? Math.round((saved / target) * 100) : 0;
}
