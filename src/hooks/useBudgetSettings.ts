import { useCallback, useState } from 'react';
import { settingsRepository } from '../repositories/settings.repository';
import { syncBudgetLimits } from '../services/dailyBudget';
import type { LiveBudgetMode } from '../lib/budget';
import type { SupabaseError } from '../utils/result';

export interface BudgetSettings {
  daily: number | null;
  monthly: number | null;
  liveMode: LiveBudgetMode;
}

/**
 * Daily + monthly limits and the live-update mode (settings.daily_budget,
 * monthly_budget, live_budget_mode). Saving writes Supabase, then the native
 * copy the widgets and the live notification draw from.
 */
export function useBudgetSettings(userId: string | undefined) {
  const [value, setValue] = useState<BudgetSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<SupabaseError | null>(null);

  const fetch = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const res = await settingsRepository.fetchOrCreate(userId);
    if (res.ok) {
      const s = res.data;
      setValue({
        daily: s.daily_budget === null || s.daily_budget === undefined ? null : Number(s.daily_budget),
        monthly: s.monthly_budget === null || s.monthly_budget === undefined ? null : Number(s.monthly_budget),
        // Before migration 20261117 the column is absent: behave as the default.
        liveMode: s.live_budget_mode ?? 'daily',
      });
      setError(null);
    } else setError(res.error);
    setLoading(false);
  }, [userId]);

  const save = useCallback(async (next: BudgetSettings) => {
    if (!userId) return { ok: false as const, error: { code: 'NO_USER', message: 'Not signed in' } };
    const res = await settingsRepository.update(userId, { daily_budget: next.daily, monthly_budget: next.monthly, live_budget_mode: next.liveMode });
    if (res.ok) {
      setValue(next);
      syncBudgetLimits(next.daily, next.monthly, next.liveMode);
    }
    return res;
  }, [userId]);

  return { value, loading, error, fetch, save };
}
