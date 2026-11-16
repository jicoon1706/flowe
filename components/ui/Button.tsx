import { ActivityIndicator, Pressable, type StyleProp, type ViewStyle } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { colors } from '@/theme/tokens';
import { Text } from './Text';

/**
 * - `primary`: black #020202 pill — the one primary action on a white region.
 * - `white`: white pill — the primary action on the gradient.
 * - `action`: #EFEFEF pill — secondary actions on white (Add / Scan).
 * - `glass`: white-16% pill — secondary actions on the gradient.
 * - `text`: no fill — Skip, Cancel, Delete, Dismiss.
 */
export type ButtonVariant = 'primary' | 'white' | 'action' | 'glass' | 'text';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  icon?: LucideIcon;
  /** Trailing icon (e.g. chevron). */
  trailingIcon?: LucideIcon;
  loading?: boolean;
  /** Label while loading ("Saving…"). Defaults to the label. */
  loadingLabel?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  /** 52 (default) or 44 for compact rows. */
  height?: 52 | 44;
  /** Muted text tone for text buttons (Dismiss, Delete on detail). */
  muted?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const FILL: Record<ButtonVariant, string> = {
  primary: colors.secondary,
  white: colors.surface,
  action: colors['surface-container-high'],
  glass: colors.glass,
  text: 'transparent',
};

const INK: Record<ButtonVariant, string> = {
  primary: colors['on-secondary'],
  white: colors['on-surface'],
  action: colors['on-surface'],
  glass: colors['on-primary'],
  text: colors['on-surface'],
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon: Icon,
  trailingIcon: Trailing,
  loading = false,
  loadingLabel,
  disabled = false,
  fullWidth = false,
  height = 52,
  muted = false,
  accessibilityLabel,
  accessibilityHint,
  style,
  testID,
}: ButtonProps) {
  const inactive = disabled || loading;
  // A disabled primary keeps its size but drops to the grey action fill
  // ("Enter an amount"), so there is never a dimmed black button.
  const fill = disabled && variant === 'primary' ? colors['surface-container-high'] : FILL[variant];
  let ink = disabled && variant === 'primary' ? colors['on-surface-variant-aa'] : INK[variant];
  if (variant === 'text' && muted) ink = colors['on-surface-variant-aa'];
  const padH = variant === 'text' ? 16 : variant === 'action' ? 16 : 24;

  return (
    <Pressable
      onPress={inactive ? undefined : onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      testID={testID}
      style={({ pressed }) => [
        {
          height: variant === 'text' ? 44 : height,
          minWidth: 44,
          borderRadius: 9999,
          backgroundColor: fill,
          paddingHorizontal: padH,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: pressed && !inactive ? 0.8 : 1,
          alignSelf: fullWidth ? 'stretch' : undefined,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={ink} />
      ) : Icon ? (
        <Icon size={18} color={ink} strokeWidth={1.75} />
      ) : null}
      <Text variant="label-lg" tone="inherit" style={{ color: ink }} numberOfLines={1}>
        {loading ? loadingLabel ?? label : label}
      </Text>
      {Trailing && !loading ? <Trailing size={16} color={ink} strokeWidth={1.75} /> : null}
    </Pressable>
  );
}
