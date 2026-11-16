import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '@/theme/tokens';
import { Text } from './Text';

export interface BrandMarkProps {
  size?: number;
  /** Lockup with the "flowe" wordmark. */
  wordmark?: boolean;
  /** White on the gradient (default) or black one-colour on white. */
  ink?: 'white' | 'black';
}

/** The Flowe mark: one stem curling into an "f", crossed by a single wave. */
export function BrandMark({ size = 28, wordmark = false, ink = 'white' }: BrandMarkProps) {
  const color = ink === 'white' ? colors['on-primary'] : colors['on-surface'];
  const stroke = size >= 80 ? 6.5 : 8;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: size * 0.28 }} accessible accessibilityRole="image" accessibilityLabel="Flowe">
      <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <Path d="M22 56V27c0-10 6-16 15-16 5 0 9 2 12 5" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M10 35c5-5 10-5 15 0s10 5 15 0 10-5 15 0" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
      {wordmark ? (
        <Text variant="body-lg" weight={500} size={size * 0.8} tone="inherit" style={{ color, letterSpacing: -0.045 * size * 0.8, lineHeight: size * 0.9 }}>flowe</Text>
      ) : null}
    </View>
  );
}
