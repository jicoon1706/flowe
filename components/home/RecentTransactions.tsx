import { View, Text, Pressable } from 'react-native';
import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { RefreshCw, Image, ChevronRight } from 'lucide-react-native';
import { TransactionDetail, TransactionData } from './TransactionDetail';
import type { Transaction, CustomCategory } from '../../src/types/database.types';
import { resolveCategory } from '../../src/utils/resolveCategory';
import { useCustomCategories } from '../../src/hooks/useCustomCategories';
import { MerchantIcon } from '../ui/MerchantIcon';
import { useAuth } from '../../context/AuthContext';

interface RecentTransactionsProps {
  transactions?: Transaction[];
  /**
   * Hide every amount. Set while the app is still locked (or the eye toggle
   * is off): the names and dates stay, since they're what the user scans for
   * "did I already log that?", but nothing in ringgit is shown.
   */
  masked?: boolean;
  /**
   * Asked before opening a row while masked. Resolves true once the user has
   * unlocked, at which point the tap goes ahead as normal.
   */
  onRequestUnlock?: () => Promise<boolean>;
  onSeeAll: () => void;
  onTransactionPress?: (id: string) => void;
  onTransactionDeleted?: (id: string) => void;
}

function formatTxDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const txDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (txDate.getTime() === today.getTime()) return 'Today';
  if (txDate.getTime() === yesterday.getTime()) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function RecentTransactions({ transactions, masked = false, onRequestUnlock, onSeeAll, onTransactionPress, onTransactionDeleted }: RecentTransactionsProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { categories: customCategories, fetchCategories: fetchCustomCategories } = useCustomCategories();
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useFocusEffect(useCallback(() => {
    if (user) fetchCustomCategories(user.id);
  }, [fetchCustomCategories, user]));

  const customByName: Record<string, CustomCategory> = Object.fromEntries(
    customCategories.map((c) => [c.name, c])
  );

  const txs: Transaction[] = transactions ?? [];
  const displayTxs = txs.slice(0, 5);

  const handleEdit = (id: string) => {
    const tx = txs.find((t) => t.id === id);
    if (!tx) return;
    setModalVisible(false);
    router.push({
      pathname: '/(main)/add-transaction',
      params: {
        editId: tx.id,
        type: tx.type,
        name: tx.name,
        amount: String(tx.amount),
        category: tx.category ?? '',
        fromAccountId: tx.from_account_id ?? '',
        toAccountId: tx.to_account_id ?? '',
        date: tx.date,
        note: tx.note ?? '',
        // Unique per tap so the edit screen re-prefills even when its instance
        // is reused (re-editing the same transaction).
        nonce: String(Date.now()),
      },
    });
  };

  const handleTransactionPress = async (tx: Transaction) => {
    // The detail sheet shows the amount, so a masked row asks first. Nothing
    // to ask with means the row simply stays closed.
    if (masked) {
      if (!onRequestUnlock || !(await onRequestUnlock())) return;
    }
    const cat = resolveCategory(tx, customByName);
    const data: TransactionData = {
      id: tx.id,
      name: tx.name,
      category: cat.name,
      categoryIcon: cat.emoji,
      amount: (tx.type === 'expense' || tx.type === 'tabung_topup' ? '-' : '+') + tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 }),
      type: tx.type as 'expense' | 'income' | 'transfer',
      date: formatTxDate(tx.date),
      recurring: tx.is_recurring,
      recurringFreq: (tx as any).recurring?.frequency,
      startDate: (tx as any).recurring?.start_date,
      endDate: (tx as any).recurring?.end_date,
      reminder: (tx as any).recurring?.reminder_enabled ? 'Enabled' : undefined,
      note: tx.note,
      hasReceipt: !!tx.receipt_url,
      receiptPath: tx.receipt_url,
      account: tx.type === 'income'
        ? (tx as any).to_account?.name
        : (tx as any).from_account?.name,
      toAccount: (tx as any).to_account?.name,
    };
    setSelectedTransaction(data);
    setModalVisible(true);
    onTransactionPress?.(tx.id);
  };

  return (
    <>
      <View className="px-4 pb-36 flex-1">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
            Recent Transactions
          </Text>
          <Pressable onPress={onSeeAll}>
            <Text className="text-xs text-primary font-medium">See All</Text>
          </Pressable>
        </View>
        <View className="gap-2">
          {displayTxs.map((tx) => (
            <Pressable
              key={tx.id}
              onPress={() => handleTransactionPress(tx)}
              className="flex-row items-center justify-between bg-card border border-border rounded-xl px-4 py-3 active:scale-[0.98] transition-transform"
            >
              <View className="flex-row items-center gap-3">
                <MerchantIcon name={tx.name} fallback={resolveCategory(tx, customByName).emoji} />
                <View>
                  <View className="flex-row items-center gap-1.5">
                    <Text className="text-sm font-medium text-foreground">{tx.name}</Text>
                    {tx.is_recurring && <RefreshCw size={10} color="#a0a0a0" />}
                    {tx.receipt_url && <Image size={10} color="#a0a0a0" />}
                  </View>
                  <Text className="text-xs text-muted-foreground">{formatTxDate(tx.date)}</Text>
                </View>
              </View>
              <View className="flex-row items-center gap-2">
                <Text
                  className={`text-sm font-semibold ${
                    tx.type === 'income' ? 'text-income' : tx.type === 'expense' || tx.type === 'tabung_topup' ? 'text-expense' : tx.type === 'transfer' ? 'text-[#00d4ff]' : 'text-primary'
                  }`}
                >
                  {masked
                    ? '••••'
                    : ((tx.type === 'expense' || tx.type === 'tabung_topup') ? '-' : '+') + tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Text>
                <ChevronRight size={16} color="#a0a0a0" />
              </View>
            </Pressable>
          ))}
        </View>
      </View>

      <TransactionDetail
        transaction={selectedTransaction}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onDeleted={(id) => {
          setModalVisible(false);
          onTransactionDeleted?.(id);
        }}
        onEdit={handleEdit}
      />
    </>
  );
}