import { useState, useCallback } from 'react';
import { settingsRepository } from '../repositories/settings.repository';
import type { Settings } from '../types';
import type { SupabaseError } from '../utils/result';

export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<SupabaseError | null>(null);

  const fetchSettings = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    const result = await settingsRepository.fetch(userId);
    if (result.ok) setSettings(result.data);
    else setError(result.error);
    setLoading(false);
  }, []);

  const updateSettings = useCallback(async (userId: string, patch: Partial<Settings>) => {
    setLoading(true);
    setError(null);
    const result = await settingsRepository.update(userId, patch);
    if (result.ok) setSettings(result.data);
    else setError(result.error);
    setLoading(false);
    return result;
  }, []);

  return { settings, loading, error, fetchSettings, updateSettings };
}