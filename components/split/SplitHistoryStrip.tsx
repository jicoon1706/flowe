import { useEffect, useRef } from 'react';
import { ScrollView, View } from 'react-native';
import { colors, radius } from '@/theme/tokens';
import { useIncomeSplitHistory } from '@/src/hooks/useIncomeSplit';
import { pctShort, SPLIT_GROUP_SHORT } from '@/src/lib/incomeSplit';
import { splitBar } from '@/src/lib/incomeSplitView';
import { monthName, sameMonth } from '@/src/lib/splitMonth';
import { formatRM } from '@/src/lib/money';
import type { IncomeSplit } from '@/src/types';
import { Money } from '../ui/Money';
import { Pressable } from '../ui/Pressable';
import { Skeleton } from '../ui/Skeleton';
import { Text } from '../ui/Text';
import { PartDot, SplitBar } from './SplitBar';

const CELL = 128;
const GAP = 8;
const PARTS = ['needs', 'wants', 'invest'] as const;

/**
 * Income split · the last months side by side: income, a mini bar and Needs /
 * Wants / Invest & save against their targets. Tap a month to open it. Phone:
 * scrolls sideways, kept on the selected month; tablet: one row.
 */
export function SplitHistoryStrip({ months, selected, onSelect, masked, phone }: {
  months: readonly Date[];
  selected: Date;
  onSelect: (month: Date) => void;
  masked: boolean;
  phone: boolean;
}) {
  const items = useIncomeSplitHistory(months);
  const scroll = useRef<ScrollView>(null);
  const index = months.findIndex((m) => sameMonth(m, selected));

  useEffect(() => {
    if (phone && index >= 0) scroll.current?.scrollTo({ x: Math.max(0, index * (CELL + GAP) - CELL), animated: false });
  }, [phone, index]);

  const cells = items.map((it, i) => (
    <HistoryCell key={it.key} month={months[i]} split={it.data} loading={it.loading} selected={i === index} masked={masked} onPress={() => onSelect(months[i])} width={phone ? CELL : undefined} />
  ));

  return (
    <View style={{ gap: 8 }}>
      <Text variant="label-lg" size={17} accessibilityRole="header">Last {months.length} months</Text>
      {phone ? (
        <ScrollView ref={scroll} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: GAP }}>
          {cells}
        </ScrollView>
      ) : (
        <View style={{ flexDirection: 'row', gap: 12 }}>{cells}</View>
      )}
    </View>
  );
}

function HistoryCell({ month, split, loading, selected, masked, onPress, width }: {
  month: Date; split: IncomeSplit | null; loading: boolean; selected: boolean; masked: boolean; onPress: () => void; width?: number;
}) {
  const bar = split ? splitBar(split) : null;
  const b = split?.buckets ?? null;
  const name = monthName(month);
  const label = !split
    ? `${name}, loading`
    : !b
      ? `${name}, no income`
      : `${name}${masked ? '' : `, income ${formatRM(split.income)}`}, ${PARTS.map((p) => `${SPLIT_GROUP_SHORT[p]} ${pctShort(b[p].pct)} of ${split.targets[p]}% guide`).join(', ')}`;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        ...(width ? { width } : { flex: 1 }), minWidth: 0, minHeight: 132, gap: 6, borderRadius: radius.md, backgroundColor: colors.surface,
        borderWidth: selected ? 2 : 1, borderColor: selected ? colors.secondary : colors['surface-container-high'], padding: selected ? 11 : 12,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Text variant="label-sm" weight={600}>{monthName(month, 'short')}</Text>
      {loading && !split ? (
        <>
          <Skeleton width="80%" height={18} />
          <Skeleton width="100%" height={8} />
        </>
      ) : b && split ? (
        <>
          <Money amount={split.income} variant="label-lg" weight={600} masked={masked} />
          <View style={{ paddingVertical: 2 }}>{bar ? <SplitBar model={bar} height={8} /> : null}</View>
          {PARTS.map((p) => (
            <View key={p} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <PartDot part={p} size={8} />
              <Text variant="caption" tone="muted" tabular numberOfLines={1}>{pctShort(b[p].pct)} / {split.targets[p]}%</Text>
            </View>
          ))}
        </>
      ) : (
        <>
          <Text variant="label-sm" weight={400} tone="muted">No income</Text>
          <View style={{ height: 8, borderRadius: 9999, borderWidth: 1, borderStyle: 'dashed', borderColor: colors['on-surface-variant'] + '55' }} />
        </>
      )}
    </Pressable>
  );
}
