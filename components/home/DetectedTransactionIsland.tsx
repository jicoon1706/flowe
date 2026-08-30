import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, TextInput, Animated, Easing, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Check, Sparkle, Ban } from '../ui/icons';
import { expenseCategories, incomeCategories } from '../../constants/categories';
import { accountColor } from '../../src/utils/accountColor';
import { merchantCategory } from '../../src/utils/merchantLogo';
import type { DetectedTransaction } from '../../src/hooks/useDetectedTransactions';

interface DetectedTransactionIslandProps {
  detected: DetectedTransaction | null;
  accounts: any[];
  onSave: (
    detected: DetectedTransaction,
    values: { name: string; type: 'expense' | 'income'; accountId: string; category?: string }
  ) => Promise<{ ok: boolean }>;
  /**
   * Throws the detection away for good: it wasn't a transaction. Distinct from
   * `onSnooze`, which keeps it queued for later.
   */
  onDismiss: (id: string) => void;
  /** Called when the island times out — hides it, but keeps the detection. */
  onSnooze: (id: string) => void;
}

/**
 * How long the collapsed island hovers before it steps aside. The detection
 * isn't lost: its Android notification stays in the shade, where the user can
 * still file it (or reopen Flowe on it) whenever they get to it. Ten seconds is
 * long enough to read the amount and decide, short enough that it never becomes
 * something to swat away.
 */
const AUTO_HIDE_MS = 10_000;

/**
 * The floating capsule that drops in when Flowe spots a payment in a bank or
 * e-wallet notification. Collapsed it's a one-line summary; tapping it expands
 * to the only two things the detection can't work out on its own — what the
 * payment was for, and (when the alert was ambiguous) which account it came from.
 *
 * Amount, date/time and account come from the notification itself, so confirming
 * is a couple of taps rather than a trip through the add-transaction form.
 */
export function DetectedTransactionIsland({
  detected,
  accounts,
  onSave,
  onDismiss,
  onSnooze,
}: DetectedTransactionIslandProps) {
  const insets = useSafeAreaInsets();
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [accountId, setAccountId] = useState('');
  const [category, setCategory] = useState('');
  const [saving, setSaving] = useState(false);
  const slide = useRef(new Animated.Value(0)).current;

  // Reset the form for each new detection — the previous one's name must never
  // carry over onto a different payment.
  useEffect(() => {
    if (!detected) return;
    const detectedName = detected.suggestedName ?? detected.parsed.merchant ?? '';
    setExpanded(false);
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

  // Step aside after AUTO_HIDE_MS — but only while collapsed. Once the user has
  // opened the form they're mid-edit, and yanking it away would throw away what
  // they've typed; the timer restarts if they collapse it again.
  useEffect(() => {
    if (!detected || expanded || saving) return;
    const timer = setTimeout(() => onSnooze(detected.id), AUTO_HIDE_MS);
    return () => clearTimeout(timer);
  }, [detected, expanded, saving, onSnooze]);

  useEffect(() => {
    Animated.timing(slide, {
      toValue: detected ? 1 : 0,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [detected, slide]);

  if (!detected) return null;

  const { parsed, sourceLabel } = detected;
  const categories = type === 'expense' ? expenseCategories : incomeCategories;
  const selectableAccounts = accounts.filter((a) => a.type === 'bank' || a.type === 'wallet');
  const canSave = name.trim().length > 0 && !!accountId && !saving;

  const detectedAt = new Date(parsed.postedAt).toLocaleString('en-MY', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    const result = await onSave(detected, {
      name: name.trim(),
      type,
      accountId,
      // Built-in categories are stored by slug id, the same as the main form —
      // storing the display name here left detected rows with a fallback icon.
      category,
    });
    setSaving(false);
    if (!result.ok) setExpanded(true);
  };

  return (
    <Animated.View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        top: insets.top + 8,
        left: 12,
        right: 12,
        zIndex: 100,
        opacity: slide,
        transform: [
          { translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [-80, 0] }) },
        ],
      }}
    >
      <View className="bg-card border border-primary/40 rounded-3xl overflow-hidden shadow-xl">
        {/* Collapsed summary — always visible, tapping toggles the form */}
        <Pressable
          onPress={() => setExpanded((prev) => !prev)}
          className="flex-row items-center gap-3 px-4 py-3"
        >
          <View className="w-9 h-9 rounded-full bg-primary/15 items-center justify-center">
            <Sparkle size={18} color="#C5FF00" />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-foreground">
              {type === 'expense' ? '−' : '+'}RM {parsed.amount.toFixed(2)}
            </Text>
            <Text className="text-xs text-muted-foreground" numberOfLines={1}>
              {sourceLabel} · {detectedAt}
            </Text>
          </View>
          <Pressable onPress={() => onDismiss(detected.id)} hitSlop={10} className="p-1">
            <X size={18} color="#a0a0a0" />
          </Pressable>
        </Pressable>

        {expanded && (
          <View className="px-4 pb-4 border-t border-border pt-3">
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
              autoFocus
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
                notice. Saying so outright drops it, so it stops coming back;
                the X above does the same but reads as "close for now". */}
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
        )}
      </View>
    </Animated.View>
  );
}
