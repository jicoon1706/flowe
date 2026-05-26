import { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BankDropdown } from './BankDropdown';
import type { DraftBank } from '../../src/types/onboarding';

interface BankFormProps {
  onAdd: (draft: DraftBank) => void;
}

export function BankForm({ onAdd }: BankFormProps) {
  const [bankId, setBankId] = useState('maybank');
  const [customName, setCustomName] = useState('');
  const [accountLast4, setAccountLast4] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!bankId) e.bankId = 'Please select a bank';
    if (bankId === 'other' && !customName.trim()) e.customName = 'Please enter a bank name';
    if (accountLast4 && accountLast4.length !== 4) e.accountLast4 = 'Must be 4 digits';
    const balance = parseFloat(openingBalance);
    if (openingBalance && isNaN(balance)) e.openingBalance = 'Invalid amount';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function submit() {
    if (!validate()) return;
    onAdd({
      kind: 'bank',
      bankId,
      customName: bankId === 'other' ? customName.trim() : undefined,
      accountLast4: accountLast4 || undefined,
      openingBalance: parseFloat(openingBalance) || 0,
    });
    // reset
    setBankId('maybank');
    setCustomName('');
    setAccountLast4('');
    setOpeningBalance('');
    setErrors({});
  }

  return (
    <View className="gap-4">
      <BankDropdown value={bankId} onChange={setBankId} />
      {bankId === 'other' && (
        <View>
          <Text className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1.5">Bank Name</Text>
          <TextInput
            value={customName}
            onChangeText={setCustomName}
            placeholder="Enter bank name"
            placeholderTextColor="#a0a0a0"
            className="bg-card border border-border rounded-xl px-4 py-3 text-foreground"
          />
          {errors.customName && <Text className="text-xs text-red-400 mt-1">{errors.customName}</Text>}
        </View>
      )}
      <View>
        <Text className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1.5">Last 4 Digits (optional)</Text>
        <TextInput
          value={accountLast4}
          onChangeText={(v) => setAccountLast4(v.replace(/\D/g, '').slice(0, 4))}
          placeholder="e.g. 1234"
          placeholderTextColor="#a0a0a0"
          keyboardType="numeric"
          maxLength={4}
          className="bg-card border border-border rounded-xl px-4 py-3 text-foreground"
        />
        {errors.accountLast4 && <Text className="text-xs text-red-400 mt-1">{errors.accountLast4}</Text>}
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