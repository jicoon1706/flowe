import { monthTotals } from '../src/utils/accountHistory';

// AUDIT #8: the account pages list full history, but the tiles stay monthly.
const tx = (type: string, amount: number, date: string) => ({ type, amount, date }) as any;

describe('monthTotals', () => {
  const history = [
    tx('income', 3000, '2026-11-01'),
    tx('expense', 45.9, '2026-11-16'),
    tx('expense', 10.1, '2026-11-30'),
    tx('expense', 999, '2026-10-31'),
    tx('income', 500, '2025-11-15'),
    tx('transfer', 200, '2026-11-05'),
  ];

  it("counts only the given month's income and expenses", () => {
    expect(monthTotals(history, '2026-11')).toEqual({ income: 3000, expense: 56 });
  });

  it('ignores the same month in another year', () => {
    expect(monthTotals(history, '2025-11')).toEqual({ income: 500, expense: 0 });
  });

  it('is zero for a month with no rows (e.g. on the 1st before anything is logged)', () => {
    expect(monthTotals(history, '2026-12')).toEqual({ income: 0, expense: 0 });
  });

  it('rounds away floating-point noise', () => {
    expect(monthTotals([tx('expense', 0.1, '2026-11-01'), tx('expense', 0.2, '2026-11-02')], '2026-11').expense).toBe(0.3);
  });

  it('accepts amounts that arrive as numeric strings', () => {
    expect(monthTotals([tx('income', '12.50' as any, '2026-11-01')], '2026-11').income).toBe(12.5);
  });
});
