import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../../src/lib/supabase';
import { ScrollView, Pressable, Text, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter , useFocusEffect } from 'expo-router';
import { HomeTopBar } from '../../components/home/HomeTopBar';
import { AffirmationCard } from '../../components/home/AffirmationCard';
import { BalanceBanner } from '../../components/home/BalanceBanner';
import { AccountCards } from '../../components/home/AccountCards';
import { Shortcuts } from '../../components/home/Shortcuts';
import { RecentTransactions } from '../../components/home/RecentTransactions';
import { PendingRecurringModal } from '../../components/home/PendingRecurringModal';
import { PendingEntriesCard } from '../../components/home/PendingEntriesCard';
import { usePendingRecurring } from '../../src/hooks/usePendingRecurring';
import { useDailyBudget } from '../../src/hooks/useDailyBudget';
import { scheduleRecurringReminders } from '../../src/services/recurring';
import { syncDailyBudget } from '../../src/services/dailyBudget';
import { notificationsRepository } from '../../src/repositories/notifications.repository';
import { useLock } from '../../context/LockContext';
import { useDetected } from '../../context/DetectedTransactionsContext';
import { flags } from '../../src/lib/secureStore';
import { edgeFunctionsService } from '../../src/services/edgeFunctions';
import { refreshGate } from '../_layout';
import { useAuth } from '../../context/AuthContext';
import { useAccounts } from '../../src/hooks/useAccounts';
import { useTransactions } from '../../src/hooks/useTransactions';
import { useCashflow } from '../../src/hooks/useCashflow';
import { LoadingView } from '../../components/ui/LoadingView';
import { ErrorView } from '../../components/ui/ErrorView';
import { EmptyState } from '../../components/ui/EmptyState';

