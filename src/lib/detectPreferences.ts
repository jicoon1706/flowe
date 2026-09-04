import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SourceAccountDefaults } from '../utils/resolveDetectedAccount';

/**
 * Which account each bank / e-wallet app's payments belong to.
 *
 * An e-wallet alert carries nothing that names an account, so with more than
 * one wallet every Grab or TNG payment would ask the same question forever.
 * This is the answer, remembered: set explicitly in Settings → Auto-detect, or
 * learned the first time the user files a detection from that app themselves.
 *
 * Device-local on purpose — it's a matching hint for notifications this phone
 * can see, not user data worth a round trip. Losing it costs one tap.
 */
const KEY = 'flowe.detect_source_accounts';

export const sourceAccounts = {
  async all(): Promise<SourceAccountDefaults> {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      // A corrupt map should cost the user a tap, not the whole feature.
      return {};
    }
  },

  async set(packageId: string, accountId: string): Promise<SourceAccountDefaults> {
    const next = { ...(await sourceAccounts.all()), [packageId]: accountId };
    await sourceAccounts.write(next);
    return next;
  },

  async clear(packageId: string): Promise<SourceAccountDefaults> {
    const next = { ...(await sourceAccounts.all()) };
    delete next[packageId];
    await sourceAccounts.write(next);
    return next;
  },

  /**
   * Records what the user chose when they filed a detection by hand, so the
   * next payment from that app files itself. Only ever fills a gap — an
   * explicit pin is never overwritten by a one-off choice.
   */
  async learn(packageId: string, accountId: string): Promise<SourceAccountDefaults> {
    const current = await sourceAccounts.all();
    if (current[packageId]) return current;
    const next = { ...current, [packageId]: accountId };
    await sourceAccounts.write(next);
    return next;
  },

  async write(map: SourceAccountDefaults): Promise<void> {
    try {
      await AsyncStorage.setItem(KEY, JSON.stringify(map));
    } catch {
      // Best effort: the feature still works, it just keeps asking.
    }
  },
};
