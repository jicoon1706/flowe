import { useState, useCallback } from 'react';
import { accountsRepository, CreateBankAccountRequest, CreateWalletAccountRequest, CreateTabungAccountRequest } from '../repositories/accounts.repository';
import type { Account } from '../types';
import type { SupabaseError } from '../utils/result';

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<SupabaseError | null>(null);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await accountsRepository.fetchAllActive();
    if (result.ok) setAccounts(result.data);
    else setError(result.error);
    setLoading(false);
  }, []);

  const createBankAccount = useCallback(async (req: CreateBankAccountRequest) => {
    setLoading(true);
    setError(null);
    const result = await accountsRepository.createBankAccount(req);
    if (result.ok) await fetchAccounts();
    else setError(result.error);
    setLoading(false);
    return result;
  }, [fetchAccounts]);

  const createWalletAccount = useCallback(async (req: CreateWalletAccountRequest) => {
    setLoading(true);
    setError(null);
    const result = await accountsRepository.createWalletAccount(req);
    if (result.ok) await fetchAccounts();
    else setError(result.error);
    setLoading(false);
    return result;
  }, [fetchAccounts]);

  const createTabungAccount = useCallback(async (req: CreateTabungAccountRequest) => {
    setLoading(true);
    setError(null);
    const result = await accountsRepository.createTabungAccount(req);
    if (result.ok) await fetchAccounts();
    else setError(result.error);
    setLoading(false);
    return result;
  }, [fetchAccounts]);

  return { accounts, loading, error, fetchAccounts, createBankAccount, createWalletAccount, createTabungAccount };
}