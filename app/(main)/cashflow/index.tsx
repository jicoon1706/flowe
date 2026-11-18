import { useCallback, useRef, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius } from '@/theme/tokens';
import { expenseCategories, incomeCategories } from '@/constants/categories';
import { categoryIcon } from '@/constants/categoryIcons';
import { CashFlowDiagramCard } from '@/components/cashflow/CashFlowDiagramCard';
import { CashFlowPatternDiagram } from '@/components/cashflow/CashFlowPatternDiagram';
import { ExpensesSection } from '@/components/cashflow/ExpensesSection';
import { NetWorthHero } from '@/components/cashflow/NetWorthHero';
import { NetWorthTrendCard } from '@/components/cashflow/NetWorthTrendCard';
import { PatternCard } from '@/components/cashflow/PatternCard';
import { FullScreenModal } from '@/components/ui/FullScreenModal';
import { Hero } from '@/components/ui/Hero';
import { MonthPickerSheet } from '@/components/ui/MonthPickerSheet';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/context/AuthContext';
import { useLock } from '@/context/LockContext';
import { TABLET_LAYOUT, TABLET_WIDTH, useBreakpoint } from '@/src/hooks/useBreakpoint';
import { useCashflowOverview } from '@/src/hooks/useCashflowOverview';
import { useCustomCategories } from '@/src/hooks/useCustomCategories';
import { useFocusStatusBar } from '@/src/hooks/useFocusStatusBar';
import { monthStart } from '@/src/utils/monthStart';
import { describeTransaction } from '@/src/utils/transactionDisplay';
import type { Transaction } from '@/src/types';

/**
 * Starting height of the hero content (top row, net worth, chip, Assets |
 * Liabilities); the real height is measured. The hero is keyed by it because
 * the gradient keeps the size it was first drawn at: a hero that grew from
 * skeleton to data (or with a larger system font) left its lower part white.
 */
const HERO_CONTENT = 316;

