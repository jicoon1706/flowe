import { useState, useCallback } from 'react';
import { ScrollView, Pressable, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { HomeTopBar } from '../../components/home/HomeTopBar';
import { AffirmationCard } from '../../components/home/AffirmationCard';
import { BalanceBanner } from '../../components/home/BalanceBanner';
import { AccountCards } from '../../components/home/AccountCards';
import { Shortcuts } from '../../components/home/Shortcuts';
import { RecentTransactions } from '../../components/home/RecentTransactions';
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

  async function resetOnboarding() {
    await flags.unsetPin();
    refreshGate();
    router.replace('/(auth)/welcome');
  }

  async function smokeTestApi() {
    const month = '2026-05';
    const r1 = await edgeFunctionsService.getCashflowSummary(month);
    const r2 = await edgeFunctionsService.getAnalysis(month);
    console.log('[smoke] cashflow-summary:', JSON.stringify(r1));
    console.log('[smoke] analysis-monthly:', JSON.stringify(r2));
  }

  const { user } = useAuth();
  const now = new Date();
  const { accounts, loading: accountsLoading, error: accountsError, fetchAccounts } = useAccounts();
  const { transactions, loading: txLoading, error: txError } = useTransactions(now.getFullYear(), now.getMonth() + 1);
  const { summary: cashflow, loading: cfLoading, error: cfError } = useCashflow('2026-05');

  useFocusEffect(useCallback(() => {
    fetchAccounts();
  }, [fetchAccounts]));

  if (accountsLoading || cfLoading) return <LoadingView />;
  if (accountsError) return <ErrorView error={accountsError} onRetry={fetchAccounts} />;

  const totalBalance = accounts.reduce((sum, acc) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bank = (acc as any).bank_accounts;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      <ScrollView showsVerticalScrollIndicator={false}>
        <HomeTopBar
          name={user?.user_metadata?.display_name ?? 'User'}
          onBellPress={() => router.push('/home/notifications')}
          onLockPress={() => {}}
        />
        <AffirmationCard
          index={affirmationIndex}
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
          transactions={transactions}
          onSeeAll={() => router.push('/calendar')}
          onTransactionPress={(id) => console.log('Transaction pressed:', id)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}