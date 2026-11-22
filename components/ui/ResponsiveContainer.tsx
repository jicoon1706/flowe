import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { TABLET_WIDTH, useBreakpoint, type ContentWidth } from '@/src/hooks/useBreakpoint';

export interface ResponsiveContainerProps {
  children: ReactNode;
  /** 'form' ≈ 640 dp (forms, PIN, onboarding, settings); 'dashboard' ≈ 960 dp. Or an explicit dp width. */
  variant?: ContentWidth | number;
  /** Applied to the tablet wrapper only (e.g. the parent's `gap` or `flex: 1`). */
  style?: StyleProp<ViewStyle>;
}

/**
 * Centres content with a max width on tablet. On phones it renders its children
 * as they are (no wrapper view), so the phone layout is untouched.
 */
export function ResponsiveContainer({ children, variant = 'dashboard', style }: ResponsiveContainerProps) {
  const { isTablet } = useBreakpoint();
  if (!isTablet) return <>{children}</>;
  const maxWidth = typeof variant === 'number' ? variant : TABLET_WIDTH[variant];
  return <View style={[{ width: '100%', maxWidth, alignSelf: 'center' }, style]}>{children}</View>;
}
