import { useCallback, useEffect, useRef, useState } from 'react';
import { incomeSplitRepository } from '../repositories/incomeSplit.repository';
import { onTransactionsChanged } from '../repositories/transactions.repository';
import type { IncomeSplit } from '../types';
import { monthStart } from '../utils/monthStart';
import type { SupabaseError } from '../utils/result';

interface Loaded {
  key: string;
  data: IncomeSplit | null;
  error: SupabaseError | null;
}

/**
 * Desktop / tablet / phone L: the income split for one month, from income_split(p_month) — the
 * one place it is computed. Reloads when the month changes and after any
 * transaction write; only the latest request may set state (AUDIT-2026-11 B6).
 * State is only set once a response lands, so `loading` is simply "no answer
 * for this month yet".
 */
export function useIncomeSplit(month: Date) {
  const key = monthStart(month);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const latest = useRef(0);

  const refresh = useCallback(async () => {
    const request = ++latest.current;
    const res = await incomeSplitRepository.fetchSplit(key);
    if (request !== latest.current) return;
    setLoaded(res.ok ? { key, data: res.data, error: null } : { key, data: null, error: res.error });
  }, [key]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => onTransactionsChanged(() => { refresh(); }), [refresh]);

  const current = loaded?.key === key ? loaded : null;
  return { data: current?.data ?? null, error: current?.error ?? null, loading: current === null, refresh };
}
