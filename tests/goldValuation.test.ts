// Desktop K · Gold maths (mirrors the assets_derive_value trigger; the SQL side
// is covered by flowe-akmal/supabase/tests/k_l_backend.test.sql).
import {
  GOLD_PRICE_STALE_DAYS, goldFormReady, goldGainLoss, goldValue, isGoldPriceStale, isPricedGold, priceAgeDays, todayInKualaLumpur,
} from '../src/lib/goldValuation';

describe('goldValue', () => {
  it('is grams × PG Buy price (dn-gold-filled: 12.5 g × RM 522.00)', () => {
    expect(goldValue(12.5, 522)).toBe(6525);
  });
  it('rounds to sen like the database, without binary drift', () => {
    // 1.4651 × 480.10 = 703.39451 → 703.39
    expect(goldValue(1.4651, 480.1)).toBe(703.39);
    // 0.1 × 0.3 style drift: 3 g × 0.10 = 0.30 exactly
    expect(goldValue(3, 0.1)).toBe(0.3);
    // half a sen rounds up: 0.0005 g... use 1.5 g × 0.33 = 0.495 → 0.50
    expect(goldValue(1.5, 0.33)).toBe(0.5);
  });
  it('is 0 until both grams and price are above 0', () => {
    expect(goldValue(0, 522)).toBe(0);
    expect(goldValue(12.5, 0)).toBe(0);
    expect(goldValue(Number.NaN, 522)).toBe(0);
  });
});

describe('goldGainLoss', () => {
  it('value − cost and % of cost (dn-gold-filled: −RM 375.00 · −5.4%)', () => {
    expect(goldGainLoss(6525, 6900)).toEqual({ amount: -375, pct: -5.4 });
  });
  it('a gain is positive', () => {
    expect(goldGainLoss(7000, 6000)).toEqual({ amount: 1000, pct: 16.7 });
  });
  it('break-even is 0 / 0', () => {
    expect(goldGainLoss(500, 500)).toEqual({ amount: 0, pct: 0 });
  });
  it('is null without a cost; % is null when cost is 0', () => {
    expect(goldGainLoss(6525, null)).toBeNull();
    expect(goldGainLoss(6525, undefined)).toBeNull();
    expect(goldGainLoss(6525, 0)).toEqual({ amount: 6525, pct: null });
  });
});

describe('price staleness', () => {
  it('counts whole days between two dates', () => {
    expect(priceAgeDays('2026-10-12', '2026-11-15')).toBe(34);
    expect(priceAgeDays('2026-11-15', '2026-11-15')).toBe(0);
    expect(priceAgeDays('2026-11-16', '2026-11-15')).toBe(0);
  });
  it(`is stale only after ${GOLD_PRICE_STALE_DAYS} days (dn-gold-stale: 34 days)`, () => {
    expect(isGoldPriceStale('2026-10-12', '2026-11-15')).toBe(true);
    expect(isGoldPriceStale('2026-10-16', '2026-11-15')).toBe(false); // exactly 30
    expect(isGoldPriceStale('2026-10-15', '2026-11-15')).toBe(true);  // 31
    expect(isGoldPriceStale(null, '2026-11-15')).toBe(false);
  });
  it("uses Malaysia's date, not UTC's", () => {
    // 20 Nov 2026 23:30 UTC is already 21 Nov in Kuala Lumpur (UTC+8).
    expect(todayInKualaLumpur(new Date('2026-11-20T23:30:00Z'))).toBe('2026-11-21');
    expect(todayInKualaLumpur(new Date('2026-11-20T15:59:00Z'))).toBe('2026-11-20');
  });
});

describe('Gold form', () => {
  it('needs grams and price above 0; cost is optional', () => {
    expect(goldFormReady({ grams: null, pricePerGram: null, cost: null })).toBe(false);
    expect(goldFormReady({ grams: 12.5, pricePerGram: null, cost: null })).toBe(false);
    expect(goldFormReady({ grams: 12.5, pricePerGram: 522, cost: null })).toBe(true);
    expect(goldFormReady({ grams: 12.5, pricePerGram: 522, cost: -1 })).toBe(false);
  });
  it('only a gold row with a price is "priced"', () => {
    expect(isPricedGold({ type: 'gold', price_per_gram: 522 })).toBe(true);
    expect(isPricedGold({ type: 'gold', price_per_gram: null })).toBe(false);
    expect(isPricedGold({ type: 'asb', price_per_gram: null })).toBe(false);
  });
});
