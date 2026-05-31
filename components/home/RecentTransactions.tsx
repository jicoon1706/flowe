import { View, Text, Pressable } from 'react-native';
import { useState } from 'react';
import { RefreshCw, Image, ChevronRight } from 'lucide-react-native';
import { TransactionDetail, TransactionData } from './TransactionDetail';
import type { Transaction } from '../../src/types/database.types';

const CATEGORY_ICONS: Record<string, string> = {
  Food: '🍔', Transport: '🚗', Bills: '🧾', Income: '💼', Transfer: '🔄',
};

interface RecentTransactionsProps {
  transactions?: Transaction[];
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

export function RecentTransactions({ transactions, onSeeAll, onTransactionPress, onTransactionDeleted }: RecentTransactionsProps) {
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const txs: Transaction[] = transactions ?? [];
  const displayTxs = txs.slice(0, 5);

  const handleTransactionPress = (tx: Transaction) => {
    const data: TransactionData = {
      id: tx.id,
      name: tx.name,
      category: tx.category ?? 'Other',
      categoryIcon: CATEGORY_ICONS[tx.category ?? 'Other'] ?? '📦',
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
                <View className="w-9 h-9 rounded-xl bg-secondary items-center justify-center">
                  <Text className="text-base">{CATEGORY_ICONS[tx.category ?? 'Other'] ?? '📦'}</Text>
                </View>
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
                  {((tx.type === 'expense' || tx.type === 'tabung_topup') ? '-' : '+') + tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
      />
    </>
  );
}