import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { Pen } from 'lucide-react-native';
import { colors, radius } from '@/theme/tokens';
import { categoryIcon } from '@/constants/categoryIcons';
import { transactionsRepository } from '@/src/repositories/transactions.repository';
import { storageService } from '@/src/services/storage';
import { notify } from '@/src/services/notifications';
import { formatRM } from '@/src/lib/money';
import { describeTransaction, timeOf, type TxWithAccounts } from '@/src/utils/transactionDisplay';
import { accountDomain, type AnyAccount } from '@/src/utils/accountDisplay';
import type { CustomCategory } from '@/src/types';
import { Button } from '../ui/Button';
import { ConfirmSheet } from '../ui/ConfirmSheet';
import { DetailRow } from '../ui/DetailRow';
import { LogoWell } from '../ui/LogoWell';
import { Money } from '../ui/Money';
import { Sheet } from '../ui/Sheet';
import { Text } from '../ui/Text';
import { useToast } from '../ui/ToastProvider';

export interface TransactionDetailProps {
  transaction: TxWithAccounts | null;
  visible: boolean;
  onClose: () => void;
  onEdit: (tx: TxWithAccounts) => void;
  /** After delete and after Undo, so lists refresh. */
  onChanged?: () => void;
  accounts?: AnyAccount[];
  customCategories?: CustomCategory[];
  masked?: boolean;
}

/**
 * Transaction detail sheet (core-transaction-detail): logo, signed amount,
 * category / account / date / note / source. Primary: Edit. Delete = text
 * button → ConfirmSheet → toast with Undo (5 s).
 */
export function TransactionDetail({ transaction: tx, visible, onClose, onEdit, onChanged, accounts = [], customCategories = [], masked }: TransactionDetailProps) {
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

  useEffect(() => {
    setReceiptUrl(null);
    if (!visible || !tx?.receipt_url) return;
    let cancelled = false;
    storageService.getReceiptUrl(tx.receipt_url).then((r) => { if (!cancelled && r.ok) setReceiptUrl(r.data); });
    return () => { cancelled = true; };
  }, [visible, tx?.receipt_url]);

  if (!tx) return null;
  const d = describeTransaction(tx, customCategories);
  const fromName = tx.from_account?.name ?? accounts.find((a) => a.id === tx.from_account_id)?.name;
  const toName = tx.to_account?.name ?? accounts.find((a) => a.id === tx.to_account_id)?.name;
  const account = tx.type === 'income' ? toName : tx.type === 'transfer' ? [fromName, toName ?? tx.category].filter(Boolean).join(' → ') : fromName;
  const accountRow = accounts.find((a) => a.id === (tx.type === 'income' ? tx.to_account_id : tx.from_account_id));
  const dateText = `${new Date(`${tx.date.slice(0, 10)}T12:00:00`).toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} · ${timeOf(tx)}`;
  const balanceEffect = tx.type === 'expense' ? `${fromName ?? 'The account'} goes back up by ${formatRM(Number(tx.amount))}.`
    : tx.type === 'income' ? `${toName ?? 'The account'} goes down by ${formatRM(Number(tx.amount))}.`
    : 'Both account balances are restored.';

  const remove = async () => {
    const snapshot = tx;
    const res = await transactionsRepository.delete(snapshot.id);
    setConfirming(false);
    if (!res.ok) {
      toast.failure('Delete failed', { label: 'Retry', onPress: remove });
      return;
    }
    onClose();
    onChanged?.();
    notify({ type: snapshot.type === 'income' ? 'income' : snapshot.type === 'transfer' ? 'transfer' : 'expense', emoji: '🗑️', message: 'Transaction deleted', sub_text: `${snapshot.name} • ${formatRM(Number(snapshot.amount))}`, related_entity_id: snapshot.id });
    toast.show({
      kind: 'success',
      message: 'Transaction deleted',
      action: {
        label: 'Undo',
        onPress: async () => {
          const again = await transactionsRepository.create({
            user_id: snapshot.user_id,
            type: snapshot.type,
            name: snapshot.name,
            amount: Number(snapshot.amount),
            category: snapshot.category,
            from_account_id: snapshot.from_account_id ?? undefined,
            to_account_id: snapshot.to_account_id ?? undefined,
            date: snapshot.date,
            note: snapshot.note,
            receipt_url: snapshot.receipt_url,
            is_recurring: snapshot.is_recurring,
            recurring_id: snapshot.recurring_id,
            asset_id: snapshot.asset_id ?? undefined,
          });
          if (again.ok) { toast.success('Transaction restored'); onChanged?.(); }
          else toast.failure('Couldn’t restore it', { label: 'Retry', onPress: () => {} });
        },
      },
    });
  };


  return (
    <>
      <Sheet visible={visible && !confirming} onClose={onClose} scroll testID="transaction-detail">
        <View style={{ gap: 16 }}>
          <View style={{ alignItems: 'center', gap: 12 }}>
            <LogoWell merchant={tx.name} fallback={categoryIcon(d.iconKey, d.kind)} size={64} />
            <Text variant="body-lg">{tx.name}</Text>
            <Money amount={Number(tx.amount)} direction={d.direction} arrow variant="numeric-lg" smallCurrency masked={masked} />
          </View>
          <View>
            <DetailRow label="Category" value={d.label} icon={d.kind === 'transfer' ? categoryIcon(null, 'transfer') : categoryIcon(d.iconKey)} />
            {account ? <DetailRow label="Account" value={account} domain={accountDomain(accountRow)} /> : null}
            <DetailRow label="Date" value={dateText} />
            {tx.note ? <DetailRow label="Note" value={tx.note} /> : null}
          </View>
          {receiptUrl ? (
            <Image source={{ uri: receiptUrl }} style={{ height: 160, borderRadius: radius.sm, backgroundColor: colors['surface-container'] }} contentFit="cover" accessibilityLabel="Receipt photo" />
          ) : null}
          <View style={{ gap: 4 }}>
            <Button label="Edit" icon={Pen} onPress={() => { onClose(); onEdit(tx); }} fullWidth />
            <Button label="Delete" variant="text" muted onPress={() => setConfirming(true)} style={{ alignSelf: 'center' }} />
          </View>
        </View>
      </Sheet>
      <ConfirmSheet
        visible={confirming}
        title="Delete this transaction?"
        message={`${formatRM(Number(tx.amount))} at ${tx.name} will be removed. ${balanceEffect}`}
        confirmLabel="Delete"
        loadingLabel="Deleting…"
        onConfirm={remove}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}

