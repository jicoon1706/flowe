import { useEffect, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { ArrowUpRight, Check, Info, Landmark, Wallet } from 'lucide-react-native';
import { colors, radius } from '@/theme/tokens';
import { centeredPadding, TABLET_WIDTH, useBreakpoint } from '@/src/hooks/useBreakpoint';
import { formatRM, parseAmount, roundCents } from '@/src/lib/money';
import { accountDomain, type AnyAccount } from '@/src/utils/accountDisplay';
import { AccountPill } from '../ui/AccountPill';
import { AccountSelector } from '../ui/AccountSelector';
import { Button } from '../ui/Button';
import { Chip } from '../ui/Chip';
import { GlassChip } from '../ui/GlassChip';
import { Hero } from '../ui/Hero';
import { InlineError } from '../ui/InlineError';
import { Money } from '../ui/Money';
import { Numpad, applyAmountKey } from '../ui/Numpad';
import { SystemModal, useModalBottomPadding } from '../ui/SystemModal';
import { Text } from '../ui/Text';
import { TopBar } from '../ui/TopBar';

export interface TabungMoneySheetProps {
  visible: boolean;
  mode: 'in' | 'out';
  tabungName: string;
  accounts: AnyAccount[];
  defaultAccountId: string | null;
  /** Pre-filled amount ("your usual"). */
  usual: number | null;
  /** Extra quick amounts (incl. the on-track monthly figure). */
  quickAmounts: number[];
  target: number;
  /** Counted toward the goal now (contributed). */
  counted: number;
  balance: number;
  onClose: () => void;
  onSubmit: (amount: number, accountId: string) => Promise<boolean>;
}

/**
 * Add money / Pay out (n-tabung-add-money, n-tabung-pay-out): the numpad
 * sheet reused from Add. Add shows "Progress a% → b%"; Pay out reassures that
 * progress stays and only the balance drops.
 */
export function TabungMoneySheet(p: TabungMoneySheetProps) {
  const [text, setText] = useState('');
  const [accountId, setAccountId] = useState<string | null>(null);
  const [picker, setPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tried, setTried] = useState(false);
  const { isTablet, width } = useBreakpoint();
  // Tablet: the numpad column keeps a phone-like width so keys don't stretch.
  const padX = isTablet ? centeredPadding(width, TABLET_WIDTH.keypad - 32, 16) : 16;

  useEffect(() => {
    if (!p.visible) return;
    setText(p.usual ? String(p.usual) : '');
    setAccountId(p.defaultAccountId);
    setTried(false);
  }, [p.visible, p.usual, p.defaultAccountId]);

  const amount = parseAmount(text) ?? 0;
  const account = p.accounts.find((a) => a.id === accountId);
  const pct = (v: number) => (p.target > 0 ? Math.round((v / p.target) * 100) : 0);
  const error = amount <= 0 ? 'Enter an amount above RM 0.00'
    : !account ? (p.mode === 'in' ? 'Choose where the money comes from' : 'Choose where the money goes')
    : p.mode === 'out' && amount > p.balance ? `Only ${formatRM(p.balance)} is in this Tabung` : null;

  const submit = async () => {
    setTried(true);
    if (error || !accountId) return;
    setSaving(true);
    const ok = await p.onSubmit(roundCents(amount), accountId);
    setSaving(false);
    if (ok) p.onClose();
  };

  const quick = Array.from(new Set([...(p.usual ? [p.usual] : []), ...p.quickAmounts].filter((v) => v > 0).map(roundCents))).sort((a, b) => a - b).slice(0, 3);

  return (
    <SystemModal visible={p.visible} animationType="slide" onRequestClose={() => !saving && p.onClose()}>
      <View style={{ flex: 1, backgroundColor: colors.surface }}>
        <Hero style={{ paddingBottom: 48 }} contentMaxWidth={TABLET_WIDTH.keypad}>
          <TopBar title={p.mode === 'in' ? `Add to ${p.tabungName}` : `Pay out of ${p.tabungName}`} onBack={() => !saving && p.onClose()} close />
          <View style={{ alignItems: 'center', gap: 10, marginTop: 28 }}>
            <Money amount={amount} variant="numeric-lg" on="gradient" smallCurrency />
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              {p.mode === 'in' ? (
                p.target > 0 ? <GlassChip icon={ArrowUpRight} label={`Progress ${pct(p.counted)}% → ${Math.min(100, pct(p.counted + amount))}%`} /> : null
              ) : (
                <>
                  {p.target > 0 ? <GlassChip icon={Check} label={`Progress stays at ${pct(p.counted)}%`} /> : null}
                  <GlassChip label={`Balance ${formatRM(p.balance).replace('RM ', '')} → ${formatRM(Math.max(0, p.balance - amount)).replace('RM ', '')}`} />
                </>
              )}
            </View>
            {tried && error && amount <= 0 ? <InlineError on="gradient" message={error} /> : null}
          </View>
        </Hero>
        <NumpadPanel padX={padX}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text variant="body-md" tone="muted">{p.mode === 'in' ? 'From' : 'To'}</Text>
            <AccountPill
              label={account?.name ?? 'Choose account'}
              domain={accountDomain(account)}
              icon={account?.type === 'wallet' ? Wallet : Landmark}
              onPress={() => setPicker(true)}
              invalid={tried && !account}
            />
          </View>
          {tried && error && amount > 0 ? <InlineError message={error} /> : null}
          {quick.length ? (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {quick.map((q) => <Chip key={q} label={formatRM(q).replace('.00', '')} selected={q === amount} onPress={() => setText(String(q))} />)}
            </View>
          ) : null}
          {p.mode === 'out' && p.target > 0 ? (
            <View style={{ flexDirection: 'row', gap: 12, padding: 14, paddingHorizontal: 16, borderRadius: radius.md, backgroundColor: colors['surface-container'], alignItems: 'center' }}>
              <View style={{ width: 36, height: 36, borderRadius: radius.full, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
                <Info size={17} color={colors['on-surface']} strokeWidth={1.75} />
              </View>
              <Text variant="body-md" size={13} style={{ flex: 1 }}>Paying out lowers the balance only. What you’ve saved toward {formatRM(p.target)} doesn’t change.</Text>
            </View>
          ) : null}
          <View style={{ flex: 1 }} />
          <Numpad onKey={(k) => setText((cur) => applyAmountKey(cur, k))} />
          <Button label={p.mode === 'in' ? 'Add money' : 'Pay out'} onPress={submit} loading={saving} loadingLabel="Saving…" disabled={tried && !!error} fullWidth />
        </NumpadPanel>
        <AccountSelector
          visible={picker}
          onClose={() => setPicker(false)}
          title={p.mode === 'in' ? 'Add from' : 'Pay out to'}
          accounts={p.accounts}
          selectedId={accountId}
          onSelect={setAccountId}
        />
      </View>
    </SystemModal>
  );
}

/**
 * White numpad panel riding over the hero. Rendered inside SystemModal, so its bottom
 * padding clears the nav bar / home indicator of the modal window once (24 dp when none).
 */
function NumpadPanel({ padX, children }: { padX: number; children: ReactNode }) {
  const paddingBottom = useModalBottomPadding();
  return (
    <View style={{ flex: 1, marginTop: -24, backgroundColor: colors.surface, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: 16, paddingHorizontal: padX, paddingTop: 20, paddingBottom, gap: 12 }}>
      {children}
    </View>
  );
}
