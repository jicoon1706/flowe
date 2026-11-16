import { useState, useEffect, useCallback } from 'react';
import { transactionsRepository } from '../repositories/transactions.repository';
import type { Transaction } from '../types';
import type { SupabaseError } from '../utils/result';

/**
 * Every transaction that touches one account, newest first.
 *
 * The bank and wallet pages used to filter the current month's transactions
 * instead, so any older history was missing and the list was empty on the 1st
 * (AUDIT #8). Tabung pages already read the full history the same way.
 */
export function useAccountTransactions(accountId: string) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<SupabaseError | null>(null);

  const refetch = useCallback(async () => {
    if (!accountId) return;
    setLoading(true);
    setError(null);
    const result = await transactionsRepository.fetchByAccount(accountId);
    if (result.ok) setTransactions(result.data);
    else setError(result.error);
    setLoading(false);
  }, [accountId]);

  useEffect(() => { refetch(); }, [refetch]);

  return { transactions, loading, error, refetch };
}
