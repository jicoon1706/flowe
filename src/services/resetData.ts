import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FloweNotifications from '../../modules/flowe-notifications';
import { authRepository, userDataRepository } from '../repositories';
import { flags } from '../lib/secureStore';
import { cancelScheduledWithPrefix } from './notifications';
import type { Result, SupabaseError } from '../utils/result';

/** Device-local keys that hold the old user's data. */
const LOCAL_KEYS = ['flowe.lastUsed.v1', 'flowe.alerts.v1', 'flowe.homeCache.v1'];

/**
 * Settings › Data › Reset all data (full reset, decision Q2): deletes the
 * user's rows and files, then everything this phone keeps for them — widgets,
 * scheduled reminders, caches, the PIN and the onboarding flag — and signs
 * out. The caller sends the user to /welcome. A failure on the server leaves
 * everything in place so the reset can be retried.
 */
export async function resetAllData(userId: string): Promise<Result<void, SupabaseError>> {
  const res = await userDataRepository.resetAll();
  if (!res.ok) return res;
  await userDataRepository.purgeStorage(userId);

  if (FloweNotifications.isAvailable) {
    FloweNotifications.setTabungWidget(null);
    FloweNotifications.setDailyBudget(null);
    FloweNotifications.setMonthlyBudget(null);
    FloweNotifications.setLiveBudgetMode('off');
    FloweNotifications.clearCaptures();
    FloweNotifications.setEnabled(false);
  }
  await cancelScheduledWithPrefix('flowe-');
  try {
    await AsyncStorage.multiRemove(LOCAL_KEYS);
  } catch {
    // Stale caches only affect pre-fills; the next user overwrites them.
  }
  await authRepository.signOut();
  await flags.unsetPin(); // also clears onboardingDone, so the gate runs onboarding again
  return { ok: true, data: undefined };
}
