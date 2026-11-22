import { useCallback, useEffect, useMemo, useState } from 'react';
import { accountsRepository, onTabungChanged } from '../repositories/accounts.repository';
import { onTransactionsChanged, transactionsRepository } from '../repositories/transactions.repository';
import { tabungProgress, type TabungFlow, type TabungProgress } from '../lib/tabungProgress';
import type { AccountWithDetails, Transaction } from '../types';
import type { SupabaseError } from '../utils/result';

/**
 * One Tabung with its progress (section N): the account row, every flow into
 * and out of it, and the contributed / balance maths from lib/tabungProgress.
 * Re-reads after any transaction write so the ring moves straight away.
 */
export function useTabungProgress(accountId: string) {
  const [account, setAccount] = useState<AccountWithDetails | null>(null);
  const [rows, setRows] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<SupabaseError | null>(null);

  const refresh = useCallback(async () => {
    if (!accountId) return;
    setLoading(true);
    const [acc, txs] = await Promise.all([accountsRepository.fetchById(accountId), transactionsRepository.fetchByAccount(accountId)]);
    if (acc.ok) setAccount(acc.data as AccountWithDetails);
    if (txs.ok) setRows(txs.data);
    setError(!acc.ok ? acc.error : !txs.ok ? txs.error : null);
    setLoading(false);
  }, [accountId]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => onTransactionsChanged(() => { refresh(); }), [refresh]);
  useEffect(() => onTabungChanged((changed) => { if (changed === accountId) refresh(); }), [refresh, accountId]);

  const flows: TabungFlow[] = useMemo(
    () => rows
      .filter((t) => (t.type === 'tabung_topup' || t.type === 'tabung_withdraw') && t.to_account_id === accountId)
      .map((t) => ({ type: t.type as TabungFlow['type'], amount: Number(t.amount), date: t.date })),
    [rows, accountId],
  );

  const tabung = account?.tabung_accounts ?? null;
  const progress: TabungProgress | null = useMemo(() => {
    if (!tabung) return null;
    return tabungProgress({
      target: Number(tabung.target_amount) || 0,
      fromDate: tabung.from_date,
      balance: Number(tabung.saved_amount) || 0,
      mode: tabung.progress_mode ?? 'contributed',
      flows,
    });
  }, [tabung, flows]);

  return { account, tabung, rows, flows, progress, loading, error, refresh };
}
