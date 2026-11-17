import { useState, useCallback } from 'react';
import { settingsRepository } from '../repositories/settings.repository';
import { rememberSettings } from '../services/notificationPrefs';
import { rescheduleAfterSettingsChange } from '../services/alerts';
import type { Settings } from '../types';
import type { SupabaseError } from '../utils/result';

/** Settings keys whose change moves a scheduled notification. */
const SCHEDULE_KEYS: readonly (keyof Settings)[] = [
  'notif_recurring', 'notif_cashflow', 'notif_affirmation', 'show_affirmations', 'daily_reminder_time',
];

export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<SupabaseError | null>(null);

  const fetchSettings = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    const result = await settingsRepository.fetch(userId);
    if (result.ok) {
      setSettings(result.data);
      rememberSettings(result.data);
    } else setError(result.error);
    setLoading(false);
  }, []);

  const updateSettings = useCallback(async (userId: string, patch: Partial<Settings>) => {
    setLoading(true);
    setError(null);
    const result = await settingsRepository.update(userId, patch);
    if (result.ok) {
      setSettings(result.data);
      rememberSettings(result.data);
      if (SCHEDULE_KEYS.some((k) => k in patch)) rescheduleAfterSettingsChange(userId);
    } else setError(result.error);
    setLoading(false);
    return result;
  }, []);

  return { settings, loading, error, fetchSettings, updateSettings };
}
