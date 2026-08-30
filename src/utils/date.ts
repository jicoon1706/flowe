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
