import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { LockOverlay } from '../components/home/LockOverlay';

interface LockContextValue {
  locked: boolean;
  lock: () => void;
}

const LockContext = createContext<LockContextValue>({
  locked: false,
  lock: () => {},
});

export function useLock(): LockContextValue {
  return useContext(LockContext);
}

export function LockProvider({ children }: { children: React.ReactNode }) {
  // Start locked so the app requires unlocking on every entry.
  const [locked, setLocked] = useState(true);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      const prev = appState.current;
      appState.current = next;
      // Re-lock whenever the app returns to the foreground.
      if (next === 'active' && (prev === 'background' || prev === 'inactive')) {
        setLocked(true);
      }
    });
    return () => sub.remove();
  }, []);

  return (
    <LockContext.Provider value={{ locked, lock: () => setLocked(true) }}>
      {children}
      {locked && <LockOverlay onUnlock={() => setLocked(false)} />}
    </LockContext.Provider>
  );
}
