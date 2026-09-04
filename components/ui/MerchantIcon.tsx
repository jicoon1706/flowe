import { useEffect, useReducer, useState } from 'react';
import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import { merchantLogoUrl, subscribeMerchantSources } from '../../src/utils/merchantLogo';

interface MerchantIconProps {
  /** Transaction name — what the merchant is matched against. */
  name?: string;
  /** Category emoji to show when there's no logo for this merchant. */
  fallback: string;
  size?: number;
}

/**
 * A transaction's leading icon: the merchant's own logo where Flowe recognises
 * the name, and the category icon everywhere else. Logos load over the network
 * — from Supabase Storage when a file has been uploaded for the brand — so the
 * icon also falls back on a failed or offline fetch. The row always renders
 * something.
 */
export function MerchantIcon({ name, fallback, size = 44 }: MerchantIconProps) {
  // The curated list arrives shortly after launch; re-match when it does.
  const [, rerender] = useReducer((n: number) => n + 1, 0);
  useEffect(() => subscribeMerchantSources(rerender), []);

  const url = merchantLogoUrl(name);
  const [failed, setFailed] = useState(false);

  // A new merchant deserves a fresh attempt — otherwise a row recycled from a
  // failed one would never try to load its own logo.
  useEffect(() => { setFailed(false); }, [url]);

  return (
    <View
      className="rounded-xl bg-secondary items-center justify-center overflow-hidden"
      style={{ width: size, height: size }}
    >
      {url && !failed ? (
        <Image
          source={{ uri: url }}
          onError={() => setFailed(true)}
          style={{ width: size, height: size }}
          contentFit="cover"
          // Logos are identical for every user and never change per session, so
          // they're worth keeping on disk rather than refetching each launch.
          cachePolicy="memory-disk"
          transition={120}
        />
      ) : (
        <Text style={{ fontSize: size * 0.46 }}>{fallback}</Text>
      )}
    </View>
  );
}
