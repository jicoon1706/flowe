import { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Card } from '../../components/ui/Card';
import { TransactionDetail, TransactionData } from '../../components/home/TransactionDetail';


const currentMonth = 'May 2025';
const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const calendarDays = [
  { day: 1, hasTransaction: true, types: ['expense', 'income'] },
  { day: 2, hasTransaction: false },
  { day: 3, hasTransaction: true, types: ['expense'] },
  { day: 4, hasTransaction: false },
  { day: 5, hasTransaction: true, types: ['income'] },
  { day: 6, hasTransaction: false },
  { day: 7, hasTransaction: false },
  { day: 8, hasTransaction: true, types: ['expense', 'transfer'] },
  { day: 9, hasTransaction: false },
  { day: 10, hasTransaction: true, types: ['income'] },
  { day: 11, hasTransaction: false },
  { day: 12, hasTransaction: true, types: ['expense'] },
  { day: 13, hasTransaction: false },
  { day: 14, hasTransaction: true, types: ['income'] },
  { day: 15, hasTransaction: false },
  { day: 16, hasTransaction: true, types: ['expense'] },
  { day: 17, hasTransaction: false },
  { day: 18, hasTransaction: true, types: ['income'] },
  { day: 19, hasTransaction: false },
  { day: 20, hasTransaction: true, types: ['expense', 'income'] },
  { day: 21, hasTransaction: false },
  { day: 22, hasTransaction: true, types: ['transfer'] },
  { day: 23, hasTransaction: false },
  { day: 24, hasTransaction: true, types: ['expense'] },
  { day: 25, hasTransaction: false },
  { day: 26, hasTransaction: true, types: ['income'] },
  { day: 27, hasTransaction: false },
  { day: 28, hasTransaction: true, types: ['expense'] },
  { day: 29, hasTransaction: false },
  { day: 30, hasTransaction: true, types: ['income'] },
  { day: 31, hasTransaction: false },
];

const dayTransactions: TransactionData[] = [
  { id: '1', name: 'Makan Siang', category: 'Food', categoryIcon: '🍔', amount: '-RM 12.50', type: 'expense', date: '20 May 2025', recurring: true, recurringFreq: 'monthly', account: 'Maybank', note: 'Lunch with colleagues' },
  { id: '2', name: 'Salary', category: 'Income', categoryIcon: '💼', amount: '+RM 3,500.00', type: 'income', date: '20 May 2025', recurring: true, recurringFreq: 'monthly', account: 'Maybank', startDate: '1 May 2025', reminder: 'Same day' },
];

const summary = {
  income: '4,230.00',
  expense: '1,245.00',
  net: '2,985.00',
};

export default function CalendarScreen() {
  const [selectedDay, setSelectedDay] = useState(20);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScreenHeader title="Calendar" />
      <ScrollView className="pb-36" showsVerticalScrollIndicator={false}>
        {/* Month Navigator */}
        <View className="flex-row items-center justify-between px-4 py-3">
          <Pressable
            className="p-2"
            accessible
            accessibilityLabel="Previous month"
          >
            <ChevronLeft size={24} color="#ffffff" />
          </Pressable>
          <Text className="text-lg font-semibold text-foreground">{currentMonth}</Text>
          <Pressable
            className="p-2"
            accessible
            accessibilityLabel="Next month"
          >
            <ChevronRight size={24} color="#ffffff" />
          </Pressable>
        </View>

        {/* Summary Cards */}
        <View className="flex-row gap-2 px-4 mb-4">
          <Card className="flex-1">
            <Text className="text-xs text-muted-foreground mb-1">Income</Text>
            <Text className="text-base font-bold text-income">+RM {summary.income}</Text>
          </Card>
          <Card className="flex-1">
            <Text className="text-xs text-muted-foreground mb-1">Expense</Text>
            <Text className="text-base font-bold text-expense">-RM {summary.expense}</Text>
          </Card>
          <Card className="flex-1">
            <Text className="text-xs text-muted-foreground mb-1">Net</Text>
            <Text className="text-base font-bold text-[#e0ff66]">+RM {summary.net}</Text>
          </Card>
        </View>

        {/* Calendar Grid */}
        <View className="px-4 mb-4">
          <View className="bg-card border border-border rounded-2xl p-6">
            {/* Day Headers */}
            <View className="flex-row mb-4">
              {days.map((day) => (
                <View key={day} className="flex-1 items-center">
                  <Text className="text-xs text-muted-foreground font-medium">{day}</Text>
                </View>
              ))}
            </View>
            {/* Calendar Days */}
            <View className="flex-row flex-wrap">
              {/* Empty cells for first week alignment (May 2025 starts on Thursday = index 4) */}
              {[...Array(4)].map((_, i) => (
                <View key={`empty-${i}`} className="w-[14.28%] h-12" />
              ))}
              {calendarDays.map((item) => {
                const isToday = item.day === 20;
                const isSelected = item.day === selectedDay;
                return (
                  <Pressable
                    key={item.day}
                    onPress={() => setSelectedDay(item.day)}
                    className="w-[14.28%] h-12 items-center justify-center"
                    accessible
                    accessibilityLabel={`${item.day} May${item.hasTransaction ? ', has transactions' : ''}`}
                  >
                    <View
                      className={`
                        w-10 h-10 rounded-full items-center justify-center
                        ${isSelected ? 'bg-[#e0ff66]' : isToday ? 'border-2 border-[#e0ff66]' : ''}
                      `}
                    >
                      <Text
                        className={`
                          text-base font-medium
                          ${isSelected ? 'text-[#000000]' : isToday ? 'text-[#e0ff66]' : 'text-foreground'}
                        `}
                      >
                        {item.day}
                      </Text>
                    </View>
                    {/* Transaction dots */}
                    {item.hasTransaction && (
                      <View className="absolute bottom-1 flex-row gap-0.5">
                        {item.types?.slice(0, 3).map((type, i) => (
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
            <View className="w-2 h-2 rounded-full bg-[#e0ff66]" />
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
          <Text className="text-sm font-semibold text-foreground mb-3">
            {selectedDay === 20 ? 'Today' : `${selectedDay} May`}
          </Text>
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
                    tx.type === 'income' ? 'text-income' : tx.type === 'expense' ? 'text-expense' : 'text-[#00d4ff]'
                  }`}
                >
                  {tx.amount}
                </Text>
              </Pressable>
            ))}
          </View>
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