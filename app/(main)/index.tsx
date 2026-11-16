import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { ArrowDownRight, ArrowUpDown, BookOpen, ChartLine, Gauge, Plus, RefreshCw, ScanLine, Wallet } from 'lucide-react-native';
import { colors } from '@/theme/tokens';
import { HomeHero } from '@/components/home/HomeHero';
import { PendingEntriesCard } from '@/components/home/PendingEntriesCard';
import { PendingRecurringModal } from '@/components/home/PendingRecurringModal';
import { TransactionDetail } from '@/components/home/TransactionDetail';
import { TransactionList } from '@/components/home/TransactionList';
import { AffirmationCard } from '@/components/home/AffirmationCard';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { Hero } from '@/components/ui/Hero';
import { IconButton } from '@/components/ui/IconButton';
import { PhotoSlot } from '@/components/ui/PhotoSlot';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatTile } from '@/components/ui/StatTile';
import { useAuth } from '@/context/AuthContext';
import { useLock } from '@/context/LockContext';
import { useDetected } from '@/context/DetectedTransactionsContext';
import { useAccounts } from '@/src/hooks/useAccounts';
import { useTransactions } from '@/src/hooks/useTransactions';
import { useDailyBudget } from '@/src/hooks/useDailyBudget';
import { usePendingRecurring } from '@/src/hooks/usePendingRecurring';
import { useTodaySpend } from '@/src/hooks/useTodaySpend';
import { useCountDown } from '@/src/hooks/useCountDown';
import { useProfile } from '@/src/hooks/useProfile';
import { useAffirmations } from '@/src/hooks/useAffirmations';
import { useCustomCategories } from '@/src/hooks/useCustomCategories';
import { notificationsRepository } from '@/src/repositories/notifications.repository';
import { scheduleRecurringReminders } from '@/src/services/recurring';
import { refreshSpentToday, syncDailyBudget } from '@/src/services/dailyBudget';
import { readHomeCache, syncedLabel, writeHomeCache, type HomeCache } from '@/src/lib/homeCache';
import { sumBalances, spendableAccounts, type AnyAccount } from '@/src/utils/accountDisplay';
import { editParams, type TxWithAccounts } from '@/src/utils/transactionDisplay';

