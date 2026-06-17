import { View, Text, Pressable, Modal, ScrollView, Image, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { transactionsRepository } from '../../src/repositories/transactions.repository';
import { storageService } from '../../src/services/storage';
import { notify } from '../../src/services/notifications';

const X = (props: { size: number; color: string }) => <MaterialIcons name="close" size={props.size} color={props.color} />;
const RefreshCw = (props: { size: number; color: string }) => <MaterialIcons name="refresh" size={props.size} color={props.color} />;
const Calendar = (props: { size: number; color: string }) => <MaterialIcons name="event" size={props.size} color={props.color} />;
const Trash = (props: { size: number; color: string }) => <MaterialIcons name="delete" size={props.size} color={props.color} />;
const Pencil = (props: { size: number; color: string }) => <MaterialIcons name="edit" size={props.size} color={props.color} />;

export interface TransactionData {
  id: string;
  name: string;
  category: string;
  categoryIcon: string;
  amount: string;
  type: 'expense' | 'income' | 'transfer';
  date: string;
  recurring: boolean;
  recurringFreq?: 'weekly' | 'monthly' | 'yearly';
  startDate?: string;
  endDate?: string;
  reminder?: string;
  note?: string;
  hasReceipt?: boolean;
  receiptPath?: string;
  account?: string;
  toAccount?: string;
}

interface TransactionDetailProps {
  transaction: TransactionData | null;
  visible: boolean;
  onClose: () => void;
  onDeleted?: (id: string) => void;
  onEdit?: (id: string) => void;
}

const typeColors = {
  expense: { bg: 'bg-expense/10', text: 'text-expense', label: 'Expense' },
  income: { bg: 'bg-income/10', text: 'text-income', label: 'Income' },
  transfer: { bg: 'bg-[#00d4ff]/10', text: 'text-[#00d4ff]', label: 'Transfer' },
};

export function TransactionDetail({ transaction, visible, onClose, onDeleted, onEdit }: TransactionDetailProps) {
  const [deleting, setDeleting] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [receiptViewerVisible, setReceiptViewerVisible] = useState(false);

  const receiptPath = transaction?.receiptPath;

  useEffect(() => {
    setReceiptUrl(null);
    if (!visible || !receiptPath) return;
    let cancelled = false;
    storageService.getReceiptUrl(receiptPath).then((result) => {
      if (!cancelled && result.ok) setReceiptUrl(result.data);
    });
    return () => { cancelled = true; };
  }, [visible, receiptPath]);

  if (!transaction) return null;

  const typeStyle = typeColors[transaction.type];

  const handleDelete = () => {
    Alert.alert(
      'Delete transaction?',
      'This will permanently remove this transaction.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            const result = await transactionsRepository.delete(transaction.id);
            setDeleting(false);
            if (!result.ok) {
              Alert.alert('Delete failed', result.error.message);
              return;
            }
            const emoji = transaction.type === 'income' ? '💰' : transaction.type === 'transfer' ? '🔄' : '💸';
            notify({
              type: transaction.type,
              emoji,
              message: `${typeColors[transaction.type].label} deleted`,
              sub_text: `${transaction.name} • ${transaction.amount}`,
              related_entity_id: transaction.id,
            });
            onDeleted?.(transaction.id);
            onClose();
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 justify-end">
        <Pressable className="flex-1" onPress={onClose} />
        <Pressable className="bg-card rounded-t-3xl max-h-[85%]">
          <View className="w-12 h-1 bg-border rounded-full mx-auto mt-3 mb-2" />
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-border">
            <Text className="text-lg font-semibold text-foreground">Transaction Details</Text>
            <Pressable onPress={onClose} className="p-2 -mr-2">
              <X size={20} color="#a0a0a0" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="px-5 py-4">
            {/* Type Badge + Category + Delete */}
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center gap-2 flex-wrap flex-1">
                <View className={`px-3 py-1 rounded-full ${typeStyle.bg}`}>
                  <Text className={`text-xs font-semibold ${typeStyle.text}`}>{typeStyle.label}</Text>
                </View>
                <View className="flex-row items-center gap-1.5 bg-secondary px-3 py-1 rounded-full">
                  <Text className="text-base">{transaction.categoryIcon}</Text>
                  <Text className="text-xs text-foreground">{transaction.category}</Text>
                </View>
              </View>
              <View className="flex-row items-center gap-2">
                <Pressable
                  onPress={() => onEdit?.(transaction.id)}
                  className="p-2 rounded-full bg-primary/10 active:opacity-70"
                  accessibilityLabel="Edit transaction"
                >
                  <Pencil size={18} color="#C5FF00" />
                </Pressable>
                <Pressable
                  onPress={handleDelete}
                  disabled={deleting}
                  className="p-2 -mr-2 rounded-full bg-destructive/10 active:opacity-70"
                  accessibilityLabel="Delete transaction"
                >
                  <Trash size={18} color="#ff4444" />
                </Pressable>
              </View>
            </View>

            {/* Amount */}
            <Text
              className={`text-3xl font-bold mb-4 ${
                transaction.type === 'income' ? 'text-income' : transaction.type === 'expense' ? 'text-expense' : transaction.type === 'transfer' ? 'text-[#00d4ff]' : 'text-primary'
              }`}
            >
              {transaction.amount}
            </Text>

            {/* Name */}
            <View className="mb-4">
              <Text className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Description</Text>
              <Text className="text-base text-foreground font-medium">{transaction.name}</Text>
            </View>

            {/* Account Info */}
            <View className="mb-4">
              <Text className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                {transaction.type === 'transfer' ? 'From → To' : 'Account'}
              </Text>
              <View className="bg-secondary rounded-xl px-4 py-3">
                {transaction.type === 'transfer' && transaction.toAccount ? (
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm text-foreground">{transaction.account || 'Account'}</Text>
                    <Text className="text-muted-foreground">→</Text>
                    <Text className="text-sm text-foreground">{transaction.toAccount}</Text>
                  </View>
                ) : (
                  <Text className="text-sm text-foreground">{transaction.account || 'Account'}</Text>
                )}
              </View>
            </View>

            {/* Date */}
            <View className="mb-4">
              <Text className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Date</Text>
              <View className="flex-row items-center gap-2 bg-secondary rounded-xl px-4 py-3">
                <Calendar size={16} color="#a0a0a0" />
                <Text className="text-sm text-foreground">{transaction.date}</Text>
              </View>
            </View>

            {/* Recurring Details */}
            {transaction.recurring && (
              <View className="mb-4">
                <Text className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Recurring</Text>
                <View className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-3">
                  <View className="flex-row items-center gap-2 mb-2">
                    <RefreshCw size={16} color="#C5FF00" />
                    <Text className="text-sm text-primary font-medium">
                      {transaction.recurringFreq ? transaction.recurringFreq.charAt(0).toUpperCase() + transaction.recurringFreq.slice(1) : 'Monthly'}
                    </Text>
                  </View>
                  {transaction.startDate && (
                    <View className="flex-row items-center gap-2 mb-1">
                      <Text className="text-xs text-muted-foreground">Start:</Text>
                      <Text className="text-xs text-foreground">{transaction.startDate}</Text>
                    </View>
                  )}
                  {transaction.endDate && (
                    <View className="flex-row items-center gap-2 mb-1">
                      <Text className="text-xs text-muted-foreground">End:</Text>
                      <Text className="text-xs text-foreground">{transaction.endDate}</Text>
                    </View>
                  )}
                  {transaction.reminder && (
                    <View className="flex-row items-center gap-2">
                      <Text className="text-xs text-muted-foreground">Reminder:</Text>
                      <Text className="text-xs text-foreground">{transaction.reminder}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Note */}
            {transaction.note && (
              <View className="mb-4">
                <Text className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Note</Text>
                <View className="bg-secondary rounded-xl px-4 py-3">
                  <Text className="text-sm text-foreground">{transaction.note}</Text>
                </View>
              </View>
            )}

            {/* Receipt Image */}
            {transaction.hasReceipt && (
              <View className="mb-4">
                <Text className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Receipt</Text>
                {receiptUrl ? (
                  <Pressable
                    onPress={() => setReceiptViewerVisible(true)}
                    className="bg-secondary rounded-xl overflow-hidden active:opacity-80"
                    accessibilityLabel="View receipt"
                  >
                    <Image
                      source={{ uri: receiptUrl }}
                      className="w-full h-40"
                      resizeMode="cover"
                    />
                  </Pressable>
                ) : (
                  <View className="bg-secondary rounded-xl h-40 items-center justify-center">
                    <Text className="text-xs text-muted-foreground">Loading receipt…</Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </Pressable>
      </View>

      {/* Fullscreen Receipt Viewer */}
      <Modal visible={receiptViewerVisible} transparent animationType="fade" onRequestClose={() => setReceiptViewerVisible(false)}>
        <Pressable className="flex-1 bg-black/90 justify-center" onPress={() => setReceiptViewerVisible(false)}>
          <Pressable
            onPress={() => setReceiptViewerVisible(false)}
            className="absolute top-12 right-5 z-10 p-2 rounded-full bg-white/10"
            accessibilityLabel="Close receipt"
          >
            <X size={24} color="#ffffff" />
          </Pressable>
          {receiptUrl && (
            <Image source={{ uri: receiptUrl }} className="w-full h-2/3" resizeMode="contain" />
          )}
        </Pressable>
      </Modal>
    </Modal>
  );
}