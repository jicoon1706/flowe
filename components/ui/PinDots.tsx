import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { colors, radius } from '@/theme/tokens';

export interface PinDotsProps {
  /** Digits entered so far. */
  length: number;
  total?: number;
  /** Increment to shake (mismatch / wrong PIN). Motion + message only, never red. */
  errorKey?: number;
}

/** 14 px dots, 16 gap: white when filled, glass when empty. */
export function PinDots({ length, total = 6, errorKey = 0 }: PinDotsProps) {
  const tx = useSharedValue(0);
  useEffect(() => {
    if (!errorKey) return;
    tx.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-8, { duration: 50 }),
      withTiming(8, { duration: 50 }),
      withTiming(0, { duration: 50 }),
    );
  }, [errorKey, tx]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value }] }));

  return (
    <Animated.View
      style={[{ flexDirection: 'row', gap: 16, justifyContent: 'center' }, style]}
      accessible
      accessibilityLabel={`${length} of ${total} digits entered`}
    >
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={{ width: 14, height: 14, borderRadius: radius.full, backgroundColor: i < length ? colors['on-primary'] : colors.glass }}
        />
      ))}
    </Animated.View>
  );
}
