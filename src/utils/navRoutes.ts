/**
 * Which floating-nav item a route belongs to, and which routes hide the nav.
 * Matched on the expo-router pathname (groups stripped: '/home/accounts').
 */
export type NavSection = 'home' | 'cashflow' | 'calendar' | 'settings';

/** Full-screen flows draw their own bottom actions (numpad, editor). */
const NO_NAV = [
  /^\/add-transaction$/,
  /^\/settings\/change-pin$/,
  /^\/settings\/merchant-request$/,
  /^\/tabung\/new(\/form)?$/,
  /^\/cashflow\/kwsp\/[^/]+$/,
  /^\/tabung\/edit\/[^/]+$/,
  /^\/home\/learn\/[^/]+\/(add-entry|entry)$/,
];

export function showsNav(pathname: string): boolean {
  const p = pathname.replace(/\/+$/, '') || '/';
  return !NO_NAV.some((re) => re.test(p));
}

export function navKeyFor(pathname: string): NavSection {
  const p = pathname.replace(/\/+$/, '') || '/';
  if (p.startsWith('/cashflow')) return 'cashflow';
  if (p.startsWith('/calendar')) return 'calendar';
  if (p.startsWith('/settings')) return 'settings';
  return 'home';
}
