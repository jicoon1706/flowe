import { View } from 'react-native';
import { Pressable } from '@/components/ui/Pressable';
import type { LucideIcon } from 'lucide-react-native';
import { colors, radius } from '@/theme/tokens';

export interface GlassIconButtonProps {
  icon: LucideIcon;
  onPress?: () => void;
  accessibilityLabel: string;
  /** Small white presence dot (unread notifications). */
  dot?: boolean;
  disabled?: boolean;
}

/** 44 px glass circle on the gradient: back, close, bell, calendar, settings. */
export function GlassIconButton({ icon: Icon, onPress, accessibilityLabel, dot, disabled }: GlassIconButtonProps) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={!!disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        borderRadius: radius.full,
        backgroundColor: colors.glass,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.75 : disabled ? 0.5 : 1,
      })}
    >
      <Icon size={20} color={colors['on-primary']} strokeWidth={1.75} />
      {dot ? (
        <View
          style={{ position: 'absolute', top: 10, right: 11, width: 8, height: 8, borderRadius: radius.full, backgroundColor: colors['on-primary'] }}
        />
      ) : null}
    </Pressable>
  );
}
