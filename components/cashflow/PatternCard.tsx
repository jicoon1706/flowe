import { Pressable, View } from 'react-native';
import { ArrowRight, ChevronRight } from 'lucide-react-native';
import { chart, colors, radius } from '@/theme/tokens';
import { CLASS_LABEL, PATTERNS, type FinancialClass } from '@/src/lib/cashflow';
import { formatRM } from '@/src/lib/money';
import { CashflowCard } from './CashflowCard';
import { Text } from '../ui/Text';

export interface PatternCardProps {
  cls: FinancialClass;
  passive: number;
  expenses: number;
  /** Passive income ÷ expenses as a whole %; null with no expenses. */
  pct: number | null;
  onSeeAll: () => void;
  loading: boolean;
  onRetry?: (() => void) | null;
  masked?: boolean;
}

const perMonth = (v: number) => `${formatRM(v)} / mo`;

/** Your pattern (ins-cashflow): class track with the "You" marker, your flow, passive-income bar. */
export function PatternCard({ cls, passive, expenses, pct, onSeeAll, loading, onRetry, masked }: PatternCardProps) {
  if (loading || onRetry) {
    return <CashflowCard title="Your pattern" meta="Cash flow class" loadingHeight={loading && !onRetry ? 220 : undefined} error={onRetry ? { message: 'Couldn’t load this month.', onRetry } : null} />;
  }
  const mine = PATTERNS.find((p) => p.key === cls)!;
  const bar = Math.max(0, Math.min(100, pct ?? 0));
  return (
    <CashflowCard title="Your pattern" meta="Cash flow class" gap={14}>
      <View accessible accessibilityRole="image" accessibilityLabel={`Pattern track: Poor, Middle class, Rich. You are ${CLASS_LABEL[cls]}.`} style={{ flexDirection: 'row', gap: 6 }}>
        {PATTERNS.map((p) => {
          const you = p.key === cls;
          return (
            <View key={p.key} style={{ flex: 1, gap: 8 }}>
              <View style={{ height: 24, alignItems: 'center' }}>
                {you ? (
                  <View style={{ height: 24, paddingHorizontal: 10, borderRadius: 9999, backgroundColor: colors.secondary, justifyContent: 'center' }}>
                    <Text variant="caption" weight={600} tone="inherit" style={{ color: colors['on-secondary'] }}>You</Text>
                  </View>
                ) : null}
              </View>
              <View style={{ height: 8, borderRadius: 9999, backgroundColor: you ? colors.secondary : colors['surface-container-high'] }} />
              <Text variant="label-sm" weight={you ? 600 : 400} tone={you ? 'default' : 'meta'} align="center">{CLASS_LABEL[p.key]}</Text>
            </View>
          );
        })}
      </View>

      <View style={{ gap: 8 }}>
        <View accessible accessibilityLabel={`Your flow: ${mine.steps.join(' to ')}`} style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
          {mine.steps.map((s, i) => (
            <View key={s} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ height: 28, paddingHorizontal: 10, borderRadius: 9999, backgroundColor: colors.surface, justifyContent: 'center' }}>
                <Text variant="label-sm">{s}</Text>
              </View>
              {i < mine.steps.length - 1 ? <ArrowRight size={14} color={colors['on-surface']} strokeWidth={1.75} /> : null}
            </View>
          ))}
        </View>
        <Text variant="label-sm" weight={400} tone="meta">{mine.body}</Text>
      </View>

      <View style={{ backgroundColor: colors.surface, borderRadius: radius.sm, padding: 12, gap: 8 }}>
        {pct === null ? (
          <Text variant="body-md">No expenses this month for passive income to cover. Rich = 100%.</Text>
        ) : (
          <Text variant="body-md">Passive income covers <Text variant="body-md" weight={600}>{pct}%</Text> of expenses. Rich = 100%.</Text>
        )}
        <View accessible accessibilityRole="image" accessibilityLabel={`Passive income covers ${pct ?? 0} percent of expenses`} style={{ height: 8, borderRadius: 9999, backgroundColor: colors['surface-container-high'], overflow: 'hidden' }}>
          <View style={{ width: `${bar}%`, minWidth: 6, height: 8, borderRadius: 9999, backgroundColor: chart[1] }} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text variant="caption" tone="meta" tabular>{masked ? '•••' : perMonth(passive)}</Text>
          <Text variant="caption" tone="meta" tabular>{masked ? '•••' : perMonth(expenses)}</Text>
        </View>
      </View>

      <Pressable onPress={onSeeAll} accessibilityRole="button" style={{ height: 44, flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' }}>
        <Text variant="body-md" weight={600}>See all patterns</Text>
        <ChevronRight size={16} color={colors['on-surface']} strokeWidth={1.75} />
      </Pressable>
    </CashflowCard>
  );
}
