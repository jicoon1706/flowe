import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Remembers the accounts the user last used, so Add opens pre-filled
 * (last-used account; a transfer's last two). Device-local convenience only:
 * a failed read simply means no pre-fill.
 */
const KEY = 'flowe.lastUsed.v1';

export interface LastUsed {
  accountId?: string;
  transferFromId?: string;
  transferToId?: string;
  /** Last tabung funding account, per tabung account id. */
  tabungFunding?: Record<string, string>;
}

export async function readLastUsed(): Promise<LastUsed> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as LastUsed) : {};
  } catch {
    return {};
  }
}

export async function writeLastUsed(patch: LastUsed): Promise<void> {
  try {
    const cur = await readLastUsed();
    const next: LastUsed = {
      ...cur,
      ...patch,
      tabungFunding: { ...(cur.tabungFunding ?? {}), ...(patch.tabungFunding ?? {}) },
    };
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Pre-fill is a convenience; losing it is harmless.
  }
}
