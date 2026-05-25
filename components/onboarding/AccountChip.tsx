import { View, Text, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { DraftAccount } from '../../src/types/onboarding';
import { MALAYSIAN_BANKS } from '../../constants/banks';

export function AccountChip({ draft, onRemove }: { draft: DraftAccount; onRemove: () => void }) {
  const meta = describe(draft);
  return (
    <View className="bg-card rounded-2xl p-4 flex-row items-center gap-3 mb-3">
      <Text className="text-2xl">{meta.emoji}</Text>
      <View className="flex-1">
        <Text className="text-foreground font-semibold">{meta.title}</Text>
        <Text className="text-muted-foreground text-xs mt-0.5">{meta.subtitle}</Text>
      </View>
      <View className="px-2 py-1 rounded-lg bg-primary/10">
        <Text className="text-primary text-xs font-semibold">{meta.badge}</Text>
      </View>
      <Pressable onPress={onRemove} className="p-2">
        <Feather name="trash-2" size={16} color="#ff4444" />
      </Pressable>
    </View>
  );
}

function describe(d: DraftAccount) {
  if (d.kind === 'bank') {
    const bank = MALAYSIAN_BANKS.find((b) => b.id === d.bankId);
    return {
      emoji: '🏦',
      title: d.customName ?? bank?.name ?? 'Bank',
      subtitle: `RM ${d.openingBalance.toFixed(2)}`,
      badge: 'Bank',
    };
  }
  if (d.kind === 'wallet') {
    return { emoji: '🍎', title: d.name, subtitle: `RM ${d.openingBalance.toFixed(2)}`, badge: 'Wallet' };
  }
  return { emoji: '✈️', title: d.name, subtitle: `Target RM ${d.target.toFixed(2)}`, badge: 'Tabung' };
}