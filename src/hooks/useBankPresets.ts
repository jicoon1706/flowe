import { useState, useCallback } from 'react';
import { bankPresetsRepository } from '../repositories/bankPresets.repository';
import type { BankPreset } from '../types';
import type { SupabaseError } from '../utils/result';

export function useBankPresets() {
  const [presets, setPresets] = useState<BankPreset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<SupabaseError | null>(null);

  const fetchPresets = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await bankPresetsRepository.fetchAll();
    if (result.ok) setPresets(result.data);
    else setError(result.error);
    setLoading(false);
  }, []);

  return { presets, loading, error, fetchPresets };
}
