import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Info, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { FinancialClassBadge } from '../../../components/cashflow/FinancialClassBadge';
import { CashFlowDiagram } from '../../../components/cashflow/CashFlowDiagram';
import { IncomeStatementCard } from '../../../components/cashflow/IncomeStatementCard';
import { BalanceSheetCard } from '../../../components/cashflow/BalanceSheetCard';
import { MonthlyTrendChart } from '../../../components/cashflow/MonthlyTrendChart';
import { ManageAssetsLiabilitiesCard } from '../../../components/cashflow/ManageAssetsLiabilitiesCard';
import { AddAssetModal, NewAsset } from '../../../components/cashflow/AddAssetModal';
import { AddLiabilityModal, NewLiability } from '../../../components/cashflow/AddLiabilityModal';

// ─── Mock data (to be replaced by Supabase hookup) ───────────────────────────
const MONTHS = ['Jan 2026', 'Feb 2026', 'Mar 2026', 'Apr 2026', 'May 2026', 'Jun 2026'];

const INCOME_ITEMS = [
  { label: 'Salary', amount: 3500 },
  { label: 'Freelance', amount: 600 },
];

const EXPENSE_ITEMS = [
  { label: 'Bills & Utilities', amount: 350 },
  { label: 'Food', amount: 450 },
  { label: 'Transport', amount: 200 },
  { label: 'Mortgage Payment', amount: 1200 },
  { label: 'Car Loan', amount: 500 },
];

const INITIAL_ASSETS = [
  { id: 'a1', name: 'Rumah Taman Melati', type: 'Real Estate', icon: '🏠', value: 250000, monthlyIncome: 500 },
  { id: 'a2', name: 'Bursa Stocks Portfolio', type: 'Stocks / ETF', icon: '📈', value: 15000, monthlyIncome: 200 },
  { id: 'a3', name: 'Amanah Saham Bumiputera', type: 'ASB / ASB2', icon: '🐷', value: 10000, monthlyIncome: 0 },
  { id: 'a4', name: 'Fixed Deposit Maybank', type: 'Fixed Deposit', icon: '🏦', value: 5000, monthlyIncome: 0 },
];

const INITIAL_LIABILITIES = [
  { id: 'l1', name: 'Housing Loan CIMB', type: 'Mortgage', icon: '🏦', amountOwed: 180000, monthlyPayment: 1200 },
  { id: 'l2', name: 'Car Loan Maybank', type: 'Car Loan', icon: '🚗', amountOwed: 25000, monthlyPayment: 500 },
  { id: 'l3', name: 'Credit Card CIMB', type: 'Credit Card', icon: '💳', amountOwed: 3000, monthlyPayment: 300 },
  { id: 'l4', name: 'PTPTN', type: 'Study Loan', icon: '🎓', amountOwed: 12000, monthlyPayment: 150 },
];

const MONTHLY_TREND = [
  { month: 'Dec', assets: 260000, liabilities: 228000 },
  { month: 'Jan', assets: 262000, liabilities: 226000 },
  { month: 'Feb', assets: 265000, liabilities: 224000 },
  { month: 'Mar', assets: 268000, liabilities: 222000 },
  { month: 'Apr', assets: 272000, liabilities: 221000 },
  { month: 'May', assets: 280000, liabilities: 220000 },
];

// ─── Types ───────────────────────────────────────────────────────────────────────
type FinancialClass = 'poor' | 'middle' | 'rich';

interface Asset { id: string; name: string; type: string; icon: string; value: number; monthlyIncome: number; }
interface Liability { id: string; name: string; type: string; icon: string; amountOwed: number; monthlyPayment: number; }

