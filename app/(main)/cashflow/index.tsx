import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, useWindowDimensions, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { ArrowLeft, ChevronDown, Info, Plus, RefreshCw } from 'lucide-react-native';
import { colors } from '@/theme/tokens';
import { expenseCategories } from '@/constants/categories';
import { categoryIcon } from '@/constants/categoryIcons';
import { CategoryBubble } from '@/components/ui/CategoryBubble';
import { EmptyState } from '@/components/ui/EmptyState';
import { GlassIconButton } from '@/components/ui/GlassIconButton';
import { HeroScreen } from '@/components/ui/HeroScreen';
import { Money } from '@/components/ui/Money';
import { MonthPickerSheet } from '@/components/ui/MonthPickerSheet';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatTile } from '@/components/ui/StatTile';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/context/AuthContext';
import { useLock } from '@/context/LockContext';
import { useCustomCategories } from '@/src/hooks/useCustomCategories';
import { useTransactions } from '@/src/hooks/useTransactions';
import { spendByCategory } from '@/src/lib/cashflow';
import { describeTransaction } from '@/src/utils/transactionDisplay';
import type { Transaction } from '@/src/types';

/** Bubble slots on a 390-wide hero (ins-cashflow): [left, top, size], largest first. */
const SLOTS: [number, number, number][] = [
  [14, 72, 150], [196, 82, 134], [120, 216, 122], [268, 254, 108], [16, 284, 92], [150, 374, 76],
];

/**
 * cashflow — glass bubbles sized by share of spend (bright arc = %), month pill
 * pre-set to this month. Tap a bubble → that category's transactions.
 */
export default function CashflowScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const { locked } = useLock();
  const [month, setMonth] = useState(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1); });
  const [picker, setPicker] = useState(false);
  const { transactions, loading, error, refetch } = useTransactions(month.getFullYear(), month.getMonth() + 1);
  const { categories: custom, fetchCategories } = useCustomCategories();
  const [fetched, setFetched] = useState(false);

  useFocusEffect(useCallback(() => { refetch().then(() => setFetched(true)); if (user) fetchCategories(user.id); }, [refetch, fetchCategories, user]));

  const { total, items } = useMemo(() => spendByCategory(transactions as Transaction[]), [transactions]);
  const labelOf = (cat: string) => describeTransaction({ type: 'expense', category: cat } as Transaction, custom).label;
  const scale = Math.min(1, width / 390);
  const iconKeyOf = (cat: string) => expenseCategories.find((c) => c.id === cat)?.id ?? custom.find((c) => c.name === cat)?.icon ?? cat;
  const openCategory = (cat: string) => router.push({ pathname: '/transactions', params: { category: cat, month: `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}` } });
  const firstLoad = loading && !fetched;
  const monthLabel = month.toLocaleDateString('en-MY', { month: 'long', year: 'numeric' });

  const bubbles = firstLoad
    ? SLOTS.map(([l, t, s], i) => (
        <View key={i} style={{ position: 'absolute', left: l * scale, top: t, width: s * scale, height: s * scale, borderRadius: 9999, backgroundColor: colors.glass }} />
      ))
    : items.length === 0
    ? SLOTS.slice(0, 4).map(([l, t, s], i) => (
        <View key={i} style={{ position: 'absolute', left: l * scale, top: t }}>
          <CategoryBubble label="" share={0} icon={Plus} size={s * scale} ghost />
        </View>
      ))
    : items.slice(0, SLOTS.length).map((c, i) => {
        const [l, t, s] = SLOTS[i];
        return (
          <View key={c.category} style={{ position: 'absolute', left: l * scale, top: t }}>
            <CategoryBubble label={labelOf(c.category)} share={c.share} icon={categoryIcon(iconKeyOf(c.category))} size={s * scale} onPress={() => openCategory(c.category)} />
          </View>
        );
      });

  return (
    <HeroScreen
      heroHeight={580}
      refreshControl={<RefreshControl refreshing={loading && fetched} onRefresh={refetch} tintColor={colors['on-primary']} />}
      hero={
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 }}>
            <GlassIconButton icon={ArrowLeft} accessibilityLabel="Back" onPress={() => (router.canGoBack() ? router.back() : router.navigate('/(main)'))} />
            <Pressable
              onPress={() => setPicker(true)}
              accessibilityRole="button"
              accessibilityLabel={`Month: ${monthLabel}. Change month`}
              style={{ height: 44, paddingHorizontal: 16, borderRadius: 9999, backgroundColor: colors.glass, flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              <Text variant="body-md" weight={500} tone="inverse">{monthLabel}</Text>
              <ChevronDown size={16} color={colors['on-primary']} strokeWidth={1.75} />
            </Pressable>
            <GlassIconButton icon={Info} accessibilityLabel="Cashflow info" onPress={() => router.push('/cashflow/info')} />
          </View>
          <View style={{ flex: 1 }} accessibilityLabel={items.length ? 'Spending by category' : undefined}>
            {bubbles}
            {!firstLoad && items.length === 0 && !error ? (
              <View style={{ position: 'absolute', left: 24, right: 24, bottom: 48, alignItems: 'center' }}>
                <Text variant="body-md" tone="soft" align="center">Your spending shows up here as bubbles.</Text>
              </View>
            ) : null}
          </View>
        </View>
      }
      overlay={<MonthPickerSheet visible={picker} onClose={() => setPicker(false)} value={month} onChange={setMonth} />}
    >
      {error && transactions.length === 0 ? (
        <EmptyState icon={RefreshCw} title="Couldn’t load cashflow" body="Check your connection and try again." ctaLabel="Try again" ctaIcon={RefreshCw} onCta={refetch} />
      ) : !firstLoad && items.length === 0 ? (
        <EmptyState title="No spending yet this month" body="Add a transaction and Flowe sorts it into categories here." ctaLabel="Add transaction" ctaIcon={Plus} onCta={() => router.push({ pathname: '/add-transaction', params: { nonce: String(Date.now()) } })} />
      ) : (
        <>
          <SectionHeader title="Expenses" onAction={() => router.push('/transactions')} />
          {firstLoad ? <Skeleton width={180} height={32} /> : <Money amount={total} variant="display-md" masked={locked} />}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {firstLoad
              ? [0, 1].map((i) => <View key={i} style={{ width: '48.8%' }}><Skeleton height={84} radius={12} /></View>)
              : items.map((c) => (
                  <View key={c.category} style={{ width: '48.8%' }}>
                    <StatTile label={labelOf(c.category)} icon={categoryIcon(iconKeyOf(c.category))} amount={c.amount} masked={locked} onPress={() => openCategory(c.category)} />
                  </View>
                ))}
          </View>
        </>
      )}
    </HeroScreen>
  );
}
