import { useRef, useState } from 'react';
import { Pressable, TextInput as RNTextInput, View } from 'react-native';
import { Ellipsis, Landmark, Wallet, type LucideIcon } from 'lucide-react-native';
import { colors, radius } from '@/theme/tokens';
import { MALAYSIAN_BANKS, type Bank } from '@/constants/banks';
import { institutionDomain } from '@/constants/institutionDomains';
import { TABUNG_GOALS } from '@/constants/tabungGoals';
import { parseAmount } from '@/src/lib/money';
import { localYMD } from '@/src/utils/date';
import type { DraftAccount } from '@/src/types/onboarding';
import { AmountField } from '../ui/AmountField';
import { Button } from '../ui/Button';
import { LogoWell } from '../ui/LogoWell';
import { SegmentedToggle } from '../ui/SegmentedToggle';
import { Text } from '../ui/Text';
import { TextInput } from '../ui/TextInput';
import { BankDropdown, POPULAR_BANK_IDS } from './BankDropdown';

type Kind = 'bank' | 'wallet' | 'tabung';

const WALLETS = [
  { id: 'tng', name: 'TNG eWallet' },
  { id: 'grabpay', name: 'GrabPay' },
  { id: 'shopeepay', name: 'ShopeePay' },
];
const ONBOARDING_GOALS = TABUNG_GOALS.filter((g) => ['emergency', 'travel', 'raya', 'home'].includes(g.key));

export interface AccountDraftFormProps {
  onAdd: (draft: DraftAccount) => void;
  submitLabel?: string;
  /**
   * Inside the app (Accounts › Add account) the Tabung tab also offers the
   * goal-first flow at /tabung/new, which sets a target and date. Onboarding
   * leaves it out.
   */
  onNewTabung?: () => void;
}

/**
 * Bank / E-wallet / Tabung tabs (C2–C4): pick a tile, name, starting balance.
 * Missing fields: first empty field focused with a black outline and a chip
 * under each (k-onb-missing-fields). No modal.
 */
