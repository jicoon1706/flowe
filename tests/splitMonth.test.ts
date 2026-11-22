// Income split · month stepping, bounds and the history strip's months.
// Same cases as flowe-desktop/src/lib/splitMonth.test.ts.
import {
  addMonths, clampMonth, historyMonths, monthBounds, monthFromKey, monthKey, pickerMonths, resolveMonth, sameMonth, startOfMonth, stepState,
} from '../src/lib/splitMonth';

const ym = (d: Date) => monthKey(d);

// The app runs on Malaysian phones: check the month edges in that zone.
const ORIGINAL_TZ = process.env.TZ;
beforeAll(() => { process.env.TZ = 'Asia/Kuala_Lumpur'; });
afterAll(() => { process.env.TZ = ORIGINAL_TZ; });

describe('stepping', () => {
  it('January back one is the previous December', () => {
    expect(ym(addMonths(new Date(2026, 0, 1), -1))).toBe('2025-12');
    expect(ym(addMonths(new Date(2025, 11, 1), 1))).toBe('2026-01');
  });
  it('steps from the 31st without skipping a month', () => {
    expect(ym(addMonths(startOfMonth(new Date(2026, 0, 31)), 1))).toBe('2026-02');
  });
});

describe('monthFromKey', () => {
  it('reads YYYY-MM and YYYY-MM-DD without a timezone shift', () => {
    expect(ym(monthFromKey('2026-08')!)).toBe('2026-08');
    expect(ym(monthFromKey('2026-08-01')!)).toBe('2026-08');
  });
  it('rejects anything else', () => {
    for (const bad of [undefined, null, '', '2026-13', '2026-00', '26-08', 'august']) expect(monthFromKey(bad)).toBeNull();
  });
});

describe('bounds', () => {
  const now = new Date(2026, 10, 22, 15, 0); // 22 Nov 2026
  it('the current month: next is disabled, prev enabled with older data', () => {
    const b = monthBounds('2026-03-14', now);
    expect(stepState(new Date(2026, 10, 1), b)).toEqual({ prev: true, next: false });
    expect(stepState(new Date(2026, 2, 1), b)).toEqual({ prev: false, next: true });
  });
  it('no data at all: only the current month, both arrows off', () => {
    const b = monthBounds(null, now);
    expect(ym(b.earliest)).toBe('2026-11');
    expect(stepState(b.latest, b)).toEqual({ prev: false, next: false });
    expect(historyMonths(b).map(ym)).toEqual(['2026-11']);
  });
  it('a first date in the future counts as this month', () => {
    expect(ym(monthBounds('2027-01-05', now).earliest)).toBe('2026-11');
  });
  it('clamps months outside the bounds', () => {
    const b = monthBounds('2026-03-14', now);
    expect(ym(clampMonth(new Date(2027, 0, 1), b))).toBe('2026-11');
    expect(ym(clampMonth(new Date(2025, 5, 1), b))).toBe('2026-03');
    expect(ym(clampMonth(new Date(2026, 7, 20), b))).toBe('2026-08');
  });
});

describe('resolveMonth (the ?month= param)', () => {
  const now = new Date(2026, 10, 22);
  const b = monthBounds('2026-03-14', now);
  it('no param → the current month', () => {
    expect(ym(resolveMonth(null, b, true))).toBe('2026-11');
  });
  it('keeps a month inside the bounds, clamps one outside', () => {
    expect(ym(resolveMonth(new Date(2026, 7, 1), b, true))).toBe('2026-08');
    expect(ym(resolveMonth(new Date(2025, 0, 1), b, true))).toBe('2026-03');
    expect(ym(resolveMonth(new Date(2027, 0, 1), b, true))).toBe('2026-11');
  });
  it('while the first month is unknown, only pulls a future month back', () => {
    const unknown = monthBounds(null, now);
    expect(ym(resolveMonth(new Date(2026, 7, 1), unknown, false))).toBe('2026-08');
    expect(ym(resolveMonth(new Date(2027, 0, 1), unknown, false))).toBe('2026-11');
  });
});

describe('Asia/Kuala_Lumpur near midnight on the 1st', () => {
  it('00:30 on 1 Dec (16:30 UTC on 30 Nov) is already December', () => {
    const b = monthBounds('2026-01-02', new Date('2026-11-30T16:30:00Z'));
    expect(ym(b.latest)).toBe('2026-12');
  });
  it('23:59 on 30 Nov (15:59 UTC) is still November', () => {
    const b = monthBounds('2026-01-02', new Date('2026-11-30T15:59:00Z'));
    expect(ym(b.latest)).toBe('2026-11');
    expect(sameMonth(b.latest, new Date(2026, 10, 30))).toBe(true);
  });
  it('a transaction dated the 1st belongs to that month', () => {
    expect(ym(monthBounds('2026-12-01', new Date('2026-11-30T16:30:00Z')).earliest)).toBe('2026-12');
  });
});

describe('history strip and picker months', () => {
  it('six months ending this month, oldest first, across a year end', () => {
    const b = monthBounds('2024-01-01', new Date(2026, 1, 10));
    expect(historyMonths(b).map(ym)).toEqual(['2025-09', '2025-10', '2025-11', '2025-12', '2026-01', '2026-02']);
  });
  it('none before the first data month', () => {
    const b = monthBounds('2026-09-30', new Date(2026, 10, 22));
    expect(historyMonths(b).map(ym)).toEqual(['2026-09', '2026-10', '2026-11']);
    expect(pickerMonths(b).map(ym)).toEqual(['2026-11', '2026-10', '2026-09']);
  });
  it('the picker stops at 12', () => {
    expect(pickerMonths(monthBounds('2020-01-01', new Date(2026, 10, 22)))).toHaveLength(12);
  });
});
