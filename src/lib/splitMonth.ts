/**
 * Income split · which months can be shown and how to step between them.
 * Pure; identical file in flowe-desktop/src/lib (no imports), unit-tested in
 * both apps.
 *
 * A month is a Date on the 1st at local midnight. "Now" is the device's local
 * time, the same clock every transaction date is written in (localYMD), so in
 * Malaysia 00:30 on 1 December is already December.
 */

/** 'YYYY-MM'. */
export function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** The 1st of the month `d` falls in. */
export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/** The 1st of the month `delta` months away (January − 1 → the previous December). */
export function addMonths(month: Date, delta: number): Date {
  return new Date(month.getFullYear(), month.getMonth() + delta, 1);
}

export function sameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/** 'YYYY-MM' or 'YYYY-MM-DD' → the 1st of that month; null when it isn't one. No timezone shift. */
export function monthFromKey(key: string | null | undefined): Date | null {
  const m = /^(\d{4})-(\d{2})(?:-\d{2})?$/.exec(key ?? '');
  if (!m) return null;
  const month = Number(m[2]);
  if (month < 1 || month > 12) return null;
  return new Date(Number(m[1]), month - 1, 1);
}

export interface MonthBounds {
  /** The first month with any transaction; the current month when there are none. */
  earliest: Date;
  /** The current month. Nothing after it can be shown. */
  latest: Date;
}

/**
 * @param firstDate the earliest transaction's date ('YYYY-MM-DD'), or null with none.
 * @param now defaults to the current time.
 */
export function monthBounds(firstDate: string | null, now: Date = new Date()): MonthBounds {
  const latest = startOfMonth(now);
  const first = monthFromKey(firstDate);
  return { earliest: first && first < latest ? first : latest, latest };
}

/** `month` moved inside the bounds. */
export function clampMonth(month: Date, b: MonthBounds): Date {
  const m = startOfMonth(month);
  if (m < b.earliest) return b.earliest;
  if (m > b.latest) return b.latest;
  return m;
}

/**
 * The month to show for a requested one (a `?month=` param, or null for the
 * current month): inside the bounds. Until the first data month is known
 * (`boundsKnown` false) only a future month is pulled back, so a deep link to
 * an old month isn't clamped to today while the bounds load.
 */
export function resolveMonth(requested: Date | null, b: MonthBounds, boundsKnown: boolean): Date {
  const want = requested ? startOfMonth(requested) : b.latest;
  if (boundsKnown) return clampMonth(want, b);
  return want > b.latest ? b.latest : want;
}

/** Whether ‹ and › are enabled. */
export function stepState(month: Date, b: MonthBounds): { prev: boolean; next: boolean } {
  const m = startOfMonth(month);
  return { prev: m > b.earliest, next: m < b.latest };
}

/**
 * The months the history strip shows: up to `count` months ending at the
 * current month, oldest first, none before the first month with data.
 */
export function historyMonths(b: MonthBounds, count = 6): Date[] {
  const out: Date[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const m = addMonths(b.latest, -i);
    if (m >= b.earliest) out.push(m);
  }
  return out;
}

/** The picker's months, newest first: from the current month back to the first data month, at most `count`. */
export function pickerMonths(b: MonthBounds, count = 12): Date[] {
  return historyMonths(b, count).reverse();
}

/** "November 2026" / "Nov 2026" / "November" / "Nov". */
export function monthName(d: Date, style: 'long' | 'short' | 'month' | 'month-short' = 'long'): string {
  if (style === 'month') return d.toLocaleDateString('en-MY', { month: 'long' });
  if (style === 'month-short') return d.toLocaleDateString('en-MY', { month: 'short' });
  return d.toLocaleDateString('en-MY', { month: style, year: 'numeric' });
}
