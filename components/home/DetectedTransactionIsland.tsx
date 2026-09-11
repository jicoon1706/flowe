import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Sparkle } from '../ui/icons';
import { DetectedTransactionForm } from './DetectedTransactionForm';
import type { DetectedTransaction, SaveOverrides } from '../../src/hooks/useDetectedTransactions';

interface DetectedTransactionIslandProps {
  detected: DetectedTransaction | null;
  accounts: any[];
  onSave: (detected: DetectedTransaction, values: SaveOverrides) => Promise<{ ok: boolean }>;
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
 * isn't lost: it stays in the "needs your input" list on Home and its Android
 * notification stays in the shade, so the user can file it whenever they get
 * to it. Ten seconds is long enough to read the amount and decide, short
 * enough that it never becomes something to swat away.
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
  const [saving, setSaving] = useState(false);
  const slide = useRef(new Animated.Value(0)).current;

  // Each new detection arrives collapsed, whatever state the last one was in.
  useEffect(() => {
    if (detected) setExpanded(false);
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

  const detectedAt = new Date(parsed.postedAt).toLocaleString('en-MY', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

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
              {parsed.type === 'expense' ? '−' : '+'}RM {parsed.amount.toFixed(2)}
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
            <DetectedTransactionForm
              detected={detected}
              accounts={accounts}
              onSave={async (item, values) => {
                const result = await onSave(item, values);
                // A failed write leaves the form up so nothing typed is lost.
                if (!result.ok) setExpanded(true);
                return result;
              }}
              onDismiss={onDismiss}
              onSavingChange={setSaving}
            />
          </View>
        )}
      </View>
    </Animated.View>
  );
}
