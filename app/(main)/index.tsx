import { useState } from 'react';
import { ScrollView, Pressable, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { HomeTopBar } from '../../components/home/HomeTopBar';
import { AffirmationCard } from '../../components/home/AffirmationCard';
import { BalanceBanner } from '../../components/home/BalanceBanner';
import { AccountCards } from '../../components/home/AccountCards';
import { Shortcuts } from '../../components/home/Shortcuts';
import { RecentTransactions } from '../../components/home/RecentTransactions';
import { flags } from '../../src/lib/secureStore';
import { edgeFunctionsService } from '../../src/services/edgeFunctions';
import { refreshGate } from '../_layout';

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
          name="Ahmad"
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
          balance="4,250.00"
          visible={balanceVisible}
          onToggle={() => setBalanceVisible(!balanceVisible)}
        />
        <AccountCards onAccountPress={(id, type) => {
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
          onSeeAll={() => router.push('/calendar')}
          onTransactionPress={(id) => console.log('Transaction pressed:', id)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}