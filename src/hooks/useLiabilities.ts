import { useState, useCallback } from 'react';
import { liabilitiesRepository, CreateLiabilityRequest } from '../repositories/liabilities.repository';
import type { Liability } from '../types';
import type { SupabaseError } from '../utils/result';

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
    if (result.ok) await fetchLiabilities();
    else setError(result.error);
    setLoading(false);
    return result;
  }, [fetchLiabilities]);

  const updateLiability = useCallback(async (id: string, patch: Partial<Liability>) => {
    setLoading(true);
    setError(null);
    const result = await liabilitiesRepository.update(id, patch);
    if (result.ok) await fetchLiabilities();
    else setError(result.error);
    setLoading(false);
    return result;
  }, [fetchLiabilities]);

  const deleteLiability = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    const result = await liabilitiesRepository.softDelete(id);
    if (result.ok) await fetchLiabilities();
    else setError(result.error);
    setLoading(false);
    return result;
  }, [fetchLiabilities]);

  return { liabilities, loading, error, fetchLiabilities, createLiability, updateLiability, deleteLiability };
}