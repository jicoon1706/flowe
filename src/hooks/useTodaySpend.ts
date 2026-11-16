import { useCallback, useEffect, useState } from 'react';
import { onTransactionsChanged, transactionsRepository } from '../repositories/transactions.repository';
import { localYMD } from '../utils/date';

/**
 * Today's expense total, re-read after every transaction write anywhere in the
 * app (onTransactionsChanged), so Home's "Left today" ticks down live.
 * `changedAt` bumps on each write-triggered refresh (drives "Updated just now").
 */
export function useTodaySpend() {
  const [spent, setSpent] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [changedAt, setChangedAt] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    const res = await transactionsRepository.sumExpensesOn(localYMD(new Date()));
    if (res.ok) { setSpent(res.data); setFailed(false); } else setFailed(true);
    setLoading(false);
    return res.ok;
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => onTransactionsChanged(() => {
    refresh().then((ok) => { if (ok) setChangedAt(Date.now()); });
  }), [refresh]);

  return { spent, loading, failed, changedAt, refresh };
}
