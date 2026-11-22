import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Landmark, Wallet } from 'lucide-react-native';
import { ASSET_TYPES, UNIT_FOR_ASSET, VALUED_ASSET_TYPES } from '@/constants/balanceSheetTypes';
import { parseAmount, roundCents } from '@/src/lib/money';
import { monthStart } from '@/src/utils/monthStart';
import { accountDomain, type AnyAccount } from '@/src/utils/accountDisplay';
import type { Asset, AssetType } from '@/src/types';
import { AccountPill } from '../ui/AccountPill';
import { AccountSelector } from '../ui/AccountSelector';
import { AmountField } from '../ui/AmountField';
import { Button } from '../ui/Button';
import { Chip } from '../ui/Chip';
import { Sheet } from '../ui/Sheet';
import { Text } from '../ui/Text';
import { TextInput } from '../ui/TextInput';
import { Toggle } from '../ui/Toggle';

export interface AssetInput {
  name: string;
  type: AssetType;
  iconKey: string;
  /** Total value after this save. */
  value: number;
  monthlyIncome: number;
  quantity?: number;
  unit?: string;
  note?: string;
  asOfMonth: string;
  /** Money that went in just now (new value, or the top-up when editing). */
  contribution: number;
  fundFromAccountId?: string;
}

export interface AssetSheetProps {
  visible: boolean;
  onClose: () => void;
  initial: Asset | null;
  accounts: AnyAccount[];
  onSubmit: (a: AssetInput) => Promise<boolean>;
  onDelete?: () => void;
  /** Add: the type picked in the type picker. */
  initialType?: AssetType;
  /** Gold and KWSP have their own forms here, so their chips are hidden (tablet). */
  valuedForms?: boolean;
}

/** Add / edit asset (ins-add-asset). Type defaults to an investment; optional funding from an account. */
export function AssetSheet({ visible, onClose, initial, accounts, onSubmit, onDelete, initialType, valuedForms = false }: AssetSheetProps) {
  const editing = !!initial;
  const [name, setName] = useState('');
  const [type, setType] = useState<AssetType>('stocks');
  const [value, setValue] = useState('');
  const [topUp, setTopUp] = useState('');
  const [income, setIncome] = useState('');
  const [qty, setQty] = useState('');
  const [fund, setFund] = useState(false);
  const [fundId, setFundId] = useState<string | null>(null);
  const [picker, setPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setName(initial?.name ?? '');
    setType(initial?.type ?? initialType ?? 'stocks');
    setValue(initial ? String(initial.current_value) : '');
    setIncome(initial?.monthly_income ? String(initial.monthly_income) : '');
    setQty(initial?.quantity != null ? String(initial.quantity) : '');
    setTopUp('');
    setFund(false);
    setFundId(null);
    setError(null);
  }, [visible, initial, initialType]);

  const unit = UNIT_FOR_ASSET[type];
  const base = parseAmount(value) ?? 0;
  const add = editing ? parseAmount(topUp) ?? 0 : 0;
  const contribution = editing ? add : base;
  const fundAccount = accounts.find((a) => a.id === fundId);

  const submit = async () => {
    if (!name.trim()) { setError('Give the asset a name'); return; }
    if (!editing && base <= 0) { setError('Enter a value above RM 0.00'); return; }
    if (fund && contribution > 0 && !fundId) { setError('Choose the account it comes from'); return; }
    setSaving(true);
    const opt = ASSET_TYPES.find((o) => o.value === type) ?? ASSET_TYPES[0];
    const ok = await onSubmit({
      name: name.trim(),
      type,
      iconKey: opt.iconKey,
      value: roundCents(base + add),
      monthlyIncome: parseAmount(income) ?? 0,
      quantity: unit ? Number(qty || 0) : undefined,
      unit,
      asOfMonth: monthStart(new Date()),
      contribution,
      fundFromAccountId: fund && contribution > 0 ? fundId ?? undefined : undefined,
    });
    setSaving(false);
    if (ok) onClose();
  };

  return (
    <Sheet visible={visible} onClose={onClose} title={editing ? 'Edit asset' : 'Add asset'} scroll dismissible={!saving} testID="asset-sheet">
      <View style={{ gap: 16 }}>
        <TextInput label="Name" value={name} onChangeText={setName} autoCapitalize="words" placeholder="e.g. ASB" />
        <View style={{ gap: 8 }}>
          <Text variant="label-sm" tone="muted">Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {ASSET_TYPES.filter((o) => o.value === initial?.type || (o.value !== 'kwsp' && !(valuedForms && VALUED_ASSET_TYPES.includes(o.value)))).map((o) => <Chip key={o.value} label={o.label} selected={o.value === type} onPress={() => setType(o.value)} />)}
          </ScrollView>
        </View>
        <AmountField label={editing ? 'Value now' : 'Value'} value={value} onChangeText={setValue} />
        {editing ? <TextInput label="Top up (optional)" prefix="RM" keyboardType="decimal-pad" value={topUp} onChangeText={setTopUp} /> : null}
        {unit ? <TextInput label={`Amount held (${unit})`} keyboardType="decimal-pad" value={qty} onChangeText={setQty} /> : null}
        <TextInput label="Monthly income from it (optional)" prefix="RM" keyboardType="decimal-pad" value={income} onChangeText={setIncome} />
        {accounts.length && contribution > 0 ? (
          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text variant="body-md" style={{ flex: 1 }}>Paid from one of my accounts</Text>
              <Toggle value={fund} onValueChange={setFund} accessibilityLabel="Paid from one of my accounts" />
            </View>
            {fund ? (
              <View style={{ flexDirection: 'row' }}>
                <AccountPill label={fundAccount?.name ?? 'Choose account'} domain={accountDomain(fundAccount)} icon={fundAccount?.type === 'wallet' ? Wallet : Landmark} onPress={() => setPicker(true)} />
              </View>
            ) : null}
          </View>
        ) : null}
        {error ? <Text variant="label-sm" accessibilityRole="alert">{error}</Text> : null}
        <View style={{ gap: 4 }}>
          <Button label={editing ? 'Save asset' : 'Add asset'} onPress={submit} loading={saving} loadingLabel="Saving…" fullWidth />
          {editing && onDelete ? <Button label="Delete asset" variant="text" muted disabled={saving} onPress={onDelete} style={{ alignSelf: 'center' }} /> : null}
        </View>
      </View>
      <AccountSelector visible={picker} onClose={() => setPicker(false)} accounts={accounts} selectedId={fundId} onSelect={setFundId} title="Paid from" />
    </Sheet>
  );
}
