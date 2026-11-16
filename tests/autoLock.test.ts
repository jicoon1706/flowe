import { shouldRelock, autoLockMinutesFrom, DEFAULT_AUTO_LOCK_MINUTES } from '../src/utils/autoLock';

// AUDIT #12: the Auto-lock Timer must actually decide when the app re-locks.
const MIN = 60_000;
const t0 = Date.UTC(2026, 10, 16, 9, 0);

describe('shouldRelock', () => {
  it('re-locks once the chosen time away has passed', () => {
    expect(shouldRelock(t0, t0 + 5 * MIN, 5)).toBe(true);
    expect(shouldRelock(t0, t0 + 60 * MIN, 5)).toBe(true);
  });

  it('does not re-lock for a shorter absence', () => {
    expect(shouldRelock(t0, t0 + 5 * MIN - 1, 5)).toBe(false);
    expect(shouldRelock(t0, t0 + 30_000, 1)).toBe(false);
  });

  it('never re-locks when the timer is Never', () => {
    expect(shouldRelock(t0, t0 + 24 * 60 * MIN, null)).toBe(false);
  });

  it('does nothing without a recorded trip to the background', () => {
    expect(shouldRelock(null, t0, 1)).toBe(false);
  });
});

describe('autoLockMinutesFrom', () => {
  it("uses the saved value", () => {
    expect(autoLockMinutesFrom({ auto_lock_minutes: 15 })).toBe(15);
  });

  it('treats a saved null as Never', () => {
    expect(autoLockMinutesFrom({ auto_lock_minutes: null })).toBeNull();
  });

  it('falls back to the default Settings displays when nothing is saved', () => {
    expect(autoLockMinutesFrom(null)).toBe(DEFAULT_AUTO_LOCK_MINUTES);
    expect(autoLockMinutesFrom(undefined)).toBe(5);
  });
});
