import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { MALAYSIAN_BANKS, type Bank } from '../../constants/banks';

export function BankDropdown({
  value, onChange,
}: { value: string; onChange: (bankId: string) => void }) {
  const [open, setOpen] = useState(false);
  const selected = MALAYSIAN_BANKS.find((b) => b.id === value) ?? MALAYSIAN_BANKS[0];

  return (
    <View>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        className="bg-card border border-border rounded-2xl px-4 py-3 flex-row items-center justify-between"
      >
        <View className="flex-row items-center gap-3">
          <View className="w-3 h-3 rounded-full" style={{ backgroundColor: selected.color }} />
          <Text className="text-foreground text-base">{selected.name}</Text>
        </View>
        <Feather name={open ? 'chevron-up' : 'chevron-down'} size={18} color="#a0a0a0" />
      </Pressable>
      {open && (
        <View className="bg-card border border-border rounded-2xl mt-2 overflow-hidden">
          {MALAYSIAN_BANKS.map((b: Bank) => {
            const isSel = b.id === value;
            return (
              <Pressable
                key={b.id}
                onPress={() => { onChange(b.id); setOpen(false); }}
                className="flex-row items-center px-4 py-3 active:bg-secondary"
              >
                <View className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: b.color }} />
                <Text className="text-foreground flex-1">{b.name}</Text>
                {isSel && <Feather name="check" size={16} color="#C5FF00" />}
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}