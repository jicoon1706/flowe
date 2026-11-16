import { useEffect } from 'react';
import { type DimensionValue } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { colors } from '@/theme/tokens';

export interface SkeletonProps {
  width?: DimensionValue;
  height: number;
  radius?: number;
  /** 'glass' on the gradient; 'tile' = #F5F5F5; 'pill' = #EFEFEF. */
  tone?: 'glass' | 'tile' | 'pill';
  flex?: number;
}

/** Placeholder block in the final layout's position. Shimmer: 1.2 s opacity pulse. */
export function Skeleton({ width = '100%', height, radius = 9999, tone = 'tile', flex }: SkeletonProps) {
  const o = useSharedValue(1);
  useEffect(() => {
    o.value = withRepeat(withTiming(0.55, { duration: 600, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [o]);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  const fill = tone === 'glass' ? colors.glass : tone === 'pill' ? colors['surface-container-high'] : colors['surface-container'];
  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ width, height, borderRadius: radius, backgroundColor: fill, flex }, style]}
    />
  );
}
