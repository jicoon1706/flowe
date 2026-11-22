import { useEffect, useState } from 'react';
import { monthBounds, type MonthBounds } from '../lib/splitMonth';
import { loadFirstTransactionDate } from '../services/incomeSplitCache';
import { useSplitCacheGeneration } from './useIncomeSplit';

/**
 * Income split: the months the page may show — from the user's first
 * transaction to the current month. Until the first date is known (`ready`
 * false) only the current month counts. Re-read after transaction writes.
 */
export function useSplitBounds(): { bounds: MonthBounds; ready: boolean } {
  const generation = useSplitCacheGeneration();
  const [state, setState] = useState(() => ({ bounds: monthBounds(null), ready: false }));

  useEffect(() => {
    let live = true;
    loadFirstTransactionDate().then((first) => {
      if (live) setState({ bounds: monthBounds(first), ready: true });
    });
    return () => { live = false; };
  }, [generation]);

  return state;
}
