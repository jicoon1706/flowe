import { useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useFocusEffect } from 'expo-router';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Card } from '../../components/ui/Card';
import { TransactionDetail } from '../../components/home/TransactionDetail';
import { useTransactions } from '../../src/hooks/useTransactions';
import { LoadingView } from '../../components/ui/LoadingView';
import { ErrorView } from '../../components/ui/ErrorView';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface DayTransaction {
  id: string;
  name: string;
  category: string;
  categoryIcon: string;
  amount: string;
  type: 'income' | 'expense' | 'transfer';
  date: string;
  recurring: boolean;
  recurringFreq?: 'weekly' | 'monthly' | 'yearly';
  account: string;
  note?: string;
}

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTransaction, setSelectedTransaction] = useState<DayTransaction | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth() + 1;

  const { transactions, loading, error, refetch } = useTransactions(year, month);

  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

  if (loading) return <LoadingView />;
  if (error) return <ErrorView error={error} onRetry={refetch} />;

  const monthName = selectedDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  // Build calendar days
  const firstDayOfMonth = new Date(year, month - 1, 1);
  const lastDayOfMonth = new Date(year, month, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startDayOfWeek = firstDayOfMonth.getDay();

  // Group transactions by day
  const transactionsByDay: Record<number, typeof transactions> = {};
  transactions.forEach(tx => {
    const txDate = new Date(tx.date);
    if (txDate.getFullYear() === year && txDate.getMonth() === month - 1) {
      const day = txDate.getDate();
      if (!transactionsByDay[day]) transactionsByDay[day] = [];
      transactionsByDay[day].push(tx);
    }
  });

  // Calculate monthly totals
  const monthlyIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const monthlyExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const monthlyNet = monthlyIncome - monthlyExpenses;

  const calendarDays: {
    day: number;
    hasTransaction: boolean;
    types: string[];
  }[] = [];

  // Empty cells before first day
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarDays.push({ day: 0, hasTransaction: false, types: [] });
  }

  // Days of month
  for (let d = 1; d <= daysInMonth; d++) {
    const dayTxs = transactionsByDay[d] ?? [];
    const types = [...new Set(dayTxs.map(t => t.type))];
    calendarDays.push({
      day: d,
      hasTransaction: dayTxs.length > 0,
      types,
    });
  }

  // Selected day transactions
  const today = new Date();
  const selectedDay = selectedDate.getDate();
  const selectedDayTxs = transactionsByDay[selectedDay] ?? [];

  const selectedDayLabel = selectedDay === today.getDate() &&
    selectedDate.getMonth() === today.getMonth() &&
    selectedDate.getFullYear() === today.getFullYear()
    ? 'Today'
    : `${selectedDay} ${selectedDate.toLocaleString('en-US', { month: 'short' })}`;

  const dayTransactions: DayTransaction[] = selectedDayTxs.map(tx => ({
    id: tx.id,
    name: tx.name,
    category: tx.category ?? 'Others',
    categoryIcon: '📦',
    amount: `${tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}RM ${Number(tx.amount).toLocaleString('en-US')}`,
    type: tx.type as 'income' | 'expense' | 'transfer',
    date: new Date(tx.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
    recurring: false,
    recurringFreq: undefined,
    account: (tx.type === 'income'
      ? (tx as any).to_account?.name
      : (tx as any).from_account?.name) ?? '',
    toAccount: (tx as any).to_account?.name ?? undefined,
    note: tx.note ?? undefined,
  }));

  const navigateMonth = (delta: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setSelectedDate(newDate);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScreenHeader title="Calendar" />
      <ScrollView className="pb-36" showsVerticalScrollIndicator={false}>
        {/* Month Navigator */}
        <View className="flex-row items-center justify-between px-4 py-3">
          <Pressable onPress={() => navigateMonth(-1)} className="p-2">
            <ChevronLeft size={24} color="#ffffff" />
          </Pressable>
          <Text className="text-lg font-semibold text-foreground">{monthName}</Text>
          <Pressable onPress={() => navigateMonth(1)} className="p-2">
            <ChevronRight size={24} color="#ffffff" />
          </Pressable>
        </View>

        {/* Summary Cards */}
        <View className="flex-row gap-2 px-4 mb-4">
          <Card className="flex-1">
            <Text className="text-xs text-muted-foreground mb-1">Income</Text>
            <Text className="text-base font-bold text-income">
              +RM {monthlyIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </Text>
          </Card>
          <Card className="flex-1">
            <Text className="text-xs text-muted-foreground mb-1">Expense</Text>
            <Text className="text-base font-bold text-expense">
              -RM {monthlyExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </Text>
          </Card>
          <Card className="flex-1">
            <Text className="text-xs text-muted-foreground mb-1">Net</Text>
            <Text className={`text-base font-bold ${monthlyNet >= 0 ? 'text-income' : 'text-expense'}`}>
              {monthlyNet >= 0 ? '+' : '-'}RM {Math.abs(monthlyNet).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </Text>
          </Card>
        </View>

        {/* Calendar Grid */}
        <View className="px-4 mb-4">
          <View className="bg-card border border-border rounded-2xl p-6">
            {/* Day Headers */}
            <View className="flex-row mb-4">
              {DAYS.map((day) => (
                <View key={day} className="flex-1 items-center">
                  <Text className="text-xs text-muted-foreground font-medium">{day}</Text>
                </View>
              ))}
            </View>
            {/* Calendar Days */}
            <View className="flex-row flex-wrap">
              {calendarDays.map((item, index) => {
                const isToday =
                  item.day === today.getDate() &&
                  selectedDate.getMonth() === today.getMonth() &&
                  selectedDate.getFullYear() === today.getFullYear();
                const isSelected = item.day === selectedDay && item.day > 0;

                if (item.day === 0) {
                  return <View key={`empty-${index}`} className="w-[14.28%] h-12" />;
                }

                return (
                  <Pressable
                    key={item.day}
                    onPress={() => setSelectedDate(new Date(year, month - 1, item.day))}
                    className="w-[14.28%] h-12 items-center justify-center"
                  >
                    <View
                      className={`w-10 h-10 rounded-full items-center justify-center ${
                        isSelected ? 'bg-primary' : isToday ? 'border-2 border-primary' : ''
                      }`}
                    >
                      <Text
                        className={`text-base font-medium ${
                          isSelected ? 'text-primary-foreground' : isToday ? 'text-primary' : 'text-foreground'
                        }`}
                      >
                        {item.day}
                      </Text>
                    </View>
                    {/* Transaction dots */}
                    {item.hasTransaction && (
                      <View className="absolute bottom-1 flex-row gap-0.5">
                        {item.types.slice(0, 3).map((type, i) => (
                          <View
                            key={i}
                            className={`w-1 h-1 rounded-full ${
                              type === 'income' ? 'bg-income' : type === 'expense' ? 'bg-expense' : 'bg-transfer'
                            }`}
                          />
                        ))}
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        {/* Legend */}
        <View className="flex-row items-center justify-center gap-4 px-4 mb-4">
          <View className="flex-row items-center gap-1.5">
            <View className="w-2 h-2 rounded-full bg-income" />
            <Text className="text-xs text-muted-foreground">Income</Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <View className="w-2 h-2 rounded-full bg-expense" />
            <Text className="text-xs text-muted-foreground">Expense</Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <View className="w-2 h-2 rounded-full bg-transfer" />
            <Text className="text-xs text-muted-foreground">Transfer</Text>
          </View>
        </View>

        {/* Day Transactions */}
        <View className="px-4 mb-6">
          <Text className="text-sm font-semibold text-foreground mb-3">{selectedDayLabel}</Text>
          {dayTransactions.length === 0 ? (
            <Text className="text-sm text-muted-foreground text-center py-4">
              No transactions on this day
            </Text>
          ) : (
            <View className="gap-2">
              {dayTransactions.map((tx) => (
                <Pressable
                  key={tx.id}
                  onPress={() => {
                    setSelectedTransaction(tx);
                    setModalVisible(true);
                  }}
                  className="flex-row items-center justify-between bg-card border border-border rounded-xl px-4 py-3 active:scale-[0.98] transition-transform"
                >
                  <View className="flex-row items-center gap-3">
                    <View className="w-9 h-9 rounded-xl bg-secondary items-center justify-center">
                      <Text className="text-base">{tx.categoryIcon}</Text>
                    </View>
                    <View>
                      <Text className="text-sm font-medium text-foreground">{tx.name}</Text>
                      <Text className="text-xs text-muted-foreground">{tx.date}</Text>
                    </View>
                  </View>
                  <Text
                    className={`text-sm font-semibold ${
                      tx.type === 'income' ? 'text-income' : tx.type === 'expense' ? 'text-expense' : 'text-transfer'
                    }`}
                  >
                    {tx.amount}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <TransactionDetail
        transaction={selectedTransaction}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}