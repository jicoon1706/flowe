import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Pressable } from '@/components/ui/Pressable';
import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import { colors, radius } from '@/theme/tokens';
import { LogoWell } from './LogoWell';
import { Text } from './Text';

export interface SettingsRowProps {
  label: string;
  /** Meta line under the label. */
  value?: string;
  onPress?: () => void;
  icon?: LucideIcon;
  /** Logo instead of an icon (auto-detect sources). */
  domain?: string;
  /** Trailing control (Toggle) instead of a chevron. */
  right?: ReactNode;
  disabled?: boolean;
  accessibilityLabel?: string;
}

/** 40 px icon well · label (body-lg) over meta (label-sm) · chevron or control. */
export function SettingsRow({ label, value, onPress, icon: Icon, domain, right, disabled, accessibilityLabel }: SettingsRowProps) {
  const body = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingVertical: 8, opacity: disabled ? 0.5 : 1 }}>
      {domain ? (
        <LogoWell domain={domain} brand={label} fallback={Icon} />
      ) : Icon ? (
        <View style={{ width: 40, height: 40, borderRadius: radius.full, backgroundColor: colors['surface-container'], alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={19} color={colors['on-surface']} strokeWidth={1.75} />
        </View>
      ) : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text variant="body-lg" numberOfLines={1}>{label}</Text>
        {value ? <Text variant="label-sm" tone="muted" numberOfLines={2}>{value}</Text> : null}
      </View>
      {right ?? (onPress ? <ChevronRight size={18} color={colors['on-surface-variant']} strokeWidth={1.75} /> : null)}
    </View>
  );
  // A trailing control (Toggle, pill) handles its own taps; a trailing glyph
  // passed with onPress keeps the whole row pressable.
  if (!onPress) return body;
  return (
    <Pressable onPress={disabled ? undefined : onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      {body}
    </Pressable>
  );
}
