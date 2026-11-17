import { Pressable, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { colors } from '@/theme/tokens';
import { Text } from './Text';

export interface GlassChipProps {
  label: string;
  icon?: LucideIcon;
  onPress?: () => void;
  /** 'alert' announces the chip (validation on the gradient). */
  role?: 'status' | 'alert';
  accessibilityLabel?: string;
  /** Where the chip sits in a column parent; 'center' under a centred hero figure. */
  align?: 'flex-start' | 'center';
}

/** White-16% pill on the gradient, label-sm white. Never used on white. */
export function GlassChip({ label, icon: Icon, onPress, role, accessibilityLabel, align = 'flex-start' }: GlassChipProps) {
  const body = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        minHeight: 32,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 9999,
        backgroundColor: colors.glass,
      }}
    >
      {Icon ? <Icon size={14} color={colors['on-primary']} strokeWidth={2} /> : null}
      <Text variant="label-sm" tone="inverse">{label}</Text>
    </View>
  );
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        hitSlop={6}
        style={{ alignSelf: align, minHeight: 44, justifyContent: 'center' }}
      >
        {body}
      </Pressable>
    );
  }
  return (
    <View
      accessible
      accessibilityRole={role === 'alert' ? 'alert' : 'text'}
      accessibilityLiveRegion={role ? 'polite' : 'none'}
      accessibilityLabel={accessibilityLabel ?? label}
      style={{ alignSelf: align }}
    >
      {body}
    </View>
  );
}
