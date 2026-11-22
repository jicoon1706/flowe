/**
 * Desktop K · the words around an asset: row subtitles, the gain/loss tag,
 * the stale chip and the breakdown labels (dn-assets-saved, dn-gold-stale,
 * dn-gold-filled, dn-networth-breakdown). Pure, so it is unit-tested.
 */
import { formatRM, MINUS } from './money';
import { goldGainLoss, isGoldPriceStale, isPricedGold, priceAgeDays, type GainLoss } from './goldValuation';
import type { Asset } from '../types/database.types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** '2026-11-15' → '15 Nov'. */
export function dayMonth(ymd: string): string {
  const [, m, d] = ymd.slice(0, 10).split('-').map(Number);
  return `${d} ${MONTHS[m - 1]}`;
}

/** '2026-11-15' → '15 Nov 2026'. */
export function dayMonthYear(ymd: string): string {
  return `${dayMonth(ymd)} ${ymd.slice(0, 4)}`;
}

/** 12.5 → '12.5', 10 → '10', 1.4651 → '1.4651' (grams as the user typed them). */
export function gramsText(grams: number): string {
  return String(Number(grams.toFixed(4)));
}

/** '−RM 375.00 · −5.4%' / '+RM 120.00 · +1.8%' (no % when the cost is 0). */
export function gainLossText(g: GainLoss): string {
  const money = formatRM(Math.abs(g.amount), g.amount < 0 ? 'expense' : 'income');
  if (g.pct === null) return money;
  const sign = g.pct < 0 ? MINUS : '+';
  return `${money} · ${sign}${Math.abs(g.pct).toFixed(1)}%`;
}

/** Gain/loss of a priced Gold asset with a cost, else null. */
export function assetGainLoss(a: Asset): GainLoss | null {
  if (!isPricedGold(a)) return null;
  return goldGainLoss(Number(a.current_value), a.cost === null || a.cost === undefined ? null : Number(a.cost));
}

/** Days since the PG Buy price was saved, when that is more than 30 days (dn-gold-stale); else null. */
export function staleDays(a: Asset, today: string): number | null {
  if (!isPricedGold(a) || !a.price_date || !isGoldPriceStale(a.price_date, today)) return null;
  return priceAgeDays(a.price_date, today);
}

/**
 * Row subtitle on the Assets card: Gold '12.5 g · 999 · Price as of 15 Nov',
 * KWSP '3 accounts', everything else its type label.
 */
export function assetSubtitle(a: Asset, typeLabel: string): string {
  if (isPricedGold(a)) {
    const parts = [`${gramsText(Number(a.quantity ?? 0))} g`];
    if (a.purity) parts.push(String(a.purity));
    if (a.price_date) parts.push(`Price as of ${dayMonth(a.price_date)}`);
    return parts.join(' · ');
  }
  if (a.type === 'kwsp') return '3 accounts';
  return typeLabel;
}

/** Screen-reader name of an asset row (the frames' aria-labels). */
export function assetRowLabel(a: Asset, stale: number | null, gain: GainLoss | null): string {
  const value = formatRM(Number(a.current_value));
  if (stale !== null) return `${a.name}, ${value}, price is ${stale} days old`;
  if (gain && gain.amount !== 0) {
    const pct = gain.pct === null ? '' : `, ${Math.abs(gain.pct).toFixed(1)} percent`;
    return `${a.name}, ${value}, ${gain.amount < 0 ? 'down' : 'up'} ${formatRM(Math.abs(gain.amount))}${pct}`;
  }
  return a.name;
}
