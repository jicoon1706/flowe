import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { LockOverlay } from '../components/home/LockOverlay';
import { useAuth } from './AuthContext';
import { useProfile } from '../src/hooks/useProfile';
import { authConfigRepository } from '../src/repositories/authConfig.repository';
import { autoLockMinutesFrom, shouldRelock, DEFAULT_AUTO_LOCK_MINUTES } from '../src/utils/autoLock';

interface LockContextValue {
  /**
   * True until the user has verified their PIN or fingerprint in this
   * session. The app stays usable while locked — home with balances masked,
   * and the add-transaction form — so this is a "not yet verified" flag, not a
   * wall. Screens that show money read it to decide what to hide.
   */
  locked: boolean;
  /** Puts the app back into the locked state. Called from Settings › Account › Sign out of this device. */
  lock: () => void;
  /**
   * Shows the unlock prompt now, if the app is locked. Resolves `true` once the
   * user has unlocked, `false` if they backed out. Already-unlocked resolves
   * `true` immediately, so callers can gate any action with one `await`.
   */
  requireUnlock: () => Promise<boolean>;
  /**
   * Skips the auto-lock check for the next return to the app. Call before
   * deliberately leaving it, e.g. opening the camera or image picker, so
   * coming back with a photo never asks for the PIN.
   */
  suspend: () => void;
}

const LockContext = createContext<LockContextValue>({
  locked: false,
  lock: () => {},
  requireUnlock: async () => true,
  suspend: () => {},
});

export function useLock(): LockContextValue {
  return useContext(LockContext);
}

export function LockProvider({ children }: { children: React.ReactNode }) {
  // Start locked on a fresh app launch (cold start). Returning from the
  // background re-locks only after the Settings → Security "Auto-lock Timer"
  // has elapsed (see the AppState effect below; "Never" turns it off).
  //
  // Locked no longer means blocked: the overlay is only raised when something
  // that needs the PIN is opened, or a caller asks for it. Until then the user
  // can log a payment with every balance hidden.
  const [locked, setLocked] = useState(true);
  const [prompting, setPrompting] = useState(false);
  const lockedRef = useRef(locked);
  lockedRef.current = locked;
  // One in-flight prompt at a time: a route change and a button press asking
  // together share the same overlay and the same answer.
  const pendingRef = useRef<{ promise: Promise<boolean>; resolve: (ok: boolean) => void } | null>(null);

  const settle = useCallback((ok: boolean) => {
    const pending = pendingRef.current;
    pendingRef.current = null;
    setPrompting(false);
    pending?.resolve(ok);
  }, []);

  const requireUnlock = useCallback(() => {
    if (!lockedRef.current) return Promise.resolve(true);
    if (pendingRef.current) return pendingRef.current.promise;
    let resolve!: (ok: boolean) => void;
    const promise = new Promise<boolean>((r) => { resolve = r; });
    pendingRef.current = { promise, resolve };
    setPrompting(true);
    return promise;
  }, []);

  const lock = useCallback(() => setLocked(true), []);

  // ── Auto-lock Timer (AUDIT #12) ─────────────────────────────────────────
  // The setting used to be saved and never read. The timer is re-read
  // whenever the app goes to or comes back from the background, so a change
  // made in Settings applies to the very next time the user leaves.
  const { user } = useAuth();
  const { displayName } = useProfile(user?.id);
  const autoLockMinutesRef = useRef<number | null>(DEFAULT_AUTO_LOCK_MINUTES);
  const backgroundedAtRef = useRef<number | null>(null);
  const skipNextCheckRef = useRef(false);

  const refreshAutoLock = useCallback(async () => {
    if (!user) return;
    const res = await authConfigRepository.fetch(user.id);
    // Offline: keep the last known value rather than guessing.
    if (res.ok) autoLockMinutesRef.current = autoLockMinutesFrom(res.data);
  }, [user]);

  useEffect(() => { refreshAutoLock(); }, [refreshAutoLock]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      // 'background' only: 'inactive' also fires for system sheets such as
      // the fingerprint prompt, which isn't leaving the app.
      if (next === 'background') {
        if (backgroundedAtRef.current === null) backgroundedAtRef.current = Date.now();
        refreshAutoLock();
        return;
      }
      if (next !== 'active') return;
      const leftAt = backgroundedAtRef.current;
      backgroundedAtRef.current = null;
      if (skipNextCheckRef.current) {
        skipNextCheckRef.current = false;
        return;
      }
      if (shouldRelock(leftAt, Date.now(), autoLockMinutesRef.current)) setLocked(true);
    });
    return () => sub.remove();
  }, [refreshAutoLock]);

  const suspend = useCallback(() => { skipNextCheckRef.current = true; }, []);

  return (
    <LockContext.Provider value={{ locked, lock, requireUnlock, suspend }}>
      {children}
      {locked && prompting && (
        <LockOverlay
          displayName={displayName || undefined}
          onUnlock={() => { setLocked(false); settle(true); }}
          onCancel={() => settle(false)}
        />
      )}
    </LockContext.Provider>
  );
}
