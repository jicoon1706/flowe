import { View, Text, Pressable, ScrollView, Modal } from 'react-native';
import { X, Repeat, Check, CalendarClock } from 'lucide-react-native';
import type { RecurringRule } from '../../src/types';

interface PendingRecurringModalProps {
  visible: boolean;
  pending: RecurringRule[];
  acting: boolean;
  onApprove: (rule: RecurringRule) => void;
  onReject: (rule: RecurringRule) => void;
  onClose: () => void;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function PendingRecurringModal({
  visible,
  pending,
  acting,
  onApprove,
  onReject,
  onClose,
}: PendingRecurringModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/50 justify-end" onPress={onClose}>
        <Pressable className="bg-card rounded-t-3xl p-6 pb-8" onPress={(e) => e.stopPropagation()}>
          <View className="w-12 h-1 bg-border rounded-full mx-auto mb-6" />

          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-row items-center gap-2">
              <CalendarClock size={20} color="#C5FF00" />
              <Text className="text-lg font-semibold text-foreground">Recurring Due</Text>
            </View>
            <Pressable onPress={onClose} className="p-2">
              <X size={20} color="#a0a0a0" />
            </Pressable>
          </View>

          {pending.length === 0 ? (
            <View className="items-center justify-center py-10">
              <Repeat size={44} color="#404040" />
              <Text className="text-muted-foreground text-sm mt-4">No recurring payments due</Text>
              <Text className="text-muted-foreground text-xs mt-1">You&apos;re all caught up 🎉</Text>
            </View>
          ) : (
            <>
              <Text className="text-xs text-muted-foreground mb-3">
                Approve to add to your transactions, or reject to skip this time.
              </Text>
              <ScrollView showsVerticalScrollIndicator={false} className="max-h-96">
                <View className="gap-3">
                  {pending.map((rule) => (
                    <View
                      key={rule.id}
                      className="bg-background border border-border rounded-2xl p-4"
                    >
                      <View className="flex-row items-center gap-3">
                        <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center">
                          <Repeat size={18} color="#C5FF00" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-sm font-medium text-foreground">{rule.name}</Text>
                          <View className="flex-row items-center gap-2 mt-0.5">
                            <Text className="text-xs text-muted-foreground capitalize">
                              {rule.frequency}
                            </Text>
                            <Text className="text-xs text-muted-foreground">·</Text>
                            <Text className="text-xs text-muted-foreground">
                              {formatDate(rule.next_date ?? rule.start_date)}
                            </Text>
                          </View>
                        </View>
                        <Text className="text-sm font-semibold text-foreground">
                          RM {Number(rule.amount).toFixed(2)}
                        </Text>
                      </View>

                      <View className="flex-row items-center gap-2 mt-3">
                        <Pressable
                          onPress={() => onReject(rule)}
                          disabled={acting}
                          className="flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl border border-border active:opacity-70"
                        >
                          <X size={15} color="#ff4444" />
                          <Text className="text-sm font-medium text-destructive">Reject</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => onApprove(rule)}
                          disabled={acting}
                          className="flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary active:opacity-80"
                        >
                          <Check size={15} color="#000000" />
                          <Text className="text-sm font-semibold text-black">Approve</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
