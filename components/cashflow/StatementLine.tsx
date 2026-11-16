import { View } from 'react-native';
import { Money } from '../ui/Money';
import { Text } from '../ui/Text';

/** Label on the left, signed amount on the right, inside a #F5F5F5 statement card. */
export function StatementLine({ label, amount, direction = 'none', masked }: { label: string; amount: number; direction?: 'income' | 'expense' | 'none'; masked?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
      <Text variant="body-md" style={{ flexShrink: 1 }} numberOfLines={1}>{label}</Text>
      <Money amount={amount} direction={direction} variant="body-md" weight={500} on="grey" masked={masked} />
    </View>
  );
}
