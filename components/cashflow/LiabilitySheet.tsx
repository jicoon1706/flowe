import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { LIABILITY_TYPES } from '@/constants/balanceSheetTypes';
import { parseAmount } from '@/src/lib/money';
import { monthStart } from '@/src/utils/monthStart';
import type { Liability, LiabilityType } from '@/src/types';
import { AmountField } from '../ui/AmountField';
import { Button } from '../ui/Button';
import { Chip } from '../ui/Chip';
import { Sheet } from '../ui/Sheet';
import { Text } from '../ui/Text';
import { TextInput } from '../ui/TextInput';
import { Toggle } from '../ui/Toggle';

export interface LiabilityInput {
  name: string;
  type: LiabilityType;
  iconKey: string;
  amountOwed: number;
  monthlyPayment: number;
  interestRate: number;
  asOfMonth: string;
  /** Also create a monthly recurring bill for the payment. */
  addRecurring: boolean;
}

export interface LiabilitySheetProps {
  visible: boolean;
  onClose: () => void;
  initial: Liability | null;
  onSubmit: (l: LiabilityInput) => Promise<boolean>;
  onDelete?: () => void;
}

/** Add / edit liability (ins-add-liability). An optional monthly payment can become a recurring bill. */
export function LiabilitySheet({ visible, onClose, initial, onSubmit, onDelete }: LiabilitySheetProps) {
  const editing = !!initial;
  const [name, setName] = useState('');
  const [type, setType] = useState<LiabilityType>('study_loan');
  const [owed, setOwed] = useState('');
  const [payment, setPayment] = useState('');
  const [rate, setRate] = useState('');
  const [recurring, setRecurring] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setName(initial?.name ?? '');
    setType(initial?.type ?? 'study_loan');
    setOwed(initial ? String(initial.amount_owed) : '');
    setPayment(initial?.monthly_payment ? String(initial.monthly_payment) : '');
    setRate(initial?.interest_rate ? String(initial.interest_rate) : '');
    setRecurring(!initial);
    setError(null);
  }, [visible, initial]);

  const pay = parseAmount(payment) ?? 0;

  const submit = async () => {
    const amt = parseAmount(owed);
    if (!name.trim()) { setError('Give the liability a name'); return; }
    if (amt === null || amt < 0) { setError('Enter the amount owed'); return; }
    setSaving(true);
    const opt = LIABILITY_TYPES.find((o) => o.value === type) ?? LIABILITY_TYPES[0];
    const ok = await onSubmit({
      name: name.trim(), type, iconKey: opt.iconKey, amountOwed: amt, monthlyPayment: pay,
      interestRate: Number(rate) || 0, asOfMonth: monthStart(new Date()), addRecurring: !editing && recurring && pay > 0,
    });
    setSaving(false);
    if (ok) onClose();
  };

  return (
    <Sheet visible={visible} onClose={onClose} title={editing ? 'Edit liability' : 'Add liability'} scroll dismissible={!saving} testID="liability-sheet">
      <View style={{ gap: 16 }}>
        <TextInput label="Name" value={name} onChangeText={setName} autoCapitalize="words" placeholder="e.g. PTPTN" />
        <View style={{ gap: 8 }}>
          <Text variant="label-sm" tone="muted">Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {LIABILITY_TYPES.map((o) => <Chip key={o.value} label={o.label} selected={o.value === type} onPress={() => setType(o.value)} />)}
          </ScrollView>
        </View>
        <AmountField label="Amount owed" value={owed} onChangeText={setOwed} />
        <TextInput label="Monthly payment (optional)" prefix="RM" keyboardType="decimal-pad" value={payment} onChangeText={setPayment} />
        <TextInput label="Interest rate % (optional)" keyboardType="decimal-pad" value={rate} onChangeText={setRate} />
        {!editing && pay > 0 ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text variant="body-md" style={{ flex: 1 }}>Add the monthly payment as a recurring bill</Text>
            <Toggle value={recurring} onValueChange={setRecurring} accessibilityLabel="Add as recurring bill" />
          </View>
        ) : null}
        {error ? <Text variant="label-sm" accessibilityRole="alert">{error}</Text> : null}
        <View style={{ gap: 4 }}>
          <Button label={editing ? 'Save liability' : 'Add liability'} onPress={submit} loading={saving} loadingLabel="Saving…" fullWidth />
          {editing && onDelete ? <Button label="Delete liability" variant="text" muted disabled={saving} onPress={onDelete} style={{ alignSelf: 'center' }} /> : null}
        </View>
      </View>
    </Sheet>
  );
}
