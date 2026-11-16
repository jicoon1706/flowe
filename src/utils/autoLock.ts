/**
 * The Settings → Security "Auto-lock Timer" (AUDIT #12).
 *
 * The setting was saved but nothing read it. The lock is deferred (Home and
 * Add Transaction stay usable, figures masked), so re-locking only means "ask
 * for the PIN again before anything private", after the user has been away
 * from Flowe for at least the chosen time. `null` is "Never".
 */

/** What Settings shows when no value has been saved yet. */
export const DEFAULT_AUTO_LOCK_MINUTES = 5;

/**
 * The timer to apply, from the user's `auth_config` row.
 * No row (or not loaded) → the default the Settings screens display.
 * A row whose value is null → "Never".
 */
export function autoLockMinutesFrom(
  row: { auto_lock_minutes: number | null } | null | undefined,
): number | null {
  if (!row) return DEFAULT_AUTO_LOCK_MINUTES;
  return row.auto_lock_minutes;
}

/** Whether returning to the app now should lock it again. */
export function shouldRelock(
  backgroundedAt: number | null,
  now: number,
  minutes: number | null,
): boolean {
  if (backgroundedAt === null || minutes === null) return false;
  return now - backgroundedAt >= minutes * 60_000;
}
