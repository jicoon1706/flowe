import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Check, Repeat } from 'lucide-react-native';
import { colors, radius } from '@/theme/tokens';
import type { RecurringRule } from '@/src/types';
import { Button } from '../ui/Button';
import { Money } from '../ui/Money';
import { Sheet } from '../ui/Sheet';
import { Text } from '../ui/Text';
import { RecurringRuleRow } from './RecurringRuleRow';

export interface PendingRecurringModalProps {
  visible: boolean;
  pending: RecurringRule[];
  acting: boolean;
  /** Source account names by id, for the subtitle. */
  accountNames: Record<string, string>;
  onApprove: (rule: RecurringRule) => Promise<{ ok: boolean }>;
  onReject: (rule: RecurringRule) => Promise<{ ok: boolean }>;
  onClose: () => void;
}


/**
 * Due-today recurring bills (core-recurring-modal): all pre-ticked, one tap
 * logs every ticked bill. "Review one by one" steps through with Skip.
 */
export function PendingRecurringModal({ visible, pending, acting, accountNames, onApprove, onReject, onClose }: PendingRecurringModalProps) {
  const [ticked, setTicked] = useState<Set<string>>(new Set());
  const [oneByOne, setOneByOne] = useState(false);
  useEffect(() => { if (visible) { setTicked(new Set(pending.map((r) => r.id))); setOneByOne(false); } }, [visible, pending]);

  const selected = pending.filter((r) => ticked.has(r.id));
  const total = selected.reduce((s, r) => s + (r.type === 'expense' ? -1 : 1) * Number(r.amount), 0);
  const sources = Array.from(new Set(pending.map((r) => accountNames[r.from_account_id ?? r.to_account_id ?? ''] ).filter(Boolean)));

  const confirmSelected = async () => {
    for (const r of selected) await onApprove(r);
    if (selected.length === pending.length) onClose();
  };

  const toggle = (id: string) => setTicked((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const current = pending[0];

  return (
    <Sheet visible={visible && pending.length > 0} onClose={onClose} dismissible={!acting} scroll testID="recurring-due">
      <View style={{ gap: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 44, height: 44, borderRadius: radius.full, backgroundColor: colors['surface-container'], alignItems: 'center', justifyContent: 'center' }}>
            <Repeat size={21} color={colors['on-surface']} strokeWidth={1.75} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="headline-md" accessibilityRole="header">
              {pending.length} recurring {pending.length === 1 ? 'bill' : 'bills'} due
            </Text>
            <Text variant="body-md" tone="muted">Today{sources.length === 1 ? ` · from ${sources[0]}` : ''}</Text>
          </View>
        </View>

        {oneByOne && current ? (
          <View style={{ gap: 12 }}>
            <RecurringRuleRow rule={current} />
            <Button label="Confirm" onPress={() => onApprove(current)} loading={acting} fullWidth />
            <Button label="Skip this one" variant="text" disabled={acting} onPress={() => onReject(current)} style={{ alignSelf: 'center' }} />
          </View>
        ) : (
          <>
            <View>
              {pending.map((r) => (
                <Pressable
                  key={r.id}
                  onPress={() => toggle(r.id)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: ticked.has(r.id) }}
                  accessibilityLabel={`Include ${r.name}`}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
                >
                  <View style={{ flex: 1 }}><RecurringRuleRow rule={r} /></View>
                  <View style={{ width: 24, height: 24, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: ticked.has(r.id) ? colors.secondary : 'transparent', borderWidth: ticked.has(r.id) ? 0 : 1.5, borderColor: colors['on-surface-variant'] }}>
                    {ticked.has(r.id) ? <Check size={14} color={colors['on-secondary']} strokeWidth={2.5} /> : null}
                  </View>
                </Pressable>
              ))}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text variant="body-md" tone="muted">Total</Text>
              <Money amount={Math.abs(total)} direction={total < 0 ? 'expense' : total > 0 ? 'income' : 'none'} variant="headline-md" />
            </View>
            <View style={{ gap: 4, marginTop: 8 }}>
              <Button
                label={selected.length === pending.length ? 'Confirm all' : `Confirm ${selected.length}`}
                onPress={confirmSelected}
                disabled={selected.length === 0}
                loading={acting}
                loadingLabel="Confirming…"
                fullWidth
              />
              <Button label="Review one by one" variant="text" disabled={acting} onPress={() => setOneByOne(true)} style={{ alignSelf: 'center' }} />
            </View>
          </>
        )}
      </View>
    </Sheet>
  );
}

