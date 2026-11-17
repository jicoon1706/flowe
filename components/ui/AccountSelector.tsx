import { View } from 'react-native';
import { Pressable } from '@/components/ui/Pressable';
import { Check, Landmark, PiggyBank, Plus, TrendingUp, Wallet } from 'lucide-react-native';
import { colors } from '@/theme/tokens';
import { accountBalance, accountDomain, ACCOUNT_GROUP_LABEL, type AnyAccount } from '@/src/utils/accountDisplay';
import { Button } from './Button';
import { LogoWell } from './LogoWell';
import { Money } from './Money';
import { Sheet } from './Sheet';
import { Text } from './Text';

export interface AccountSelectorProps {
  visible: boolean;
  onClose: () => void;
  accounts: AnyAccount[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  title?: string;
  /** Shows "Add account" at the bottom. */
  onAddAccount?: () => void;
  /** Hide an account (Transfer: the From account can't be the To). */
  excludeId?: string | null;
  /** Transfer into an asset = an investment (listed under "Assets"). */
  assets?: { id: string; name: string; value: number }[];
  /** Hide balances while the app is locked. */
  masked?: boolean;
}

/**
 * Sheet listing accounts grouped Banks / E-wallets / Tabung with balances.
 * One tap selects and closes (m-account-selector).
 */
export function AccountSelector({ visible, onClose, accounts, selectedId, onSelect, title = 'Pay from', onAddAccount, excludeId, assets = [], masked }: AccountSelectorProps) {
  const list = accounts.filter((a) => a.id !== excludeId);
  const groups = (['bank', 'wallet', 'tabung'] as const)
    .map((t) => ({ type: t, items: list.filter((a) => a.type === t) }))
    .filter((g) => g.items.length > 0);

  return (
    <Sheet visible={visible} onClose={onClose} title={title} scroll testID="account-selector">
      <View style={{ gap: 4 }}>
        {groups.map((g) => (
          <View key={g.type} style={{ gap: 4 }}>
            <Text variant="label-sm" tone="muted" style={{ marginTop: 8 }}>{ACCOUNT_GROUP_LABEL[g.type]}</Text>
            {g.items.map((a) => {
              const selected = a.id === selectedId;
              return (
                <Pressable
                  key={a.id}
                  onPress={() => { onSelect(a.id); onClose(); }}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={a.name}
                  style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, opacity: pressed ? 0.7 : 1 })}
                >
                  <LogoWell domain={accountDomain(a)} fallback={a.type === 'tabung' ? PiggyBank : a.type === 'wallet' ? Wallet : Landmark} />
                  <Text variant="body-lg" style={{ flex: 1 }} numberOfLines={1}>{a.name}</Text>
                  <Money amount={accountBalance(a)} variant="body-md" weight={500} masked={masked} />
                  <View
                    style={{
                      width: 24, height: 24, borderRadius: 9999, alignItems: 'center', justifyContent: 'center',
                      backgroundColor: selected ? colors.secondary : 'transparent',
                      borderWidth: selected ? 0 : 1.5, borderColor: colors['on-surface-variant'],
                    }}
                  >
                    {selected ? <Check size={14} color={colors['on-secondary']} strokeWidth={2.5} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
        {assets.length > 0 ? (
          <View style={{ gap: 4 }}>
            <Text variant="label-sm" tone="muted" style={{ marginTop: 8 }}>Assets</Text>
            {assets.map((a) => {
              const selected = a.id === selectedId;
              return (
                <Pressable
                  key={a.id}
                  onPress={() => { onSelect(a.id); onClose(); }}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={`${a.name}, asset`}
                  style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, opacity: pressed ? 0.7 : 1 })}
                >
                  <LogoWell fallback={TrendingUp} />
                  <Text variant="body-lg" style={{ flex: 1 }} numberOfLines={1}>{a.name}</Text>
                  <Money amount={a.value} variant="body-md" weight={500} masked={masked} />
                  <View style={{ width: 24, height: 24, borderRadius: 9999, alignItems: 'center', justifyContent: 'center', backgroundColor: selected ? colors.secondary : 'transparent', borderWidth: selected ? 0 : 1.5, borderColor: colors['on-surface-variant'] }}>
                    {selected ? <Check size={14} color={colors['on-secondary']} strokeWidth={2.5} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : null}
        {onAddAccount ? (
          <Button label="Add account" icon={Plus} variant="action" onPress={() => { onClose(); onAddAccount(); }} fullWidth style={{ marginTop: 12 }} />
        ) : null}
      </View>
    </Sheet>
  );
}
