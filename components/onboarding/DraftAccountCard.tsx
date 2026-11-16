import { Pressable, View } from 'react-native';
import { Landmark, Wallet, X } from 'lucide-react-native';
import { colors, radius } from '@/theme/tokens';
import { MALAYSIAN_BANKS } from '@/constants/banks';
import { institutionDomain } from '@/constants/institutionDomains';
import { tabungIcon } from '@/constants/tabungGoals';
import type { DraftAccount } from '@/src/types/onboarding';
import { LogoWell } from '../ui/LogoWell';
import { Money } from '../ui/Money';
import { Text } from '../ui/Text';

/** Added account on the onboarding list: logo, name, type, starting balance. */
export function DraftAccountCard({ draft, onRemove }: { draft: DraftAccount; onRemove: () => void }) {
  const bank = draft.kind === 'bank' ? MALAYSIAN_BANKS.find((b) => b.id === draft.bankId) : undefined;
  const name = draft.kind === 'bank' ? draft.customName || bank?.name || draft.bankId : draft.name;
  const type = draft.kind === 'bank' ? 'Bank' : draft.kind === 'wallet' ? 'E-wallet' : 'Tabung';
  const amount = draft.kind === 'tabung' ? draft.startingAmount ?? 0 : draft.openingBalance;
  const domain = draft.kind === 'tabung' ? undefined : institutionDomain(bank?.name, name);
  const icon = draft.kind === 'tabung' ? tabungIcon(draft.templateType, draft.icon) : draft.kind === 'wallet' ? Wallet : Landmark;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: radius.md, backgroundColor: colors['surface-container'] }}>
      <LogoWell domain={domain} fallback={icon} on="grey" />
      <View style={{ flex: 1 }}>
        <Text variant="body-lg" numberOfLines={1}>{name}</Text>
        <Text variant="label-sm" tone="meta">{type}</Text>
      </View>
      <Money amount={amount} on="grey" weight={600} />
      <Pressable onPress={onRemove} accessibilityRole="button" accessibilityLabel={`Remove ${name}`} hitSlop={8} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
        <X size={18} color={colors['on-surface-variant-aa']} strokeWidth={1.75} />
      </Pressable>
    </View>
  );
}
