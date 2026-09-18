import { monthStart, monthStartOfIso } from '../src/utils/monthStart';

describe('monthStart', () => {
  it('returns the first of the month in local time', () => {
    expect(monthStart(new Date(2026, 8, 18))).toBe('2026-09-01');
    expect(monthStart(new Date(2026, 0, 31))).toBe('2026-01-01');
  });

  it('is unaffected by the day of month', () => {
    expect(monthStart(new Date(2026, 7, 1))).toBe(monthStart(new Date(2026, 7, 31)));
  });
});

describe('monthStartOfIso', () => {
  it('keeps the year-month and pins the day to 01', () => {
    expect(monthStartOfIso('2026-08-15')).toBe('2026-08-01');
    expect(monthStartOfIso('2025-12-31')).toBe('2025-12-01');
  });
});