// ─── Main screen ────────────────────────────────────────────────────────────────
export default function CashFlowScreen() {
  const router = useRouter();
  const [monthIndex, setMonthIndex] = useState(4); // May 2026
  const [assets, setAssets] = useState<Asset[]>(INITIAL_ASSETS);
  const [liabilities, setLiabilities] = useState<Liability[]>(INITIAL_LIABILITIES);
  const [balanceSheetTab, setBalanceSheetTab] = useState<'assets' | 'liabilities'>('assets');
  const [manageTab, setManageTab] = useState<'assets' | 'liabilities'>('assets');
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [showAddLiability, setShowAddLiability] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editingLiability, setEditingLiability] = useState<Liability | null>(null);

  const handleAddAsset = (a: NewAsset) => {
    if (editingAsset) {
      setAssets((prev) => prev.map((x) => (x.id === editingAsset.id ? { ...x, ...a } : x)));
    } else {
      setAssets((prev) => [...prev, { id: `a${Date.now()}`, ...a }]);
    }
    setEditingAsset(null);
    setShowAddAsset(false);
  };

  const handleAddLiability = (l: NewLiability) => {
    if (editingLiability) {
      setLiabilities((prev) => prev.map((x) => (x.id === editingLiability.id ? { ...x, ...l } : x)));
    } else {
      setLiabilities((prev) => [...prev, { id: `l${Date.now()}`, ...l }]);
    }
    setEditingLiability(null);
    setShowAddLiability(false);
  };

  const handleEdit = (item: Asset | Liability) => {
    if (manageTab === 'assets') {
      setEditingAsset(item as Asset);
      setShowAddAsset(true);
    } else {
      setEditingLiability(item as Liability);
      setShowAddLiability(true);
    }
  };

  // ─── Computed ────────────────────────────────────────────────────────────────
  const totalIncome = INCOME_ITEMS.reduce((s, i) => s + i.amount, 0);
  const passiveFromAssets = assets.reduce((s, a) => s + a.monthlyIncome, 0);
  const allIncome = totalIncome + passiveFromAssets;
  const totalExpenses = EXPENSE_ITEMS.reduce((s, e) => s + e.amount, 0);
  const netCashFlow = allIncome - totalExpenses;
  const totalAssets = assets.reduce((s, a) => s + a.value, 0);
  const totalLiabilities = liabilities.reduce((s, l) => s + l.amountOwed, 0);
  const netWorth = totalAssets - totalLiabilities;

  const financialClass: FinancialClass =
    assets.length === 0 && passiveFromAssets === 0
      ? 'poor'
      : passiveFromAssets >= totalExpenses
      ? 'rich'
      : 'middle';

  const prevMonth = monthIndex > 0 ? MONTHLY_TREND[monthIndex - 1] : null;
  const currMonth = MONTHLY_TREND[monthIndex];
  const netWorthChange = (currMonth?.assets ?? 0) - (currMonth?.liabilities ?? 0)
    - ((prevMonth?.assets ?? 0) - (prevMonth?.liabilities ?? 0));

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
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Month Navigator */}
        <View className="flex-row items-center justify-between px-4 py-3">
          <Pressable onPress={() => setMonthIndex((i) => Math.max(0, i - 1))} className="p-2">
            <ChevronLeft size={24} color="#ffffff" />
          </Pressable>
          <Text className="text-lg font-semibold text-foreground">{MONTHS[monthIndex]}</Text>
          <Pressable onPress={() => setMonthIndex((i) => Math.min(MONTHS.length - 1, i + 1))} className="p-2">
            <ChevronRight size={24} color="#ffffff" />
          </Pressable>
        </View>

        {/* Financial Class Badge */}
        <View className="px-4 mb-4">
          <FinancialClassBadge
            financialClass={financialClass}
            totalAssets={totalAssets}
            totalLiabilities={totalLiabilities}
            passiveIncome={passiveFromAssets}
            netWorth={netWorth}
            totalIncome={allIncome}
            totalExpenses={totalExpenses}
          />
        </View>

        {/* Cash Flow Diagram */}
        <View className="px-4 mb-4">
          <CashFlowDiagram
            financialClass={financialClass}
            totalIncome={allIncome}
            passiveIncome={passiveFromAssets}
            totalExpenses={totalExpenses}
            totalAssets={totalAssets}
            totalLiabilities={totalLiabilities}
          />
        </View>

        {/* Income Statement */}
        <View className="px-4 mb-4">
          <IncomeStatementCard
            incomeItems={INCOME_ITEMS}
            expenseItems={EXPENSE_ITEMS}
            passiveFromAssets={passiveFromAssets}
            totalIncome={allIncome}
            totalExpenses={totalExpenses}
            netCashFlow={netCashFlow}
          />
        </View>

        {/* Balance Sheet */}
        <View className="px-4 mb-4">
          <BalanceSheetCard
            assets={assets}
            liabilities={liabilities}
            activeTab={balanceSheetTab}
            onTabChange={setBalanceSheetTab}
            onAddAsset={() => setShowAddAsset(true)}
            onAddLiability={() => setShowAddLiability(true)}
            totalAssets={totalAssets}
            totalLiabilities={totalLiabilities}
            netWorth={netWorth}
          />
        </View>

        {/* Monthly Trend */}
        <View className="px-4 mb-4">
          <MonthlyTrendChart data={MONTHLY_TREND} netWorthChange={netWorthChange} />
        </View>

        {/* Manage Assets & Liabilities */}
        <View className="px-4 mb-32">
          <ManageAssetsLiabilitiesCard
            assets={assets}
            liabilities={liabilities}
            activeTab={manageTab}
            onTabChange={setManageTab}
            onEdit={handleEdit}
            onDelete={(id) => {
              setAssets((prev) => prev.filter((a) => a.id !== id));
              setLiabilities((prev) => prev.filter((l) => l.id !== id));
            }}
            onAdd={() => (manageTab === 'assets' ? setShowAddAsset(true) : setShowAddLiability(true))}
          />
        </View>
      </ScrollView>

      <AddAssetModal
        visible={showAddAsset}
        onClose={() => { setShowAddAsset(false); setEditingAsset(null); }}
        onSubmit={handleAddAsset}
        initial={editingAsset}
      />
      <AddLiabilityModal
        visible={showAddLiability}
        onClose={() => { setShowAddLiability(false); setEditingLiability(null); }}
        onSubmit={handleAddLiability}
        initial={editingLiability}
      />
    </SafeAreaView>
  );
}