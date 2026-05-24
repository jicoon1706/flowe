import { useState, useEffect, useCallback } from 'react';
import { transactionsRepository, CreateTransactionRequest } from '../repositories/transactions.repository';
import type { Transaction } from '../types';
import type { SupabaseError } from '../utils/result';

export function useTransactions(year: number, month: number) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<SupabaseError | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await transactionsRepository.fetchByMonth(year, month);
    if (result.ok) setTransactions(result.data);
    else setError(result.error);
    setLoading(false);
  }, [year, month]);

  useEffect(() => { fetch(); }, [fetch]);

  const expenses = transactions.filter(t => t.type === 'expense');
  const income = transactions.filter(t => t.type === 'income');

  const create = useCallback(async (req: CreateTransactionRequest) => {
    setLoading(true);
    setError(null);
    const result = await transactionsRepository.create(req);
    if (result.ok) await fetch();
    else setError(result.error);
    setLoading(false);
    return result;
  }, [fetch]);

  return { transactions, expenses, income, loading, error, refetch: fetch, create };
}