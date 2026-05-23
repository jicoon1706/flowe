import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Info, ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react-native';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Card } from '../../components/ui/Card';

const financialClass = {
  emoji: '💎',
  label: 'Rich Pattern',
  description: 'Your passive income exceeds your expenses',
};

const stats = {
  assets: '45,000',
  liabilities: '12,000',
  passiveIncome: '2,500',
  netWorth: '33,000',
};

const incomeStatement = [
  { label: 'Salary', amount: '4,230.00' },
  { label: 'Freelance', amount: '500.00' },
  { label: 'Passive Income', amount: '2,500.00', isHighlight: true },
  { label: 'Total Income', amount: '7,230.00', isBold: true },
  { label: 'Expenses', amount: '-2,145.00', isExpense: true },
  { label: 'Net Cash Flow', amount: '+5,085.00', isPositive: true },
];

const assets = [
  { name: 'Maybank Savings', value: '15,000', monthly: '+200/mo' },
  { name: 'Tabung Raya', value: '5,000', monthly: '+400/mo' },
  { name: 'ASB', value: '25,000', monthly: '+50/mo' },
];

const liabilities = [
  { name: 'Car Loan', value: '12,000', monthly: '-450/mo', rate: '2.5%' },
];

export default function CashFlowScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScreenHeader
        title="Cash Flow"
        rightAction={
          <Pressable onPress={() => {}} className="p-2">
            <Info size={22} color="#ffffff" />
          </Pressable>
        }
      />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Month Navigator */}
        <View className="flex-row items-center justify-between px-4 py-3">
          <Pressable accessible accessibilityLabel="Previous month" className="p-2">
            <ChevronLeft size={24} color="#ffffff" />
          </Pressable>
          <Text className="text-lg font-semibold text-foreground">May 2025</Text>
          <Pressable accessible accessibilityLabel="Next month" className="p-2">
            <ChevronRight size={24} color="#ffffff" />
          </Pressable>
        </View>

        {/* Financial Class Badge */}
        <View className="px-4 mb-4">
          <View className="bg-card border border-border rounded-2xl p-4 flex-row items-center gap-4">
            <View className="w-14 h-14 rounded-2xl bg-primary/10 items-center justify-center">
              <Text className="text-3xl">{financialClass.emoji}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-primary mb-1">{financialClass.label}</Text>
              <Text className="text-sm text-muted-foreground">{financialClass.description}</Text>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View className="px-4 mb-4">
          <View className="grid grid-cols-2 gap-3">
            <Card>
              <Text className="text-xs text-muted-foreground mb-1">Assets</Text>
              <Text className="text-lg font-bold text-income">RM {stats.assets}</Text>
            </Card>
            <Card>
              <Text className="text-xs text-muted-foreground mb-1">Liabilities</Text>
              <Text className="text-lg font-bold text-expense">RM {stats.liabilities}</Text>
            </Card>
            <Card>
              <Text className="text-xs text-muted-foreground mb-1">Passive Income</Text>
              <Text className="text-lg font-bold text-primary">RM {stats.passiveIncome}</Text>
            </Card>
            <Card>
              <Text className="text-xs text-muted-foreground mb-1">Net Worth</Text>
              <Text className="text-lg font-bold text-foreground">RM {stats.netWorth}</Text>
            </Card>
          </View>
        </View>

        {/* Cash Flow Diagram */}
        <View className="px-4 mb-4">
          <Text className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-3 px-4">
            Cash Flow Pattern
          </Text>
          <Card className="items-center py-6">
            {/* Rich Pattern SVG Illustration */}
            <View className="w-full flex-row items-center justify-center gap-4 mb-4">
              <View className="items-center">
                <View className="w-16 h-16 rounded-2xl bg-income/20 items-center justify-center mb-1">
                  <TrendingUp size={24} color="#22C55E" />
                </View>
                <Text className="text-xs text-foreground">Assets</Text>
              </View>
              <View className="flex-row items-center gap-1">
                <View className="w-8 h-0.5 bg-income" />
                <Text className="text-lg">→</Text>
              </View>
              <View className="items-center">
                <View className="w-16 h-16 rounded-2xl bg-primary/20 items-center justify-center mb-1">
                  <Text className="text-2xl">💰</Text>
                </View>
                <Text className="text-xs text-foreground">Income</Text>
              </View>
              <View className="flex-row items-center gap-1">
                <View className="w-8 h-0.5 bg-primary" />
                <Text className="text-lg">→</Text>
              </View>
              <View className="items-center">
                <View className="w-16 h-16 rounded-2xl bg-expense/20 items-center justify-center mb-1">
                  <TrendingDown size={24} color="#EF4444" />
                </View>
                <Text className="text-xs text-foreground">Expenses</Text>
              </View>
            </View>
            <Text className="text-xs text-muted-foreground text-center px-4">
              Assets generate passive income, which covers expenses and allows reinvestment
            </Text>
          </Card>
        </View>

        {/* Income Statement */}
        <View className="px-4 mb-4">
          <Text className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-3 px-4">
            Income Statement
          </Text>
          <Card>
            {incomeStatement.map((item, index) => (
              <View
                key={index}
                className={`flex-row justify-between py-2 ${index !== incomeStatement.length - 1 ? 'border-b border-border' : ''}`}
              >
                <Text
                  className={`
                    text-sm
                    ${item.isBold ? 'font-semibold text-foreground' : ''}
                    ${item.isHighlight ? 'text-primary' : ''}
                    ${item.isExpense ? 'text-expense' : ''}
                    ${!item.isBold && !item.isHighlight && !item.isExpense ? 'text-foreground' : ''}
                  `}
                >
                  {item.label}
                </Text>
                <Text
                  className={`
                    text-sm font-medium
                    ${item.isBold ? 'font-semibold' : ''}
                    ${item.isPositive ? 'text-income' : ''}
                    ${item.isExpense ? 'text-expense' : ''}
                    ${!item.isPositive && !item.isExpense ? 'text-foreground' : ''}
                  `}
                >
                  {item.amount}
                </Text>
              </View>
            ))}
          </Card>
        </View>

        {/* Balance Sheet Tabs */}
        <View className="px-4 mb-4">
          <View className="flex-row bg-card rounded-2xl p-1 mb-3">
            <Pressable className="flex-1 py-2 rounded-xl bg-primary">
              <Text className="text-sm font-semibold text-primary-foreground text-center">Assets</Text>
            </Pressable>
            <Pressable className="flex-1 py-2 rounded-xl">
              <Text className="text-sm font-semibold text-muted-foreground text-center">Liabilities</Text>
            </Pressable>
          </View>
          <Card>
            {assets.map((asset, index) => (
              <View
                key={index}
                className={`flex-row justify-between items-center py-3 ${index !== assets.length - 1 ? 'border-b border-border' : ''}`}
              >
                <View>
                  <Text className="text-sm font-medium text-foreground">{asset.name}</Text>
                  <Text className="text-xs text-income">{asset.monthly}</Text>
                </View>
                <Text className="text-sm font-semibold text-foreground">RM {asset.value}</Text>
              </View>
            ))}
            <Pressable className="flex-row items-center justify-center gap-2 py-3 mt-2 border-t border-dashed border-border">
              <Text className="text-sm text-primary font-medium">+ Add Asset</Text>
            </Pressable>
          </Card>
        </View>

        {/* Monthly Trend Chart Placeholder */}
        <View className="px-4 mb-8">
          <Text className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-3 px-4">
            Monthly Trend
          </Text>
          <Card className="items-center py-8">
            <Text className="text-sm text-muted-foreground">Net worth grew RM 1,500 this month</Text>
            <View className="flex-row items-end gap-2 mt-4 h-24">
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, i) => {
                const assetHeight = [40, 50, 55, 60, 70, 80][i];
                const liabilityHeight = [30, 28, 25, 22, 20, 18][i];
                return (
                  <View key={month} className="items-center gap-1">
                    <View className="flex-row items-end gap-0.5">
                      <View className="w-4 bg-income rounded-t" style={{ height: assetHeight }} />
                      <View className="w-4 bg-expense rounded-t" style={{ height: liabilityHeight }} />
                    </View>
                    <Text className="text-xs text-muted-foreground">{month}</Text>
                  </View>
                );
              })}
            </View>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}