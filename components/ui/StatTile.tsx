import { View } from 'react-native';
import { Pressable } from '@/components/ui/Pressable';
import type { LucideIcon } from 'lucide-react-native';
import { colors, radius } from '@/theme/tokens';
import type { MoneyDirection } from '@/src/lib/money';
import { Money } from './Money';
import { Text } from './Text';

export interface StatTileProps {
  label: string;
  icon?: LucideIcon;
  amount?: number;
  /** Plain value instead of an amount (e.g. '62%', '4 months'). */
  value?: string;
  direction?: MoneyDirection;
  masked?: boolean;
  onPress?: () => void;
}

/** #F5F5F5 tile, 12 radius, 16 padding: muted label + trailing icon over an amount. */
export function StatTile({ label, icon: Icon, amount, value, direction, masked, onPress }: StatTileProps) {
  const body = (
    <View style={{ backgroundColor: colors['surface-container'], borderRadius: radius.sm, padding: 16, gap: 12, flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text variant="label-sm" tone="meta">{label}</Text>
        {Icon ? <Icon size={16} color={colors['on-surface-variant-aa']} strokeWidth={1.75} /> : null}
      </View>
      {amount !== undefined ? (
        <Money amount={amount} direction={direction} on="grey" variant="body-lg" weight={600} masked={masked} />
      ) : (
        <Text variant="body-lg" weight={600} tabular>{value}</Text>
      )}
    </View>
  );
  if (!onPress) return <View style={{ flex: 1 }}>{body}</View>;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => ({ flex: 1, opacity: pressed ? 0.8 : 1 })}>
      {body}
    </Pressable>
  );
}
