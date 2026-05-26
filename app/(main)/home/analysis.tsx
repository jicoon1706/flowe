import { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { ChevronLeft, ChevronRight, Sparkle, TrendingUp, TrendingDown } from '../../../components/ui/icons';
import { useAnalysis } from '../../../src/hooks/useAnalysis';
import { LoadingView } from '../../../components/ui/LoadingView';
import { ErrorView } from '../../../components/ui/ErrorView';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const CATEGORY_COLORS = ['#C5FF00', '#00d4ff', '#ff6b6b', '#ffd93d', '#a78bfa', '#6bcf7f', '#94a3b8'];
const CATEGORY_EMOJIS: Record<string, string> = {
  'Food & Drink': '🍔', Transport: '🚗', Bills: '🧾', Shopping: '🛍️',
  Entertainment: '🎬', Health: '💊', Others: '📦', Salary: '💼', Freelance: '💻',
  Gift: '🎁', Allowance: '💰', Investment: '📈', Rental: '🏠', Business: '🏪',
};

const INCOME_COLORS = ['#22C55E', '#3B82F6', '#EC4899', '#F59E0B', '#6366F1', '#14B8A6', '#6B7280'];

export default function AnalysisScreen() {
  const router = useRouter();
  const [toggleMode, setToggleMode] = useState<'expense' | 'income'>('expense');

  const now = new Date();
  const [selectedDate, setSelectedDate] = useState(
    () => new Date(now.getFullYear(), now.getMonth(), 1)
  );
  const currentYear = selectedDate.getFullYear();
  const currentMonth = selectedDate.getMonth() + 1;
  const monthParam = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

  const goPrevMonth = () =>
    setSelectedDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const goNextMonth = () =>
    setSelectedDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const { analysis, loading, error } = useAnalysis(monthParam);

  useFocusEffect(useCallback(() => {}, []));

  if (loading) return <LoadingView />;
  if (error) return <ErrorView error={error} onRetry={() => {}} />;

  const savingsRate = analysis?.savings_rate ?? 0;
  const netSavings = analysis?.net_savings ?? 0;
  const incomeTotal = analysis?.income ?? 0;
  const expensesTotal = analysis?.expenses ?? 0;

  const expenseCategories = (analysis?.expense_by_category ?? []).map((cat, i) => ({
    name: cat.category,
    amount: cat.amount,
    percentage: cat.percentage,
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
    emoji: CATEGORY_EMOJIS[cat.category] ?? '📦',
  }));

  const incomeCategories = (analysis?.income_by_category ?? []).map((cat, i) => ({
    name: cat.category,
    amount: cat.amount,
    percentage: cat.percentage,
    color: INCOME_COLORS[i % INCOME_COLORS.length],
    emoji: CATEGORY_EMOJIS[cat.category] ?? '💰',
  }));

  const monthlyTrend = analysis?.monthly_trend ?? [];
  const maxChartValue = Math.max(
    ...monthlyTrend.map(m => Math.max(m.income, m.expenses)),
    6000
  );
  const chartBarMaxHeight = 96;

  const insightText =
    savingsRate < 10
      ? 'Challenge: Your expenses are eating into your income. The rich focus on buying assets.'
      : savingsRate < 30
      ? "Good progress! You're building healthy financial habits."
      : 'Excellent! Your savings rate is impressive. Keep reinvesting in assets.';

  const selectedMonthTrend = monthlyTrend[currentMonth - 1] ?? monthlyTrend[monthlyTrend.length - 1];
  const prevMonthTrend = currentMonth > 1 ? monthlyTrend[currentMonth - 2] : null;
  const isPositiveTrend = prevMonthTrend
    ? selectedMonthTrend.net_savings >= prevMonthTrend.net_savings
    : true;

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
        {/* Month Display */}
        <View className="flex-row items-center justify-between mx-4 mt-4">
          <Pressable
            onPress={goPrevMonth}
            hitSlop={8}
            className="w-9 h-9 items-center justify-center rounded-full bg-card border border-border"
          >
            <ChevronLeft size={20} color="#fff" />
          </Pressable>
          <Text className="text-base font-semibold text-foreground">
            {MONTHS[currentMonth - 1]} {currentYear}
          </Text>
          <Pressable
            onPress={goNextMonth}
            hitSlop={8}
            className="w-9 h-9 items-center justify-center rounded-full bg-card border border-border"
          >
            <ChevronRight size={20} color="#fff" />
          </Pressable>
        </View>

        {/* Net Savings Hero */}
        <View className="mx-4 mt-2 bg-card rounded-2xl p-5 border border-border">
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
                RM {netSavings.toLocaleString('en-US')}
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
              RM {incomeTotal.toLocaleString('en-US')}
            </Text>
          </View>
          <View className="flex-1 bg-card rounded-2xl p-4 border border-border">
            <Text className="text-sm text-muted-foreground">Expenses</Text>
            <Text className="text-lg font-bold text-expense">
              RM {expensesTotal.toLocaleString('en-US')}
            </Text>
          </View>
        </View>

        {/* Monthly Bar Chart */}
        {monthlyTrend.length > 0 && (
          <View className="mx-4 mt-4 bg-card rounded-2xl p-4 border border-border">
            <Text className="text-sm font-semibold text-foreground mb-3">Monthly Overview</Text>
            <View className="flex-row items-end justify-between h-28 px-2">
              {monthlyTrend.map((monthData, index) => {
                const incomeHeight = maxChartValue > 0
                  ? (monthData.income / maxChartValue) * chartBarMaxHeight
                  : 0;
                const expenseHeight = maxChartValue > 0
                  ? (monthData.expenses / maxChartValue) * chartBarMaxHeight
                  : 0;
                const isSelected = index === currentMonth - 1;

                return (
                  <View key={monthData.month} className="flex-1 items-center">
                    <View className="flex-row items-end gap-0.5">
                      <View
                        className="w-3 rounded-t"
                        style={{ height: incomeHeight, backgroundColor: '#22C55E' }}
                      />
                      <View
                        className="w-3 rounded-t"
                        style={{ height: expenseHeight, backgroundColor: '#EF4444' }}
                      />
                    </View>
                    <Text className="text-xs text-muted-foreground mt-1">
                      {monthData.month.substring(5)}
                    </Text>
                    {isSelected && (
                      <View className="w-1.5 h-1.5 rounded-full bg-primary mt-1" />
                    )}
                  </View>
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
        )}

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

          {/* Category Donut Chart */}
          <View className="flex-row items-center mb-4">
            {/* Donut Chart */}
            <View className="w-36 h-36 relative items-center justify-center">
              {toggleMode === 'expense' ? (
                <>
                  <View className="absolute w-28 h-28 rounded-full border-8 border-background" />
                  {expenseCategories.filter(c => c.amount > 0).map((cat, idx) => {
                    const rotation = idx * 45 - 90;
                    return (
                      <View
                        key={cat.name}
                        className="absolute w-28 h-28 rounded-full border-8 border-transparent"
                        style={{
                          borderTopColor: cat.color,
                          borderRightColor: cat.percentage > 25 ? cat.color : 'transparent',
                          borderBottomColor: cat.percentage > 50 ? cat.color : 'transparent',
                          borderLeftColor: cat.percentage > 75 ? cat.color : 'transparent',
                          transform: [{ rotate: `${rotation}deg` }],
                        }}
                      />
                    );
                  })}
                  <View className="items-center">
                    <Text className="text-xs text-muted-foreground">Total</Text>
                    <Text className="text-base font-bold text-foreground">
                      RM {expensesTotal.toLocaleString('en-US')}
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <View className="absolute w-28 h-28 rounded-full border-8 border-background" />
                  {incomeCategories.filter(c => c.amount > 0).map((cat, idx) => {
                    const rotation = idx * 45 - 90;
                    return (
                      <View
                        key={cat.name}
                        className="absolute w-28 h-28 rounded-full border-8 border-transparent"
                        style={{
                          borderTopColor: cat.color,
                          borderRightColor: cat.percentage > 25 ? cat.color : 'transparent',
                          borderBottomColor: cat.percentage > 50 ? cat.color : 'transparent',
                          borderLeftColor: cat.percentage > 75 ? cat.color : 'transparent',
                          transform: [{ rotate: `${rotation}deg` }],
                        }}
                      />
                    );
                  })}
                  <View className="items-center">
                    <Text className="text-xs text-muted-foreground">Total</Text>
                    <Text className="text-base font-bold text-foreground">
                      RM {incomeTotal.toLocaleString('en-US')}
                    </Text>
                  </View>
                </>
              )}
            </View>
            {/* Legend */}
            <View className="flex-1 ml-4 gap-1">
              {(toggleMode === 'expense' ? expenseCategories : incomeCategories).slice(0, 4).map((cat) => (
                <View key={cat.name} className="flex-row items-center gap-2">
                  <View className="w-3 h-3 rounded" style={{ backgroundColor: cat.color }} />
                  <Text className="text-xs text-muted-foreground flex-1" numberOfLines={1}>{cat.name}</Text>
                  <Text className="text-xs text-foreground font-medium">{cat.percentage}%</Text>
                </View>
              ))}
            </View>
          </View>

          <Text className="text-sm font-semibold text-foreground mb-3">
            {toggleMode === 'expense' ? 'Expense Breakdown' : 'Income Breakdown'}
          </Text>

          {toggleMode === 'expense' ? (
            <View className="gap-2">
              {expenseCategories.map((category) => (
                <View
                  key={category.name}
                  className="flex-row items-center bg-card border border-border rounded-xl px-4 py-3"
                >
                  <View className="w-9 h-9 rounded-xl bg-secondary items-center justify-center mr-3">
                    <Text className="text-base">{category.emoji}</Text>
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-sm font-medium text-foreground">{category.name}</Text>
                      <Text className="text-sm font-semibold text-foreground">
                        RM {category.amount.toLocaleString('en-US')}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <View className="flex-1 h-2 bg-background rounded-full overflow-hidden">
                        <View
                          className="h-full rounded-full"
                          style={{ width: `${category.percentage}%`, backgroundColor: category.color }}
                        />
                      </View>
                      <Text className="text-xs text-muted-foreground">{category.percentage}%</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View className="gap-2">
              {incomeCategories.map((category) => (
                <View
                  key={category.name}
                  className="flex-row items-center bg-card border border-border rounded-xl px-4 py-3"
                >
                  <View className="w-9 h-9 rounded-xl bg-secondary items-center justify-center mr-3">
                    <Text className="text-base">{category.emoji}</Text>
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-sm font-medium text-foreground">{category.name}</Text>
                      <Text className="text-sm font-semibold text-foreground">
                        RM {category.amount.toLocaleString('en-US')}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <View className="flex-1 h-2 bg-background rounded-full overflow-hidden">
                        <View
                          className="h-full rounded-full"
                          style={{ width: `${category.percentage}%`, backgroundColor: category.color }}
                        />
                      </View>
                      <Text className="text-xs text-muted-foreground">{category.percentage}%</Text>
                    </View>
                  </View>
                </View>
              ))}
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