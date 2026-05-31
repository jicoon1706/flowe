import { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { ChevronLeft, ChevronRight, Eye, EyeOff, Pencil, RefreshCw, Receipt, X, AlertCircle } from '../../../../components/ui/icons';
import { useAccounts } from '../../../../src/hooks/useAccounts';
import { useTransactions } from '../../../../src/hooks/useTransactions';
import { accountsRepository } from '../../../../src/repositories/accounts.repository';
import { LoadingView } from '../../../../components/ui/LoadingView';
import { ErrorView } from '../../../../components/ui/ErrorView';
import { TransactionDetail, TransactionData } from '../../../../components/home/TransactionDetail';

const EDIT_COLORS = ['#6bcf7f', '#ffd93d', '#00d4ff', '#C5FF00', '#f472b6', '#a78bfa', '#34d399', '#fb923c'];

function getCategoryEmoji(category: string): string {
  const map: Record<string, string> = {
    'Food & Drink': '🍔', Transport: '🚗', Shopping: '🛍️', Bills: '🧾',
    Entertainment: '🎬', Health: '💊', Income: '💼', Transfer: '🔄', Other: '💰',
  };
  return map[category] ?? '💰';
}

export default function WalletDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [balanceVisible, setBalanceVisible] = useState(true);

  const { accounts, loading, error, fetchAccounts } = useAccounts();
  const now = new Date();
  const { transactions, loading: txLoading, error: txError, refetch: refetchTransactions } = useTransactions(now.getFullYear(), now.getMonth() + 1);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(useCallback(() => {
    fetchAccounts();
    refetchTransactions();
  }, [fetchAccounts, refetchTransactions]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchAccounts(), refetchTransactions()]);
    setRefreshing(false);
  }, [fetchAccounts, refetchTransactions]);

  const accountId = typeof id === 'string' ? id : '';
  const account = accounts.find((a) => a.id === accountId) ?? accounts[0];
  const walletAccount = (account as any)?.wallet_accounts;
  const balance = Number(walletAccount?.current_balance ?? 0);
  const walletColor = account?.color ?? '#00d4ff';

  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('#00d4ff');
  const [editBalance, setEditBalance] = useState('');
  const [editError, setEditError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedTx, setSelectedTx] = useState<TransactionData | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const handleOpenEdit = () => {
    setEditName(account?.name ?? '');
    setEditColor(account?.color ?? '#00d4ff');
    setEditBalance(balance.toString());
    setEditError('');
    setShowEdit(true);
  };

  const handleSaveEdit = async () => {
    if (!account) return;
    const trimmedName = editName.trim();
    const balanceNum = parseFloat(editBalance.replace(/,/g, ''));
    if (!trimmedName) {
      setEditError('Name is required');
      return;
    }
    if (Number.isNaN(balanceNum)) {
      setEditError('Enter a valid balance');
      return;
    }
    setActionLoading(true);
    const accountResult = await accountsRepository.updateAccount(account.id, {
      name: trimmedName,
      color: editColor,
    });
    if (!accountResult.ok) {
      setActionLoading(false);
      setEditError(accountResult.error.message ?? 'Failed to update wallet');
      return;
    }
    if (balanceNum !== balance) {
      const balanceResult = await accountsRepository.updateWalletBalance(account.id, balanceNum);
      if (!balanceResult.ok) {
        setActionLoading(false);
        setEditError(balanceResult.error.message ?? 'Failed to update balance');
        return;
      }
    }
    setActionLoading(false);
    await fetchAccounts();
    setEditError('');
    setShowEdit(false);
  };

  const accountTransactions = transactions.filter((t) => t.from_account_id === accountId || t.to_account_id === accountId);
  const income = accountTransactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expense = accountTransactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  const handleTxPress = (tx: (typeof accountTransactions)[number]) => {
    const data: TransactionData = {
      id: tx.id,
      name: tx.name,
      category: tx.category ?? 'Other',
      categoryIcon: getCategoryEmoji(tx.category ?? 'Other'),
      amount: `${tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}RM ${Math.abs(tx.amount).toFixed(2)}`,
      type: tx.type as 'expense' | 'income' | 'transfer',
      date: new Date(tx.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
      recurring: tx.is_recurring,
      recurringFreq: (tx as any).recurring?.frequency,
      startDate: (tx as any).recurring?.start_date,
      endDate: (tx as any).recurring?.end_date,
      reminder: (tx as any).recurring?.reminder_enabled ? 'Enabled' : undefined,
      note: (tx as any).note,
      hasReceipt: !!(tx as any).receipt_url,
      receiptPath: (tx as any).receipt_url,
      account: tx.type === 'income' ? (tx as any).to_account?.name : (tx as any).from_account?.name,
      toAccount: (tx as any).to_account?.name,
    };
    setSelectedTx(data);
    setDetailVisible(true);
  };

  if (loading || txLoading) return <LoadingView />;
  if (error || txError) return <ErrorView error={error ?? txError!} onRetry={fetchAccounts} />;
  if (!account) return null;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-border">
        <Pressable onPress={() => router.back()} className="mr-3">
          <ChevronLeft size={24} color="#fff" />
        </Pressable>
        <Text className="flex-1 text-lg font-semibold text-foreground">{account.name}</Text>
        <Pressable onPress={handleOpenEdit} className="p-2">
          <Pencil size={22} color="#fff" />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C5FF00" colors={['#C5FF00']} />
        }
      >
        {/* Balance Card */}
        <View className="mx-4 mt-4 bg-card rounded-2xl overflow-hidden border border-border">
          <View style={{ backgroundColor: walletColor }} className="h-1" />
          <View className="p-5">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-sm text-muted-foreground">Balance</Text>
              <Pressable onPress={() => setBalanceVisible(!balanceVisible)}>
                {balanceVisible ? (
                  <Eye size={20} color="#fff" />
                ) : (
                  <EyeOff size={20} color="#fff" />
                )}
              </Pressable>
            </View>
            <Text className="text-3xl font-bold text-foreground">
              {balanceVisible ? `RM ${balance.toFixed(2)}` : 'RM ••••••'}
            </Text>
          </View>
        </View>

        {/* Monthly Summary */}
        <View className="flex-row mx-4 mt-3">
          <View className="flex-1 bg-card rounded-2xl p-4 mr-1.5 items-center border border-border">
            <Text className="text-xs text-muted-foreground mb-1">Income</Text>
            <Text className="text-lg font-semibold text-income">+RM {income.toFixed(2)}</Text>
          </View>
          <View className="flex-1 bg-card rounded-2xl p-4 ml-1.5 items-center border border-border">
            <Text className="text-xs text-muted-foreground mb-1">Expenses</Text>
            <Text className="text-lg font-semibold text-expense">-RM {expense.toFixed(2)}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="flex-row mx-4 mt-3">
          <Pressable
            onPress={() => router.push('/add-transaction')}
            className="flex-1 bg-primary rounded-2xl py-3 mr-1.5 items-center"
          >
            <Text className="text-sm font-semibold text-primary-foreground">Add Transaction</Text>
          </Pressable>
          <Pressable className="flex-1 bg-card rounded-2xl py-3 ml-1.5 items-center border border-border">
            <Text className="text-sm font-semibold text-foreground">Transfer</Text>
          </Pressable>
        </View>

        {/* Transaction History */}
        <View className="mt-5 mb-4">
          <View className="flex-row items-center justify-between px-4 mb-3">
            <Text className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Transaction History</Text>
            <Pressable>
              <Text className="text-xs text-primary font-medium">See All</Text>
            </Pressable>
          </View>
          <View className="gap-2 px-4">
            {accountTransactions.length === 0 ? (
              <Text className="text-sm text-muted-foreground text-center py-4">No transactions yet</Text>
            ) : (
              accountTransactions.map((tx) => {
                const formattedAmount = `${tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}RM ${Math.abs(tx.amount).toFixed(2)}`;
                const formattedDate = new Date(tx.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                return (
                  <Pressable
                    key={tx.id}
                    onPress={() => handleTxPress(tx)}
                    className="flex-row items-center justify-between bg-card border border-border rounded-xl px-4 py-3 active:scale-[0.98] transition-transform"
                  >
                    <View className="flex-row items-center gap-3">
                      <View className="w-9 h-9 rounded-xl bg-secondary items-center justify-center">
                        <Text className="text-base">{tx.category ? getCategoryEmoji(tx.category) : '💰'}</Text>
                      </View>
                      <View>
                        <View className="flex-row items-center gap-1.5">
                          <Text className="text-sm font-medium text-foreground">{tx.name}</Text>
                          {tx.is_recurring && <RefreshCw size={10} color="#a0a0a0" />}
                          {tx.type === 'expense' && <Receipt size={10} color="#a0a0a0" />}
                        </View>
                        <Text className="text-xs text-muted-foreground">{formattedDate}</Text>
                      </View>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <Text
                        className={`text-sm font-semibold ${
                          tx.type === 'income' ? 'text-income' : 'text-expense'
                        }`}
                      >
                        {formattedAmount}
                      </Text>
                      <ChevronRight size={16} color="#a0a0a0" />
                    </View>
                  </Pressable>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>

      {/* Edit Wallet Modal */}
      <Modal visible={showEdit} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/70">
          <View className="bg-card rounded-t-3xl p-6 pb-10" onStartShouldSetResponder={() => true}>
            <View className="flex-row items-center justify-between mb-5">
              <Text className="text-lg font-bold text-foreground">Edit Wallet</Text>
              <Pressable onPress={() => setShowEdit(false)}>
                <X size={24} color="#888" />
              </Pressable>
            </View>

            <View className="mb-4">
              <Text className="text-xs text-muted-foreground mb-1">Wallet Name</Text>
              <TextInput
                className="bg-background border border-border rounded-xl px-4 py-3 text-foreground"
                placeholder="Wallet name"
                placeholderTextColor="#888"
                value={editName}
                onChangeText={setEditName}
              />
            </View>

            <View className="mb-4">
              <Text className="text-xs text-muted-foreground mb-1">Balance (RM)</Text>
              <TextInput
                className="bg-background border border-border rounded-xl px-4 py-3 text-foreground"
                placeholder="0.00"
                placeholderTextColor="#888"
                keyboardType="numeric"
                value={editBalance}
                onChangeText={(text) => setEditBalance(text.replace(/[^0-9.]/g, ''))}
              />
            </View>

            {/* Color Picker */}
            <View className="mb-5">
              <Text className="text-xs text-muted-foreground mb-2">Color</Text>
              <View className="flex-row flex-wrap">
                {EDIT_COLORS.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => setEditColor(c)}
                    className="w-9 h-9 rounded-full m-1"
                    style={{
                      backgroundColor: c,
                      borderWidth: editColor === c ? 3 : 0,
                      borderColor: '#fff',
                    }}
                  />
                ))}
              </View>
            </View>

            {editError ? (
              <View className="flex-row items-center gap-1.5 mb-3">
                <AlertCircle size={14} color="#EF4444" />
                <Text className="text-xs text-red-400">{editError}</Text>
              </View>
            ) : null}

            <Pressable
              onPress={handleSaveEdit}
              disabled={actionLoading}
              className="bg-primary rounded-2xl py-4 items-center"
            >
              <Text className="text-sm font-bold text-black">{actionLoading ? 'Saving...' : 'Save Changes'}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Transaction Detail */}
      <TransactionDetail
        transaction={selectedTx}
        visible={detailVisible}
        onClose={() => setDetailVisible(false)}
        onDeleted={() => { setDetailVisible(false); refetchTransactions(); fetchAccounts(); }}
      />
    </SafeAreaView>
  );
}