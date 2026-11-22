/**
 * Desktop L · what the Income split screens draw from an income_split()
 * answer: the stacked bar (dl-cashflow-card, dl-split, dl-split-over), the
 * table rows' links (state 4) and the Edit groups category list (dl-edit-groups).
 * Pure, so it is unit-tested.
 */
import { pct1 } from './incomeSplit';
import type { IncomeSplit, IncomeSplitRow, SplitGroup } from '../types/database.types';

export type SplitPart = 'needs' | 'wants' | 'invest' | 'left';

export interface BarSegment {
  part: SplitPart;
  /** Width in % of the bar. */
  width: number;
}

export interface SplitBarModel {
  segments: BarSegment[];
  /** Overspent: where income (100%) falls on the bar, in % of its width; else null. */
  incomeAt: number | null;
  label: string;
}

const PART_NAME: Record<SplitPart, string> = { needs: 'Needs', wants: 'Wants', invest: 'Investments & savings', left: 'Left over' };

/**
 * The 100% bar. Normally the four parts are % of income. Overspent: Left over
 * is negative, so the bar spans what was used (Needs + Wants + Invest & save)
 * and a line marks income at 100 ÷ used (dl-split-over: 100 ÷ 113 → 88.5%).
 */
export function splitBar(split: IncomeSplit): SplitBarModel | null {
  const b = split.buckets;
  if (!b) return null;
  const label = `Income split: ${(['needs', 'wants', 'invest', 'left'] as const).map((p) => `${PART_NAME[p]} ${b[p].pct.toFixed(1)}%`).join(', ')}`;
  if (b.left.amount < 0) {
    const used = b.needs.pct + b.wants.pct + b.invest.pct;
    const parts = (['needs', 'wants', 'invest'] as const).filter((p) => b[p].pct > 0);
    return {
      segments: parts.map((p) => ({ part: p, width: Math.round((b[p].pct / used) * 10000) / 100 })),
      incomeAt: Math.round((100 / used) * 10000) / 100,
      label,
    };
  }
  const parts = (['needs', 'wants', 'invest', 'left'] as const).filter((p) => b[p].pct > 0);
  return { segments: parts.map((p) => ({ part: p, width: b[p].pct })), incomeAt: null, label };
}

/** A table row's name: the category's label, "Tabung · {name}" or "{asset} top-up". */
export function rowName(row: IncomeSplitRow, categoryLabel: (c: string) => string): string {
  return row.kind === 'category' && row.category ? categoryLabel(row.category) : row.label ?? '';
}

/**
 * Where a table row leads (spec §5.4.5 state 4): the category's transactions,
 * the Tabung's top-ups or the asset's transfers, for that month.
 * @param month 'YYYY-MM'
 */
export function rowHref(row: IncomeSplitRow, month: string): string {
  const q = new URLSearchParams();
  if (row.kind === 'category' && row.category) {
    q.set('category', row.category);
  } else if (row.kind === 'tabung') {
    q.set('types', 'tabung_topup');
    q.set('account', row.key.replace(/^tabung:/, ''));
  } else {
    q.set('types', 'transfer');
    q.set('search', (row.label ?? '').replace(/ top-up$/, ''));
  }
  q.set('month', month);
  return `/transactions?${q.toString()}`;
}

/** Group card line: "46.6% of income · guide 50%" / "32.9% of income · not assigned yet" / "−13.0% of income · more than you earned". */
export function groupNote(part: SplitPart, pct: number, guide?: number): string {
  if (part === 'left') return `${pct1(pct)} of income · ${pct < 0 ? 'more than you earned' : 'not assigned yet'}`;
  return `${pct1(pct)} of income · guide ${guide}%`;
}

export interface GroupCategory {
  category: string;
  label: string;
  custom: boolean;
  group: SplitGroup;
}

/**
 * Every expense category for the Edit groups drawer: built-ins, the user's
 * custom expense categories ("(custom)") and any other category that already
 * has a group row (the seeded Groceries / Leisure). Needs, then Wants, then
 * Skip; built-in order, then by name, within each.
 */
export function groupCategories(
  builtins: readonly { id: string; name: string }[],
  custom: readonly { name: string }[],
  groups: Record<string, SplitGroup>,
): GroupCategory[] {
  const seen = new Map<string, GroupCategory>();
  builtins.forEach((b) => seen.set(b.id, { category: b.id, label: b.name, custom: false, group: groups[b.id] ?? 'skip' }));
  custom.forEach((c) => { if (!seen.has(c.name)) seen.set(c.name, { category: c.name, label: `${c.name} (custom)`, custom: true, group: groups[c.name] ?? 'skip' }); });
  Object.entries(groups).forEach(([cat, g]) => { if (!seen.has(cat)) seen.set(cat, { category: cat, label: cat, custom: false, group: g }); });
  const order: Record<SplitGroup, number> = { needs: 0, wants: 1, skip: 2 };
  const builtinIndex = (c: string) => { const i = builtins.findIndex((b) => b.id === c); return i === -1 ? builtins.length : i; };
  return [...seen.values()].sort((a, b) => order[a.group] - order[b.group] || builtinIndex(a.category) - builtinIndex(b.category) || a.label.localeCompare(b.label));
}
