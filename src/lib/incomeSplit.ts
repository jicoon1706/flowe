/**
 * Desktop L · Income split and net worth: turning the server's answers into
 * what the screens show. Pure; shared with the app (identical file in
 * flowe-akmal/src/lib, only import paths differ) and unit-tested.
 *
 * The figures themselves are computed once, in the database:
 * income_split(p_month) and net_worth_breakdown(). This module only parses
 * them, validates targets and words the suggestions — no maths that could
 * disagree with the server.
 */
import { formatRM } from './money';
import type {
  IncomeSplit, IncomeSplitRow, IncomeSplitSuggestion, NetWorthBreakdown, SplitTargets,
} from '../types/database.types';

export const DEFAULT_SPLIT_TARGETS: SplitTargets = { needs: 50, wants: 30, invest: 20 };

export const SPLIT_GROUP_LABEL = {
  needs: 'Needs',
  wants: 'Wants',
  invest: 'Investments & savings',
  left: 'Left over',
} as const;

/** Short group label used in the table and the drawer ("Invest & save"). */
export const SPLIT_GROUP_SHORT = { needs: 'Needs', wants: 'Wants', invest: 'Invest & save' } as const;

export const SPLIT_DISCLAIMER = 'A general guide, not financial advice.';

const num = (v: unknown): number => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
};
const str = (v: unknown): string | null => (typeof v === 'string' ? v : null);

/** Parses income_split()'s JSON (numbers may arrive as numbers or strings). */
export function parseIncomeSplit(raw: unknown): IncomeSplit {
  const r = (raw ?? {}) as Record<string, any>;
  const t = r.targets ?? {};
  const bucket = (b: any) => ({ amount: num(b?.amount), pct: num(b?.pct) });
  const state = r.state === 'ok' || r.state === 'overspent' ? r.state : 'empty';
  return {
    month: String(r.month ?? ''),
    state,
    income: num(r.income),
    targets: {
      needs: num(t.needs ?? DEFAULT_SPLIT_TARGETS.needs),
      wants: num(t.wants ?? DEFAULT_SPLIT_TARGETS.wants),
      invest: num(t.invest ?? DEFAULT_SPLIT_TARGETS.invest),
    },
    buckets: state === 'empty' || !r.buckets ? null : {
      needs: bucket(r.buckets.needs),
      wants: bucket(r.buckets.wants),
      invest: bucket(r.buckets.invest),
      left: bucket(r.buckets.left),
    },
    rows: (Array.isArray(r.rows) ? r.rows : []).map((x: any): IncomeSplitRow => ({
      kind: x.kind === 'tabung' || x.kind === 'asset' ? x.kind : 'category',
      key: String(x.key ?? ''),
      category: str(x.category),
      label: str(x.label),
      group: x.group === 'wants' || x.group === 'invest' ? x.group : 'needs',
      amount: num(x.amount),
      pct: num(x.pct),
    })),
    suggestions: (Array.isArray(r.suggestions) ? r.suggestions : []).slice(0, 3).map((s: any): IncomeSplitSuggestion => {
      switch (s.kind) {
        case 'invest_below_target':
          return { kind: s.kind, amount: num(s.amount), target_pct: num(s.target_pct), current_pct: num(s.current_pct), target_amount: num(s.target_amount) };
        case 'unassigned':
          return { kind: s.kind, amount: num(s.amount), pct: num(s.pct) };
        case 'wants_over_target':
          return { kind: s.kind, category: String(s.category ?? ''), amount: num(s.amount), pct: num(s.pct), target_pct: num(s.target_pct) };
        default:
          return { kind: 'needs_over_target', category: String(s.category ?? ''), amount: num(s.amount), pct: num(s.pct), target_pct: num(s.target_pct) };
      }
    }),
  };
}

/** Parses net_worth_breakdown()'s JSON. */
export function parseNetWorthBreakdown(raw: unknown): NetWorthBreakdown {
  const r = (raw ?? {}) as Record<string, any>;
  return {
    total_assets: num(r.total_assets),
    total_liabilities: num(r.total_liabilities),
    net_worth: num(r.net_worth),
    cash_accounts: num(r.cash_accounts),
    groups: (Array.isArray(r.groups) ? r.groups : []).map((g: any) => ({
      key: String(g.key) as NetWorthBreakdown['groups'][number]['key'],
      total: num(g.total),
      count: num(g.count),
      share_pct: num(g.share_pct),
    })),
    liabilities: (Array.isArray(r.liabilities) ? r.liabilities : []).map((l: any) => ({
      id: String(l.id), name: String(l.name ?? ''), type: l.type, amount_owed: num(l.amount_owed),
    })),
  };
}

