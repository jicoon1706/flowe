import { View, Text, Pressable } from 'react-native';
import { useState } from 'react';
import { RefreshCw, Image, ChevronRight } from 'lucide-react-native';
import { TransactionDetail, TransactionData } from './TransactionDetail';

const transactions: TransactionData[] = [
  { id: '1', name: 'Makan Siang', category: 'Food', categoryIcon: '🍔', amount: '-12.50', type: 'expense', date: 'Today', recurring: true, recurringFreq: 'monthly', account: 'Maybank', note: 'Lunch with colleagues' },
  { id: '2', name: 'Salary', category: 'Income', categoryIcon: '💼', amount: '+3,500.00', type: 'income', date: 'Yesterday', recurring: true, recurringFreq: 'monthly', account: 'Maybank', startDate: '1 May 2026', reminder: 'Same day' },
  { id: '3', name: 'Grab', category: 'Transport', categoryIcon: '🚗', amount: '-8.00', type: 'expense', date: 'Yesterday', recurring: false, account: 'Maybank' },
  { id: '4', name: 'Unifi', category: 'Bills', categoryIcon: '🧾', amount: '-89.00', type: 'expense', date: '19 May', recurring: true, recurringFreq: 'monthly', account: 'CIMB', startDate: '1 Jun 2025', reminder: '1 day before' },
  { id: '5', name: 'Transfer to Tabung', category: 'Transfer', categoryIcon: '🔄', amount: '-100.00', type: 'transfer', date: '18 May', recurring: false, account: 'Maybank', toAccount: 'Tabung Raya' },
];

interface RecentTransactionsProps {
  onSeeAll: () => void;
  onTransactionPress?: (id: string) => void;
}

export function RecentTransactions({ onSeeAll, onTransactionPress }: RecentTransactionsProps) {
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleTransactionPress = (tx: TransactionData) => {
    setSelectedTransaction(tx);
    setModalVisible(true);
    onTransactionPress?.(tx.id);
  };

  return (
    <>
      <View className="px-4 mb-6 flex-1">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
            Recent Transactions
          </Text>
          <Pressable onPress={onSeeAll}>
            <Text className="text-xs text-primary font-medium">See All</Text>
          </Pressable>
        </View>
        <View className="gap-2">
          {transactions.map((tx) => (
            <Pressable
              key={tx.id}
              onPress={() => handleTransactionPress(tx)}
              className="flex-row items-center justify-between bg-card border border-border rounded-xl px-4 py-3 active:scale-[0.98] transition-transform"
            >
              <View className="flex-row items-center gap-3">
                <View className="w-9 h-9 rounded-xl bg-secondary items-center justify-center">
                  <Text className="text-base">{tx.categoryIcon}</Text>
                </View>
                <View>
                  <View className="flex-row items-center gap-1.5">
                    <Text className="text-sm font-medium text-foreground">{tx.name}</Text>
                    {tx.recurring && <RefreshCw size={10} color="#a0a0a0" />}
                    {tx.type === 'expense' && tx.hasReceipt && <Image size={10} color="#a0a0a0" />}
                  </View>
                  <Text className="text-xs text-muted-foreground">{tx.date}</Text>
                </View>
              </View>
              <View className="flex-row items-center gap-2">
                <Text
                  className={`text-sm font-semibold ${
                    tx.type === 'income' ? 'text-income' : tx.type === 'expense' ? 'text-expense' : 'text-primary'
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

      <TransactionDetail
        transaction={selectedTransaction}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
}