import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { colors, radius } from '@/theme/tokens';
import { useIncomeSplit } from '@/src/hooks/useIncomeSplit';
import { pct1, SPLIT_GROUP_LABEL } from '@/src/lib/incomeSplit';
import { splitBar } from '@/src/lib/incomeSplitView';
import { formatRM } from '@/src/lib/money';
import { Money } from '../ui/Money';
import { Pressable } from '../ui/Pressable';
import { Skeleton } from '../ui/Skeleton';
import { Text } from '../ui/Text';
import { PartDot, SplitBar } from './SplitBar';

/**
 * Cashflow · Income split card (mo-cashflow-card, t-mo-cashflow-card): the
 * month's split as a 100% bar and a 2 × 2 legend; See split → /cashflow/split.
 */
export function IncomeSplitCard({ month, masked = false }: { month: Date; masked?: boolean }) {
  const router = useRouter();
  const { data, loading, error, refresh } = useIncomeSplit(month);
  const monthShort = month.toLocaleDateString('en-MY', { month: 'short', year: 'numeric' });
  const bar = data ? splitBar(data) : null;

  return (
    <View accessibilityLabel="Income split" style={{ backgroundColor: colors['surface-container'], borderRadius: radius.md, padding: 16, gap: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ gap: 2, flex: 1 }}>
          <Text variant="label-lg">Income split</Text>
          {data ? <Text variant="label-sm" weight={400} tone="meta">{monthShort} · of {masked ? 'RM •••••' : formatRM(data.income)} income</Text> : null}
        </View>
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push({ pathname: '/cashflow/split', params: { month: `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}` } } as never)}
          style={({ pressed }) => ({ height: 44, flexDirection: 'row', alignItems: 'center', gap: 6, opacity: pressed ? 0.7 : 1 })}
        >
          <Text variant="body-md" weight={600}>See split</Text>
          <ChevronRight size={16} color={colors['on-surface']} strokeWidth={1.75} />
        </Pressable>
      </View>
      {loading ? (
        <Skeleton width="100%" height={14} />
      ) : error && !data ? (
        <Pressable accessibilityRole="button" onPress={refresh}><Text variant="body-md" tone="meta">Couldn’t load this month · Try again</Text></Pressable>
      ) : !bar || !data?.buckets ? (
        <View accessibilityElementsHidden style={{ height: 14, borderRadius: 9999, borderWidth: 2, borderStyle: 'dashed', borderColor: colors['on-surface-variant'] + '55' }} />
      ) : (
        <>
          <View style={{ paddingTop: bar.incomeAt !== null ? 22 : 0 }}><SplitBar model={bar} height={14} /></View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 10, columnGap: 12 }}>
            {(['needs', 'wants', 'invest', 'left'] as const).map((p) => (
              <View key={p} style={{ width: '47%', gap: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <PartDot part={p} />
                  <Text variant="label-sm" weight={600} numberOfLines={1}>{SPLIT_GROUP_LABEL[p]}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                  <Money amount={data.buckets![p].amount} variant="body-md" weight={600} masked={masked} />
                  <Text variant="label-sm" weight={400} tone="muted" tabular>{pct1(data.buckets![p].pct)}</Text>
                </View>
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  );
}
