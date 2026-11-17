import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, Plus, RefreshCw } from 'lucide-react-native';
import { colors } from '@/theme/tokens';
import { TransactionDetail } from '@/components/home/TransactionDetail';
import { TransactionList } from '@/components/home/TransactionList';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { GlassIconButton } from '@/components/ui/GlassIconButton';
import { HeroScreen } from '@/components/ui/HeroScreen';
import { Money } from '@/components/ui/Money';
import { Sheet } from '@/components/ui/Sheet';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/context/AuthContext';
import { useLock } from '@/context/LockContext';
import { useAccounts } from '@/src/hooks/useAccounts';
import { useCustomCategories } from '@/src/hooks/useCustomCategories';
import { useTransactions } from '@/src/hooks/useTransactions';
import { useBreakpoint } from '@/src/hooks/useBreakpoint';
import { spendOnDay } from '@/src/lib/calendarSpend';
import { localYMD } from '@/src/utils/date';
import { editParams, type TxWithAccounts } from '@/src/utils/transactionDisplay';
import type { AnyAccount } from '@/src/utils/accountDisplay';

const WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** calendar — opens on today; dots scale with daily spend; tap a day → day sheet. */
export default function CalendarScreen() {
  const router = useRouter();
  const { isTablet } = useBreakpoint();
  const { user } = useAuth();
  const { locked } = useLock();
  const today = new Date();
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [day, setDay] = useState<string | null>(null);
  const [detail, setDetail] = useState<TxWithAccounts | null>(null);
  const { transactions, loading, error, refetch } = useTransactions(month.getFullYear(), month.getMonth() + 1);
  const { accounts, fetchAccounts } = useAccounts();
  const { categories: custom, fetchCategories } = useCustomCategories();
  const [fetched, setFetched] = useState(false);

  useFocusEffect(useCallback(() => { refetch().then(() => setFetched(true)); fetchAccounts(); if (user) fetchCategories(user.id); }, [refetch, fetchAccounts, fetchCategories, user]));

  const rows = transactions as TxWithAccounts[];
  const { levels, total } = useMemo(() => spendOnDay(rows), [rows]);
  const first = month.getDay();
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const todayYmd = localYMD(today);
  const ymdOf = (d: number) => localYMD(new Date(month.getFullYear(), month.getMonth(), d));
  const dayRows = day ? rows.filter((t) => t.date.slice(0, 10) === day) : [];
  const daySpent = dayRows.reduce((s, t) => (t.type === 'expense' ? s + Number(t.amount) : s), 0);
  const firstLoad = loading && !fetched;
  const monthName = month.toLocaleDateString('en-MY', { month: 'long', year: 'numeric' });
  const shift = (n: number) => { setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1)); setFetched(false); };

  return (
    <HeroScreen
      contentWidth="form"
      heroHeight={260}
      refreshControl={<RefreshControl refreshing={loading && fetched} onRefresh={refetch} tintColor={colors['on-primary']} />}
      hero={
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 }}>
            <GlassIconButton icon={ChevronLeft} accessibilityLabel="Previous month" onPress={() => shift(-1)} />
            <Text variant="body-lg" weight={500} tone="inverse" accessibilityRole="header">{monthName}</Text>
            <GlassIconButton icon={ChevronRight} accessibilityLabel="Next month" onPress={() => shift(1)} />
          </View>
          <View style={{ alignItems: 'center', gap: 8, marginTop: 24 }}>
            {firstLoad ? <><Skeleton width={130} height={14} tone="glass" /><Skeleton width={220} height={56} tone="glass" /></> : (
              <>
                <Text variant="body-lg" tone="soft">Spent this month</Text>
                <Money amount={total} variant="numeric-lg" on="gradient" smallCurrency masked={locked} />
              </>
            )}
          </View>
        </View>
      }
      overlay={
        <>
          <Sheet visible={!!day} onClose={() => setDay(null)} scroll testID="calendar-day">
            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text variant="headline-md" accessibilityRole="header">
                  {day ? new Date(`${day}T12:00:00`).toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric', month: 'short' }) : ''}
                </Text>
                {daySpent ? <Money amount={daySpent} direction="expense" variant="headline-md" masked={locked} /> : null}
              </View>
              {dayRows.length ? (
                <TransactionList transactions={dayRows} customCategories={custom} masked={locked} onPress={(t) => { setDay(null); setDetail(t); }} />
              ) : (
                <Text variant="body-md" tone="muted" style={{ paddingVertical: 12 }}>Nothing on this day.</Text>
              )}
              <Button label="Add to this day" icon={Plus} variant="action" onPress={() => { const d = day; setDay(null); router.push({ pathname: '/add-transaction', params: { date: d ?? '', nonce: String(Date.now()) } }); }} fullWidth />
            </View>
          </Sheet>
          <TransactionDetail
            visible={!!detail}
            transaction={detail}
            accounts={accounts as AnyAccount[]}
            customCategories={custom}
            masked={locked}
            onClose={() => setDetail(null)}
            onChanged={refetch}
            onEdit={(tx) => router.push({ pathname: '/add-transaction', params: editParams(tx) })}
          />
        </>
      }
    >
      {error && !rows.length ? (
        <EmptyState icon={RefreshCw} title="Couldn’t load this month" body="Check your connection and try again." ctaLabel="Try again" onCta={refetch} />
      ) : (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {WEEK.map((w, i) => (
              <View key={`${w}${i}`} style={{ width: `${100 / 7}%`, alignItems: 'center', paddingBottom: 8 }}>
                <Text variant="label-sm" tone="muted">{w}</Text>
              </View>
            ))}
            {cells.map((d, i) => {
              if (!d) return <View key={`b${i}`} style={{ width: `${100 / 7}%`, height: 52 }} />;
              const ymd = ymdOf(d);
              const isToday = ymd === todayYmd;
              const future = ymd > todayYmd;
              const level = levels[ymd] ?? 0;
              const label = `${d} ${month.toLocaleDateString('en-MY', { month: 'long' })}${level ? `, spend level ${level} of 3` : ''}`;
              return (
                <View key={ymd} style={{ width: `${100 / 7}%`, padding: 2 }}>
                  {firstLoad ? (
                    <Skeleton height={44} />
                  ) : (
                    <Pressable
                      onPress={() => setDay(ymd)}
                      accessibilityRole="button"
                      accessibilityLabel={label}
                      accessibilityState={{ selected: isToday }}
                      style={{ ...(isTablet ? { width: 48, alignSelf: 'center' } as const : null), height: 48, borderRadius: 9999, alignItems: 'center', justifyContent: 'center', gap: 3, backgroundColor: isToday ? colors.secondary : 'transparent' }}
                    >
                      <Text variant="body-md" size={15} weight={500} tone="inherit" style={{ color: isToday ? colors['on-secondary'] : future ? colors['on-surface-variant'] : colors['on-surface'] }}>{d}</Text>
                      <View style={{ flexDirection: 'row', gap: 2, height: 4 }}>
                        {Array.from({ length: level }).map((_, k) => (
                          <View key={k} style={{ width: 4, height: 4, borderRadius: 9999, backgroundColor: isToday ? colors['on-secondary'] : colors['primary-container'] }} />
                        ))}
                      </View>
                    </Pressable>
                  )}
                </View>
              );
            })}
          </View>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <Text variant="label-sm" weight={400} tone="muted">Dots = spend level (1–3)</Text>
            <Text variant="label-sm" weight={400} tone="muted">Today = black</Text>
          </View>
        </>
      )}
    </HeroScreen>
  );
}
