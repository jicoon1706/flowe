import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { LockOverlay } from '../components/home/LockOverlay';

interface LockContextValue {
  /**
   * True until the user has verified their PIN or fingerprint in this
   * session. The app stays usable while locked — home with balances masked,
   * and the add-transaction form — so this is a "not yet verified" flag, not a
   * wall. Screens that show money read it to decide what to hide.
   */
  locked: boolean;
  /** Puts the app back into the locked state (the padlock on the home screen). */
  lock: () => void;
  /**
   * Shows the unlock prompt now, if the app is locked. Resolves `true` once the
   * user has unlocked, `false` if they backed out. Already-unlocked resolves
   * `true` immediately, so callers can gate any action with one `await`.
   */
  requireUnlock: () => Promise<boolean>;
  /**
   * No-op kept for backward compatibility. The app no longer re-locks when
   * returning from the background, so there's nothing to suspend.
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
  // background does NOT re-lock — that only happens when the app process is
  // killed and relaunched, which remounts this provider.
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
  const suspend = () => {};

  return (
    <LockContext.Provider value={{ locked, lock, requireUnlock, suspend }}>
      {children}
      {locked && prompting && (
        <LockOverlay
          onUnlock={() => { setLocked(false); settle(true); }}
          onCancel={() => settle(false)}
        />
      )}
    </LockContext.Provider>
  );
}
