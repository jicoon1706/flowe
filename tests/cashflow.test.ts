import { coverRatio, financialClass, spendByCategory, CLASS_LABEL } from '../src/lib/cashflow';

describe('financialClass (cashflow/info chip)', () => {
  it('is Poor with no assets, whatever the income', () => {
    expect(financialClass(0, 0, 2500)).toBe('poor');
    expect(financialClass(-10, 500, 100)).toBe('poor');
  });

  it('is Middle class with assets whose income does not cover expenses', () => {
    expect(financialClass(50_000, 300, 2500)).toBe('middle');
  });

  it('is Rich when asset income covers expenses', () => {
    expect(financialClass(400_000, 2500, 2500)).toBe('rich');
    expect(financialClass(400_000, 3000, 2500)).toBe('rich');
  });

  it('is not Rich in a month with no expenses', () => {
    expect(financialClass(10_000, 100, 0)).toBe('middle');
  });

  it('has a label for every class', () => {
    expect(CLASS_LABEL).toEqual({ poor: 'Poor', middle: 'Middle class', rich: 'Rich' });
  });
});

describe('coverRatio ("assets cover N× debts")', () => {
  it('is null without debts', () => {
    expect(coverRatio(10_000, 0)).toBeNull();
  });

  it('rounds to one decimal', () => {
    expect(coverRatio(25_000, 10_000)).toBe(2.5);
    expect(coverRatio(10_000, 3_000)).toBe(3.3);
  });

  it('is below 1 when debts exceed assets', () => {
    expect(coverRatio(4_000, 10_000)).toBe(0.4);
  });
});

describe('spendByCategory (cashflow bubbles)', () => {
  it('counts expenses only and sorts by share', () => {
    const { total, items } = spendByCategory([
      { type: 'expense', amount: 300, category: 'food' },
      { type: 'expense', amount: 100, category: 'transport' },
      { type: 'income', amount: 5000, category: 'salary' },
      { type: 'expense', amount: 100, category: 'food' },
    ]);
    expect(total).toBe(500);
    expect(items[0]).toEqual(expect.objectContaining({ category: 'food', amount: 400 }));
    expect(items[1]).toEqual(expect.objectContaining({ category: 'transport', amount: 100 }));
  });
});
