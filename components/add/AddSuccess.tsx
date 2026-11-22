import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { ArrowDownRight, Check, Wallet } from 'lucide-react-native';
import { colors, radius } from '@/theme/tokens';
import { categoryIcon } from '@/constants/categoryIcons';
import { useAuth } from '@/context/AuthContext';
import { useDailyBudget } from '@/src/hooks/useDailyBudget';
import { useTodaySpend } from '@/src/hooks/useTodaySpend';
import { directionOf } from '@/src/lib/money';
import { dayLabel, timeOf } from '@/src/utils/transactionDisplay';
import type { Transaction } from '@/src/types';
import { TABLET_WIDTH, useColumnPadding } from '@/src/hooks/useBreakpoint';
import { Button } from '../ui/Button';
import { Hero } from '../ui/Hero';
import { Money } from '../ui/Money';
import { ProgressRing } from '../ui/ProgressRing';
import { StatTile } from '../ui/StatTile';
import { Text } from '../ui/Text';
import { TransactionRow } from '../ui/TransactionRow';

/** Success closes itself after this long (core-add-4-success). */
const AUTO_CLOSE_MS = 1200;

export interface AddSuccessProps {
  transaction: Transaction;
  categoryLabel: string;
  accountName?: string;
  onDone: () => void;
  onAddAnother: () => void;
}

/** Ring sweeps to a check, "Saved", the amount, the new row, today's tiles. */
export function AddSuccess({ transaction, categoryLabel, accountName, onDone, onAddAnother }: AddSuccessProps) {
  const { user } = useAuth();
  const { budget, fetchBudget } = useDailyBudget(user?.id);
  const { spent } = useTodaySpend();
  const [sweep, setSweep] = useState(0.72);
  const padX = useColumnPadding(16);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => { fetchBudget(); }, [fetchBudget]);
  useEffect(() => {
    const a = setTimeout(() => setSweep(1), 120);
    const t = setTimeout(() => doneRef.current(), AUTO_CLOSE_MS);
    return () => { clearTimeout(a); clearTimeout(t); };
  }, []);

  const dir = directionOf(transaction.type);
  const meta = [categoryLabel, accountName, `${dayLabel(transaction.date)}, ${timeOf(transaction)}`].filter(Boolean).join(' · ');
  const left = budget !== null && spent !== null ? budget - spent : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }} accessibilityLiveRegion="polite">
      <Hero style={{ paddingBottom: 56 }} contentMaxWidth={TABLET_WIDTH.form}>
        <View style={{ alignItems: 'center', gap: 24, marginTop: 48 }}>
          <ProgressRing progress={sweep} size={132} stroke={8} accessibilityLabel="Saved">
            <View style={{ width: 92, height: 92, borderRadius: radius.full, backgroundColor: colors.glass, alignItems: 'center', justifyContent: 'center' }}>
              <Check size={44} color={colors['on-primary']} strokeWidth={2} />
            </View>
          </ProgressRing>
          <Text variant="body-lg" tone="soft">Saved</Text>
          <Money amount={Number(transaction.amount)} direction={dir} variant="numeric-lg" on="gradient" smallCurrency />
        </View>
      </Hero>
      <View style={{ flex: 1, marginTop: -32, backgroundColor: colors.surface, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: 16, paddingHorizontal: padX, paddingTop: 24, gap: 16 }}>
        <TransactionRow title={transaction.name} meta={meta} amount={Number(transaction.amount)} direction={dir} icon={categoryIcon(transaction.category)} />
        {transaction.type === 'expense' ? (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <StatTile label="Spent today" icon={ArrowDownRight} amount={spent ?? 0} />
            {left !== null ? <StatTile label="Left today" icon={Wallet} amount={left} /> : null}
          </View>
        ) : null}
        <View style={{ flex: 1 }} />
        <View style={{ gap: 4 }}>
          <Button label="Done" onPress={onDone} fullWidth />
          <Button label="Add another" variant="text" onPress={onAddAnother} style={{ alignSelf: 'center' }} />
        </View>
      </View>
    </View>
  );
}
