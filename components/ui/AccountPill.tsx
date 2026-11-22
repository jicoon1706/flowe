import { Pressable } from '@/components/ui/Pressable';
import { ChevronDown, Landmark, type LucideIcon } from 'lucide-react-native';
import { colors, radius } from '@/theme/tokens';
import { LogoWell } from './LogoWell';
import { Text } from './Text';

export interface AccountPillProps {
  label: string;
  domain?: string;
  icon?: LucideIcon;
  onPress?: () => void;
  /** Leading glyph instead of a logo well (Date pill). */
  plainIcon?: LucideIcon;
  /** Black outline when the pill is the field an error points at. */
  invalid?: boolean;
  accessibilityLabel?: string;
}

/** #EFEFEF pill with a 32 px white logo well and a chevron: account / date pickers. */
export function AccountPill({ label, domain, icon = Landmark, onPress, plainIcon: Plain, invalid, accessibilityLabel }: AccountPillProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => ({
        height: 44,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingLeft: Plain ? 12 : 6,
        paddingRight: 12,
        borderRadius: radius.full,
        backgroundColor: colors['surface-container-high'],
        borderWidth: 1.5,
        borderColor: invalid ? colors.secondary : 'transparent',
        opacity: pressed ? 0.8 : 1,
        flexShrink: 1,
      })}
    >
      {Plain ? <Plain size={18} color={colors['on-surface']} strokeWidth={1.75} /> : <LogoWell domain={domain} brand={label} fallback={icon} size={32} on="grey" />}
      <Text variant="body-md" weight={500} numberOfLines={1} style={{ flexShrink: 1 }}>{label}</Text>
      <ChevronDown size={16} color={colors['on-surface']} strokeWidth={1.75} />
    </Pressable>
  );
}
