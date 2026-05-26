import { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { DraftWallet } from '../../src/types/onboarding';

interface WalletFormProps {
  onAdd: (draft: DraftWallet) => void;
}

export function WalletForm({ onAdd }: WalletFormProps) {
  const [name, setName] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Please enter a wallet name';
    const balance = parseFloat(openingBalance);
    if (openingBalance && isNaN(balance)) e.openingBalance = 'Invalid amount';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function submit() {
    if (!validate()) return;
    onAdd({
      kind: 'wallet',
      name: name.trim(),
      openingBalance: parseFloat(openingBalance) || 0,
    });
    setName('');
    setOpeningBalance('');
    setErrors({});
  }

  return (
    <View className="gap-4">
      <View>
        <Text className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1.5">Wallet Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. Cash, Touch 'n Go"
          placeholderTextColor="#a0a0a0"
          maxLength={30}
          className="bg-card border border-border rounded-xl px-4 py-3 text-foreground"
        />
        {errors.name && <Text className="text-xs text-red-400 mt-1">{errors.name}</Text>}
      </View>
      <View>
        <Text className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1.5">Opening Balance (RM)</Text>
        <TextInput
          value={openingBalance}
          onChangeText={(v) => setOpeningBalance(v.replace(/[^0-9.]/g, ''))}
          placeholder="0.00"
          placeholderTextColor="#a0a0a0"
          keyboardType="decimal-pad"
          maxLength={12}
          className="bg-card border border-border rounded-xl px-4 py-3 text-foreground"
        />
        {errors.openingBalance && <Text className="text-xs text-red-400 mt-1">{errors.openingBalance}</Text>}
      </View>
      <Pressable
        onPress={submit}
        className="bg-primary rounded-2xl py-3.5 flex-row items-center justify-center gap-2 active:opacity-90"
      >
        <Feather name="plus" size={18} color="#000" />
        <Text className="text-primary-foreground font-bold">Add Account</Text>
      </Pressable>
    </View>
  );
}