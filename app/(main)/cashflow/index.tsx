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
import { useCashflow } from '../../../src/hooks/useCashflow';
import { useAccounts } from '../../../src/hooks/useAccounts';
import { transactionsRepository } from '../../../src/repositories/transactions.repository';
import { accountColor } from '../../../src/utils/accountColor';
import { localYMD } from '../../../src/utils/date';
import { LoadingView } from '../../../components/ui/LoadingView';
import { ErrorView } from '../../../components/ui/ErrorView';
import { useAuth } from '../../../context/AuthContext';
import type { Asset, Liability, AssetType, LiabilityType } from '../../../src/types/database.types';

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
interface UIAsset { id: string; name: string; type: string; icon: string; value: number; monthlyIncome: number; dateAcquired?: string; note?: string; }
interface UILiability { id: string; name: string; type: string; icon: string; amountOwed: number; monthlyPayment: number; }

// ─── Main screen ────────────────────────────────────────────────────────────────
export default function CashFlowScreen() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date()); // default to current month
  const [balanceSheetTab, setBalanceSheetTab] = useState<'assets' | 'liabilities'>('assets');
  const [manageTab, setManageTab] = useState<'assets' | 'liabilities'>('assets');
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [showAddLiability, setShowAddLiability] = useState(false);
  const [editingAsset, setEditingAsset] = useState<UIAsset | null>(null);
  const [editingLiability, setEditingLiability] = useState<UILiability | null>(null);

  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth() + 1;
  const currentMonth = `${year}-${String(month).padStart(2, '0')}`;
  const monthLabel = selectedDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  // Whether the selected month is after the current calendar month.
  // Future months have no data yet, so they start from the "poor" pattern.
  const now = new Date();
  const isFutureMonth = year > now.getFullYear() || (year === now.getFullYear() && month > now.getMonth() + 1);

  // ─── Hook calls ────────────────────────────────────────────────────────────
  const { user } = useAuth();
  const { income: incomeTxns, expenses: expenseTxns, loading: txLoading, error: txError, refetch: refetchTxns } = useTransactions(year, month);
  const { assets: rawAssets, loading: astLoading, error: astError, fetchAssets, createAsset, updateAsset, deleteAsset } = useAssets();
  const { liabilities: rawLiabilities, loading: liabLoading, error: liabError, fetchLiabilities, createLiability, updateLiability, deleteLiability } = useLiabilities();
  const { accounts, fetchAccounts } = useAccounts();
  const { summary } = useCashflow(currentMonth);

  // Accounts an asset can be funded from, in the shape AccountSelector wants.
  const accountOptions = accounts.map((a: any) => {
    const bal = Number(
      a.type === 'bank'
        ? a.bank_accounts?.current_balance ?? 0
        : a.type === 'wallet'
        ? a.wallet_accounts?.current_balance ?? 0
        : a.type === 'tabung'
        ? a.tabung_accounts?.saved_amount ?? 0
        : 0
    );
    return {
      id: a.id,
      name: a.name,
      balance: bal.toLocaleString('en-US', { minimumFractionDigits: 2 }),
      color: accountColor(a),
    };
  });

  const loading = txLoading || astLoading || liabLoading;
  const anyError = txError || astError || liabError;

  useFocusEffect(useCallback(() => {
    fetchAssets();
    fetchLiabilities();
    fetchAccounts();
    refetchTxns();
  }, [fetchAssets, fetchLiabilities, fetchAccounts, refetchTxns]));

  // ─── Loading / error guards ────────────────────────────────────────────────
  if (loading) return <LoadingView />;
  if (anyError) return <ErrorView error={anyError} onRetry={() => { fetchAssets(); fetchLiabilities(); refetchTxns(); }} />;

  // ─── Map DB types to UI component types ───────────────────────────────────
  // Future months have no data yet — show the empty "poor" starting pattern.
  const assets: UIAsset[] = isFutureMonth ? [] : rawAssets.map((a: Asset) => ({
    id: a.id,
    name: a.name,
    type: a.type,
    icon: a.icon ?? '📦',
    value: a.current_value,
    monthlyIncome: a.monthly_income,
    dateAcquired: a.date_acquired,
    note: a.note,
  }));

  const liabilities: UILiability[] = isFutureMonth ? [] : rawLiabilities.map((l: Liability) => ({
    id: l.id,
    name: l.name,
    type: l.type,
    icon: l.icon ?? '📦',
    amountOwed: l.amount_owed,
    monthlyPayment: l.monthly_payment,
  }));

  // ─── Income / expense items (from local transactions) ──────────────────────
  const incomeItems = isFutureMonth ? [] : incomeTxns.map(t => ({ label: t.name || t.category || 'Income', amount: Number(t.amount) }));
  const expenseItems = isFutureMonth ? [] : expenseTxns.map(t => ({ label: t.name || t.category || 'Expense', amount: Number(t.amount) }));

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

  const monthlyTrend = isFutureMonth
    ? []
    : summary?.monthly_trend?.length ? summary.monthly_trend : MONTHLY_TREND;

  const currMonth = monthlyTrend[monthlyTrend.length - 1];
  const prevMonth = monthlyTrend.length > 1 ? monthlyTrend[monthlyTrend.length - 2] : null;
  const netWorthChange = (currMonth?.assets ?? 0) - (currMonth?.liabilities ?? 0)
    - ((prevMonth?.assets ?? 0) - (prevMonth?.liabilities ?? 0));

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const navigateMonth = (delta: number) => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + delta);
      return next;
    });
  };

  const handleAddAsset = async (a: NewAsset) => {
    if (!user) return;
    const result = editingAsset
      ? await updateAsset(editingAsset.id, {
          name: a.name,
          type: a.type as AssetType,
          icon: a.icon,
          current_value: a.value,
          monthly_income: a.monthlyIncome,
          date_acquired: a.dateAcquired,
          note: a.note,
        })
      : await createAsset({
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
      // Funded from an account: record the money leaving it, exactly as a
      // transfer into this asset from the Add Transaction screen would — a
      // transfer with no destination account, filed under the asset's name.
      // The asset was already created holding the value, so only the account
      // side is left to write.
      if (!editingAsset && a.fundFromAccountId) {
        await transactionsRepository.create({
          user_id: user.id,
          type: 'transfer',
          name: `Into ${a.name}`,
          amount: a.value,
          category: a.name,
          from_account_id: a.fundFromAccountId,
          date: localYMD(new Date()),
        });
        await fetchAccounts();
        await refetchTxns();
      }
      setEditingAsset(null);
      setShowAddAsset(false);
    }
  };

  const handleAddLiability = async (l: NewLiability) => {
    if (!user) return;
    const result = editingLiability
      ? await updateLiability(editingLiability.id, {
          name: l.name,
          type: l.type as LiabilityType,
          icon: l.icon,
          amount_owed: l.amountOwed,
          monthly_payment: l.monthlyPayment,
          interest_rate: l.interestRate,
          note: l.note,
        })
      : await createLiability({
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
    if (manageTab === 'assets') {
      await deleteAsset(id);
    } else {
      await deleteLiability(id);
    }
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
          <Pressable onPress={() => navigateMonth(-1)} className="p-2">
            <ChevronLeft size={24} color="#ffffff" />
          </Pressable>
          <Text className="text-lg font-semibold text-foreground">{monthLabel}</Text>
          <Pressable onPress={() => navigateMonth(1)} className="p-2">
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
        accounts={accountOptions}
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
