import { spentOn, budgetProgress, parseBudgetInput } from '../src/utils/dailyBudget';

describe('spentOn', () => {
  const txs = [
    { type: 'expense' as const, amount: 12.5, date: '2026-09-11' },
    { type: 'expense' as const, amount: 30, date: '2026-09-11' },
    { type: 'income' as const, amount: 3000, date: '2026-09-11' },
    { type: 'expense' as const, amount: 99, date: '2026-09-10' },
    { type: 'transfer' as const, amount: 500, date: '2026-09-11' },
  ];

  it('sums only the expenses dated that day', () => {
    expect(spentOn(txs, '2026-09-11')).toBe(42.5);
  });

  it('is zero on a day with nothing spent', () => {
    expect(spentOn(txs, '2026-09-12')).toBe(0);
  });

  it('tolerates a timestamp in the date column', () => {
    expect(spentOn([{ type: 'expense', amount: 5, date: '2026-09-11T08:00:00+08:00' }], '2026-09-11')).toBe(5);
  });

  it('rounds away floating-point noise', () => {
    expect(spentOn([
      { type: 'expense', amount: 0.1, date: '2026-09-11' },
      { type: 'expense', amount: 0.2, date: '2026-09-11' },
    ], '2026-09-11')).toBe(0.3);
  });
});

describe('budgetProgress', () => {
  it('reports what is left and how full the bar is', () => {
    expect(budgetProgress(100, 42.5)).toEqual({ percent: 43, remaining: 57.5, over: false });
  });

  it('caps the bar at full once the budget is blown', () => {
    expect(budgetProgress(100, 130)).toEqual({ percent: 100, remaining: -30, over: true });
  });

  it('treats no budget as nothing to measure against', () => {
    expect(budgetProgress(0, 10)).toEqual({ percent: 0, remaining: 0, over: true });
    expect(budgetProgress(0, 0).over).toBe(false);
  });
});

describe('parseBudgetInput', () => {
  it('reads plain and formatted amounts', () => {
    expect(parseBudgetInput('100')).toBe(100);
    expect(parseBudgetInput('RM 1,250.50')).toBe(1250.5);
    expect(parseBudgetInput(' 45.999 ')).toBe(46);
  });

  it('turns empty or nonsense input into "no budget"', () => {
    expect(parseBudgetInput('')).toBeNull();
    expect(parseBudgetInput('RM')).toBeNull();
    expect(parseBudgetInput('0')).toBeNull();
    expect(parseBudgetInput('-5')).toBeNull();
  });
});
