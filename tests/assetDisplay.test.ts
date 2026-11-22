// Desktop K · asset row and tag copy (dn-assets-saved, dn-gold-stale, dn-gold-filled).
import { assetGainLoss, assetRowLabel, assetSubtitle, dayMonth, dayMonthYear, gainLossText, gramsText, staleDays } from '../src/lib/assetDisplay';
import type { Asset } from '../src/types/database.types';

const gold: Asset = {
  id: 'g', user_id: 'u', name: 'Public Gold GAP', type: 'gold', current_value: 6525, quantity: 12.5, unit: 'g',
  purity: 999, price_per_gram: 522, price_date: '2026-11-15', cost: 6900, monthly_income: 0, is_active: true,
  created_at: '', updated_at: '',
};

describe('dates and grams', () => {
  it('formats like the frames', () => {
    expect(dayMonth('2026-11-15')).toBe('15 Nov');
    expect(dayMonthYear('2026-11-15')).toBe('15 Nov 2026');
    expect(gramsText(12.5)).toBe('12.5');
    expect(gramsText(10)).toBe('10');
    expect(gramsText(1.46512)).toBe('1.4651');
  });
});

describe('gain / loss', () => {
  it('reads −RM 375.00 · −5.4% for the dn-gold-filled example', () => {
    expect(gainLossText(assetGainLoss(gold)!)).toBe('−RM 375.00 · −5.4%');
  });

  it('shows a gain with plus signs', () => {
    expect(gainLossText({ amount: 120, pct: 1.8 })).toBe('+RM 120.00 · +1.8%');
  });

  it('drops the % when the cost was 0', () => {
    expect(gainLossText({ amount: 50, pct: null })).toBe('+RM 50.00');
  });

  it('is null without a cost or for unpriced gold', () => {
    expect(assetGainLoss({ ...gold, cost: null })).toBeNull();
    expect(assetGainLoss({ ...gold, price_per_gram: null })).toBeNull();
  });
});

describe('row text', () => {
  it('gives Gold its grams, purity and price date, KWSP its accounts, others their type', () => {
    expect(assetSubtitle(gold, 'Gold')).toBe('12.5 g · 999 · Price as of 15 Nov');
    expect(assetSubtitle({ ...gold, type: 'kwsp', price_per_gram: null }, 'KWSP / EPF')).toBe('3 accounts');
    expect(assetSubtitle({ ...gold, type: 'asb', price_per_gram: null }, 'ASB')).toBe('ASB');
  });

  it('flags a price older than 30 days (dn-gold-stale: 34 days)', () => {
    expect(staleDays({ ...gold, price_date: '2026-10-12' }, '2026-11-15')).toBe(34);
    expect(staleDays(gold, '2026-11-15')).toBeNull();
    expect(staleDays({ ...gold, price_date: '2026-10-16' }, '2026-11-15')).toBeNull();
  });

  it('names the row like the frames', () => {
    expect(assetRowLabel(gold, null, assetGainLoss(gold))).toBe('Public Gold GAP, RM 6,525.00, down RM 375.00, 5.4 percent');
    expect(assetRowLabel(gold, 34, null)).toBe('Public Gold GAP, RM 6,525.00, price is 34 days old');
  });
});
