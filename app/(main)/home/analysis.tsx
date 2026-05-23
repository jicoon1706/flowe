import { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Sparkle, TrendingUp, TrendingDown } from '../../../components/ui/icons';

const MONTHS = ['Jan 2026', 'Feb 2026', 'Mar 2026', 'Apr 2026', 'May 2026'];

const MONTHLY_DATA = [
  { income: 4200, expenses: 3100, net: 1100 },
  { income: 4200, expenses: 3400, net: 800 },
  { income: 4500, expenses: 3200, net: 1300 },
  { income: 4500, expenses: 3700, net: 800 },
  { income: 4800, expenses: 2800, net: 2000 },
];

const CATEGORIES = [
  { name: 'Food & Drink', amount: 700, color: '#C5FF00' },
  { name: 'Transport', amount: 350, color: '#00d4ff' },
  { name: 'Bills', amount: 900, color: '#ff6b6b' },
  { name: 'Shopping', amount: 500, color: '#ffd93d' },
  { name: 'Entertainment', amount: 200, color: '#a78bfa' },
  { name: 'Health', amount: 80, color: '#6bcf7f' },
  { name: 'Others', amount: 70, color: '#94a3b8' },
];

export default function AnalysisScreen() {
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState(4);
  const [toggleMode, setToggleMode] = useState<'expense' | 'income'>('expense');

  const data = MONTHLY_DATA[selectedMonth];
  const savingsRate = data.income > 0 ? Math.round((data.net / data.income) * 100) : 0;

  const prevData = selectedMonth > 0 ? MONTHLY_DATA[selectedMonth - 1] : null;
  const isPositiveTrend = prevData ? data.net >= prevData.net : true;

  const insightText =
    savingsRate < 10
      ? 'Challenge: Your expenses are eating into your income. The rich focus on buying assets.'
      : savingsRate < 30
      ? "Good progress! You're building healthy financial habits."
      : 'Excellent! Your savings rate is impressive. Keep reinvesting in assets.';

  const maxCategoryAmount = Math.max(...CATEGORIES.map((c) => c.amount));
  const maxChartValue = 6000;
  const chartBarMaxHeight = 96;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-border">
        <Pressable onPress={() => router.back()} className="mr-3">
          <ChevronLeft size={24} color="#fff" />
        </Pressable>
        <Text className="flex-1 text-lg font-semibold text-foreground">Analysis</Text>
        <Sparkle size={20} color="#C5FF00" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Month Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-4 px-4"
          contentContainerClassName="flex-row gap-2"
        >
          {MONTHS.map((month, index) => (
            <Pressable
              key={month}
              onPress={() => setSelectedMonth(index)}
              className={`px-4 py-2 rounded-full ${
                selectedMonth === index
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground'
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  selectedMonth === index ? 'text-primary-foreground' : 'text-muted-foreground'
                }`}
              >
                {month}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Net Savings Hero */}
        <View className="mx-4 mt-4 bg-card rounded-2xl p-5 border border-border">
          <View className="flex-row items-center">
            {/* Decorative Donut */}
            <View className="w-20 h-20 relative items-center justify-center">
              <View className="absolute w-16 h-16 rounded-full border-4 border-income/20" />
              <View
                className="absolute w-16 h-16 rounded-full border-4 border-transparent"
                style={{
                  borderTopColor: '#22C55E',
                  borderRightColor: savingsRate > 25 ? '#22C55E' : 'transparent',
                  borderBottomColor: savingsRate > 50 ? '#22C55E' : 'transparent',
                  borderLeftColor: savingsRate > 75 ? '#22C55E' : 'transparent',
                  transform: [{ rotate: '-45deg' }],
                }}
              />
              <Text className="text-lg font-bold text-foreground">{savingsRate}%</Text>
            </View>
            {/* Right side */}
            <View className="flex-1 ml-4">
              <Text className="text-sm text-muted-foreground">Net Savings</Text>
              <Text className="text-2xl font-bold text-foreground">
                RM {data.net.toLocaleString('en-US')}
              </Text>
              <View className="flex-row items-center mt-1">
                {isPositiveTrend ? (
                  <TrendingUp size={16} color="#22C55E" />
                ) : (
                  <TrendingDown size={16} color="#EF4444" />
                )}
                <Text
                  className={`text-xs ml-1 ${
                    isPositiveTrend ? 'text-income' : 'text-expense'
                  }`}
                >
                  {isPositiveTrend ? 'Up' : 'Down'} vs previous month
                </Text>
              </View>
            </View>
          </View>
          <Text className="text-sm text-muted-foreground italic mt-3">
            {insightText}
          </Text>
        </View>

        {/* Income/Expenses Summary */}
        <View className="flex-row mx-4 mt-4 gap-3">
          <View className="flex-1 bg-card rounded-2xl p-4 border border-border">
            <Text className="text-sm text-muted-foreground">Income</Text>
            <Text className="text-lg font-bold text-income">
              RM {data.income.toLocaleString('en-US')}
            </Text>
          </View>
          <View className="flex-1 bg-card rounded-2xl p-4 border border-border">
            <Text className="text-sm text-muted-foreground">Expenses</Text>
            <Text className="text-lg font-bold text-expense">
              RM {data.expenses.toLocaleString('en-US')}
            </Text>
          </View>
        </View>

        {/* 5-Month Bar Chart */}
        <View className="mx-4 mt-4 bg-card rounded-2xl p-4 border border-border">
          <Text className="text-sm font-semibold text-foreground mb-3">5-Month Overview</Text>
          <View className="flex-row items-end justify-between h-28 px-2">
            {MONTHLY_DATA.map((monthData, index) => {
              const incomeHeight = (monthData.income / maxChartValue) * chartBarMaxHeight;
              const expenseHeight = (monthData.expenses / maxChartValue) * chartBarMaxHeight;
              const isSelected = index === selectedMonth;

              return (
                <Pressable
                  key={MONTHS[index]}
                  onPress={() => setSelectedMonth(index)}
                  className="flex-1 items-center"
                >
                  <View className="flex-row items-end gap-0.5">
                    <View
                      className="w-3 rounded-t"
                      style={{
                        height: incomeHeight,
                        backgroundColor: '#22C55E',
                      }}
                    />
                    <View
                      className="w-3 rounded-t"
                      style={{
                        height: expenseHeight,
                        backgroundColor: '#EF4444',
                      }}
                    />
                  </View>
                  <Text className="text-xs text-muted-foreground mt-1">
                    {MONTHS[index].split(' ')[0].substring(0, 3)}
                  </Text>
                  {isSelected && (
                    <View className="w-1.5 h-1.5 rounded-full bg-primary mt-1" />
                  )}
                </Pressable>
              );
            })}
          </View>
          {/* Legend */}
          <View className="flex-row justify-center gap-6 mt-3 pt-3 border-t border-border">
            <View className="flex-row items-center">
              <View className="w-3 h-3 rounded bg-income mr-2" />
              <Text className="text-xs text-muted-foreground">Income</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-3 h-3 rounded bg-expense mr-2" />
              <Text className="text-xs text-muted-foreground">Expense</Text>
            </View>
          </View>
        </View>

        {/* Category Breakdown */}
        <View className="mx-4 mt-4 bg-card rounded-2xl p-4 border border-border">
          {/* Toggle Pill */}
          <View className="flex-row bg-background rounded-full p-1 mb-4">
            <Pressable
              onPress={() => setToggleMode('expense')}
              className={`flex-1 py-2 rounded-full ${
                toggleMode === 'expense' ? 'bg-primary' : 'bg-transparent'
              }`}
            >
              <Text
                className={`text-sm font-medium text-center ${
                  toggleMode === 'expense' ? 'text-primary-foreground' : 'text-muted-foreground'
                }`}
              >
                Expense
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setToggleMode('income')}
              className={`flex-1 py-2 rounded-full ${
                toggleMode === 'income' ? 'bg-primary' : 'bg-transparent'
              }`}
            >
              <Text
                className={`text-sm font-medium text-center ${
                  toggleMode === 'income' ? 'text-primary-foreground' : 'text-muted-foreground'
                }`}
              >
                Income
              </Text>
            </Pressable>
          </View>

          <Text className="text-sm font-semibold text-foreground mb-3">
            {toggleMode === 'expense' ? 'Expense Breakdown' : 'Income Breakdown'}
          </Text>

          {toggleMode === 'expense' ? (
            <View className="gap-3">
              {CATEGORIES.map((category) => {
                const progressWidth = (category.amount / maxCategoryAmount) * 100;
                return (
                  <View key={category.name}>
                    <View className="flex-row justify-between mb-1">
                      <Text className="text-sm text-foreground">{category.name}</Text>
                      <Text className="text-sm font-medium text-foreground">
                        RM {category.amount.toLocaleString('en-US')}
                      </Text>
                    </View>
                    <View className="h-2 bg-background rounded-full overflow-hidden">
                      <View
                        className="h-full rounded-full"
                        style={{
                          width: `${progressWidth}%`,
                          backgroundColor: category.color,
                        }}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View className="py-6 items-center">
              <Text className="text-sm text-muted-foreground">
                No income categories tracked
              </Text>
            </View>
          )}
        </View>

        {/* Rich Dad Insight Card */}
        <View className="mx-4 mt-4 mb-6 bg-primary/10 rounded-2xl p-4 border border-primary/20">
          <View className="flex-row items-center mb-2">
            <Sparkle size={16} color="#C5FF00" />
            <Text className="text-sm font-semibold text-primary ml-2">Rich Dad Insight</Text>
          </View>
          <Text className="text-sm text-foreground leading-relaxed">{insightText}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}