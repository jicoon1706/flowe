import { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, ChevronRight, Eye, EyeOff, Copy, Pencil, RefreshCw, Receipt } from '../../../../components/ui/icons';

const MOCK_ACCOUNTS: Record<string, {
  name: string;
  balance: string;
  bankColor: string;
  last4: string;
  income: string;
  expense: string;
}> = {
  '1': { name: 'Maybank', balance: '3,200.00', bankColor: '#ffd93d', last4: '4521', income: '4,500.00', expense: '1,300.00' },
  '2': { name: 'CIMB', balance: '1,500.00', bankColor: '#ff6b6b', last4: '8899', income: '0.00', expense: '800.00' },
  '3': { name: 'Cash', balance: '200.00', bankColor: '#00d4ff', last4: '0000', income: '0.00', expense: '150.00' },
};

const MOCK_TRANSACTIONS = [
  { id: 't1', name: 'Salary', amount: '+4,500.00', type: 'income' as const, category: 'Income', date: 'Today', recurring: true, emoji: '💼' },
  { id: 't2', name: 'Grab', amount: '-24.50', type: 'expense' as const, category: 'Transport', date: 'Yesterday', recurring: false, emoji: '🚗' },
  { id: 't3', name: 'Lunch', amount: '-12.00', type: 'expense' as const, category: 'Food & Drink', date: 'Yesterday', recurring: false, emoji: '🍔' },
  { id: 't4', name: 'Unifi', amount: '-89.00', type: 'expense' as const, category: 'Bills', date: '19 May', recurring: true, emoji: '🧾' },
  { id: 't5', name: 'Transfer to Tabung', amount: '-200.00', type: 'transfer' as const, category: 'Transfer', date: '18 May', recurring: false, emoji: '🔄' },
];

export default function AccountDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [copied, setCopied] = useState(false);

  const accountId = typeof id === 'string' ? id : '1';
  const account = MOCK_ACCOUNTS[accountId] ?? MOCK_ACCOUNTS['1'];

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-border">
        <Pressable onPress={() => router.back()} className="mr-3">
          <ChevronLeft size={24} color="#fff" />
        </Pressable>
        <Text className="flex-1 text-lg font-semibold text-foreground">{account.name}</Text>
        <Pressable>
          <Pencil size={22} color="#fff" />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Balance Card */}
        <View className="mx-4 mt-4 bg-card rounded-2xl overflow-hidden border border-border">
          <View style={{ backgroundColor: account.bankColor }} className="h-1" />
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
            <Text className="text-3xl font-bold text-foreground mb-3">
              {balanceVisible ? `RM ${account.balance}` : 'RM ••••••'}
            </Text>
            <Pressable onPress={handleCopy} className="flex-row items-center">
              <Text className="text-sm text-muted-foreground mr-1">
                {account.last4 === '0000' ? 'Cash Account' : `Account ending ${account.last4}`}
              </Text>
              <Copy size={14} color="#888" />
            </Pressable>
            {copied && (
              <Text className="text-xs text-primary mt-1">Copied!</Text>
            )}
          </View>
        </View>

        {/* Monthly Summary */}
        <View className="flex-row mx-4 mt-3">
          <View className="flex-1 bg-card rounded-2xl p-4 mr-1.5 border border-border">
            <Text className="text-xs text-muted-foreground mb-1">Income</Text>
            <Text className="text-lg font-semibold text-income">+RM {account.income}</Text>
          </View>
          <View className="flex-1 bg-card rounded-2xl p-4 ml-1.5 border border-border">
            <Text className="text-xs text-muted-foreground mb-1">Expenses</Text>
            <Text className="text-lg font-semibold text-expense">-RM {account.expense}</Text>
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
            {MOCK_TRANSACTIONS.map((tx) => (
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
                      tx.type === 'income' ? 'text-income' : tx.type === 'transfer' ? 'text-muted-foreground' : 'text-expense'
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