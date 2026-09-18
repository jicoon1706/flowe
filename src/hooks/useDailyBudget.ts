import { useState, useCallback } from 'react';
import { settingsRepository } from '../repositories/settings.repository';
import * as FloweNotifications from '../../modules/flowe-notifications';
import type { SupabaseError } from '../utils/result';

/**
 * The user's daily spending budget, from `settings.daily_budget`.
 *
 * Supabase is the source of truth (it follows the user across devices); the
 * native side keeps a copy so the home-screen widget still draws — and still
 * moves for a payment answered from the shade — while Flowe is closed. Saving
 * writes both.
 */
export function useDailyBudget(userId: string | undefined) {
  const [budget, setBudget] = useState<number | null>(null);
  // Distinguishes "no budget" from "haven't asked yet", so callers don't
  // clear the native copy before the real value has arrived.
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<SupabaseError | null>(null);

  const fetchBudget = useCallback(async () => {
    if (!userId) return;
    const result = await settingsRepository.fetchOrCreate(userId);
    if (result.ok) {
      const value = result.data.daily_budget;
      setBudget(value === null || value === undefined ? null : Number(value));
      setError(null);
    } else {
      setError(result.error);
    }
    setLoaded(true);
  }, [userId]);

  const saveBudget = useCallback(async (value: number | null) => {
    if (!userId) return { ok: false as const };
    setSaving(true);
    const result = await settingsRepository.update(userId, { daily_budget: value });
    setSaving(false);
    if (result.ok) {
      setBudget(value);
      setError(null);
      FloweNotifications.setDailyBudget(value);
    } else {
      setError(result.error);
    }
    return result;
  }, [userId]);

  return { budget, loaded, saving, error, fetchBudget, saveBudget };
}
