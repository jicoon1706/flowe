import type { ReactNode } from 'react';
import { View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Clock, RefreshCw } from 'lucide-react-native';
import { colors, radius } from '@/theme/tokens';
import { Pressable } from '../ui/Pressable';
import { Text } from '../ui/Text';

interface Props {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  /** Screen-reader name (the frames' aria-labels). */
  label: string;
  amount: ReactNode;
  /** Under the amount: Gold's gain / loss tag. */
  tag?: ReactNode;
  onPress: () => void;
  /** mn-gold-stale: grey fill, "Price is {n} days old" and Update price. */
  stale?: { days: number; onUpdate: () => void };
}

/** One row of the Assets / Liabilities lists (mn-assets-saved, t-mn-assets-saved). */
export function BalanceRow({ icon: Icon, title, subtitle, label, amount, tag, onPress, stale }: Props) {
  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        style={({ pressed }) => ({
          flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56,
          paddingVertical: stale ? 8 : 6,
          ...(stale ? { backgroundColor: colors['surface-container'], paddingHorizontal: 10, marginHorizontal: -10, borderRadius: radius.md } : null),
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <View style={{ width: 40, height: 40, borderRadius: 9999, backgroundColor: stale ? colors.surface : colors['surface-container'], alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={20} color={colors['on-surface']} strokeWidth={1.75} />
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text variant="body-lg" numberOfLines={1}>{title}</Text>
          <Text variant="label-sm" tone="muted" numberOfLines={1}>{subtitle}</Text>
          {stale ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <Clock size={14} color={colors['on-surface']} strokeWidth={1.75} />
              <Text variant="label-sm">Price is {stale.days} days old</Text>
            </View>
          ) : null}
        </View>
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          {amount}
          {tag}
        </View>
      </Pressable>
      {stale ? (
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Update gold price"
            onPress={stale.onUpdate}
            style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 6, height: 44, paddingHorizontal: 16, borderRadius: 9999, backgroundColor: colors['surface-container-high'], opacity: pressed ? 0.8 : 1 })}
          >
            <RefreshCw size={14} color={colors['on-surface']} strokeWidth={1.75} />
            <Text variant="body-md" weight={600}>Update price</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
