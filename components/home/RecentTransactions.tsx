import { View, Text, Pressable } from 'react-native';
import { RefreshCw, Image, ChevronRight } from 'lucide-react-native';

const transactions = [
  { id: '1', name: 'Makan Siang', category: 'Food', emoji: '🍔', amount: '-12.50', type: 'expense', date: 'Today', recurring: true },
  { id: '2', name: 'Salary', category: 'Income', emoji: '💼', amount: '+3,500.00', type: 'income', date: 'Yesterday', recurring: true },
  { id: '3', name: 'Grab', category: 'Transport', emoji: '🚗', amount: '-8.00', type: 'expense', date: 'Yesterday', recurring: false },
  { id: '4', name: 'Unifi', category: 'Bills', emoji: '🧾', amount: '-89.00', type: 'expense', date: '19 May', recurring: true },
  { id: '5', name: 'Transfer to Tabung', category: 'Transfer', emoji: '🔄', amount: '-100.00', type: 'transfer', date: '18 May', recurring: false },
];

interface RecentTransactionsProps {
  onSeeAll: () => void;
  onTransactionPress: (id: string) => void;
}

export function RecentTransactions({ onSeeAll, onTransactionPress }: RecentTransactionsProps) {
  return (
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
            onPress={() => onTransactionPress(tx.id)}
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
                  {tx.type === 'expense' && <Image size={10} color="#a0a0a0" />}
                </View>
                <Text className="text-xs text-muted-foreground">{tx.date}</Text>
              </View>
            </View>
            <View className="flex-row items-center gap-2">
              <Text
                className={`text-sm font-semibold ${
                  tx.type === 'income' ? 'text-income' : tx.type === 'expense' ? 'text-expense' : 'text-transfer'
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
  );
}