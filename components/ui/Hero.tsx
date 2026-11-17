import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radius } from '@/theme/tokens';
import { useBreakpoint } from '@/src/hooks/useBreakpoint';
import { GradientFill } from './GradientFill';

export interface HeroProps {
  children?: ReactNode;
  /** Fixed height of the field (canvas: 200 / 320 / 444). Omit to wrap content. */
  height?: number;
  /** Full-screen field (auth, lock, splash): no bottom radius, fills the screen. */
  full?: boolean;
  /** Adds the top safe-area inset to the inner padding. */
  safeTop?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Content dimmed to 55% while showing cached figures (q-launch-2). */
  dimmed?: boolean;
  /** Tablet only: centres the content in a column this wide (dp). The gradient stays full width. */
  contentMaxWidth?: number;
}

/**
 * The hero field: the gradient holding one key metric. 40 px bottom radius
 * (rounded.xl) where a white sheet meets it; full-bleed on auth screens.
 */
export function Hero({ children, height, full, safeTop = true, style, dimmed, contentMaxWidth }: HeroProps) {
  const insets = useSafeAreaInsets();
  const { isTablet } = useBreakpoint();
  const column = isTablet && contentMaxWidth ? { width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center' } as const : null;
  return (
    <View
      style={[
        {
          height: full ? undefined : height,
          flex: full ? 1 : undefined,
          overflow: 'hidden',
          borderBottomLeftRadius: full ? 0 : radius.xl,
          borderBottomRightRadius: full ? 0 : radius.xl,
          paddingTop: safeTop ? insets.top + 12 : 0,
        },
        style,
      ]}
    >
      <GradientFill />
      <View style={{ flex: full || height ? 1 : undefined, opacity: dimmed ? 0.55 : 1, ...column }}>{children}</View>
    </View>
  );
}
