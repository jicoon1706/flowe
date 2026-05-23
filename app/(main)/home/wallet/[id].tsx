import { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Eye, EyeOff, Pencil } from '../../../../components/ui/icons';

const MOCK_WALLETS: Record<string, {
  name: string;
  balance: string;
  color: string;
  income: string;
  expense: string;
  history: { id: string; name: string; amount: string; type: 'income' | 'expense'; category: string; date: string }[];
}> = {
  '4': {
    name: 'Cash',
    balance: '200.00',
    color: '#00d4ff',
    income: '0.00',
    expense: '150.00',
    history: [
      { id: 'w1', name: 'Lunch', amount: '-12.00', type: 'expense', category: 'Food & Drink', date: 'May 6, 2026' },
      { id: 'w2', name: 'Grab', amount: '-24.50', type: 'expense', category: 'Transport', date: 'May 5, 2026' },
    ],
  },
};

export default function WalletDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [balanceVisible, setBalanceVisible] = useState(true);

  const walletId = typeof id === 'string' ? id : '4';
  const wallet = MOCK_WALLETS[walletId] ?? MOCK_WALLETS['4'];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-border">
        <Pressable onPress={() => router.back()} className="mr-3">
          <ChevronLeft size={24} color="#fff" />
        </Pressable>
        <Text className="flex-1 text-lg font-semibold text-foreground">{wallet.name}</Text>
        <Pressable>
          <Pencil size={22} color="#fff" />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Balance Card */}
        <View className="mx-4 mt-4 bg-card rounded-2xl overflow-hidden border border-border">
          <View style={{ backgroundColor: wallet.color }} className="h-1" />
          <View className="p-5">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-sm text-muted-foreground">Balance</Text>
              <Pressable onPress={() => setBalanceVisible(!balanceVisible)}>
                {balanceVisible ? (
                  <Eye size={20} color="#fff" />
                ) : (
                  <EyeOff size={20} color="#fff" />
                )}
              </Pressable>
            </View>
            <Text className="text-3xl font-bold text-foreground">
              {balanceVisible ? `RM ${wallet.balance}` : 'RM ••••••'}
            </Text>
          </View>
        </View>

        {/* Monthly Summary */}
        <View className="flex-row mx-4 mt-3">
          <View className="flex-1 bg-card rounded-2xl p-4 mr-1.5 items-center border border-border">
            <Text className="text-xs text-muted-foreground mb-1">Income</Text>
            <Text className="text-lg font-semibold text-income">+RM {wallet.income}</Text>
          </View>
          <View className="flex-1 bg-card rounded-2xl p-4 ml-1.5 items-center border border-border">
            <Text className="text-xs text-muted-foreground mb-1">Expenses</Text>
            <Text className="text-lg font-semibold text-expense">-RM {wallet.expense}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="flex-row mx-4 mt-3">
          <Pressable
            onPress={() => router.push('/add-transaction')}
            className="flex-1 bg-primary rounded-2xl py-3 mr-1.5 items-center"
          >
            <Text className="text-sm font-semibold text-primary-foreground">Add Transaction</Text>
          </Pressable>
          <Pressable className="flex-1 bg-card rounded-2xl py-3 ml-1.5 items-center border border-border">
            <Text className="text-sm font-semibold text-foreground">Transfer</Text>
          </Pressable>
        </View>

        {/* Transaction History */}
        <View className="mt-5 mb-4">
          <Text className="text-sm font-semibold text-foreground px-4 mb-3">Transaction History</Text>
          {wallet.history.map((tx) => (
            <View
              key={tx.id}
              className="flex-row items-center px-4 py-3 border-b border-border"
            >
              <View className="flex-1">
                <Text className="text-sm font-medium text-foreground">{tx.name}</Text>
                <Text className="text-xs text-muted-foreground mt-0.5">{tx.category} • {tx.date}</Text>
              </View>
              <Text
                className={`text-sm font-semibold ${
                  tx.type === 'income' ? 'text-income' : 'text-expense'
                }`}
              >
                {tx.amount}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}