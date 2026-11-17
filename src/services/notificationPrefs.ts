import { supabase } from '../lib/supabase';
import { settingsRepository } from '../repositories/settings.repository';
import type { NotificationPrefs } from '../lib/notificationRules';
import type { Settings } from '../types';

/**
 * The user's notification switches (settings.notif_*, show_affirmations,
 * daily_reminder_time, daily_budget), cached in memory so every notify() call
 * doesn't cost a round trip. Settings screens push fresh values through
 * `rememberSettings`; otherwise the cache is re-read after 5 minutes.
 *
 * A failed read keeps the last good copy (or null): callers treat null as
 * "everything on", the column default, so being offline never silences a
 * notification the user asked for.
 */
export type NotificationSettings = NotificationPrefs & Pick<Partial<Settings>, 'daily_reminder_time' | 'daily_budget'>;

const TTL_MS = 5 * 60 * 1000;
let cached: NotificationSettings | null = null;
let readAt = 0;
let inflight: Promise<NotificationSettings | null> | null = null;

function pick(s: Settings): NotificationSettings {
  return {
    notif_expense: s.notif_expense,
    notif_income: s.notif_income,
    notif_transfer: s.notif_transfer,
    notif_recurring: s.notif_recurring,
    notif_alert: s.notif_alert,
    notif_tabung: s.notif_tabung,
    notif_milestone: s.notif_milestone,
    notif_asset: s.notif_asset,
    notif_cashflow: s.notif_cashflow,
    notif_affirmation: s.notif_affirmation,
    show_affirmations: s.show_affirmations,
    daily_reminder_time: s.daily_reminder_time,
    daily_budget: s.daily_budget,
  };
}

/** Called by any screen that loads or saves the settings row. */
export function rememberSettings(s: Settings): void {
  cached = pick(s);
  readAt = Date.now();
}

export async function getNotificationSettings(): Promise<NotificationSettings | null> {
  if (cached && Date.now() - readAt < TTL_MS) return cached;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const { data } = await supabase.auth.getUser();
      const userId = data.user?.id;
      if (!userId) return cached;
      const res = await settingsRepository.fetch(userId);
      if (res.ok) rememberSettings(res.data);
      return cached;
    } catch {
      return cached;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}