export function AccountDraftForm({ onAdd, submitLabel = 'Continue', onNewTabung }: AccountDraftFormProps) {
  const [kind, setKind] = useState<Kind>('bank');
  const [pick, setPick] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [errors, setErrors] = useState<{ pick?: string; name?: string; amount?: string }>({});
  const [dropdown, setDropdown] = useState(false);
  const nameRef = useRef<RNTextInput>(null);
  const amountRef = useRef<RNTextInput>(null);

  const reset = (k: Kind) => { setKind(k); setPick(null); setName(''); setAmount(''); setErrors({}); };

  const choose = (id: string, label: string) => {
    setPick(id);
    setErrors((e) => ({ ...e, pick: undefined }));
    if (!name || [...MALAYSIAN_BANKS.map((b) => b.name), ...WALLETS.map((w) => w.name), ...TABUNG_GOALS.map((g) => g.defaultName)].includes(name)) setName(label);
  };

  const submit = () => {
    const value = amount.trim() === '' ? null : parseAmount(amount);
    const next: typeof errors = {};
    if (!pick) next.pick = kind === 'bank' ? 'Choose your bank' : kind === 'wallet' ? 'Choose your e-wallet' : 'Choose a goal type';
    if (!name.trim()) next.name = 'Give this account a name';
    if (value === null) next.amount = 'Enter a starting balance (0 is fine)';
    setErrors(next);
    if (next.name) { nameRef.current?.focus(); return; }
    if (next.amount) { amountRef.current?.focus(); return; }
    if (next.pick || value === null || !pick) return;

    if (kind === 'bank') onAdd({ kind: 'bank', bankId: pick, customName: name.trim(), openingBalance: value });
    else if (kind === 'wallet') onAdd({ kind: 'wallet', name: name.trim(), openingBalance: value });
    else {
      const goal = TABUNG_GOALS.find((g) => g.key === pick);
      const from = new Date();
      const to = new Date(from.getFullYear() + 1, from.getMonth(), from.getDate());
      onAdd({ kind: 'tabung', name: name.trim(), icon: goal?.key ?? 'custom', templateType: goal?.key, target: 0, fromDate: localYMD(from), toDate: localYMD(to), startingAmount: value });
    }
    reset(kind);
  };

  const tile = (id: string, label: string, opts: { domain?: string; icon?: LucideIcon; onPress?: () => void }) => {
    const selected = pick === id;
    return (
      <Pressable
        key={id}
        onPress={opts.onPress ?? (() => choose(id, label))}
        accessibilityRole="radio"
        accessibilityState={{ checked: selected }}
        accessibilityLabel={label}
        style={{ flex: 1, height: 96, borderRadius: radius.md, borderWidth: 2, borderColor: selected ? colors.secondary : 'transparent', backgroundColor: colors['surface-container'], alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 4 }}
      >
        {opts.icon && !opts.domain ? (
          <View style={{ width: 40, height: 40, borderRadius: 9999, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
            <opts.icon size={19} color={colors['on-surface']} strokeWidth={1.75} />
          </View>
        ) : (
          <LogoWell domain={opts.domain} brand={label} fallback={opts.icon ?? Landmark} on="grey" />
        )}
        <Text variant="label-sm" align="center" numberOfLines={1}>{label}</Text>
      </Pressable>
    );
  };

  const otherBank = pick && !POPULAR_BANK_IDS.includes(pick) && kind === 'bank' ? MALAYSIAN_BANKS.find((b) => b.id === pick) : undefined;

  return (
    <View style={{ gap: 16 }}>
      <SegmentedToggle
        options={[{ value: 'bank', label: 'Bank' }, { value: 'wallet', label: 'E-wallet' }, { value: 'tabung', label: 'Tabung' }]}
        value={kind}
        onChange={reset}
        accessibilityLabel="Account type"
      />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {kind === 'bank'
          ? [
              ...POPULAR_BANK_IDS.slice(0, 3).map((id) => {
                const b = MALAYSIAN_BANKS.find((x) => x.id === id) as Bank;
                return tile(b.id, b.name.replace(' Bank', ''), { domain: institutionDomain(b.name, b.id) });
              }),
              otherBank
                ? tile(otherBank.id, otherBank.name.replace(' Bank', ''), { domain: institutionDomain(otherBank.name, otherBank.id), onPress: () => setDropdown(true) })
                : tile('__more', 'More banks', { icon: Ellipsis, onPress: () => setDropdown(true) }),
            ]
          : kind === 'wallet'
          ? WALLETS.map((w) => tile(w.id, w.name, { domain: institutionDomain(w.name), icon: Wallet }))
          : ONBOARDING_GOALS.map((g) => tile(g.key, g.label.replace(' & festive', ''), { icon: g.icon }))}
      </View>
      {errors.pick ? <Text variant="label-sm" tone="muted" accessibilityRole="alert">{errors.pick}</Text> : null}
      {/* (onboarding)/accounts: name and starting balance side by side, both pills. */}
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
        <View style={{ flex: 1, minWidth: 0 }}>
        <TextInput ref={nameRef} label="Account name" value={name} onChangeText={(t) => { setName(t); setErrors((e) => ({ ...e, name: undefined })); }} error={errors.name} autoCapitalize="words" returnKeyType="next" onSubmitEditing={() => amountRef.current?.focus()} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
        <AmountField look="pill" ref={amountRef} label="Starting balance" value={amount} onChangeText={(t) => { setAmount(t); setErrors((e) => ({ ...e, amount: undefined })); }} error={errors.amount} />
        </View>
      </View>
      <Button label={submitLabel} onPress={submit} fullWidth />
      {kind === 'tabung' && onNewTabung ? <Button label="New Tabung" variant="text" onPress={onNewTabung} style={{ alignSelf: 'center' }} /> : null}
      <BankDropdown visible={dropdown} onClose={() => setDropdown(false)} value={pick} onChange={(b) => choose(b.id, b.name)} />
    </View>
  );
}
