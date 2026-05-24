import { View, Text, Pressable, Modal, ScrollView, Image } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const X = (props: { size: number; color: string }) => <MaterialIcons name="close" size={props.size} color={props.color} />;
const RefreshCw = (props: { size: number; color: string }) => <MaterialIcons name="refresh" size={props.size} color={props.color} />;
const Calendar = (props: { size: number; color: string }) => <MaterialIcons name="event" size={props.size} color={props.color} />;

export interface TransactionData {
  id: string;
  name: string;
  category: string;
  categoryIcon: string;
  amount: string;
  type: 'expense' | 'income' | 'transfer';
  date: string;
  recurring: boolean;
  recurringFreq?: 'weekly' | 'monthly' | 'yearly';
  startDate?: string;
  endDate?: string;
  reminder?: string;
  note?: string;
  hasReceipt?: boolean;
  account?: string;
  toAccount?: string;
}

interface TransactionDetailProps {
  transaction: TransactionData | null;
  visible: boolean;
  onClose: () => void;
}

const typeColors = {
  expense: { bg: 'bg-expense/10', text: 'text-expense', label: 'Expense' },
  income: { bg: 'bg-income/10', text: 'text-income', label: 'Income' },
  transfer: { bg: 'bg-[#00d4ff]/10', text: 'text-[#00d4ff]', label: 'Transfer' },
};

export function TransactionDetail({ transaction, visible, onClose }: TransactionDetailProps) {
  if (!transaction) return null;

  const typeStyle = typeColors[transaction.type];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 justify-end">
        <Pressable className="flex-1" onPress={onClose} />
        <Pressable className="bg-card rounded-t-3xl max-h-[85%]">
          <View className="w-12 h-1 bg-border rounded-full mx-auto mt-3 mb-2" />
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-border">
            <Text className="text-lg font-semibold text-foreground">Transaction Details</Text>
            <Pressable onPress={onClose} className="p-2 -mr-2">
              <X size={20} color="#a0a0a0" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="px-5 py-4">
            {/* Type Badge + Category + Account */}
            <View className="flex-row items-center gap-2 mb-4 flex-wrap">
              <View className={`px-3 py-1 rounded-full ${typeStyle.bg}`}>
                <Text className={`text-xs font-semibold ${typeStyle.text}`}>{typeStyle.label}</Text>
              </View>
              <View className="flex-row items-center gap-1.5 bg-secondary px-3 py-1 rounded-full">
                <Text className="text-base">{transaction.categoryIcon}</Text>
                <Text className="text-xs text-foreground">{transaction.category}</Text>
              </View>
            </View>

            {/* Amount */}
            <Text
              className={`text-3xl font-bold mb-4 ${
                transaction.type === 'income' ? 'text-income' : transaction.type === 'expense' ? 'text-expense' : transaction.type === 'transfer' ? 'text-[#00d4ff]' : 'text-primary'
              }`}
            >
              {transaction.amount}
            </Text>

            {/* Name */}
            <View className="mb-4">
              <Text className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Description</Text>
              <Text className="text-base text-foreground font-medium">{transaction.name}</Text>
            </View>

            {/* Account Info */}
            <View className="mb-4">
              <Text className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                {transaction.type === 'transfer' ? 'From → To' : 'Account'}
              </Text>
              <View className="bg-secondary rounded-xl px-4 py-3">
                {transaction.type === 'transfer' && transaction.toAccount ? (
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm text-foreground">{transaction.account || 'Account'}</Text>
                    <Text className="text-muted-foreground">→</Text>
                    <Text className="text-sm text-foreground">{transaction.toAccount}</Text>
                  </View>
                ) : (
                  <Text className="text-sm text-foreground">{transaction.account || 'Account'}</Text>
                )}
              </View>
            </View>

            {/* Date */}
            <View className="mb-4">
              <Text className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Date</Text>
              <View className="flex-row items-center gap-2 bg-secondary rounded-xl px-4 py-3">
                <Calendar size={16} color="#a0a0a0" />
                <Text className="text-sm text-foreground">{transaction.date}</Text>
              </View>
            </View>

            {/* Recurring Details */}
            {transaction.recurring && (
              <View className="mb-4">
                <Text className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Recurring</Text>
                <View className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-3">
                  <View className="flex-row items-center gap-2 mb-2">
                    <RefreshCw size={16} color="#C5FF00" />
                    <Text className="text-sm text-primary font-medium">
                      {transaction.recurringFreq ? transaction.recurringFreq.charAt(0).toUpperCase() + transaction.recurringFreq.slice(1) : 'Monthly'}
                    </Text>
                  </View>
                  {transaction.startDate && (
                    <View className="flex-row items-center gap-2 mb-1">
                      <Text className="text-xs text-muted-foreground">Start:</Text>
                      <Text className="text-xs text-foreground">{transaction.startDate}</Text>
                    </View>
                  )}
                  {transaction.endDate && (
                    <View className="flex-row items-center gap-2 mb-1">
                      <Text className="text-xs text-muted-foreground">End:</Text>
                      <Text className="text-xs text-foreground">{transaction.endDate}</Text>
                    </View>
                  )}
                  {transaction.reminder && (
                    <View className="flex-row items-center gap-2">
                      <Text className="text-xs text-muted-foreground">Reminder:</Text>
                      <Text className="text-xs text-foreground">{transaction.reminder}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Note */}
            {transaction.note && (
              <View className="mb-4">
                <Text className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Note</Text>
                <View className="bg-secondary rounded-xl px-4 py-3">
                  <Text className="text-sm text-foreground">{transaction.note}</Text>
                </View>
              </View>
            )}

            {/* Receipt Image */}
            {transaction.hasReceipt && (
              <View className="mb-4">
                <Text className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Receipt</Text>
                <View className="bg-secondary rounded-xl overflow-hidden">
                  <Image
                    source={{ uri: 'https://picsum.photos/300/200' }}
                    className="w-full h-40"
                    resizeMode="cover"
                  />
                </View>
              </View>
            )}
          </ScrollView>
        </Pressable>
      </View>
    </Modal>
  );
}