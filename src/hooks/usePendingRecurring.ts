import { useState, useCallback } from 'react';
import { recurringRepository } from '../repositories/recurring.repository';
import { approveRecurring, skipRecurring } from '../services/recurring';
import type { RecurringRule } from '../types';

/** Today as a local 'YYYY-MM-DD' string (avoids the UTC shift toISOString causes). */
function todayYMD(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Recurring rules whose date has arrived and are waiting on the user to approve
 * (create the transaction) or reject (skip this period). Each due rule surfaces
 * as one pending item for its current occurrence.
 */
export function usePendingRecurring() {
  const [pending, setPending] = useState<RecurringRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState(false);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    const result = await recurringRepository.fetchDue(todayYMD());
    if (result.ok) setPending(result.data);
    setLoading(false);
  }, []);

  const approve = useCallback(async (rule: RecurringRule) => {
    setActing(true);
    const res = await approveRecurring(rule);
    if (res.ok) setPending((prev) => prev.filter((r) => r.id !== rule.id));
    setActing(false);
    return res;
  }, []);

  const reject = useCallback(async (rule: RecurringRule) => {
    setActing(true);
    const res = await skipRecurring(rule);
    if (res.ok) setPending((prev) => prev.filter((r) => r.id !== rule.id));
    setActing(false);
    return res;
  }, []);

  return { pending, loading, acting, fetchPending, approve, reject };
}
