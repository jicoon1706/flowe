/**
 * Local 'YYYY-MM-DD'. Never use `toISOString().slice(0, 10)` for a calendar
 * date: it converts to UTC first, so in UTC+8 anything logged before 08:00
 * local lands on the previous day.
 */
export function localYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * The same day `delta` months away, clamped to the target month's last day.
 * `Date#setMonth` overflows instead: from 31 Jan, +1 lands on 3 Mar, so month
 * arrows skipped February whenever the selected day was the 29th–31st.
 */
export function shiftMonth(d: Date, delta: number): Date {
  const target = new Date(d.getFullYear(), d.getMonth() + delta, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(d.getDate(), lastDay));
  return target;
}
