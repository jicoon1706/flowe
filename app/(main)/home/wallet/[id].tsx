import { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, ChevronRight, Eye, EyeOff, Pencil, RefreshCw, Receipt } from '../../../../components/ui/icons';

const MOCK_WALLETS: Record<string, {
  name: string;
  balance: string;
  color: string;
  income: string;
  expense: string;
  history: { id: string; name: string; amount: string; type: 'income' | 'expense'; category: string; date: string; recurring: boolean; emoji: string }[];
}> = {
  '4': {
    name: 'Cash',
    balance: '200.00',
    color: '#00d4ff',
    income: '0.00',
    expense: '150.00',
    history: [
      { id: 'w1', name: 'Lunch', amount: '-12.00', type: 'expense', category: 'Food & Drink', date: 'Today', recurring: false, emoji: '🍔' },
      { id: 'w2', name: 'Grab', amount: '-24.50', type: 'expense', category: 'Transport', date: 'Yesterday', recurring: false, emoji: '🚗' },
      { id: 'w3', name: 'Salary', amount: '+3,500.00', type: 'income', category: 'Income', date: '1 May', recurring: true, emoji: '💼' },
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
          <View className="flex-row items-center justify-between px-4 mb-3">
            <Text className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Transaction History</Text>
            <Pressable>
              <Text className="text-xs text-primary font-medium">See All</Text>
            </Pressable>
          </View>
          <View className="gap-2 px-4">
            {wallet.history.map((tx) => (
              <Pressable
                key={tx.id}
                className="flex-row items-center justify-between bg-card border border-border rounded-xl px-4 py-3 active:scale-[0.98] transition-transform"
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-9 h-9 rounded-xl bg-secondary items-center justify-center">
                    <Text className="text-base">{tx.emoji}</Text>
                  </View>
                  <View>
                    <View className="flex-row items-center gap-1.5">
                      <Text className="text-sm font-medium text-foreground">{tx.name}</Text>
                      {tx.recurring && <RefreshCw size={10} color="#a0a0a0" />}
                      {tx.type === 'expense' && <Receipt size={10} color="#a0a0a0" />}
                    </View>
                    <Text className="text-xs text-muted-foreground">{tx.date}</Text>
                  </View>
                </View>
                <View className="flex-row items-center gap-2">
                  <Text
                    className={`text-sm font-semibold ${
                      tx.type === 'income' ? 'text-income' : 'text-expense'
                    }`}
                  >
                    {tx.amount}
                  </Text>
                  <ChevronRight size={16} color="#a0a0a0" />
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}