/** 12,680.42 → '12,680.42'; 12,000 → '12,000' (diagram box lines). */
const plain = (v: number) => v.toLocaleString('en-MY', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

/**
 * cashflow (ins-cashflow / t-ins-cashflow): net worth hero, net worth trend,
 * cash flow diagram, your pattern, expenses. One month drives every card.
 */
export default function CashflowScreen() {
  const router = useRouter();
  const { width, isTablet } = useBreakpoint();
  const { user } = useAuth();
  const { locked } = useLock();
  const insets = useSafeAreaInsets();
  const [heroContent, setHeroContent] = useState(HERO_CONTENT);
  const [month, setMonth] = useState(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1); });
  const [picker, setPicker] = useState(false);
  const [patterns, setPatterns] = useState(false);
  const { data, errors, loading, refetch } = useCashflowOverview(month);
  const { categories: custom, fetchCategories } = useCustomCategories();
  useFocusStatusBar('dark', isTablet);

  // The hook loads on mount and on month change; focus only needs a refresh when coming back.
  const focused = useRef(false);
  useFocusEffect(useCallback(() => {
    if (focused.current) refetch(); else focused.current = true;
    if (user) fetchCategories(user.id);
  }, [refetch, fetchCategories, user]));

  const key = monthStart(month);
  const monthParam = key.slice(0, 7);
  const monthLabel = month.toLocaleDateString('en-MY', { month: 'long', year: 'numeric' });
  const monthShort = month.toLocaleDateString('en-MY', { month: 'short', year: 'numeric' });
  const monthName = month.toLocaleDateString('en-MY', { month: 'long' });
  // Picking a month reloads every card: skeletons until that month's data lands.
  const current = data && data.month === key ? data : null;
  const busy = loading && !current;

  const labelOf = (cat: string) => describeTransaction({ type: 'expense', category: cat } as Transaction, custom).label;
  const iconOf = (cat: string) => categoryIcon(expenseCategories.find((c) => c.id === cat)?.id ?? custom.find((c) => c.name === cat)?.icon ?? cat);
  const incomeName = (cat: string) => incomeCategories.find((c) => c.id === cat)?.name ?? cat.charAt(0).toUpperCase() + cat.slice(1);
  const openCategory = (cat: string) => router.push({ pathname: '/transactions', params: { category: cat, month: monthParam } });

  const balanceRetry = errors.balance && !busy ? refetch : null;
  const monthRetry = (errors.balance || errors.month) && !busy ? refetch : null;

  const hero = (
    <NetWorthHero
      monthLabel={monthLabel}
      onBack={() => (router.canGoBack() ? router.back() : router.navigate('/(main)'))}
      onMonth={() => setPicker(true)}
      onInfo={() => router.push('/cashflow/info')}
      onClass={() => setPatterns(true)}
      data={current}
      loading={busy}
      onRetry={balanceRetry}
      masked={locked}
    />
  );

  const heroBody = (
    <View onLayout={(e) => { const h = Math.ceil(e.nativeEvent.layout.height); if (h > heroContent) setHeroContent(h); }}>{hero}</View>
  );

  const trend = <NetWorthTrendCard points={current?.trend ?? []} loading={busy} onRetry={(errors.trend || errors.balance) && !busy ? refetch : null} masked={locked} />;
  const spendNames = (current?.spend ?? []).map((s) => labelOf(s.category));
  const diagram = (
    <CashFlowDiagramCard
      monthLabel={monthShort}
      income={current?.income ?? 0}
      incomeLines={(current?.incomeLines ?? []).map((l) => `${incomeName(l.name)} ${plain(Math.round(l.amount))}`)}
      expenses={current?.expenses ?? 0}
      expenseLines={[spendNames.slice(0, 2).join(', '), spendNames.slice(2).join(', ')].filter(Boolean)}
      assets={current?.assets ?? 0}
      assetLines={[`Cash ${plain(current?.cash ?? 0)}`, ...(current?.assetLines ?? []).slice(0, 1).map((a) => `${a.name} ${plain(a.amount)}`)]}
      liabilities={current?.liabilities ?? 0}
      liabilityLines={(current?.liabilityLines ?? []).slice(0, 2).map((l) => l.name)}
      passive={current?.passive ?? { total: 0, items: [] }}
      repayments={current?.repayments ?? { total: 0, items: [] }}
      loading={busy}
      onRetry={monthRetry}
      masked={locked}
    />
  );
  const pattern = (
    <PatternCard
      cls={current?.cls ?? 'poor'}
      passive={current?.passive.total ?? 0}
      expenses={current?.expenses ?? 0}
      pct={current?.passivePct ?? null}
      onSeeAll={() => setPatterns(true)}
      loading={busy}
      onRetry={monthRetry}
      masked={locked}
    />
  );
  const expenses = (
    <ExpensesSection
      monthName={monthName}
      total={current?.expenses ?? 0}
      items={current?.spend ?? []}
      labelOf={labelOf}
      iconOf={iconOf}
      onCategory={openCategory}
      onViewAll={() => router.push({ pathname: '/transactions', params: { type: 'expense', month: monthParam } })}
      onAdd={() => router.push({ pathname: '/add-transaction', params: { nonce: String(Date.now()) } })}
      loading={busy}
      onRetry={errors.month && !busy ? refetch : null}
      layout={isTablet ? 'tablet' : 'phone'}
      masked={locked}
    />
  );

  const padX = isTablet ? Math.max(TABLET_LAYOUT.cardPadding, (width - TABLET_WIDTH.dashboard) / 2 + TABLET_LAYOUT.cardPadding) : 16;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={loading && !!current} onRefresh={refetch} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {isTablet ? (
          <Hero key={heroContent} tablet="card" height={24 + heroContent} contentMaxWidth={TABLET_LAYOUT.cardHeroColumn}>{heroBody}</Hero>
        ) : (
          <Hero key={heroContent} height={insets.top + 12 + heroContent} style={{ margin: 8, borderRadius: radius.xl }}>{heroBody}</Hero>
        )}
        <View style={{ paddingHorizontal: padX, paddingTop: isTablet ? 0 : 8, gap: isTablet ? 16 : 12 }}>
          {isTablet ? (
            <>
              <View style={{ flexDirection: 'row', gap: 16, alignItems: 'flex-start' }}>
                <View style={{ flex: 1, minWidth: 0 }}>{trend}</View>
                <View style={{ flex: 1, minWidth: 0 }}>{pattern}</View>
              </View>
              <View style={{ flexDirection: 'row', gap: 16, alignItems: 'flex-start' }}>
                <View style={{ flex: 1, minWidth: 0 }}>{diagram}</View>
                <View style={{ flex: 1, minWidth: 0 }}>{expenses}</View>
              </View>
            </>
          ) : (
            <>
              <Text variant="headline-md" accessibilityRole="header" style={{ marginTop: 4 }}>{'Cashflow & net worth'}</Text>
              {trend}
              {diagram}
              {pattern}
              <View style={{ marginTop: 12 }}>{expenses}</View>
            </>
          )}
        </View>
      </ScrollView>
      <MonthPickerSheet visible={picker} onClose={() => setPicker(false)} value={month} onChange={setMonth} />
      <FullScreenModal visible={patterns} title="Cash flow patterns" onClose={() => setPatterns(false)}>
        <CashFlowPatternDiagram current={current?.cls ?? 'poor'} />
      </FullScreenModal>
    </View>
  );
}
