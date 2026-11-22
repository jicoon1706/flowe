/**
 * Desktop K · Gold valuation. Pure; shared with the app (identical file in
 * flowe-akmal/src/lib, only import paths differ) and unit-tested.
 *
 * The database is the source of truth for the stored value (the
 * assets_derive_value trigger keeps current_value = round(grams × price, 2));
 * this module mirrors that formula for the live preview in the Gold form, and
 * adds what only the screen needs: gain/loss against cost and staleness.
 */
import { roundCents } from './money';
import type { Asset, GoldPurity } from '../types/database.types';

export const GOLD_PURITIES: readonly GoldPurity[] = [999, 916];
export const DEFAULT_GOLD_PURITY: GoldPurity = 999;

/** A PG Buy price older than this many days shows the stale nudge. */
export const GOLD_PRICE_STALE_DAYS = 30;

/**
 * grams × PG Buy price, rounded to sen exactly like the database
 * (`round(quantity * price_per_gram, 2)`). Works in integer units so
 * 1.4651 g × RM 480.10 doesn't pick up binary drift.
 */
export function goldValue(grams: number, pricePerGram: number): number {
  if (!Number.isFinite(grams) || !Number.isFinite(pricePerGram) || grams <= 0 || pricePerGram <= 0) return 0;
  const tenThousandthsOfGram = Math.round(grams * 10_000); // quantity is numeric(16,4)
  const priceSen = Math.round(pricePerGram * 100);          // price is numeric(12,2)
  const valueSen = Math.round((tenThousandthsOfGram * priceSen) / 10_000);
  return valueSen / 100;
}

export interface GainLoss {
  /** value − cost, RM (negative = loss). */
  amount: number;
  /** (value − cost) ÷ cost × 100, 1 dp; null when cost is 0. */
  pct: number | null;
}

/** Unrealised gain/loss, or null when no cost was entered. */
export function goldGainLoss(value: number, cost: number | null | undefined): GainLoss | null {
  if (cost === null || cost === undefined || !Number.isFinite(cost) || cost < 0) return null;
  const amount = roundCents(value - cost);
  const pct = cost > 0 ? Math.round(((value - cost) / cost) * 1000) / 10 : null;
  return { amount, pct: pct === 0 ? 0 : pct };
}

/** Today's date in Malaysia as 'YYYY-MM-DD' — the same day the database stamps. */
export function todayInKualaLumpur(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kuala_Lumpur', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** Whole days from `priceDate` to `today` (both 'YYYY-MM-DD'); 0 if the price is from today or later. */
export function priceAgeDays(priceDate: string, today: string): number {
  const toUtc = (iso: string) => {
    const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
    return Date.UTC(y, m - 1, d);
  };
  const days = Math.round((toUtc(today) - toUtc(priceDate)) / 86_400_000);
  return Number.isFinite(days) ? Math.max(0, days) : 0;
}

/** True when the PG Buy price is more than 30 days old. */
export function isGoldPriceStale(priceDate: string | null | undefined, today: string): boolean {
  if (!priceDate) return false;
  return priceAgeDays(priceDate, today) > GOLD_PRICE_STALE_DAYS;
}

/** A priced gold asset (saved in the Gold form). Legacy gold rows have no price and keep the old form. */
export function isPricedGold(a: Pick<Asset, 'type' | 'price_per_gram'>): boolean {
  return a.type === 'gold' && a.price_per_gram !== null && a.price_per_gram !== undefined;
}

export interface GoldFormValues {
  grams: number | null;
  pricePerGram: number | null;
  cost: number | null;
}

/** Save is enabled once grams and PG Buy price are both above 0 (dn-gold-empty). */
export function goldFormReady(v: GoldFormValues): boolean {
  return (v.grams ?? 0) > 0 && (v.pricePerGram ?? 0) > 0 && (v.cost === null || v.cost >= 0);
}
