import { useState, useFocusEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, ChevronRight, Eye, EyeOff, Copy, Pencil, RefreshCw, Receipt } from '../../../../components/ui/icons';
import { useAccounts } from '../../../../src/hooks/useAccounts';
import { useTransactions } from '../../../../src/hooks/useTransactions';
import { LoadingView } from '../../../../components/ui/LoadingView';
import { ErrorView } from '../../../../components/ui/ErrorView';

function getCategoryEmoji(category: string): string {
  const map: Record<string, string> = {
    'Food & Drink': '🍔', Transport: '🚗', Shopping: '🛍️', Bills: '🧾',
    Entertainment: '🎬', Health: '💊', Income: '💼', Transfer: '🔄', Other: '💰',
  };
  return map[category] ?? '💰';
}

export default function AccountDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [copied, setCopied] = useState(false);

  const { accounts, loading, error, fetchAccounts } = useAccounts();
  const now = new Date();
  const { transactions, loading: txLoading, error: txError } = useTransactions(now.getFullYear(), now.getMonth() + 1);

  useFocusEffect(useCallback(() => {
    fetchAccounts();
  }, [fetchAccounts]));

  const accountId = typeof id === 'string' ? id : '';
  const account = accounts.find((a) => a.id === accountId) ?? accounts[0];
  const accountTransactions = transactions.filter((t) => t.from_account_id === accountId || t.to_account_id === accountId);

  const income = accountTransactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expense = accountTransactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  const bankAccount = (account as any)?.bank_accounts;
  const balance = bankAccount?.current_balance ?? 0;
  const bankColor = account?.color ?? '#ffd93d';
  const last4 = bankAccount?.account_number?.slice(-4) ?? '0000';
  const bankName = bankAccount?.bank_name ?? account?.name ?? '';

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        <Pressable>
          <Pencil size={22} color="#fff" />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Balance Card */}
        <View className="mx-4 mt-4 bg-card rounded-2xl overflow-hidden border border-border">
          <View style={{ backgroundColor: bankColor }} className="h-1" />
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
            <Text className="text-3xl font-bold text-foreground mb-3">
              {balanceVisible ? `RM ${balance.toFixed(2)}` : 'RM ••••••'}
            </Text>
            <Pressable onPress={handleCopy} className="flex-row items-center">
              <Text className="text-sm text-muted-foreground mr-1">
                {last4 === '0000' ? 'Cash Account' : `Account ending ${last4}`}
              </Text>
              <Copy size={14} color="#888" />
            </Pressable>
            {copied && (
              <Text className="text-xs text-primary mt-1">Copied!</Text>
            )}
          </View>
        </View>

        {/* Monthly Summary */}
        <View className="flex-row mx-4 mt-3">
          <View className="flex-1 bg-card rounded-2xl p-4 mr-1.5 border border-border">
            <Text className="text-xs text-muted-foreground mb-1">Income</Text>
            <Text className="text-lg font-semibold text-income">+RM {income.toFixed(2)}</Text>
          </View>
          <View className="flex-1 bg-card rounded-2xl p-4 ml-1.5 border border-border">
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
                          tx.type === 'income' ? 'text-income' : tx.type === 'transfer' ? 'text-muted-foreground' : 'text-expense'
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
    </SafeAreaView>
  );
}