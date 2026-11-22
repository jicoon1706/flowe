/**
 * First day of the month a date falls in, as 'YYYY-MM-01' in local time —
 * the key used by the asset/liability value history.
 */
export function monthStart(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}-01`;
}

/**
 * Same, from a 'YYYY-MM-DD' string (no timezone shift) or a timestamp such as `created_at`
 * (its local month: '2026-10-31T17:30:00+00:00' is 1 Nov 01:30 in Malaysia → '2026-11-01').
 */
export function monthStartOfIso(iso: string): string {
  return iso.length > 10 ? monthStart(new Date(iso)) : `${iso.slice(0, 7)}-01`;
}
