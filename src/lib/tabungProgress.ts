/**
 * Tabung progress (section N). Pure and framework-free: shared with desktop.
 *
 * Default rule ('contributed'): progress = Σ tabung_topup since from_date ÷
 * target_amount. Pay-outs never reduce it — taking money out for the thing you
 * saved for is not going backwards. The balance and the paid-out total are
 * reported separately. 'balance' mode uses saved_amount ÷ target instead.
 */
import { roundCents } from './money';

export type TabungProgressMode = 'contributed' | 'balance';

export interface TabungFlow {
  type: 'tabung_topup' | 'tabung_withdraw';
  amount: number;
  /** 'YYYY-MM-DD' */
  date: string;
}

export interface TabungMonth {
  /** 'YYYY-MM' */
  month: string;
  toppedUp: number;
  paidOut: number;
  /** Running Σ top-ups up to and including this month; only ever climbs. */
  towardGoal: number;
}

export interface TabungProgress {
  contributed: number;
  paidOut: number;
  balance: number;
  /** 0..1 for the ring (capped at 1). */
  progress: number;
  /** Whole percent, uncapped (can pass 100). */
  percent: number;
  reached: boolean;
  /** Target − counted amount, never below 0. */
  remaining: number;
  months: TabungMonth[];
}

export interface TabungProgressInput {
  target: number;
  /** tabung_accounts.from_date, 'YYYY-MM-DD'. Flows before it don't count. */
  fromDate: string;
  /** tabung_accounts.saved_amount (the real balance). */
  balance: number;
  mode?: TabungProgressMode;
  flows: TabungFlow[];
}

const ymd = (s: string) => s.slice(0, 10);

export function tabungProgress({ target, fromDate, balance, mode = 'contributed', flows }: TabungProgressInput): TabungProgress {
  const since = ymd(fromDate);
  const inRange = flows.filter((f) => ymd(f.date) >= since);
  let contributed = 0;
  let paidOut = 0;
  const byMonth = new Map<string, { toppedUp: number; paidOut: number }>();
  for (const f of inRange) {
    const m = ymd(f.date).slice(0, 7);
    const row = byMonth.get(m) ?? { toppedUp: 0, paidOut: 0 };
    const amt = Math.abs(Number(f.amount) || 0);
    if (f.type === 'tabung_topup') { contributed += amt; row.toppedUp += amt; } else { paidOut += amt; row.paidOut += amt; }
    byMonth.set(m, row);
  }
  let running = 0;
  const months: TabungMonth[] = [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, r]) => {
      running += r.toppedUp;
      return { month, toppedUp: roundCents(r.toppedUp), paidOut: roundCents(r.paidOut), towardGoal: roundCents(running) };
    });

  contributed = roundCents(contributed);
  paidOut = roundCents(paidOut);
  const counted = mode === 'balance' ? Math.max(0, balance) : contributed;
  const ratio = target > 0 ? counted / target : 0;
  return {
    contributed,
    paidOut,
    balance: roundCents(balance),
    progress: Math.max(0, Math.min(1, ratio)),
    percent: Math.round(ratio * 100),
    reached: target > 0 && counted >= target,
    remaining: roundCents(Math.max(0, target - counted)),
    months,
  };
}

/** Whole months from `now` to `toDate` (at least 1). */
export function monthsLeft(toDate: string, now: Date = new Date()): number {
  const [y, m] = ymd(toDate).split('-').map(Number);
  const diff = (y - now.getFullYear()) * 12 + (m - 1 - now.getMonth());
  return Math.max(1, diff + 1);
}

/** Monthly amount that reaches the target by the target date. */
export function onTrackMonthly(remaining: number, toDate: string, now: Date = new Date()): number {
  if (remaining <= 0) return 0;
  return roundCents(remaining / monthsLeft(toDate, now));
}

/** The user's usual amount for a flow type: the most frequent, else the latest. */
export function usualAmount(flows: TabungFlow[], type: TabungFlow['type']): number | null {
  const list = flows.filter((f) => f.type === type).sort((a, b) => ymd(b.date).localeCompare(ymd(a.date)));
  if (!list.length) return null;
  const counts = new Map<number, number>();
  for (const f of list) counts.set(roundCents(Number(f.amount)), (counts.get(roundCents(Number(f.amount))) ?? 0) + 1);
  let best = roundCents(Number(list[0].amount));
  let bestCount = counts.get(best) ?? 0;
  for (const [amt, n] of counts) if (n > bestCount) { best = amt; bestCount = n; }
  return best;
}

/** The funding account used most for a Tabung's top-ups (return account on delete). */
export function mostUsedFunding(rows: { type: string; from_account_id?: string | null }[]): string | null {
  const counts = new Map<string, number>();
  for (const r of rows) if (r.type === 'tabung_topup' && r.from_account_id) counts.set(r.from_account_id, (counts.get(r.from_account_id) ?? 0) + 1);
  let best: string | null = null;
  let n = 0;
  for (const [id, c] of counts) if (c > n) { best = id; n = c; }
  return best;
}
