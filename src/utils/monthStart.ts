/**
 * First day of the month a date falls in, as 'YYYY-MM-01' in local time —
 * the key used by the asset/liability value history.
 */
export function monthStart(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}-01`;
}

/** Same, from a 'YYYY-MM-DD' string (no timezone shift). */
export function monthStartOfIso(iso: string): string {
  return `${iso.slice(0, 7)}-01`;
}
