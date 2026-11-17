import { useCallback, useState } from 'react';
import { RefreshControl, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { ArrowDownRight, ArrowUpRight, RefreshCw } from 'lucide-react-native';
import { chart, colors } from '@/theme/tokens';
import { EmptyState } from '@/components/ui/EmptyState';
import { GlassChip } from '@/components/ui/GlassChip';
import { HeroScreen } from '@/components/ui/HeroScreen';
import { ResponsiveColumns } from '@/src/components/ui/ResponsiveGrid';
import { Money } from '@/components/ui/Money';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { TopBar } from '@/components/ui/TopBar';
import { useLock } from '@/context/LockContext';
import { useAnalysis } from '@/src/hooks/useAnalysis';
import { formatRMCompact } from '@/src/lib/money';

type Period = 3 | 6 | 12;
const NEXT: Record<Period, Period> = { 3: 6, 6: 12, 12: 3 };
const BAR_MAX = 136;

function monthName(ym: string, style: 'short' | 'long' = 'short'): string {
  const [y, m] = ym.slice(0, 7).split('-').map(Number);
  if (!y || !m) return ym;
  return new Date(y, m - 1, 1).toLocaleDateString('en-MY', { month: style });
}

/** home/analysis — monochrome blues; current month navy; income vs expense with sign + arrow. */
export default function AnalysisScreen() {
  const router = useRouter();
  const { locked } = useLock();
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const { analysis, loading, error, refetch } = useAnalysis(ym);
  const [period, setPeriod] = useState<Period>(6);
  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

  const trend = (analysis?.monthly_trend ?? []).slice(-period);
  const prev = trend.length > 1 ? trend[trend.length - 2] : null;
  const spent = analysis?.expenses ?? 0;
  const income = analysis?.income ?? 0;
  const change = prev && prev.expenses > 0 ? ((spent - prev.expenses) / prev.expenses) * 100 : null;
  const max = Math.max(1, ...trend.map((t) => t.expenses));
  const kept = income > 0 ? Math.round(((income - spent) / income) * 100) : null;
  const firstLoad = loading && !analysis;

  return (
    <HeroScreen
      tabletLayout="panel"
      heroHeight={300}
      refreshControl={<RefreshControl refreshing={loading && !!analysis} onRefresh={refetch} tintColor={colors['on-primary']} />}
      hero={
        <View>
          <TopBar title="Analysis" onBack={() => router.back()} />
          <View style={{ alignItems: 'center', gap: 12, marginTop: 28 }}>
            {firstLoad ? (
              <><Skeleton width={150} height={14} tone="glass" /><Skeleton width={240} height={56} tone="glass" /></>
            ) : (
              <>
                <Text variant="body-lg" tone="soft">Spent in {monthName(ym, 'long')}</Text>
                <Money amount={spent} variant="numeric-lg" on="gradient" smallCurrency masked={locked} />
                {change !== null && prev ? (
                  <GlassChip icon={change <= 0 ? ArrowDownRight : ArrowUpRight} label={`${Math.abs(change).toFixed(1)}% ${change <= 0 ? 'less' : 'more'} than ${monthName(prev.month, 'long')}`} />
                ) : null}
              </>
            )}
          </View>
        </View>
      }
    >
      {error && !analysis ? (
        <EmptyState icon={RefreshCw} title="Couldn’t load analysis" body="Check your connection and try again." ctaLabel="Try again" ctaIcon={RefreshCw} onCta={refetch} />
      ) : (
        <ResponsiveColumns>
          <>
            <SectionHeader title="Monthly trend" actionLabel={`${period}M`} onAction={() => setPeriod((p) => NEXT[p])} />
            {firstLoad ? (
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 196, paddingHorizontal: 4 }} accessibilityLabel="Loading chart">
                {[103, 123, 112, 136, 126, 116].map((h, i) => <Skeleton key={i} width={28} height={h} tone="pill" />)}
              </View>
            ) : trend.length ? (
              <View
                accessible
                accessibilityRole="image"
                accessibilityLabel={`Monthly spend: ${trend.map((t) => `${monthName(t.month)} ${formatRMCompact(t.expenses)}`).join(', ')}`}
                style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 196, paddingHorizontal: 4 }}
              >
                {trend.map((t, i) => {
                  const current = i === trend.length - 1;
                  return (
                    <View key={t.month} style={{ alignItems: 'center', gap: 8 }}>
                      <Text variant="caption" tone="muted">{formatRMCompact(t.expenses).replace('RM ', '')}</Text>
                      <View style={{ width: period === 12 ? 16 : 28, height: Math.max(8, Math.round((t.expenses / max) * BAR_MAX)), borderRadius: 9999, backgroundColor: current ? chart[0] : chart[1], opacity: current ? 1 : 0.55 }} />
                      <Text variant="label-sm" tone={current ? 'default' : 'muted'}>{monthName(t.month)}</Text>
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text variant="body-md" tone="muted">Your first month of spending starts the trend.</Text>
            )}
          </>
          <>
            <SectionHeader title="Income vs expense" />
            {[{ label: 'Income', value: income, dir: 'income' as const, color: chart[0] }, { label: 'Expense', value: spent, dir: 'expense' as const, color: chart[2] }].map((r) => {
              const share = Math.max(income, spent) > 0 ? r.value / Math.max(income, spent) : 0;
              return (
                <View key={r.label} style={{ gap: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text variant="body-md">{r.label}</Text>
                    <Money amount={r.value} direction={r.dir} arrow variant="body-md" weight={500} masked={locked} />
                  </View>
                  <View style={{ height: 12, borderRadius: 9999, backgroundColor: colors['surface-container'], overflow: 'hidden' }} accessibilityElementsHidden>
                    <View style={{ width: `${share * 100}%`, height: 12, borderRadius: 9999, backgroundColor: r.color }} />
                  </View>
                </View>
              );
            })}
            {kept !== null ? <Text variant="label-sm" weight={400} tone="muted">{kept >= 0 ? `You kept ${kept}% of income this month.` : `You spent ${Math.abs(kept)}% more than you earned this month.`}</Text> : null}
          </>
        </ResponsiveColumns>
      )}
    </HeroScreen>
  );
}
