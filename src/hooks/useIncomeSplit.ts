import { useCallback, useEffect, useState } from 'react';
import { clearIncomeSplitCache, loadIncomeSplit, peekIncomeSplit, subscribeIncomeSplits, type SplitEntry } from '../services/incomeSplitCache';
import { monthStart } from '../utils/monthStart';

interface Loaded extends SplitEntry {
  key: string;
}

/** Bumps whenever the split cache is cleared, so effects reading it run again. */
export function useSplitCacheGeneration(): number {
  const [generation, setGeneration] = useState(0);
  useEffect(() => subscribeIncomeSplits(() => setGeneration((g) => g + 1)), []);
  return generation;
}

const cached = (key: string): Loaded | null => {
  const hit = peekIncomeSplit(key);
  return hit ? { key, ...hit } : null;
};

/**
 * Desktop / tablet / phone L: the income split for one month, from income_split(p_month) — the
 * one place it is computed — through the shared month cache (services/incomeSplitCache).
 * Reloads when the month changes and after any transaction write or Edit groups save.
 * Only the answer for the month still selected may set state (AUDIT-2026-11 B6).
 *
 * `loading` is "no answer for this month yet"; `previous` is the last month
 * shown, so a screen can keep it up (dimmed) instead of flashing blank.
 * `prefetch` warms other months (the neighbours) once this one has landed.
 */
export function useIncomeSplit(month: Date, prefetch: readonly Date[] = []) {
  const key = monthStart(month);
  const generation = useSplitCacheGeneration();
  const [loaded, setLoaded] = useState<Loaded | null>(() => cached(key));
  const warm = prefetch.map(monthStart).join(',');

  useEffect(() => {
    let live = true;
    loadIncomeSplit(key).then((entry) => {
      if (!live) return;
      setLoaded({ key, ...entry });
      warm.split(',').filter(Boolean).forEach((k) => { loadIncomeSplit(k); });
    });
    return () => { live = false; };
  }, [key, generation, warm]);

  const refresh = useCallback(() => clearIncomeSplitCache(), []);
  const current = loaded?.key === key ? loaded : cached(key);
  return {
    data: current?.data ?? null,
    error: current?.error ?? null,
    loading: current === null,
    previous: current === null ? loaded?.data ?? null : null,
    refresh,
  };
}

/** The history strip: several months at once, fetched in parallel through the same cache. */
export function useIncomeSplitHistory(months: readonly Date[]) {
  const keys = months.map(monthStart);
  const signature = keys.join(',');
  const generation = useSplitCacheGeneration();
  const [loaded, setLoaded] = useState<Record<string, SplitEntry>>({});

  useEffect(() => {
    let live = true;
    signature.split(',').filter(Boolean).forEach((k) => {
      loadIncomeSplit(k).then((entry) => { if (live) setLoaded((prev) => ({ ...prev, [k]: entry })); });
    });
    return () => { live = false; };
  }, [signature, generation]);

  return keys.map((key) => {
    const entry = loaded[key] ?? peekIncomeSplit(key);
    return { key, data: entry?.data ?? null, error: entry?.error ?? null, loading: !entry };
  });
}