export default function HomeScreen() {
  const router = useRouter();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [affirmationIndex, setAffirmationIndex] = useState(0);
  const { locked, lock, requireUnlock } = useLock();
  const detected = useDetected();

  // Until the user has unlocked, every figure on this screen is masked no
  // matter what the eye toggle says — the toggle itself is what asks for the
  // PIN. After unlocking it goes back to being the user's own preference.
  const showFigures = !locked && balanceVisible;
  const toggleFigures = async () => {
    if (locked) {
      if (await requireUnlock()) setBalanceVisible(true);
      return;
    }
    setBalanceVisible((v) => !v);
  };

  async function resetOnboarding() {
    await flags.unsetPin();
    refreshGate();
    router.replace('/(auth)/welcome');
  }

  async function smokeTestApi() {
    const { supabase } = await import('../../src/lib/supabase');
    const { data: { user } } = await supabase.auth.getUser();
    console.log('[smoke] auth user:', user?.id ?? 'NONE', 'is_anonymous:', user?.is_anonymous);

    const acc = await supabase.from('accounts').select('*').limit(5);
    console.log('[smoke] accounts read:', JSON.stringify({ data: acc.data, error: acc.error }));

    const month = '2026-05';
    const r1 = await edgeFunctionsService.getCashflowSummary(month);
    const r2 = await edgeFunctionsService.getAnalysis(month);
    console.log('[smoke] cashflow-summary:', JSON.stringify(r1));
    console.log('[smoke] analysis-monthly:', JSON.stringify(r2));
  }

  const { user } = useAuth();
  const [displayName, setDisplayName] = useState<string>('User');
  const [affirmationItems, setAffirmationItems] = useState<{ emoji: string; category: string; quote: string }[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { pending, acting, fetchPending, approve, reject } = usePendingRecurring();
  const [showPending, setShowPending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnread = useCallback(async () => {
    const result = await notificationsRepository.getUnreadCount();
    if (result.ok) setUnreadCount(result.data);
  }, []);

  useEffect(() => {
    if (!user) return;
    const CATEGORY_EMOJI: Record<string, string> = {
      saving: '💰', investing: '📈', mindset: '🧠', awareness: '👁️',
    };
    supabase
      .from('user_affirmations')
      .select('text, category')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.warn('[home] fetch user_affirmations failed:', error);
          return;
        }
        const items = (data ?? []).map((row: any) => ({
          emoji: CATEGORY_EMOJI[String(row.category).toLowerCase()] ?? '✨',
          category: String(row.category).charAt(0).toUpperCase() + String(row.category).slice(1),
          quote: `"${row.text}"`,
        }));
        setAffirmationItems(items);
      });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.display_name) setDisplayName(data.display_name);
      });
  }, [user]);

  const now = new Date();
  const { accounts, loading: accountsLoading, error: accountsError, fetchAccounts } = useAccounts();
  const { transactions, loading: txLoading, error: txError, refetch: fetchTransactions } = useTransactions(now.getFullYear(), now.getMonth() + 1);
  const { summary: cashflow, loading: cfLoading, error: cfError } = useCashflow('2026-05');
  const { budget: dailyBudget, loaded: budgetLoaded, fetchBudget } = useDailyBudget(user?.id);

  // The native side draws the budget widget on its own, with Flowe closed, so
  // it keeps its own copy of the budget and of today's spend. Pushing it here
  // covers the app being opened after a day (or a payment) it knew nothing
  // about; every write while the app is open is covered by the subscription in
  // the layout. Today's total is read straight from Supabase rather than summed
  // out of `transactions`, which is this month's — and therefore the wrong month
  // on the 1st.
  useEffect(() => {
    if (!budgetLoaded) return;
    syncDailyBudget(dailyBudget);
  }, [budgetLoaded, dailyBudget]);

  async function onRefresh() {
    if (!user) return;
    setRefreshing(true);
    const profilePromise = supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.display_name) setDisplayName(data.display_name);
      });
    const affirmPromise = supabase
      .from('user_affirmations')
      .select('text, category')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        const CATEGORY_EMOJI: Record<string, string> = {
          saving: '💰', investing: '📈', mindset: '🧠', awareness: '👁️',
        };
        const items = (data ?? []).map((row: any) => ({
          emoji: CATEGORY_EMOJI[String(row.category).toLowerCase()] ?? '✨',
          category: String(row.category).charAt(0).toUpperCase() + String(row.category).slice(1),
          quote: `"${row.text}"`,
        }));
        setAffirmationItems(items);
      });
    await Promise.all([fetchAccounts(), fetchTransactions(), fetchPending(), fetchUnread(), fetchBudget(), profilePromise, affirmPromise]);
    setRefreshing(false);
  }

  useFocusEffect(useCallback(() => {
    fetchAccounts();
    fetchTransactions();
    fetchPending();
    fetchUnread();
    fetchBudget();
  }, [fetchAccounts, fetchTransactions, fetchPending, fetchUnread, fetchBudget]));

  // Put a 5am reminder on each active rule's next occurrence. Once per session
  // is enough — the whole set is rebuilt each run, so doing it on every focus
  // would just cancel and re-add the same notifications. Needs a signed-in
  // session, which is why it lives here rather than in the root layout.
  const remindersScheduledRef = useRef(false);
  useEffect(() => {
    if (!user || remindersScheduledRef.current) return;
    remindersScheduledRef.current = true;
    scheduleRecurringReminders();
  }, [user]);

  // On the date arriving, surface the approve/reject popup automatically — but
  // only once per app session, so closing it doesn't re-open on every refocus.
  // Not while locked: the popup names amounts, so it waits for the unlock.
  const autoShownRef = useRef(false);
  useEffect(() => {
    if (!autoShownRef.current && !locked && pending.length > 0) {
      autoShownRef.current = true;
      setShowPending(true);
    }
  }, [pending.length, locked]);

  const openPending = async () => {
    if (await requireUnlock()) setShowPending(true);
  };

  const handleApprove = async (rule: typeof pending[number]) => {
    const res = await approve(rule);
    if (res.ok) {
      fetchTransactions();
      fetchAccounts();
    }
  };

  if (accountsLoading || cfLoading) return <LoadingView />;
  if (accountsError) return <ErrorView error={accountsError} onRetry={fetchAccounts} />;

  const totalBalance = accounts.reduce((sum, acc) => {
     
    const bank = (acc as any).bank_accounts;
     
    const wallet = (acc as any).wallet_accounts;
    const bal = bank?.current_balance ?? wallet?.current_balance ?? 0;
    return sum + Number(bal);
  }, 0);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {__DEV__ && (
        <Pressable
          onPress={resetOnboarding}
          className="bg-destructive rounded-xl mx-4 mt-2 py-2 items-center active:opacity-80"
        >
          <Text className="text-white font-semibold text-xs">DEV: Reset onboarding</Text>
        </Pressable>
      )}
      {__DEV__ && (
        <Pressable
          onPress={smokeTestApi}
          className="bg-primary/20 rounded-xl mx-4 mt-2 py-2 items-center active:opacity-80"
        >
          <Text className="text-primary font-semibold text-xs">DEV: Smoke test APIs</Text>
        </Pressable>
      )}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#C5FF00"
            colors={['#C5FF00']}
          />
        }
      >
        <HomeTopBar
          name={displayName}
          locked={locked}
          onBellPress={() => router.push('/home/notifications')}
          onLockPress={locked ? () => { requireUnlock(); } : lock}
          onPendingPress={openPending}
          pendingCount={pending.length}
          hasNotification={unreadCount > 0 || pending.length > 0}
        />
        <AffirmationCard
          index={affirmationIndex}
          items={affirmationItems}
          onNext={() => setAffirmationIndex((i) => i + 1)}
          onPrev={() => setAffirmationIndex((i) => i - 1)}
          onFavourite={() => {}}
          onShare={() => {}}
        />
        <PendingEntriesCard
          pending={detected.pending}
          accounts={detected.accounts}
          onSave={async (item, values) => {
            const result = await detected.save(item, values);
            if (result.ok) { fetchTransactions(); fetchAccounts(); }
            return result;
          }}
          onDismiss={detected.dismiss}
        />
        <BalanceBanner
          balance={totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          visible={showFigures}
          onToggle={toggleFigures}
        />
        <AccountCards accounts={accounts} visible={showFigures} onSeeAll={() => router.push('/home/accounts')} onAccountPress={(id, type) => {
          if (type === 'tabung') {
            router.push(`/home/tabung/${id}`);
          } else if (type === 'wallet') {
            router.push(`/home/wallet/${id}`);
          } else {
            router.push(`/home/account/${id}`);
          }
        }} />
        <Shortcuts onPress={(id) => {
          switch (id) {
            case 'analysis': router.push('/home/analysis'); break;
            case 'learn': router.push('/home/learn'); break;
            case 'newTabung': router.push('/tabung/new'); break;
            case 'accounts': router.push('/home/accounts'); break;
          }
        }} />
        <RecentTransactions
          transactions={transactions.filter((tx) => tx.type === 'expense' || tx.type === 'income' || tx.type === 'transfer')}
          masked={!showFigures}
          onRequestUnlock={requireUnlock}
          onSeeAll={() => router.push('/calendar')}
          onTransactionPress={(id) => console.log('Transaction pressed:', id)}
          onTransactionDeleted={() => { fetchTransactions(); fetchAccounts(); }}
        />
      </ScrollView>

      <PendingRecurringModal
        visible={showPending}
        pending={pending}
        acting={acting}
        onApprove={handleApprove}
        onReject={reject}
        onClose={() => setShowPending(false)}
      />
    </SafeAreaView>
  );
}