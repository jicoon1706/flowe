import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors, radius } from '@/theme/tokens';
import { BrandMark } from './BrandMark';
import { GradientFill } from './GradientFill';
import { Text } from './Text';

export interface LaunchScreenProps {
  /** Shows the glass progress bar + label (q-launch-1). Plain splash when undefined. */
  syncingLabel?: string;
  /** 0..1; animates up to it. */
  progress?: number;
}

/** Full gradient, centred mark. With a label, a thin glass progress bar (max 1.5 s). */
export function LaunchScreen({ syncingLabel, progress = 0 }: LaunchScreenProps) {
  const w = useSharedValue(0);
  useEffect(() => { w.value = withTiming(Math.max(0, Math.min(1, progress)), { duration: 400 }); }, [progress, w]);
  const bar = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }} accessibilityLabel={syncingLabel ?? 'Flowe is starting'}>
      <GradientFill />
      <View style={{ alignItems: 'center', gap: 28 }}>
        <BrandMark size={syncingLabel ? 88 : 104} />
        {syncingLabel ? (
          <>
            <View style={{ width: 140, height: 4, borderRadius: radius.full, backgroundColor: colors.glass, overflow: 'hidden' }} accessibilityRole="progressbar">
              <Animated.View style={[{ height: 4, borderRadius: radius.full, backgroundColor: colors['on-primary'] }, bar]} />
            </View>
            <Text variant="body-md" tone="soft">{syncingLabel}</Text>
          </>
        ) : null}
      </View>
    </View>
  );
}
