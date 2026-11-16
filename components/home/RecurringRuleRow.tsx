import { View } from 'react-native';
import { categoryIcon } from '@/constants/categoryIcons';
import { expenseCategories, incomeCategories } from '@/constants/categories';
import { directionOf } from '@/src/lib/money';
import type { RecurringRule } from '@/src/types';
import { LogoWell } from '../ui/LogoWell';
import { Money } from '../ui/Money';
import { Text } from '../ui/Text';

const LABEL: Record<string, string> = Object.fromEntries([...expenseCategories, ...incomeCategories].map((c) => [c.id, c.name]));

/** Recurring bill: logo well · name over "Category · frequency" · signed amount. */
export function RecurringRuleRow({ rule }: { rule: RecurringRule }) {
  const dir = directionOf(rule.type);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56 }}>
      <LogoWell merchant={rule.name} fallback={categoryIcon(rule.category)} />
      <View style={{ flex: 1 }}>
        <Text variant="body-lg" numberOfLines={1}>{rule.name}</Text>
        <Text variant="label-sm" tone="muted">{LABEL[rule.category ?? ''] ?? rule.category ?? 'Others'} · {rule.frequency}</Text>
      </View>
      <Money amount={Number(rule.amount)} direction={dir} arrow weight={500} />
    </View>
  );
}
