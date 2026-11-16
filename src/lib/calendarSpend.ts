import { roundCents } from './money';

/**
 * Per-day spend levels for the calendar dots: 1–3 relative to the month's
 * biggest day (thirds), 0 for no spend. Also the month's expense total.
 */
export function spendOnDay(rows: { type: string; amount: number; date: string }[]): { levels: Record<string, number>; total: number } {
  const byDay: Record<string, number> = {};
  let total = 0;
  for (const r of rows) {
    if (r.type !== 'expense') continue;
    const d = r.date.slice(0, 10);
    byDay[d] = (byDay[d] ?? 0) + Number(r.amount);
    total += Number(r.amount);
  }
  const max = Math.max(0, ...Object.values(byDay));
  const levels: Record<string, number> = {};
  for (const [d, v] of Object.entries(byDay)) levels[d] = max > 0 && v > 0 ? Math.max(1, Math.ceil((v / max) * 3)) : 0;
  return { levels, total: roundCents(total) };
}
