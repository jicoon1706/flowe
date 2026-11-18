import { useState, useEffect, useCallback, useRef } from 'react';
import { transactionsRepository, CreateTransactionRequest } from '../repositories/transactions.repository';
import type { Transaction } from '../types';
import type { SupabaseError } from '../utils/result';

export function useTransactions(year: number, month: number) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<SupabaseError | null>(null);

  // Only the latest request may write state: switching months quickly used to
  // let a slower, older month's response land last (AUDIT-2026-11 B6).
  const latest = useRef(0);

  const fetch = useCallback(async () => {
    const request = ++latest.current;
    setLoading(true);
    setError(null);
    const result = await transactionsRepository.fetchByMonth(year, month);
    if (request !== latest.current) return;
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

  const update = useCallback(async (id: string, req: CreateTransactionRequest) => {
    setLoading(true);
    setError(null);
    const result = await transactionsRepository.updateWithBalance(id, req);
    if (result.ok) await fetch();
    else setError(result.error);
    setLoading(false);
    return result;
  }, [fetch]);

  return { transactions, expenses, income, loading, error, refetch: fetch, create, update };
}