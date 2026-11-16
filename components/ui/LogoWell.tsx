import { useEffect, useReducer, useState } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import type { LucideIcon } from 'lucide-react-native';
import { Store } from 'lucide-react-native';
import { colors } from '@/theme/tokens';
import { logoDevUrl } from '@/src/utils/logoDev';
import { merchantLogoUrl, subscribeMerchantSources } from '@/src/utils/merchantLogo';

export interface LogoWellProps {
  /** Brand domain (banks, wallets). Wins over `merchant`. */
  domain?: string;
  /** Transaction name, matched against the merchant list. */
  merchant?: string;
  /** Lucide icon when there is no logo (category icon, landmark, store). */
  fallback?: LucideIcon;
  size?: number;
  /** Well fill: white sheet → #F5F5F5; grey card or gradient → white. */
  on?: 'surface' | 'grey' | 'gradient';
  accessibilityLabel?: string;
}

/**
 * 40 px circle holding a logo at ~65% (logos unaltered), or a Lucide icon.
 * Logos come from logo.dev (or an uploaded file for a curated merchant).
 */
export function LogoWell({ domain, merchant, fallback: Fallback = Store, size = 40, on = 'surface', accessibilityLabel }: LogoWellProps) {
  const [, rerender] = useReducer((n: number) => n + 1, 0);
  useEffect(() => subscribeMerchantSources(rerender), []);
  const url = domain ? logoDevUrl(domain, size * 2) : merchantLogoUrl(merchant, size * 2);
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [url]);
  const inner = Math.round(size * 0.65);
  const fill = on === 'surface' ? colors['surface-container'] : colors.surface;

  return (
    <View
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityLabel ? 'image' : undefined}
      style={{ width: size, height: size, borderRadius: 9999, backgroundColor: fill, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
    >
      {url && !failed ? (
        <Image
          source={{ uri: url }}
          onError={() => setFailed(true)}
          style={{ width: inner, height: inner }}
          contentFit="contain"
          cachePolicy="memory-disk"
          transition={120}
        />
      ) : (
        <Fallback size={Math.round(size * 0.47)} color={colors['on-surface']} strokeWidth={1.75} />
      )}
    </View>
  );
}
