import React, { createContext, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useAccounts } from '../src/hooks/useAccounts';
import {
  useDetectedTransactions,
  type DetectedTransaction,
  type SaveOverrides,
} from '../src/hooks/useDetectedTransactions';
import type { Account } from '../src/types/database.types';

interface DetectedTransactionsValue {
  /** Every detection still waiting on the user, oldest first. */
  pending: DetectedTransaction[];
  /** The one the island should be showing right now, if any. */
  prompt: DetectedTransaction | null;
  /** Accounts the user can file a detection into. */
  accounts: Account[];
  save: (detected: DetectedTransaction, values: SaveOverrides) => Promise<{ ok: boolean }>;
  dismiss: (id: string) => void;
  snooze: (id: string) => void;
}

const DetectedTransactionsContext = createContext<DetectedTransactionsValue>({
  pending: [],
  prompt: null,
  accounts: [],
  save: async () => ({ ok: false }),
  dismiss: () => {},
  snooze: () => {},
});

export function useDetected(): DetectedTransactionsValue {
  return useContext(DetectedTransactionsContext);
}

/**
 * One queue of detected payments for the whole main app. It lives at the
 * layout level so a detection can be dealt with from wherever the user is —
 * the island hovers over any screen, and Home lists whatever is still unfiled.
 * Both read the same state, so completing one from the list drops it from the
 * island too.
 */
export function DetectedTransactionsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { accounts, fetchAccounts } = useAccounts();
  const { pending, prompt, save, dismiss, snooze } = useDetectedTransactions(user?.id, accounts);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const value: DetectedTransactionsValue = {
    pending,
    prompt,
    accounts,
    save: async (detected, values) => {
      const result = await save(detected, values);
      // A filed payment moved a balance; the account list feeding the pickers
      // should say so before the next one is offered.
      if (result.ok) await fetchAccounts();
      return result;
    },
    dismiss,
    snooze,
  };

  return (
    <DetectedTransactionsContext.Provider value={value}>
      {children}
    </DetectedTransactionsContext.Provider>
  );
}
