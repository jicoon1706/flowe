import { View } from 'react-native';
import { Pressable } from '@/components/ui/Pressable';
import type { LucideIcon } from 'lucide-react-native';
import type { MoneyDirection } from '@/src/lib/money';
import { LogoWell } from './LogoWell';
import { Money } from './Money';
import { Text } from './Text';

export interface TransactionRowProps {
  title: string;
  meta?: string;
  amount: number;
  direction: MoneyDirection;
  /** Merchant name to match a logo; defaults to the title. */
  merchant?: string;
  /** Brand domain for accounts / banks. */
  domain?: string;
  icon?: LucideIcon;
  onPress?: () => void;
  masked?: boolean;
  /** Well fill when the row sits on grey. */
  on?: 'surface' | 'grey';
  /** Plain trailing value instead of an amount. */
  trailing?: React.ReactNode;
}

/** 40 px logo well · name (body-lg) over meta (label-sm) · signed amount + arrow. */
export function TransactionRow({ title, meta, amount, direction, merchant, domain, icon, onPress, masked, on = 'surface', trailing }: TransactionRowProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, minHeight: 56, opacity: pressed ? 0.7 : 1 })}
    >
      <LogoWell domain={domain} merchant={domain ? undefined : merchant ?? title} fallback={icon} on={on} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text variant="body-lg" numberOfLines={1}>{title}</Text>
        {meta ? <Text variant="label-sm" tone={on === 'grey' ? 'meta' : 'muted'} numberOfLines={1}>{meta}</Text> : null}
      </View>
      {trailing ?? (
        <Money amount={amount} direction={direction} arrow variant="body-lg" weight={500} masked={masked} on={on} />
      )}
    </Pressable>
  );
}
