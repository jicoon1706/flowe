import { StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { gradient } from '@/theme/tokens';

/**
 * The navy → cobalt field, vertical, navy on top. Absolutely fills its parent;
 * the parent decides the shape (radius + overflow hidden).
 */
export function GradientFill({ opacity = 1 }: { opacity?: number }) {
  // No width/height props: "100%" on an absolute child resolves against the
  // parent's content box (minus padding), so a padded parent left the bottom
  // uncovered. absoluteFill alone spans the full padding box.
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none" preserveAspectRatio="none">
      <Defs>
        <LinearGradient id="floweHero" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={gradient.from} stopOpacity={opacity} />
          <Stop offset="1" stopColor={gradient.to} stopOpacity={opacity} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#floweHero)" />
    </Svg>
  );
}
