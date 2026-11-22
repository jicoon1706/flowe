import { Pressable, View } from 'react-native';
import { colors, radius } from '@/theme/tokens';
import { Text } from './Text';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedToggleProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** 'surface' = #EFEFEF track on white; 'glass' = glass track on the gradient. */
  on?: 'surface' | 'glass';
  accessibilityLabel?: string;
}

/** Pill track with black = selected. */
export function SegmentedToggle<T extends string>({ options, value, onChange, on = 'surface', accessibilityLabel }: SegmentedToggleProps<T>) {
  const glass = on === 'glass';
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      style={{
        flexDirection: 'row',
        gap: 4,
        padding: 4,
        borderRadius: radius.full,
        backgroundColor: glass ? colors.glass : colors['surface-container-high'],
      }}
    >
      {options.map((o) => {
        const selected = o.value === value;
        const ink = selected ? colors['on-secondary'] : glass ? colors['on-primary'] : colors['on-surface'];
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            style={{
              flex: 1,
              height: 44,
              borderRadius: radius.full,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: selected ? colors.secondary : 'transparent',
              paddingHorizontal: 8,
            }}
          >
            <Text variant="body-md" weight={600} tone="inherit" style={{ color: ink }} numberOfLines={1}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
