import AsyncStorage from '@react-native-async-storage/async-storage';
import { merchantLogosRepository, type MerchantLogo } from '../repositories/merchantLogos.repository';
import { setMerchantSources, type MerchantSource } from '../utils/merchantLogo';

const CACHE_KEY = 'flowe.merchantLogos.v1';

/**
 * Loads the curated merchant list that decides which logo a transaction shows.
 *
 * The list is shared reference data, not user data, so it's read once per app
 * launch and cached on device. Three layers, each covering the one before:
 *
 *   1. the bundled list compiled into the app — always there, works offline
 *      from the very first frame (see utils/merchantLogo.ts);
 *   2. the cached copy of the last successful fetch — applied immediately, so
 *      a cold start shows the up-to-date list without waiting on the network;
 *   3. the database — fetched in the background; adding a merchant there
 *      reaches users without an app update.
 *
 * Nothing here blocks the UI, and a failure at any layer simply leaves the
 * previous one in place.
 */
export async function loadMerchantLogos(): Promise<void> {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) setMerchantSources(JSON.parse(cached) as MerchantSource[]);
  } catch {
    // Unreadable cache is not worth reporting — the bundled list still stands.
  }

  const result = await merchantLogosRepository.fetchAll();
  if (!result.ok) return;

  const sources = result.data.map(toSource);
  setMerchantSources(sources);

  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(sources));
  } catch {
    // Cache write failed; the list is live for this session either way.
  }
}

/** An uploaded file wins over a curated URL, which wins over the domain. */
function toSource(row: MerchantLogo): MerchantSource {
  return {
    keyword: row.keyword.toLowerCase(),
    domain: row.domain,
    logoUrl: row.logo_path
      ? merchantLogosRepository.publicUrl(row.logo_path)
      : row.logo_url ?? undefined,
    category: row.category ?? undefined,
  };
}
