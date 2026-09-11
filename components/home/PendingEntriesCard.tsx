import { useEffect, useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView } from 'react-native';
import { X, Sparkle, ChevronRight } from '../ui/icons';
import { KeyboardAvoider } from '../ui/KeyboardAvoider';
import { DetectedTransactionForm } from './DetectedTransactionForm';
import type { DetectedTransaction, SaveOverrides } from '../../src/hooks/useDetectedTransactions';

interface PendingEntriesCardProps {
  pending: DetectedTransaction[];
  accounts: any[];
  onSave: (detected: DetectedTransaction, values: SaveOverrides) => Promise<{ ok: boolean }>;
  onDismiss: (id: string) => void;
}

function formatDetectedAt(postedAt: number): string {
  return new Date(postedAt).toLocaleString('en-MY', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Why this one couldn't file itself — the thing the user is being asked for. */
function missingHint(item: DetectedTransaction): string {
  if (!item.accountId) return 'Which account?';
  if (!item.parsed.typeConfident) return 'Expense or income?';
  if (!item.parsed.merchant && !item.suggestedName) return 'What was it for?';
  return 'Tap to complete';
}

/**
 * Payments Flowe caught in bank / e-wallet notifications but couldn't file on
 * its own — usually an e-wallet alert that names no account, or a merchant it
 * doesn't know. They stay here, on device, until the user completes or ignores
 * them, so nothing the island timed out of is lost.
 *
 * Deliberately usable before the app is unlocked: recording a payment is the
 * one thing that's allowed while locked, and these are payments half-recorded.
 */
export function PendingEntriesCard({ pending, accounts, onSave, onDismiss }: PendingEntriesCardProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const editing = pending.find((item) => item.id === editingId) ?? null;

  // The one being edited was filed or ignored from somewhere else (the island,
  // the shade) — close the sheet rather than editing a ghost.
  useEffect(() => {
    if (editingId && !editing) setEditingId(null);
  }, [editingId, editing]);

  if (pending.length === 0) return null;

  const close = () => { if (!saving) setEditingId(null); };

  return (
    <>
      <View className="mx-4 mb-5 bg-card border border-primary/30 rounded-2xl p-4">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2">
            <Sparkle size={16} color="#C5FF00" />
            <Text className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              Needs your input
            </Text>
          </View>
          <View className="min-w-5 h-5 px-1.5 rounded-full bg-primary items-center justify-center">
            <Text className="text-[10px] font-bold text-black">{pending.length > 9 ? '9+' : pending.length}</Text>
          </View>
        </View>
        <View className="gap-2">
          {pending.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => setEditingId(item.id)}
              className="flex-row items-center justify-between bg-background border border-border rounded-xl px-3 py-3 active:scale-[0.98] transition-transform"
            >
              <View className="flex-1 pr-3">
                <Text className="text-sm font-medium text-foreground" numberOfLines={1}>
                  {item.suggestedName || item.parsed.merchant || item.sourceLabel}
                </Text>
                <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                  {item.sourceLabel} · {formatDetectedAt(item.parsed.postedAt)}
                </Text>
                <Text className="text-xs text-primary mt-0.5">{missingHint(item)}</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Text
                  className={`text-sm font-semibold ${
                    item.parsed.type === 'income' ? 'text-income' : 'text-expense'
                  }`}
                >
                  {(item.parsed.type === 'income' ? '+' : '-') +
                    item.parsed.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Text>
                <ChevronRight size={16} color="#a0a0a0" />
              </View>
            </Pressable>
          ))}
        </View>
      </View>

      <Modal visible={!!editing} transparent animationType="fade" onRequestClose={close}>
        <KeyboardAvoider className="flex-1">
          <Pressable className="flex-1 bg-black/50 justify-end" onPress={close}>
            <Pressable className="bg-card rounded-t-3xl p-6 pb-8" onPress={(e) => e.stopPropagation()}>
              <View className="w-12 h-1 bg-border rounded-full mx-auto mb-6" />
              {editing && (
                <>
                  <View className="flex-row items-center justify-between mb-4">
                    <View className="flex-row items-center gap-3">
                      <View className="w-9 h-9 rounded-full bg-primary/15 items-center justify-center">
                        <Sparkle size={18} color="#C5FF00" />
                      </View>
                      <View>
                        <Text className="text-base font-semibold text-foreground">
                          {editing.parsed.type === 'expense' ? '−' : '+'}RM {editing.parsed.amount.toFixed(2)}
                        </Text>
                        <Text className="text-xs text-muted-foreground">
                          {editing.sourceLabel} · {formatDetectedAt(editing.parsed.postedAt)}
                        </Text>
                      </View>
                    </View>
                    <Pressable onPress={close} className="p-2">
                      <X size={20} color="#a0a0a0" />
                    </Pressable>
                  </View>
                  <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                    <DetectedTransactionForm
                      detected={editing}
                      accounts={accounts}
                      onSave={async (item, values) => {
                        const result = await onSave(item, values);
                        if (result.ok) setEditingId(null);
                        return result;
                      }}
                      onDismiss={(id) => { onDismiss(id); setEditingId(null); }}
                      autoFocusName={false}
                      onSavingChange={setSaving}
                    />
                  </ScrollView>
                </>
              )}
            </Pressable>
          </Pressable>
        </KeyboardAvoider>
      </Modal>
    </>
  );
}
