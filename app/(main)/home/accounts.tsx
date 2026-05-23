import { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Plus, PiggyBank } from '../../../components/ui/icons';
import { Landmark, Wallet } from 'lucide-react-native';

const ALL_ACCOUNTS = [
  { id: '1', type: 'bank' as const, name: 'Maybank', balance: '3,200.00', bankColor: '#ffd93d', last4: '4521' },
  { id: '2', type: 'tabung' as const, name: 'Tabung Raya', saved: '850.00', target: '5,000.00', color: '#6bcf7f' },
  { id: '3', type: 'wallet' as const, name: 'Cash', balance: '200.00', bankColor: '#00d4ff', last4: '0000' },
];

type FilterType = 'All' | 'Bank' | 'Tabung' | 'Investment';

export default function AccountsScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');

  const visibleAccounts = ALL_ACCOUNTS.filter((a) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Bank') return a.type === 'bank' || a.type === 'wallet';
    if (activeFilter === 'Tabung') return a.type === 'tabung';
    if (activeFilter === 'Investment') return a.type === 'investment';
    return true;
  });

  const bankAccounts = visibleAccounts.filter((a) => a.type === 'bank' || a.type === 'wallet');
  const tabungAccounts = visibleAccounts.filter((a) => a.type === 'tabung');

  const totalNetWorth = ALL_ACCOUNTS.reduce((sum, a) => {
    if (a.type === 'tabung') return sum + parseFloat(a.saved || '0');
    return sum + parseFloat(a.balance?.replace(/,/g, '') || '0');
  }, 0);

  const bankTotal = ALL_ACCOUNTS
    .filter((a) => a.type === 'bank' || a.type === 'wallet')
    .reduce((sum, a) => sum + parseFloat(a.balance?.replace(/,/g, '') || '0'), 0);

  const tabungTotal = ALL_ACCOUNTS
    .filter((a) => a.type === 'tabung')
    .reduce((sum, a) => sum + parseFloat(a.saved || '0'), 0);

  const filters: FilterType[] = ['All', 'Bank', 'Tabung', 'Investment'];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-border">
        <Pressable onPress={() => router.back()} className="mr-3">
          <ChevronLeft size={24} color="#fff" />
        </Pressable>
        <Text className="flex-1 text-lg font-semibold text-foreground">Accounts</Text>
        <Pressable className="flex-row items-center">
          <Plus size={20} color="#C5FF00" />
          <Text className="text-sm font-semibold text-primary ml-1">Add</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Net Worth Hero Card */}
        <View className="mx-4 mt-4 bg-card rounded-2xl p-5 border border-primary/30">
          <Text className="text-sm text-muted-foreground mb-1">Net Worth</Text>
          <Text className="text-3xl font-bold text-foreground mb-4">
            RM {totalNetWorth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          <View className="flex-row">
            <View className="flex-1">
              <Text className="text-xs text-muted-foreground mb-0.5">Bank & Wallet</Text>
              <Text className="text-sm font-semibold text-foreground">
                RM {bankTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-xs text-muted-foreground mb-0.5">Tabung</Text>
              <Text className="text-sm font-semibold text-foreground">
                RM {tabungTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-xs text-muted-foreground mb-0.5">Investments</Text>
              <Text className="text-sm font-semibold text-foreground">RM 0.00</Text>
            </View>
          </View>
        </View>

        {/* Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-4 mx-4"
          contentContainerClassName="flex-row gap-2"
        >
          {filters.map((filter) => (
            <Pressable
              key={filter}
              onPress={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-full ${
                activeFilter === filter
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground'
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  activeFilter === filter ? 'text-primary-foreground' : 'text-muted-foreground'
                }`}
              >
                {filter}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Bank & Wallets Section */}
        {bankAccounts.length > 0 && (
          <View className="mt-5 px-4">
            <Text className="text-xs text-muted-foreground uppercase mb-2">Bank & Wallets</Text>
            {bankAccounts.map((account) => (
              <Pressable
                key={account.id}
                onPress={() => router.push(`/home/account/${account.id}`)}
                className="flex-row items-center bg-card rounded-2xl p-4 mb-2 border border-border"
              >
                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: account.bankColor }}
                >
                  {account.type === 'wallet' ? (
                    <Wallet size={20} color="#000" />
                  ) : (
                    <Landmark size={20} color="#000" />
                  )}
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-sm font-medium text-foreground">{account.name}</Text>
                  <Text className="text-xs text-muted-foreground mt-0.5">
                    {account.type === 'wallet' ? 'Cash Account' : `Account ending ${account.last4}`}
                  </Text>
                </View>
                <Text className="text-base font-semibold text-foreground">
                  RM {account.balance}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Tabungs Section */}
        {tabungAccounts.length > 0 && (
          <View className="mt-5 px-4 mb-6">
            <Text className="text-xs text-muted-foreground uppercase mb-2">Tabungs</Text>
            {tabungAccounts.map((tabung) => {
              const saved = parseFloat(tabung.saved?.replace(/,/g, '') || '0');
              const target = parseFloat(tabung.target?.replace(/,/g, '') || '0');
              const progress = target > 0 ? (saved / target) * 100 : 0;
              return (
                <Pressable
                  key={tabung.id}
                  onPress={() => router.push(`/home/tabung/${tabung.id}`)}
                  className="bg-card rounded-2xl p-4 mb-2 border border-border"
                >
                  <View className="flex-row items-center mb-2">
                    <View
                      className="w-10 h-10 rounded-full items-center justify-center mr-3"
                      style={{ backgroundColor: tabung.color }}
                    >
                      <PiggyBank size={20} color="#000" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-foreground">{tabung.name}</Text>
                      <Text className="text-xs text-muted-foreground mt-0.5">
                        RM {tabung.saved} saved of RM {tabung.target}
                      </Text>
                    </View>
                  </View>
                  <View className="h-2 bg-background rounded-full overflow-hidden">
                    <View
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(progress, 100)}%`,
                        backgroundColor: tabung.color,
                      }}
                    />
                  </View>
                </Pressable>
              );
            })}
            {/* New Tabung Button */}
            <Pressable
              onPress={() => router.push('/tabung/new')}
              className="flex-row items-center justify-center bg-card rounded-2xl p-4 mb-2 border border-dashed border-border"
              style={{ borderStyle: 'dashed' }}
            >
              <Plus size={20} color="#C5FF00" />
              <Text className="text-sm font-medium text-primary ml-2">New Tabung</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
