import React, { createContext, useContext, useState } from 'react';
import { LockOverlay } from '../components/home/LockOverlay';

interface LockContextValue {
  locked: boolean;
  lock: () => void;
  /**
   * No-op kept for backward compatibility. The app no longer re-locks when
   * returning from the background, so there's nothing to suspend.
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
  // Start locked so a fresh app launch (cold start) requires unlocking.
  // Returning from the background does NOT re-lock — that only happens when
  // the app process is killed and relaunched, which remounts this provider.
  const [locked, setLocked] = useState(true);

  const suspend = () => {};

  return (
    <LockContext.Provider value={{ locked, lock: () => setLocked(true), suspend }}>
      {children}
      {locked && <LockOverlay onUnlock={() => setLocked(false)} />}
    </LockContext.Provider>
  );
}