/** "Updated just now" stays this long after a live update (o-home-live-after). */
const UPDATED_CHIP_MS = 2000;

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { locked, requireUnlock } = useLock();
  const detected = useDetected();
  const { displayName } = useProfile(user?.id);
  const now = new Date();
  const { accounts, loading: accLoading, error: accError, fetchAccounts } = useAccounts();
  const { transactions, loading: txLoading, error: txError, refetch: fetchTx } = useTransactions(now.getFullYear(), now.getMonth() + 1);
  const { budget, loaded: budgetLoaded, fetchBudget } = useDailyBudget(user?.id);
  const { spent, changedAt, refresh: refreshSpent } = useTodaySpend();
  const { pending, acting, fetchPending, approve, reject } = usePendingRecurring();
  const { affirmations, userAffirmations, fetchAffirmations, fetchUserAffirmations } = useAffirmations();
  const { categories: custom, fetchCategories } = useCustomCategories();

  const [cache, setCache] = useState<HomeCache | null>(null);
  const [fetchedOnce, setFetchedOnce] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [unread, setUnread] = useState(0);
  const [showRecurring, setShowRecurring] = useState(false);
  const [detail, setDetail] = useState<TxWithAccounts | null>(null);
  const [affIndex, setAffIndex] = useState(0);
  const [justUpdated, setJustUpdated] = useState(false);

  useEffect(() => { readHomeCache().then(setCache); }, []);

  const loadAll = useCallback(async () => {
    await Promise.all([
      fetchAccounts(), fetchTx(), fetchPending(), fetchBudget(), refreshSpent(),
      notificationsRepository.getUnreadCount().then((r) => { if (r.ok) setUnread(r.data); }),
    ]);
    setFetchedOnce(true);
  }, [fetchAccounts, fetchTx, fetchPending, fetchBudget, refreshSpent]);

  useFocusEffect(useCallback(() => { loadAll(); }, [loadAll]));

  useEffect(() => {
    if (!user) return;
    fetchUserAffirmations(user.id);
    fetchAffirmations();
    fetchCategories(user.id);
  }, [user, fetchUserAffirmations, fetchAffirmations, fetchCategories]);

  // Native copy of the budget for the widgets / live notification.
  useEffect(() => { if (budgetLoaded) syncDailyBudget(budget); }, [budgetLoaded, budget]);

  // Live update: a write anywhere ticks the figures down and flashes the chip.
  useEffect(() => {
    if (!changedAt) return;
    fetchAccounts();
    fetchTx();
    setJustUpdated(true);
    const t = setTimeout(() => setJustUpdated(false), UPDATED_CHIP_MS);
    return () => clearTimeout(t);
  }, [changedAt, fetchAccounts, fetchTx]);

  const remindersScheduled = useRef(false);
  useEffect(() => {
    if (!user || remindersScheduled.current) return;
    remindersScheduled.current = true;
    scheduleRecurringReminders();
  }, [user]);

  const autoShown = useRef(false);
  useEffect(() => {
    if (!autoShown.current && !locked && pending.length > 0) { autoShown.current = true; setShowRecurring(true); }
  }, [pending.length, locked]);

  const all = accounts as AnyAccount[];
  const liveBalance = all.length ? sumBalances(spendableAccounts(all)) : null;
  useEffect(() => { if (liveBalance !== null && !accError) writeHomeCache(liveBalance); }, [liveBalance, accError]);

  const stale: 'updating' | 'saved' | null = accError ? 'saved' : !fetchedOnce && cache ? 'updating' : null;
  const shownBalance = useCountDown(liveBalance ?? (stale ? cache?.balance ?? null : null));
  const left = budget !== null && spent !== null ? Math.round((budget - spent) * 100) / 100 : null;
  const shownLeft = useCountDown(left);
  const shownSpent = useCountDown(spent);

  const monthChangePct = useMemo(() => {
    if (liveBalance === null) return null;
    let net = 0;
    for (const t of transactions) {
      if (t.type === 'income') net += Number(t.amount);
      else if (t.type === 'expense') net -= Number(t.amount);
    }
    const start = liveBalance - net;
    if (start <= 0 || net === 0) return null;
    return (net / start) * 100;
  }, [transactions, liveBalance]);

  const recent = useMemo(
    () => (transactions as TxWithAccounts[]).filter((t) => t.type === 'expense' || t.type === 'income' || t.type === 'transfer').slice(0, 5),
    [transactions],
  );
  const affirmationTexts = useMemo(
    () => [...userAffirmations.filter((a) => a.is_active).map((a) => a.text), ...affirmations.map((a) => a.quote)],
    [userAffirmations, affirmations],
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    await refreshSpentToday();
    setRefreshing(false);
  };

  const unlock = () => { requireUnlock(); };
  const masked = locked;
  const firstLoad = accLoading && !fetchedOnce && !cache;
  const empty = fetchedOnce && !accError && all.length === 0;

  const hero = (
    <HomeHero
      name={displayName}
      balance={shownBalance}
      accounts={all}
      monthChangePct={monthChangePct}
      masked={masked}
      unread={unread > 0}
      loading={firstLoad}
      stale={stale}
      lastSynced={syncedLabel(cache)}
      justUpdated={justUpdated}
      onAvatar={() => router.push('/settings')}
      onBell={() => router.push('/home/notifications')}
      onAccounts={() => router.push('/home/accounts')}
      onUnlock={unlock}
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors['on-primary']} colors={[colors.secondary]} progressBackgroundColor={colors.surface} />}
      >
        <Hero style={{ paddingBottom: 24 }}>{empty ? <View style={{ height: 300 }}>{hero}</View> : hero}</Hero>

        <View style={{ paddingHorizontal: 16, paddingTop: 16, gap: 16 }}>
          {firstLoad ? (
            <>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Skeleton height={52} tone="pill" flex={1} />
                <Skeleton width={60} height={52} tone="pill" />
                <Skeleton height={52} tone="pill" flex={1} />
              </View>
              <Skeleton height={150} radius={20} />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Skeleton height={84} radius={12} flex={1} />
                <Skeleton height={84} radius={12} flex={1} />
              </View>
            </>
          ) : empty ? (
            <EmptyState
              art={<PhotoSlot photo="homeEmpty" style={{ width: 200, height: 140, borderRadius: 20 }} />}
              title="Add your first account"
              body="Connect a bank, e-wallet or Tabung and Flowe starts counting from today."
              ctaLabel="Add account"
              ctaIcon={Plus}
              onCta={() => router.push({ pathname: '/home/accounts', params: { add: '1' } })}
            />
          ) : accError && all.length === 0 ? (
            <EmptyState
              icon={RefreshCw}
              title="Couldn’t refresh balances"
              body={cache ? `We’re showing what was saved at ${syncedLabel(cache)}. Pull down or try again.` : 'Pull down or try again.'}
              ctaLabel="Try again"
              ctaIcon={RefreshCw}
              onCta={loadAll}
            />
          ) : (
            <>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Button label="Add" icon={Plus} variant="action" style={{ flex: 1 }} onPress={() => router.push({ pathname: '/add-transaction', params: { nonce: String(Date.now()) } })} />
                <IconButton icon={ArrowUpDown} variant="action" wide accessibilityLabel="Transfer" onPress={() => router.push({ pathname: '/add-transaction', params: { type: 'transfer', nonce: String(Date.now()) } })} />
                <Button label="Scan" icon={ScanLine} variant="action" style={{ flex: 1 }} onPress={() => router.push({ pathname: '/add-transaction', params: { scan: '1', nonce: String(Date.now()) } })} />
              </View>

              {detected.pending.length > 0 ? (
                <PendingEntriesCard pending={detected.pending} accounts={detected.accounts} onSave={detected.save} onDismiss={detected.dismiss} />
              ) : null}

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <StatTile label="Spent today" icon={ArrowDownRight} amount={shownSpent ?? 0} masked={masked} />
                {budget !== null ? (
                  <StatTile label="Left today" icon={Wallet} amount={shownLeft ?? 0} masked={masked} />
                ) : (
                  <StatTile label="Left today" icon={Gauge} value="Set a budget" onPress={() => router.push('/settings/budget')} />
                )}
              </View>

              <SectionHeader title="Recent Transactions" onAction={() => router.push('/transactions')} />
              {txError && recent.length === 0 ? (
                <EmptyState icon={RefreshCw} title="Couldn’t load transactions" body="Check your connection and try again." ctaLabel="Try again" onCta={fetchTx} />
              ) : !txLoading && recent.length === 0 ? (
                <EmptyState title="No transactions yet" body="Add one, or turn on auto-detect and bank alerts become one-tap confirmations." ctaLabel="Add transaction" ctaIcon={Plus} onCta={() => router.push('/add-transaction')} />
              ) : (
                <TransactionList transactions={recent} customCategories={custom} masked={masked} loading={txLoading} skeletonRows={4} onPress={async (tx) => { if (await requireUnlock()) setDetail(tx); }} />
              )}

              {affirmationTexts.length > 0 ? (
                <AffirmationCard text={affirmationTexts[affIndex % affirmationTexts.length]} onNext={affirmationTexts.length > 1 ? () => setAffIndex((i) => i + 1) : undefined} />
              ) : null}

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Chip label="Analysis" icon={ChartLine} onPress={() => router.push('/home/analysis')} />
                <Chip label="Learn" icon={BookOpen} onPress={() => router.push('/home/learn')} />
              </View>
            </>
          )}
        </View>
      </ScrollView>

      <TransactionDetail
        visible={!!detail}
        transaction={detail}
        accounts={all}
        customCategories={custom}
        onClose={() => setDetail(null)}
        onChanged={() => { fetchTx(); fetchAccounts(); }}
        onEdit={(tx) => router.push({ pathname: '/add-transaction', params: editParams(tx) })}
      />
      <PendingRecurringModal
        visible={showRecurring}
        pending={pending}
        acting={acting}
        accountNames={Object.fromEntries(all.map((a) => [a.id, a.name]))}
        onApprove={async (r) => { const res = await approve(r); if (res.ok) { fetchTx(); fetchAccounts(); } return res; }}
        onReject={reject}
        onClose={() => setShowRecurring(false)}
      />
    </View>
  );
}
