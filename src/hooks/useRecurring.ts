import { useState, useCallback } from 'react';
import { recurringRepository, CreateRecurringRuleRequest } from '../repositories/recurring.repository';
import type { RecurringRule } from '../types';
import type { SupabaseError } from '../utils/result';
import { notify, formatRM } from '../services/notifications';

export function useRecurring() {
  const [recurringRules, setRecurringRules] = useState<RecurringRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<SupabaseError | null>(null);

  const fetchRecurring = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await recurringRepository.fetchAllActive();
    if (result.ok) setRecurringRules(result.data);
    else setError(result.error);
    setLoading(false);
  }, []);

  const createRecurring = useCallback(async (req: CreateRecurringRuleRequest) => {
    setLoading(true);
    setError(null);
    const result = await recurringRepository.create(req);
    if (result.ok) {
      notify({ type: 'recurring', emoji: '🔁', message: 'Recurring rule created', sub_text: `${req.name} • ${formatRM(req.amount)} ${req.frequency}`, related_entity_id: result.data.id });
      await fetchRecurring();
    } else setError(result.error);
    setLoading(false);
    return result;
  }, [fetchRecurring]);

  const updateStatus = useCallback(async (id: string, status: 'active' | 'paused' | 'ended') => {
    setLoading(true);
    setError(null);
    const result = await recurringRepository.updateStatus(id, status);
    if (result.ok) await fetchRecurring();
    else setError(result.error);
    setLoading(false);
    return result;
  }, [fetchRecurring]);

  return { recurringRules, loading, error, fetchRecurring, createRecurring, updateStatus };
}