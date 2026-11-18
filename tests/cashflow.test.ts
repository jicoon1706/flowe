import { cashAtMonthEnd, coverRatio, entityValuesAsOf, financialClass, monthChangePct, monthlyFlows, monthsEnding, monthsWithValue, netWorthTrend, passiveCoveragePct, spendByCategory, CLASS_LABEL } from '../src/lib/cashflow';

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

// AUDIT-2026-11 B5: the Home/Overview "x% this month" chip.
describe('monthChangePct', () => {
  const ids = ['bank', 'wallet'];
  it('counts a tabung top-up out of the bank, not just income − expense', () => {
    // Started at 4,500: +1,000 salary, −500 into a tabung → 5,000 now, +11.1 %.
    const rows = [
      { type: 'income', amount: 1000, to_account_id: 'bank' },
      { type: 'tabung_topup', amount: 500, from_account_id: 'bank', to_account_id: 'jar' },
    ];
    expect(monthChangePct(5000, rows, ids)).toBeCloseTo((500 / 4500) * 100, 6);
  });
  it('counts a pay-out back into the bank and an investment out of it', () => {
    const rows = [
      { type: 'tabung_withdraw', amount: 200, from_account_id: 'bank', to_account_id: 'jar' },
      { type: 'transfer', amount: 300, from_account_id: 'wallet', to_account_id: null },
    ];
    // net −100 → started at 1,100
    expect(monthChangePct(1000, rows, ids)).toBeCloseTo((-100 / 1100) * 100, 6);
  });
  it('ignores transfers between two spendable accounts', () => {
    expect(monthChangePct(1000, [{ type: 'transfer', amount: 50, from_account_id: 'bank', to_account_id: 'wallet' }], ids)).toBeNull();
  });
  it('is null when the start would be zero or less', () => {
    expect(monthChangePct(100, [{ type: 'income', amount: 100, to_account_id: 'bank' }], ids)).toBeNull();
  });
});

describe('Cashflow tab: net worth trend', () => {
  const live = '2026-11-01';
  const asb = { id: 'asb', name: 'ASB', amount: 12000, since: '2026-01-01', monthly: 52 };
  const ptptn = { id: 'ptptn', name: 'PTPTN', amount: 9850, since: '2026-01-01', monthly: 150 };

  it('lists the months ending at the selected one, oldest first, across a year end', () => {
    expect(monthsEnding('2026-02-01', 4)).toEqual(['2025-11-01', '2025-12-01', '2026-01-01', '2026-02-01']);
  });

  it('carries the latest recorded value forward and uses live values from the current month', () => {
    const history = [{ id: 'asb', month: '2026-07-01', amount: 10000 }, { id: 'asb', month: '2026-09-01', amount: 11000 }];
    expect(entityValuesAsOf([asb], history, '2026-06-01', live).get('asb')).toBe(0);
    expect(entityValuesAsOf([asb], history, '2026-08-01', live).get('asb')).toBe(10000);
    expect(entityValuesAsOf([asb], history, '2026-10-01', live).get('asb')).toBe(11000);
    expect(entityValuesAsOf([asb], history, '2026-11-01', live).get('asb')).toBe(12000);
  });

  it('counts an entity with no history at its live value once it existed', () => {
    const later = { ...asb, since: '2026-09-01' };
    expect(entityValuesAsOf([later], [], '2026-08-01', live).get('asb')).toBe(0);
    expect(entityValuesAsOf([later], [], '2026-09-01', live).get('asb')).toBe(12000);
  });

  it('rolls cash back by every later leg on the accounts', () => {
    const legs = [
      { type: 'income', amount: 3000, to_account_id: 'bank', date: '2026-11-01' },
      { type: 'expense', amount: 500, from_account_id: 'bank', date: '2026-10-31' },
      { type: 'expense', amount: 200, from_account_id: 'bank', date: '2026-10-15' },
    ];
    expect(cashAtMonthEnd(5000, legs, ['bank'], '2026-11-01', live)).toBe(5000);
    expect(cashAtMonthEnd(5000, legs, ['bank'], '2026-10-01', live)).toBe(2000);
    expect(cashAtMonthEnd(5000, legs, ['bank'], '2026-09-01', live)).toBe(2700);
  });

  it('builds assets, liabilities and net worth per month', () => {
    const points = netWorthTrend({
      months: ['2026-10-01', '2026-11-01'], liveMonth: live, cashNow: 1000, accountIds: ['bank'],
      legs: [{ type: 'income', amount: 400, to_account_id: 'bank', date: '2026-11-05' }],
      assets: [asb], assetHistory: [{ id: 'asb', month: '2026-10-01', amount: 11000 }],
      liabilities: [ptptn], liabilityHistory: [{ id: 'ptptn', month: '2026-10-01', amount: 10000 }],
    });
    expect(points).toEqual([
      { month: '2026-10-01', assets: 11600, liabilities: 10000, netWorth: 1600 },
      { month: '2026-11-01', assets: 13000, liabilities: 9850, netWorth: 3150 },
    ]);
    expect(monthsWithValue(points)).toBe(2);
  });

  it('sums monthly flows only from entities held that month', () => {
    const flows = monthlyFlows([asb, { ...ptptn, id: 'x', name: 'Later', since: '2026-12-01', monthly: 10 }], [], '2026-10-01', live);
    expect(flows).toEqual({ total: 52, items: [{ name: 'ASB', amount: 52 }] });
  });

  it('gives passive coverage as a whole percentage, null without expenses', () => {
    expect(passiveCoveragePct(52, 2486.7)).toBe(2);
    expect(passiveCoveragePct(3000, 2500)).toBe(120);
    expect(passiveCoveragePct(50, 0)).toBeNull();
  });
});
