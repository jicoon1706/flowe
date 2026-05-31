import { useState, useCallback, useEffect } from 'react';
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
import { useLock } from '../../context/LockContext';
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
  const { lock } = useLock();

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
    await Promise.all([fetchAccounts(), fetchTransactions(), profilePromise, affirmPromise]);
    setRefreshing(false);
  }

  useFocusEffect(useCallback(() => {
    fetchAccounts();
    fetchTransactions();
  }, [fetchAccounts, fetchTransactions]));

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
          onBellPress={() => router.push('/home/notifications')}
          onLockPress={lock}
        />
        <AffirmationCard
          index={affirmationIndex}
          items={affirmationItems}
          onNext={() => setAffirmationIndex((i) => i + 1)}
          onPrev={() => setAffirmationIndex((i) => i - 1)}
          onFavourite={() => {}}
          onShare={() => {}}
        />
        <BalanceBanner
          balance={totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          visible={balanceVisible}
          onToggle={() => setBalanceVisible(!balanceVisible)}
        />
        <AccountCards accounts={accounts} onAccountPress={(id, type) => {
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
          onSeeAll={() => router.push('/calendar')}
          onTransactionPress={(id) => console.log('Transaction pressed:', id)}
          onTransactionDeleted={() => { fetchTransactions(); fetchAccounts(); }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}