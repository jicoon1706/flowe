import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';

export function PinDots({ length, error }: { length: number; error?: boolean }) {
  const tx = useSharedValue(0);
  useEffect(() => {
    if (error) {
      tx.value = withSequence(
        withTiming(-8, { duration: 60 }),
        withTiming(8, { duration: 60 }),
        withTiming(-6, { duration: 60 }),
        withTiming(6, { duration: 60 }),
        withTiming(0, { duration: 60 }),
      );
    }
  }, [error]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value }] }));

  return (
    <Animated.View style={style} className="flex-row gap-3 justify-center my-6">
      {Array.from({ length: 6 }).map((_, i) => {
        const filled = i < length;
        return (
          <View
            key={i}
            className={`w-4 h-4 rounded-full border-2 ${
              error ? 'border-destructive bg-destructive' :
              filled ? 'border-primary bg-primary' : 'border-muted-foreground/50'
            }`}
          />
        );
      })}
    </Animated.View>
  );
}