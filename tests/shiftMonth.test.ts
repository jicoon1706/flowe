import { shiftMonth, localYMD } from '../src/utils/date';

// AUDIT #6: month arrows must land on the adjacent month, whatever the day.
describe('shiftMonth', () => {
  it('goes from 31 Jan to February, clamped to its last day', () => {
    expect(localYMD(shiftMonth(new Date(2026, 0, 31), 1))).toBe('2026-02-28');
    expect(localYMD(shiftMonth(new Date(2028, 0, 31), 1))).toBe('2028-02-29');
  });

  it('goes back from 31 Mar to February', () => {
    expect(localYMD(shiftMonth(new Date(2026, 2, 31), -1))).toBe('2026-02-28');
  });

  it('crosses year boundaries', () => {
    expect(localYMD(shiftMonth(new Date(2026, 11, 31), 1))).toBe('2027-01-31');
    expect(localYMD(shiftMonth(new Date(2026, 0, 15), -1))).toBe('2025-12-15');
  });

  it('keeps the day when the target month has it', () => {
    expect(localYMD(shiftMonth(new Date(2026, 3, 16), 1))).toBe('2026-05-16');
  });
});
