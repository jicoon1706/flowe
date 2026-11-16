import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Last-known Home figures, so a cold start or a failed refresh still shows a
 * balance (q-launch-2 "cached data → live", st-home-error "showing saved data").
 * Device-local; never the source of truth.
 */
const KEY = 'flowe.homeCache.v1';

export interface HomeCache {
  balance: number;
  /** ISO time of the fetch that produced it. */
  syncedAt: string;
}

export async function readHomeCache(): Promise<HomeCache | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as HomeCache) : null;
  } catch {
    return null;
  }
}

export async function writeHomeCache(balance: number): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify({ balance, syncedAt: new Date().toISOString() }));
  } catch {
    // Only a convenience.
  }
}

/** 'HH:mm' of a cache entry, local time. */
export function syncedLabel(c: HomeCache | null): string | null {
  if (!c) return null;
  const d = new Date(c.syncedAt);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
