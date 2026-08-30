import { useState, useCallback } from 'react';
import { recurringRepository } from '../repositories/recurring.repository';
import { approveRecurring, skipRecurring, dueThroughYMD } from '../services/recurring';
import type { RecurringRule } from '../types';

/**
 * Recurring rules whose date has arrived and are waiting on the user to approve
 * (create the transaction) or reject (skip this period). Each due rule surfaces
 * as one pending item for its current occurrence.
 *
 * "Arrived" means 5am local on the day — see `dueThroughYMD`.
 */
export function usePendingRecurring() {
  const [pending, setPending] = useState<RecurringRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState(false);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    // Not simply "today": a rule dated today only comes due at 5am local, so
    // opening the app at 1am shouldn't put tomorrow's bills in front of anyone.
    const result = await recurringRepository.fetchDue(dueThroughYMD());
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
