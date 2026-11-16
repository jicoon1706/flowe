import { budgetStatus, dailyFromMonthly, daysInMonth, defaultLiveMode, effectiveLiveMode, spentInMonth, spentOnDay } from '../src/lib/budget';

const rows = [
  { type: 'expense', amount: 12.5, date: '2026-11-16' },
  { type: 'expense', amount: 89.9, date: '2026-11-16' },
  { type: 'income', amount: 3200, date: '2026-11-16' },
  { type: 'expense', amount: 60, date: '2026-11-15' },
  { type: 'transfer', amount: 200, date: '2026-11-16' },
  { type: 'expense', amount: 10.1, date: '2026-10-31' },
];

describe('budget totals', () => {
  it('sums only expenses on the day', () => {
    expect(spentOnDay(rows, '2026-11-16')).toBe(102.4);
  });

  it('sums only expenses in the month', () => {
    expect(spentInMonth(rows, '2026-11')).toBe(162.4);
    expect(spentInMonth(rows, '2026-10')).toBe(10.1);
  });

  it('reports left, share used and overspend', () => {
    expect(budgetStatus(200, 162.4)).toEqual({ limit: 200, spent: 162.4, left: 37.6, used: 0.812, over: false });
    const over = budgetStatus(100, 120.5);
    expect(over.left).toBe(-20.5);
    expect(over.over).toBe(true);
    expect(over.used).toBe(1);
  });

  it('pre-fills a daily limit as monthly ÷ days', () => {
    expect(daysInMonth(new Date(2026, 10, 1))).toBe(30);
    expect(dailyFromMonthly(3000, new Date(2026, 10, 17))).toBe(100);
    expect(dailyFromMonthly(1000, new Date(2026, 1, 1))).toBe(35.71);
  });

  it('defaults live updates to Both only with a monthly limit', () => {
    expect(defaultLiveMode(3000)).toBe('both');
    expect(defaultLiveMode(null)).toBe('daily');
  });

  it('falls back to what the limits allow', () => {
    expect(effectiveLiveMode('both', 100, null)).toBe('daily');
    expect(effectiveLiveMode('monthly', null, 3000)).toBe('monthly');
    expect(effectiveLiveMode('monthly', 100, null)).toBe('daily');
    expect(effectiveLiveMode('daily', null, null)).toBe('off');
    expect(effectiveLiveMode('off', 100, 3000)).toBe('off');
  });
});
