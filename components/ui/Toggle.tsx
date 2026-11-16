import { useEffect } from 'react';
import { Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors } from '@/theme/tokens';

export interface ToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}

/** 52×32 switch: on = black track + white knob; off = #EFEFEF track + #737373 knob. */
export function Toggle({ value, onValueChange, disabled = false, accessibilityLabel }: ToggleProps) {
  const x = useSharedValue(value ? 24 : 4);
  useEffect(() => { x.value = withTiming(value ? 24 : 4, { duration: 160 }); }, [value, x]);
  const knob = useAnimatedStyle(() => ({ left: x.value }));
  return (
    <Pressable
      onPress={() => !disabled && onValueChange(!value)}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled }}
      hitSlop={8}
      style={{
        width: 52,
        height: 32,
        borderRadius: 9999,
        backgroundColor: value ? colors.secondary : colors['surface-container-high'],
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Animated.View
        style={[
          { position: 'absolute', top: 4, width: 24, height: 24, borderRadius: 9999, backgroundColor: value ? colors.surface : colors['on-surface-variant'] },
          knob,
        ]}
      />
    </Pressable>
  );
}
