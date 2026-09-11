import { useEffect, useState } from 'react';
import { View, Text, Pressable, TextInput, ScrollView } from 'react-native';
import { Check, Ban } from '../ui/icons';
import { expenseCategories, incomeCategories } from '../../constants/categories';
import { accountColor } from '../../src/utils/accountColor';
import { merchantCategory } from '../../src/utils/merchantLogo';
import type { DetectedTransaction, SaveOverrides } from '../../src/hooks/useDetectedTransactions';

interface DetectedTransactionFormProps {
  detected: DetectedTransaction;
  accounts: any[];
  onSave: (detected: DetectedTransaction, values: SaveOverrides) => Promise<{ ok: boolean }>;
  /** Throws the detection away for good: it wasn't a transaction. */
  onDismiss: (id: string) => void;
  /** Whether the name field grabs the keyboard as soon as the form appears. */
  autoFocusName?: boolean;
  /** Reports the in-flight save so a parent can hold off dismissing mid-write. */
  onSavingChange?: (saving: boolean) => void;
}

/**
 * The fields a detection can't work out on its own — what the payment was
 * for, its direction and category, and (when the alert was ambiguous) which
 * account it came from. Everything the alert *did* say is already filled in,
 * so completing one is a couple of taps rather than the whole add form.
 *
 * Shared by the floating island and the "needs your input" list on Home, so
 * the two never drift apart.
 */
export function DetectedTransactionForm({
  detected,
  accounts,
  onSave,
  onDismiss,
  autoFocusName = true,
  onSavingChange,
}: DetectedTransactionFormProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [accountId, setAccountId] = useState('');
  const [category, setCategory] = useState('');
  const [saving, setSaving] = useState(false);

  // Reset the form for each new detection — the previous one's name must never
  // carry over onto a different payment.
  useEffect(() => {
    const detectedName = detected.suggestedName ?? detected.parsed.merchant ?? '';
    setName(detectedName);
    setType(detected.parsed.type);
    setAccountId(detected.accountId ?? '');
    setCategory(
      detected.parsed.type === 'expense'
        // The alert usually names the merchant, so the category is often known
        // before the user has touched anything.
        ? merchantCategory(detectedName) ?? 'food'
        : 'salary'
    );
  }, [detected]);

  const categories = type === 'expense' ? expenseCategories : incomeCategories;
  const selectableAccounts = accounts.filter((a) => a.type === 'bank' || a.type === 'wallet');
  const canSave = name.trim().length > 0 && !!accountId && !saving;

  const setSavingState = (value: boolean) => {
    setSaving(value);
    onSavingChange?.(value);
  };

  const handleSave = async () => {
    if (!canSave) return;
    setSavingState(true);
    await onSave(detected, {
      name: name.trim(),
      type,
      accountId,
      // Built-in categories are stored by slug id, the same as the main form —
      // storing the display name here left detected rows with a fallback icon.
      category,
    });
    setSavingState(false);
  };

  return (
    <View>
      {/* Type */}
      <View className="flex-row gap-2 mb-3">
        {(['expense', 'income'] as const).map((option) => (
          <Pressable
            key={option}
            onPress={() => {
              setType(option);
              setCategory(option === 'expense' ? 'food' : 'salary');
            }}
            className={`flex-1 py-2.5 rounded-xl items-center ${
              type === option ? 'bg-primary' : 'bg-background border border-border'
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                type === option ? 'text-black' : 'text-foreground'
              }`}
            >
              {option === 'expense' ? 'Expense' : 'Income'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Name */}
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="What was this for?"
        placeholderTextColor="#6b7280"
        autoFocus={autoFocusName}
        className="bg-background border border-border rounded-xl px-4 py-3 text-foreground mb-3"
      />

      {/* Category */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
        <View className="flex-row gap-2">
          {categories.map((cat) => (
            <Pressable
              key={cat.id}
              onPress={() => setCategory(cat.id)}
              className={`flex-row items-center gap-1.5 px-3 py-2 rounded-xl ${
                category === cat.id ? 'bg-primary' : 'bg-background border border-border'
              }`}
            >
              <Text className="text-sm">{cat.emoji}</Text>
              <Text
                className={`text-xs ${category === cat.id ? 'text-black font-semibold' : 'text-foreground'}`}
              >
                {cat.name}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Account — preselected when the alert named one */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
        <View className="flex-row gap-2">
          {selectableAccounts.map((account) => (
            <Pressable
              key={account.id}
              onPress={() => setAccountId(account.id)}
              className={`flex-row items-center gap-2 px-3 py-2 rounded-xl ${
                accountId === account.id ? 'bg-primary' : 'bg-background border border-border'
              }`}
            >
              <View
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: accountColor(account) }}
              />
              <Text
                className={`text-xs ${
                  accountId === account.id ? 'text-black font-semibold' : 'text-foreground'
                }`}
              >
                {account.name}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <Pressable
        onPress={handleSave}
        disabled={!canSave}
        className={`flex-row items-center justify-center gap-2 py-3 rounded-2xl ${
          canSave ? 'bg-primary' : 'bg-muted'
        }`}
      >
        <Check size={16} color={canSave ? '#000' : '#a0a0a0'} />
        <Text className={`text-sm font-semibold ${canSave ? 'text-black' : 'text-muted-foreground'}`}>
          {saving ? 'Saving…' : !accountId ? 'Choose an account' : 'Save transaction'}
        </Text>
      </Pressable>

      {/* Plenty of what Flowe catches is neither expense nor income — a
          promo quoting a ringgit figure, a balance reminder, a refund
          notice. Saying so outright drops it, so it stops coming back. */}
      <Pressable
        onPress={() => onDismiss(detected.id)}
        disabled={saving}
        className="flex-row items-center justify-center gap-2 py-2.5 mt-2 rounded-2xl border border-border"
      >
        <Ban size={14} color="#a0a0a0" />
        <Text className="text-xs font-semibold text-muted-foreground">
          Not a transaction — ignore
        </Text>
      </Pressable>
    </View>
  );
}
