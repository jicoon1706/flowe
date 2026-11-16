/**
 * Ringgit formatting. Every amount in Flowe is drawn as a strong integer part
 * and a muted cents part, with a sign + arrow (never colour) for direction.
 * Pure on purpose: shared with the desktop app and unit-tested.
 */

/** U+2212, the typographic minus the canvas uses. */
export const MINUS = '−';

export type MoneyDirection = 'income' | 'expense' | 'none';

export interface MoneyParts {
  /** '+', '−' or '' */
  sign: string;
  /** Thousands-grouped integer part, no currency: '12,680'. */
  integer: string;
  /** Cents with the point: '.42'. */
  cents: string;
}

/** Rounds to whole cents, avoiding binary drift (1.005 → 1.01). */
export function roundCents(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function groupThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Splits an amount into sign, integer and cents. `direction` decides the sign:
 * income → '+', expense → '−', none → '−' only for a negative value.
 */
export function splitMoney(value: number, direction: MoneyDirection = 'none'): MoneyParts {
  const rounded = roundCents(value);
  const abs = Math.abs(rounded);
  const [whole, frac] = abs.toFixed(2).split('.');
  let sign = '';
  if (direction === 'income') sign = '+';
  else if (direction === 'expense') sign = MINUS;
  else if (rounded < 0) sign = MINUS;
  return { sign, integer: groupThousands(whole), cents: '.' + frac };
}

/** 'RM 1,234.56', '−RM 12.50', '+RM 3,200.00'. */
export function formatRM(value: number, direction: MoneyDirection = 'none'): string {
  const { sign, integer, cents } = splitMoney(value, direction);
  return `${sign}RM ${integer}${cents}`;
}

/** Compact for chips and tight labels: 'RM 1.2k', 'RM 950'. */
export function formatRMCompact(value: number): string {
  const abs = Math.abs(roundCents(value));
  const sign = value < 0 ? MINUS : '';
  if (abs >= 1_000_000) return `${sign}RM ${(abs / 1_000_000).toFixed(1).replace(/\.0$/, '')}m`;
  if (abs >= 1_000) return `${sign}RM ${(abs / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  return `${sign}RM ${Math.round(abs)}`;
}

/** Direction of a transaction type for sign + arrow. Transfers carry none. */
export function directionOf(type: string): MoneyDirection {
  if (type === 'income' || type === 'tabung_withdraw') return 'income';
  if (type === 'expense' || type === 'tabung_topup') return 'expense';
  return 'none';
}

/**
 * Parses what a numpad or keyboard produced ('12', '12.5', '1,250.50') into a
 * number, or null when it isn't a usable amount.
 */
export function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/[,\s]/g, '').replace(/^RM/i, '');
  if (!/^\d*\.?\d{0,2}$/.test(cleaned) || cleaned === '' || cleaned === '.') return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? roundCents(value) : null;
}

/** Upper bound the add form accepts (k-add-invalid-amount). */
export const MAX_AMOUNT = 999_999.99;

export type AmountProblem = 'zero' | 'too-large' | null;

export function amountProblem(value: number | null): AmountProblem {
  if (value === null || value <= 0) return 'zero';
  if (value > MAX_AMOUNT) return 'too-large';
  return null;
}
