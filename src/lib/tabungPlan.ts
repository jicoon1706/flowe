/**
 * New Tabung form maths: "Target date auto-fills from target ÷ monthly"
 * (canvas desktop/tabung · new drawer).
 */

/** The month the goal is reached saving `monthly` from `fromYmd`: 'YYYY-MM'. */
export function targetMonthFor(target: number, monthly: number, fromYmd: string): string | null {
  if (!(target > 0) || !(monthly > 0)) return null;
  const months = Math.ceil(target / monthly);
  const [y, m] = fromYmd.split('-').map(Number);
  const d = new Date(y, m - 1 + months - 1, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Last day of a 'YYYY-MM' month as 'YYYY-MM-DD' (tabung_accounts.to_date). */
export function endOfMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  return `${ym}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`;
}
