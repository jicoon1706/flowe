import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Pressable } from '@/components/ui/Pressable';
import { Check, Landmark, Search } from 'lucide-react-native';
import { colors } from '@/theme/tokens';
import { MALAYSIAN_BANKS, type Bank } from '@/constants/banks';
import { institutionDomain } from '@/constants/institutionDomains';
import { LogoWell } from '../ui/LogoWell';
import { Sheet } from '../ui/Sheet';
import { Text } from '../ui/Text';
import { TextInput } from '../ui/TextInput';

export const POPULAR_BANK_IDS = ['maybank', 'cimb', 'public', 'rhb'];

export interface BankDropdownProps {
  visible: boolean;
  onClose: () => void;
  value: string | null;
  onChange: (bank: Bank) => void;
}

/**
 * Searchable bank sheet (m-bank-dropdown): Popular first, then all banks.
 * Banks without a logo.dev logo get a Lucide landmark well.
 */
export function BankDropdown({ visible, onClose, value, onChange }: BankDropdownProps) {
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? MALAYSIAN_BANKS.filter((b) => b.name.toLowerCase().includes(s)) : MALAYSIAN_BANKS;
  }, [q]);
  const popular = filtered.filter((b) => POPULAR_BANK_IDS.includes(b.id));
  const rest = filtered.filter((b) => !POPULAR_BANK_IDS.includes(b.id)).sort((a, b) => a.name.localeCompare(b.name));

  const row = (b: Bank) => (
    <Pressable
      key={b.id}
      onPress={() => { onChange(b); onClose(); }}
      accessibilityRole="radio"
      accessibilityState={{ checked: b.id === value }}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, opacity: pressed ? 0.7 : 1 })}
    >
      <LogoWell domain={institutionDomain(b.name, b.id)} brand={b.name} fallback={Landmark} />
      <Text variant="body-lg" style={{ flex: 1 }}>{b.name}</Text>
      {b.id === value ? <Check size={18} color={colors['on-surface']} strokeWidth={2} /> : null}
    </Pressable>
  );

  return (
    <Sheet visible={visible} onClose={onClose} title="Choose your bank" scroll testID="bank-dropdown">
      <View style={{ gap: 2 }}>
        <View style={{ marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <TextInput value={q} onChangeText={setQ} placeholder="Search banks" accessibilityLabel="Search banks" returnKeyType="search" />
          </View>
          <Search size={18} color={colors['on-surface-variant']} strokeWidth={1.75} />
        </View>
        {popular.length ? <Text variant="label-sm" tone="muted" style={{ marginTop: 8 }}>Popular</Text> : null}
        {popular.map(row)}
        {rest.length ? <Text variant="label-sm" tone="muted" style={{ marginTop: 8 }}>All banks</Text> : null}
        {rest.map(row)}
        {filtered.length === 0 ? <Text variant="body-md" tone="muted" style={{ paddingVertical: 16 }}>No bank matches “{q}”.</Text> : null}
      </View>
    </Sheet>
  );
}
