import { useState, useCallback } from 'react';
import { liabilitiesRepository, CreateLiabilityRequest } from '../repositories/liabilities.repository';
import type { Liability } from '../types';
import type { SupabaseError } from '../utils/result';
import { notify, formatRM } from '../services/notifications';

export function useLiabilities() {
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<SupabaseError | null>(null);

  const fetchLiabilities = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await liabilitiesRepository.fetchAll();
    if (result.ok) setLiabilities(result.data);
    else setError(result.error);
    setLoading(false);
  }, []);

  const createLiability = useCallback(async (req: CreateLiabilityRequest) => {
    setLoading(true);
    setError(null);
    const result = await liabilitiesRepository.create(req);
    if (result.ok) {
      notify({ type: 'liability', emoji: '💳', message: 'Liability added', sub_text: `${req.name} • ${formatRM(req.amount_owed)}`, related_entity_id: result.data.id });
      await fetchLiabilities();
    } else setError(result.error);
    setLoading(false);
    return result;
  }, [fetchLiabilities]);

  const updateLiability = useCallback(async (id: string, patch: Partial<Liability>) => {
    setLoading(true);
    setError(null);
    const result = await liabilitiesRepository.update(id, patch);
    if (result.ok) {
      const name = patch.name ?? liabilities.find((l) => l.id === id)?.name ?? 'Liability';
      const owed = patch.amount_owed ?? liabilities.find((l) => l.id === id)?.amount_owed ?? 0;
      notify({ type: 'liability', emoji: '💳', message: 'Liability updated', sub_text: `${name} • ${formatRM(owed)}`, related_entity_id: id });
      await fetchLiabilities();
    } else setError(result.error);
    setLoading(false);
    return result;
  }, [fetchLiabilities, liabilities]);

  const deleteLiability = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    const name = liabilities.find((l) => l.id === id)?.name ?? 'Liability';
    const result = await liabilitiesRepository.softDelete(id);
    if (result.ok) {
      notify({ type: 'liability', emoji: '💳', message: 'Liability removed', sub_text: name, related_entity_id: id });
      await fetchLiabilities();
    } else setError(result.error);
    setLoading(false);
    return result;
  }, [fetchLiabilities, liabilities]);

  return { liabilities, loading, error, fetchLiabilities, createLiability, updateLiability, deleteLiability };
}