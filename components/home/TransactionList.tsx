import { View } from 'react-native';
import { categoryIcon } from '@/constants/categoryIcons';
import { describeTransaction, dayLabel, groupByDay, timeOf, type TxWithAccounts } from '@/src/utils/transactionDisplay';
import type { CustomCategory } from '@/src/types';
import { Skeleton } from '../ui/Skeleton';
import { Text } from '../ui/Text';
import { TransactionRow } from '../ui/TransactionRow';

export interface TransactionListProps {
  transactions: TxWithAccounts[];
  customCategories?: CustomCategory[];
  onPress?: (tx: TxWithAccounts) => void;
  masked?: boolean;
  loading?: boolean;
  /** Skeleton rows while loading (st-recent-loading). */
  skeletonRows?: number;
}

/** Rows grouped under "Today" / "Yesterday" / date labels, merchant logos in wells. */
export function TransactionList({ transactions, customCategories = [], onPress, masked, loading, skeletonRows = 6 }: TransactionListProps) {
  if (loading && transactions.length === 0) {
    return (
      <View style={{ gap: 12 }} accessibilityLabel="Loading transactions">
        <Skeleton width={64} height={12} />
        {Array.from({ length: skeletonRows }).map((_, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }}>
            <Skeleton width={40} height={40} />
            <View style={{ flex: 1, gap: 6 }}>
              <Skeleton width="55%" height={14} />
              <Skeleton width="35%" height={10} />
            </View>
            <Skeleton width={72} height={14} />
          </View>
        ))}
      </View>
    );
  }
  return (
    <View style={{ gap: 4 }}>
      {groupByDay(transactions).map((g) => (
        <View key={g.day}>
          <Text variant="label-sm" tone="muted" style={{ marginTop: 8, marginBottom: 2 }} accessibilityRole="header">{dayLabel(g.day)}</Text>
          {g.items.map((tx) => {
            const d = describeTransaction(tx, customCategories);
            return (
              <TransactionRow
                key={tx.id}
                title={tx.name}
                meta={`${d.label} · ${timeOf(tx)}`}
                amount={Number(tx.amount)}
                direction={d.direction}
                icon={categoryIcon(d.iconKey, d.kind)}
                masked={masked}
                onPress={onPress ? () => onPress(tx) : undefined}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}