export function targetsTotal(t: SplitTargets): number {
  return t.needs + t.wants + t.invest;
}

/**
 * The Edit groups drawer's inline error, or null when the targets are valid
 * (each a whole number 0–100, together exactly 100). The server rejects the
 * same cases (settings_split_targets_check, save_income_split_groups).
 */
export function targetsProblem(t: SplitTargets): string | null {
  const vals = [t.needs, t.wants, t.invest];
  if (vals.some((v) => !Number.isInteger(v) || v < 0 || v > 100)) return 'Each target is a whole number from 0 to 100.';
  const total = targetsTotal(t);
  return total === 100 ? null : `Targets add up to ${total}%. Make them 100%.`;
}

/** "Guide: 50 / 30 / 20". */
export function guideLabel(t: SplitTargets): string {
  return `Guide: ${t.needs} / ${t.wants} / ${t.invest}`;
}

/** 1 dp for cards and the table ("46.6%", "0.0%", "−13.0%"). */
export function pct1(n: number): string {
  const v = Math.round(n * 10) / 10;
  return `${v < 0 ? '−' : ''}${Math.abs(v).toFixed(1)}%`;
}

/** Trims ".0" in running copy ("72%", "11.2%"). */
export function pctShort(n: number): string {
  const v = Math.round(n * 10) / 10;
  const s = Number.isInteger(v) ? String(Math.abs(v)) : Math.abs(v).toFixed(1);
  return `${v < 0 ? '−' : ''}${s}%`;
}

/** Whole-ringgit amount for a suggestion headline ("RM 390"). */
function wholeRM(n: number): string {
  return `RM ${Math.round(n).toLocaleString('en-MY')}`;
}

export interface SuggestionCopy {
  title: string;
  body: string;
  /** Button label. */
  action: 'Top up a Tabung' | 'Move to Tabung' | 'View transactions';
  /** Where the button goes. */
  target: 'tabung' | 'transactions';
  /** For 'transactions': the category to filter by. */
  category?: string;
}

/**
 * The suggestion card copy (dl-split, dl-split-over).
 * @param monthName e.g. "November"
 * @param categoryName resolves a category slug/name to its display label
 */
export function suggestionCopy(s: IncomeSplitSuggestion, monthName: string, categoryName: (c: string) => string): SuggestionCopy {
  switch (s.kind) {
    case 'invest_below_target':
      return {
        title: `Move ${wholeRM(s.amount)} a month to reach ${s.target_pct}%`,
        body: `Invest & save is ${pctShort(s.current_pct)} of income. The guide is ${s.target_pct}% (${formatRM(s.target_amount)}).`,
        action: 'Top up a Tabung', target: 'tabung',
      };
    case 'unassigned':
      return {
        title: `${formatRM(s.amount)} isn’t assigned yet`,
        body: `${pctShort(s.pct)} of ${monthName}’s income is still sitting in your accounts.`,
        action: 'Move to Tabung', target: 'tabung',
      };
    case 'needs_over_target':
      return {
        title: `${categoryName(s.category)} is your biggest need: ${formatRM(s.amount)}`,
        body: `Needs are ${pctShort(s.pct)} of income against a ${s.target_pct}% guide.`,
        action: 'View transactions', target: 'transactions', category: s.category,
      };
    case 'wants_over_target':
      return {
        title: `${categoryName(s.category)} is your biggest want: ${formatRM(s.amount)}`,
        body: `Wants are ${pctShort(s.pct)} of income against a ${s.target_pct}% guide.`,
        action: 'View transactions', target: 'transactions', category: s.category,
      };
  }
}

/** Overspent amount (positive RM) when Left over is negative, else 0. */
export function overspentBy(split: IncomeSplit): number {
  const left = split.buckets?.left.amount ?? 0;
  return left < 0 ? -left : 0;
}

/** "113%" of income used (needs + wants + invest), for the overspent chip. */
export function incomeUsedPct(split: IncomeSplit): number {
  if (!split.buckets) return 0;
  return Math.round((split.buckets.needs.pct + split.buckets.wants.pct + split.buckets.invest.pct) * 10) / 10;
}
