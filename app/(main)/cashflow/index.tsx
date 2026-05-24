import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Info, ChevronLeft, ChevronRight } from 'lucide-react-native';
import React from 'react';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { FinancialClassBadge } from '../../../components/cashflow/FinancialClassBadge';
import { CashFlowStatsGrid } from '../../../components/cashflow/CashFlowStatsGrid';
import { CashFlowDiagram } from '../../../components/cashflow/CashFlowDiagram';
import { IncomeStatementCard } from '../../../components/cashflow/IncomeStatementCard';
import { BalanceSheetCard } from '../../../components/cashflow/BalanceSheetCard';
import { MonthlyTrendChart } from '../../../components/cashflow/MonthlyTrendChart';
import { ManageAssetsLiabilitiesCard } from '../../../components/cashflow/ManageAssetsLiabilitiesCard';

// Mock data - will connect to Supabase Edge Functions later
const financialClass = {
  emoji: '💎',
  label: 'Rich Pattern',
  description: 'Your passive income exceeds your expenses',
  pattern: 'rich' as const,
};

const stats = {
  assets: 45000,
  liabilities: 12000,
  passiveIncome: 2500,
  netWorth: 33000,
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
  { id: '1', name: 'Maybank Savings', value: 15000, monthly: 200 },
  { id: '2', name: 'Tabung Raya', value: 5000, monthly: 400 },
  { id: '3', name: 'ASB', value: 25000, monthly: 50 },
];

const liabilities = [
  { id: '1', name: 'Car Loan', value: 12000, monthly: -450, rate: '2.5%' },
];

const monthlyTrend = [
  { month: 'Jan', assets: 40000, liabilities: 30000 },
  { month: 'Feb', assets: 42000, liabilities: 28000 },
  { month: 'Mar', assets: 43500, liabilities: 25000 },
  { month: 'Apr', assets: 44000, liabilities: 22000 },
  { month: 'May', assets: 45000, liabilities: 18000 },
  { month: 'Jun', assets: 46500, liabilities: 15000 },
];

export default function CashFlowScreen() {
  const router = useRouter();
  const [balanceSheetTab, setBalanceSheetTab] = React.useState<'assets' | 'liabilities'>('assets');
  const [manageTab, setManageTab] = React.useState<'assets' | 'liabilities'>('assets');

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScreenHeader
        title="Cash Flow"
        rightAction={
          <Pressable onPress={() => router.push('/cashflow/info')} className="p-2">
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
          <FinancialClassBadge
            emoji={financialClass.emoji}
            label={financialClass.label}
            description={financialClass.description}
          />
        </View>

        {/* Stats Grid */}
        <View className="px-4 mb-4">
          <CashFlowStatsGrid stats={stats} />
        </View>

        {/* Cash Flow Diagram */}
        <View className="px-4 mb-4">
          <CashFlowDiagram pattern={financialClass.pattern} income={7230} expenses={2145} />
        </View>

        {/* Income Statement */}
        <View className="px-4 mb-4">
          <IncomeStatementCard items={incomeStatement} />
        </View>

        {/* Balance Sheet Card */}
        <View className="px-4 mb-4">
          <BalanceSheetCard
            assets={assets}
            liabilities={liabilities}
            activeTab={balanceSheetTab}
            onTabChange={setBalanceSheetTab}
            onAddAsset={() => {}}
            onAddLiability={() => {}}
          />
        </View>

        {/* Monthly Trend Chart */}
        <View className="px-4 mb-4">
          <MonthlyTrendChart data={monthlyTrend} netWorthChange={1500} />
        </View>

        {/* Manage Assets & Liabilities */}
        <View className="px-4 mb-8">
          <ManageAssetsLiabilitiesCard
            assets={assets}
            liabilities={liabilities}
            activeTab={manageTab}
            onTabChange={setManageTab}
            onEdit={() => {}}
            onDelete={() => {}}
            onAdd={() => {}}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}