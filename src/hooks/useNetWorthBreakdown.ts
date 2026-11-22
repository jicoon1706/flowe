import { useCallback, useEffect, useRef, useState } from 'react';
import { netWorthRepository } from '../repositories/netWorth.repository';
import { onTransactionsChanged } from '../repositories/transactions.repository';
import type { NetWorthBreakdown } from '../types';
import type { SupabaseError } from '../utils/result';

interface Loaded {
  data: NetWorthBreakdown | null;
  error: SupabaseError | null;
}

/**
 * Desktop / tablet / phone K: net worth now and its breakdown by asset type, from
 * net_worth_breakdown() — the one place net worth is computed. Re-read after
 * any transaction write (balances move) and on `refresh()` after an asset or
 * liability save. The last good answer stays on screen while a refresh runs.
 */
export function useNetWorthBreakdown() {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const latest = useRef(0);

  const refresh = useCallback(async () => {
    const request = ++latest.current;
    const res = await netWorthRepository.fetchBreakdown();
    if (request !== latest.current) return;
    setLoaded((prev) => (res.ok ? { data: res.data, error: null } : { data: prev?.data ?? null, error: res.error }));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => onTransactionsChanged(() => { refresh(); }), [refresh]);

  return { data: loaded?.data ?? null, error: loaded?.error ?? null, loading: loaded === null, refresh };
}
