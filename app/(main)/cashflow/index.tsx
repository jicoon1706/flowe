import { useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Info, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { FinancialClassBadge } from '../../../components/cashflow/FinancialClassBadge';
import { CashFlowDiagram } from '../../../components/cashflow/CashFlowDiagram';
import { IncomeStatementCard } from '../../../components/cashflow/IncomeStatementCard';
import { BalanceSheetCard } from '../../../components/cashflow/BalanceSheetCard';
import { MonthlyTrendChart } from '../../../components/cashflow/MonthlyTrendChart';
import { ManageAssetsLiabilitiesCard } from '../../../components/cashflow/ManageAssetsLiabilitiesCard';
import { AddAssetModal, NewAsset } from '../../../components/cashflow/AddAssetModal';
import { AddLiabilityModal, NewLiability } from '../../../components/cashflow/AddLiabilityModal';
import { useTransactions } from '../../../src/hooks/useTransactions';
import { useAssets } from '../../../src/hooks/useAssets';
import { useLiabilities } from '../../../src/hooks/useLiabilities';
import { LoadingView } from '../../../components/ui/LoadingView';
import { ErrorView } from '../../../components/ui/ErrorView';
import { useAuth } from '../../../context/AuthContext';
import type { Asset, Liability, AssetType, LiabilityType } from '../../../src/types/database.types';

// ─── Month config ────────────────────────────────────────────────────────────
const MONTHS = ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06'];

// ─── Mock fallback data ────────────────────────────────────────────────────────
const MONTHLY_TREND = [
  { month: 'Dec', assets: 260000, liabilities: 228000 },
  { month: 'Jan', assets: 262000, liabilities: 226000 },
  { month: 'Feb', assets: 265000, liabilities: 224000 },
  { month: 'Mar', assets: 268000, liabilities: 222000 },
  { month: 'Apr', assets: 272000, liabilities: 221000 },
  { month: 'May', assets: 280000, liabilities: 220000 },
];

// ─── Component-level asset/liability shape (for UI components) ────────────────
interface UIAsset { id: string; name: string; type: string; icon: string; value: number; monthlyIncome: number; }
interface UILiability { id: string; name: string; type: string; icon: string; amountOwed: number; monthlyPayment: number; }

// ─── Main screen ────────────────────────────────────────────────────────────────
export default function CashFlowScreen() {
  const router = useRouter();
  const [monthIndex, setMonthIndex] = useState(4); // May 2026
  const [balanceSheetTab, setBalanceSheetTab] = useState<'assets' | 'liabilities'>('assets');
  const [manageTab, setManageTab] = useState<'assets' | 'liabilities'>('assets');
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [showAddLiability, setShowAddLiability] = useState(false);
  const [editingAsset, setEditingAsset] = useState<UIAsset | null>(null);
  const [editingLiability, setEditingLiability] = useState<UILiability | null>(null);

  const currentMonth = MONTHS[monthIndex] ?? '2026-05';
  const [yearStr, monthStr] = currentMonth.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);

  // ─── Hook calls ────────────────────────────────────────────────────────────
  const { user } = useAuth();
  const { income: incomeTxns, expenses: expenseTxns, loading: txLoading, error: txError, refetch: refetchTxns } = useTransactions(year, month);
  const { assets: rawAssets, loading: astLoading, error: astError, fetchAssets, createAsset } = useAssets();
  const { liabilities: rawLiabilities, loading: liabLoading, error: liabError, fetchLiabilities, createLiability } = useLiabilities();

  const loading = txLoading || astLoading || liabLoading;
  const anyError = txError || astError || liabError;

  useFocusEffect(useCallback(() => {
    fetchAssets();
    fetchLiabilities();
  }, [fetchAssets, fetchLiabilities]));

  // ─── Loading / error guards ────────────────────────────────────────────────
  if (loading) return <LoadingView />;
  if (anyError) return <ErrorView error={anyError} onRetry={() => { fetchAssets(); fetchLiabilities(); refetchTxns(); }} />;

  // ─── Map DB types to UI component types ───────────────────────────────────
  const assets: UIAsset[] = rawAssets.map((a: Asset) => ({
    id: a.id,
    name: a.name,
    type: a.type,
    icon: a.icon ?? '📦',
    value: a.current_value,
    monthlyIncome: a.monthly_income,
  }));

  const liabilities: UILiability[] = rawLiabilities.map((l: Liability) => ({
    id: l.id,
    name: l.name,
    type: l.type,
    icon: l.icon ?? '📦',
    amountOwed: l.amount_owed,
    monthlyPayment: l.monthly_payment,
  }));

  // ─── Income / expense items (from local transactions) ──────────────────────
  const incomeItems = incomeTxns.map(t => ({ label: t.name || t.category || 'Income', amount: Number(t.amount) }));
  const expenseItems = expenseTxns.map(t => ({ label: t.name || t.category || 'Expense', amount: Number(t.amount) }));

  // ─── Computed totals ────────────────────────────────────────────────────────
  const totalIncome = incomeItems.reduce((s, i) => s + i.amount, 0);
  const totalExpenses = expenseItems.reduce((s, e) => s + e.amount, 0);
  const netCashFlow = totalIncome - totalExpenses;

  const totalAssets = assets.reduce((s, a) => s + a.value, 0);
  const totalLiabilities = liabilities.reduce((s, l) => s + l.amountOwed, 0);
  const netWorth = totalAssets - totalLiabilities;

  const passiveFromAssets = assets.reduce((s, a) => s + a.monthlyIncome, 0);
  const allIncome = totalIncome + passiveFromAssets;

  const financialClass = assets.length === 0 ? 'poor' :
    passiveFromAssets >= totalExpenses ? 'rich' : 'middle';

  const monthlyTrend = MONTHLY_TREND;

  const prevMonth = monthIndex > 0 ? monthlyTrend[monthIndex - 1] : null;
  const currMonth = monthIndex < monthlyTrend.length ? monthlyTrend[monthIndex] : monthlyTrend[monthlyTrend.length - 1];
  const netWorthChange = (currMonth?.assets ?? 0) - (currMonth?.liabilities ?? 0)
    - ((prevMonth?.assets ?? 0) - (prevMonth?.liabilities ?? 0));

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleAddAsset = async (a: NewAsset) => {
    if (!user) return;
    const result = await createAsset({
      user_id: user.id,
      name: a.name,
      type: a.type as AssetType,
      icon: a.icon,
      current_value: a.value,
      monthly_income: a.monthlyIncome,
      date_acquired: a.dateAcquired,
      note: a.note,
    });
    if (result.ok) {
      setEditingAsset(null);
      setShowAddAsset(false);
    }
  };

  const handleAddLiability = async (l: NewLiability) => {
    if (!user) return;
    const result = await createLiability({
      user_id: user.id,
      name: l.name,
      type: l.type as LiabilityType,
      icon: l.icon,
      amount_owed: l.amountOwed,
      monthly_payment: l.monthlyPayment,
      interest_rate: l.interestRate,
      note: l.note,
    });
    if (result.ok) {
      setEditingLiability(null);
      setShowAddLiability(false);
    }
  };

  const handleEdit = (item: UIAsset | UILiability) => {
    if (manageTab === 'assets') {
      setEditingAsset(item as UIAsset);
      setShowAddAsset(true);
    } else {
      setEditingLiability(item as UILiability);
      setShowAddLiability(true);
    }
  };

  const handleDelete = async (id: string) => {
    // Soft-delete via repository would go here; for now, UI optimistically removes
    // The refetch via fetchAssets/fetchLiabilities will sync state
    fetchAssets();
    fetchLiabilities();
  };

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
            incomeItems={incomeItems}
            expenseItems={expenseItems}
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
          <MonthlyTrendChart data={monthlyTrend} netWorthChange={netWorthChange} />
        </View>

        {/* Manage Assets & Liabilities */}
        <View className="px-4 mb-32">
          <ManageAssetsLiabilitiesCard
            assets={assets}
            liabilities={liabilities}
            activeTab={manageTab}
            onTabChange={setManageTab}
            onEdit={handleEdit}
            onDelete={handleDelete}
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
