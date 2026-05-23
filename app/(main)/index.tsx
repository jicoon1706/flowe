import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { HomeTopBar } from '../../components/home/HomeTopBar';
import { AffirmationCard } from '../../components/home/AffirmationCard';
import { BalanceBanner } from '../../components/home/BalanceBanner';
import { AccountCards } from '../../components/home/AccountCards';
import { Shortcuts } from '../../components/home/Shortcuts';
import { RecentTransactions } from '../../components/home/RecentTransactions';

export default function HomeScreen() {
  const router = useRouter();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [affirmationIndex, setAffirmationIndex] = useState(0);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <HomeTopBar
          name="Ahmad"
          onBellPress={() => router.push('/home/notifications')}
          onLockPress={() => router.push('/lock')}
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
        <AccountCards onAccountPress={(id) => router.push(`/home/account/${id}`)} />
        <Shortcuts onPress={(id) => {
          switch (id) {
            case 'analysis': router.push('/home/analysis'); break;
            case 'learn': router.push('/learn'); break;
            case 'newTabung': router.push('/tabung/new'); break;
            case 'accounts': router.push('/home/accounts'); break;
          }
        }} />
        <RecentTransactions
          onSeeAll={() => router.push('/calendar')}
          onTransactionPress={(id) => router.push('/transaction-detail')}
        />
      </ScrollView>
    </SafeAreaView>
  );
}