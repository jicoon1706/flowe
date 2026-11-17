import { View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { colors } from '@/theme/tokens';
import { LogoWell } from './LogoWell';
import { Text } from './Text';

export interface DetailRowProps {
  label: string;
  value: string;
  icon?: LucideIcon;
  /** Logo domain drawn in a 28 px well before the value. */
  domain?: string;
}

/** Muted label on the left, value (with optional icon / logo) on the right. */
export function DetailRow({ label, value, icon: Icon, domain }: DetailRowProps) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44, gap: 16 }}>
      <Text variant="body-md" tone="muted">{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}>
        {domain ? <LogoWell domain={domain} brand={value} size={28} /> : Icon ? <Icon size={16} color={colors['on-surface']} strokeWidth={1.75} /> : null}
        <Text variant="body-md" numberOfLines={2} style={{ flexShrink: 1, textAlign: 'right' }}>{value}</Text>
      </View>
    </View>
  );
}
