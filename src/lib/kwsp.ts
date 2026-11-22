/**
 * Desktop K · KWSP / EPF balances. Pure; shared with the app (identical file
 * in flowe-akmal/src/lib, only import paths differ) and unit-tested.
 *
 * The database keeps current_value = Persaraan + Sejahtera + Fleksibel (the
 * assets_derive_value trigger); this mirrors it for the live total and adds
 * the detail drawer's split percentages.
 */
import type { Asset } from '../types/database.types';

export type KwspAccountKey = 'persaraan' | 'sejahtera' | 'fleksibel';

export const KWSP_ACCOUNTS: readonly { key: KwspAccountKey; label: string; short: string }[] = [
  { key: 'persaraan', label: 'Akaun Persaraan', short: 'Persaraan' },
  { key: 'sejahtera', label: 'Akaun Sejahtera', short: 'Sejahtera' },
  { key: 'fleksibel', label: 'Akaun Fleksibel', short: 'Fleksibel' },
];

export type KwspBalances = Record<KwspAccountKey, number>;

const sen = (v: number | null | undefined) => Math.round((Number.isFinite(v as number) ? (v as number) : 0) * 100);

/** Persaraan + Sejahtera + Fleksibel, summed in sen. */
export function kwspTotal(b: Partial<Record<KwspAccountKey, number | null>>): number {
  return (sen(b.persaraan) + sen(b.sejahtera) + sen(b.fleksibel)) / 100;
}

/** The three balances of a KWSP asset row (0 for a missing one). */
export function kwspBalancesOf(a: Pick<Asset, 'kwsp_persaraan' | 'kwsp_sejahtera' | 'kwsp_fleksibel'>): KwspBalances {
  return {
    persaraan: Number(a.kwsp_persaraan ?? 0),
    sejahtera: Number(a.kwsp_sejahtera ?? 0),
    fleksibel: Number(a.kwsp_fleksibel ?? 0),
  };
}

export interface KwspShare {
  key: KwspAccountKey;
  label: string;
  short: string;
  amount: number;
  /** Whole %, largest-remainder rounded so the three add up to 100 (all 0 when the total is 0). */
  pct: number;
}

/** Each account's share of the total, for the split bar and its lines (dn-kwsp-detail). */
export function kwspSplit(b: KwspBalances): KwspShare[] {
  const total = sen(b.persaraan) + sen(b.sejahtera) + sen(b.fleksibel);
  const raw = KWSP_ACCOUNTS.map((acc, i) => {
    const exact = total > 0 ? (sen(b[acc.key]) * 100) / total : 0;
    return { ...acc, amount: sen(b[acc.key]) / 100, base: Math.floor(exact), rem: exact - Math.floor(exact), i };
  });
  let spare = total > 0 ? 100 - raw.reduce((s, r) => s + r.base, 0) : 0;
  const order = [...raw].sort((x, y) => y.rem - x.rem || y.amount - x.amount || x.i - y.i);
  const bonus = new Set<number>();
  for (const r of order) { if (spare <= 0) break; bonus.add(r.i); spare--; }
  return raw.map((r) => ({ key: r.key, label: r.label, short: r.short, amount: r.amount, pct: r.base + (bonus.has(r.i) ? 1 : 0) }));
}

/** Save is enabled once at least one balance is above 0 and none is negative (dn-kwsp-empty). */
export function kwspFormReady(b: Partial<Record<KwspAccountKey, number | null>>): boolean {
  const vals = [b.persaraan, b.sejahtera, b.fleksibel].map((v) => v ?? 0);
  return vals.every((v) => Number.isFinite(v) && v >= 0) && kwspTotal(b) > 0;
}
