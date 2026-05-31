import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { LockOverlay } from '../components/home/LockOverlay';

interface LockContextValue {
  locked: boolean;
  lock: () => void;
  /**
   * Skip the next foreground re-lock. Call before intentionally backgrounding
   * the app (e.g. opening the image picker or camera) so returning doesn't
   * trigger the PIN/biometric prompt.
   */
  suspend: () => void;
}

const LockContext = createContext<LockContextValue>({
  locked: false,
  lock: () => {},
  suspend: () => {},
});

export function useLock(): LockContextValue {
  return useContext(LockContext);
}

export function LockProvider({ children }: { children: React.ReactNode }) {
  // Start locked so the app requires unlocking on every entry.
  const [locked, setLocked] = useState(true);
  const appState = useRef(AppState.currentState);
  // When true, the next foreground transition won't re-lock (set by suspend()).
  const skipNextLock = useRef(false);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      const prev = appState.current;
      appState.current = next;
      // Re-lock whenever the app returns to the foreground.
      if (next === 'active' && (prev === 'background' || prev === 'inactive')) {
        if (skipNextLock.current) {
          skipNextLock.current = false;
          return;
        }
        setLocked(true);
      }
    });
    return () => sub.remove();
  }, []);

  const suspend = () => {
    skipNextLock.current = true;
  };

  return (
    <LockContext.Provider value={{ locked, lock: () => setLocked(true), suspend }}>
      {children}
      {locked && <LockOverlay onUnlock={() => setLocked(false)} />}
    </LockContext.Provider>
  );
}
