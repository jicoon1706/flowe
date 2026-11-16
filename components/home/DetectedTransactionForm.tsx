import { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { CalendarDays, Landmark, Wallet } from 'lucide-react-native';
import { expenseCategories, incomeCategories } from '@/constants/categories';
import { categoryOptions } from '@/constants/categoryIcons';
import { merchantCategory } from '@/src/utils/merchantLogo';
import { accountDomain, spendableAccounts, type AnyAccount } from '@/src/utils/accountDisplay';
import type { DetectedTransaction, SaveOverrides } from '@/src/hooks/useDetectedTransactions';
import { AccountPill } from '../ui/AccountPill';
import { AccountSelector } from '../ui/AccountSelector';
import { Button } from '../ui/Button';
import { Chip } from '../ui/Chip';
import { InlineError } from '../ui/InlineError';
import { LogoWell } from '../ui/LogoWell';
import { Money } from '../ui/Money';
import { SegmentedToggle } from '../ui/SegmentedToggle';
import { Sheet } from '../ui/Sheet';
import { Text } from '../ui/Text';
import { TextInput } from '../ui/TextInput';

export interface DetectedTransactionFormProps {
  visible: boolean;
  detected: DetectedTransaction | null;
  accounts: AnyAccount[];
  onSave: (detected: DetectedTransaction, values: SaveOverrides) => Promise<{ ok: boolean }>;
  onDismiss: (id: string) => void;
  onClose: () => void;
}

export function alertTimeLabel(postedAt: number): string {
  const d = new Date(postedAt);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  const time = d.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', hour12: false });
  return sameDay ? `Today ${time}` : `${d.toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })} ${time}`;
}

/**
 * "Edit detected" sheet (m-detected-form): everything pre-filled from the alert,
 * the user fixes one field. Primary: Confirm. Dismiss = not a transaction.
 */
export function DetectedTransactionForm({ visible, detected, accounts, onSave, onDismiss, onClose }: DetectedTransactionFormProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [accountId, setAccountId] = useState('');
  const [category, setCategory] = useState('');
  const [saving, setSaving] = useState(false);
  const [picker, setPicker] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    if (!detected) return;
    const n = detected.suggestedName ?? detected.parsed.merchant ?? '';
    setName(n);
    setType(detected.parsed.type);
    setAccountId(detected.accountId ?? '');
    setCategory(detected.parsed.type === 'expense' ? merchantCategory(n) ?? 'food' : 'salary');
    setShowErrors(false);
  }, [detected]);

  const options = useMemo(
    () => categoryOptions(type === 'expense' ? expenseCategories : incomeCategories, [], type),
    [type],
  );
  const selectable = spendableAccounts(accounts);
  const account = selectable.find((a) => a.id === accountId);
  if (!detected) return null;

  const nameError = showErrors && !name.trim() ? 'Add a merchant name' : null;
  const accountError = showErrors && !accountId ? 'Choose the account this came from' : null;

  const confirm = async () => {
    if (!name.trim() || !accountId) { setShowErrors(true); return; }
    setSaving(true);
    const res = await onSave(detected, { name: name.trim(), type, accountId, category });
    setSaving(false);
    if (res.ok) onClose();
  };

  return (
    <Sheet visible={visible} onClose={onClose} dismissible={!saving} scroll testID="detected-form">
      <View style={{ gap: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text variant="headline-md" accessibilityRole="header">Edit detected</Text>
          <Text variant="label-sm" tone="muted">{detected.sourceLabel} alert</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <LogoWell merchant={name} size={48} />
          <Money amount={detected.parsed.amount} variant="numeric-lg" smallCurrency />
        </View>
        <SegmentedToggle
          options={[{ value: 'expense', label: 'Expense' }, { value: 'income', label: 'Income' }]}
          value={type}
          onChange={(t) => { setType(t); setCategory(t === 'expense' ? 'food' : 'salary'); }}
        />
        <TextInput label="Merchant" value={name} onChangeText={setName} error={nameError} autoCapitalize="words" returnKeyType="done" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {options.map((o) => (
            <Chip key={o.value} label={o.label} icon={o.icon} selected={o.value === category} onPress={() => setCategory(o.value)} />
          ))}
        </ScrollView>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          <AccountPill
            label={account?.name ?? 'Choose account'}
            domain={accountDomain(account)}
            icon={account?.type === 'wallet' ? Wallet : Landmark}
            onPress={() => setPicker(true)}
            invalid={!!accountError}
            accessibilityLabel={`Account: ${account?.name ?? 'none'}`}
          />
          <AccountPill label={alertTimeLabel(detected.parsed.postedAt)} plainIcon={CalendarDays} accessibilityLabel={`Date: ${alertTimeLabel(detected.parsed.postedAt)}`} />
        </View>
        {accountError ? <InlineError message={accountError} /> : null}
        <View style={{ gap: 4, marginTop: 8 }}>
          <Button label="Confirm" onPress={confirm} loading={saving} loadingLabel="Confirming…" fullWidth />
          <Button label="Dismiss" variant="text" muted disabled={saving} onPress={() => { onDismiss(detected.id); onClose(); }} style={{ alignSelf: 'center' }} />
        </View>
      </View>
      <AccountSelector visible={picker} onClose={() => setPicker(false)} accounts={selectable} selectedId={accountId} onSelect={setAccountId} />
    </Sheet>
  );
}
