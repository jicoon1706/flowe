import { Pressable } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { colors } from '@/theme/tokens';
import { Text } from './Text';

export interface ChipProps {
  label: string;
  icon?: LucideIcon;
  selected?: boolean;
  onPress?: () => void;
  /** 'surface' = #EFEFEF on white; 'white' = white pill on a grey card. */
  on?: 'surface' | 'white';
  height?: 44 | 28;
  accessibilityLabel?: string;
}

/** Selectable pill (category chips, filters). Black = selected. */
export function Chip({ label, icon: Icon, selected, onPress, on = 'surface', height = 44, accessibilityLabel }: ChipProps) {
  const fill = selected ? colors.secondary : on === 'white' ? colors.surface : colors['surface-container-high'];
  const ink = selected ? colors['on-secondary'] : colors['on-surface'];
  const small = height === 28;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected: !!selected }}
      hitSlop={small ? 8 : 0}
      style={({ pressed }) => ({
        height,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingLeft: Icon ? 12 : 16,
        paddingRight: 16,
        borderRadius: 9999,
        backgroundColor: fill,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      {Icon ? <Icon size={small ? 16 : 18} color={ink} strokeWidth={1.75} /> : null}
      <Text variant={small ? 'label-sm' : 'body-md'} weight={500} tone="inherit" style={{ color: ink }} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}
