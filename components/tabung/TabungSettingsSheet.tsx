import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { colors, radius } from '@/theme/tokens';
import { formatRM, parseAmount } from '@/src/lib/money';
import type { TabungProgressMode } from '@/src/lib/tabungProgress';
import { AmountField } from '../ui/AmountField';
import { Button } from '../ui/Button';
import { Sheet } from '../ui/Sheet';
import { Text } from '../ui/Text';
import { TextInput } from '../ui/TextInput';

export interface TabungSettingsValues {
  name: string;
  target: number;
  mode: TabungProgressMode;
}

export interface TabungSettingsSheetProps {
  visible: boolean;
  onClose: () => void;
  initial: TabungSettingsValues;
  contributed: number;
  balance: number;
  /** Focus the target ("Raise the target"). */
  focusTarget?: boolean;
  onSave: (v: TabungSettingsValues) => Promise<boolean>;
  onDelete: () => void;
}

/**
 * Tabung settings (n-tabung-progress-setting): "Count progress by" — Total
 * saved in (default) or Current balance — with what each would show now, plus
 * name and target. Delete → confirm.
 */
export function TabungSettingsSheet({ visible, onClose, initial, contributed, balance, focusTarget, onSave, onDelete }: TabungSettingsSheetProps) {
  const [mode, setMode] = useState<TabungProgressMode>(initial.mode);
  const [name, setName] = useState(initial.name);
  const [target, setTarget] = useState(String(initial.target || ''));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setMode(initial.mode);
    setName(initial.name);
    setTarget(initial.target ? String(initial.target) : '');
    setError(null);
  }, [visible, initial.mode, initial.name, initial.target]);

  const t = parseAmount(target) ?? 0;
  const pct = (v: number) => (t > 0 ? Math.round((v / t) * 100) : 0);
  const options: { value: TabungProgressMode; title: string; body: string; now: number }[] = [
    { value: 'contributed', title: 'Total saved in (default)', body: 'Every top-up counts toward the goal. Paying out of this Tabung never moves progress back.', now: contributed },
    { value: 'balance', title: 'Current balance', body: 'Progress follows what’s in the Tabung right now, so pay-outs pull it down.', now: balance },
  ];

  const save = async () => {
    if (!name.trim()) { setError('Give this Tabung a name'); return; }
    if (t <= 0) { setError('Set a target above RM 0.00'); return; }
    setSaving(true);
    const ok = await onSave({ name: name.trim(), target: t, mode });
    setSaving(false);
    if (ok) onClose();
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="Count progress by" scroll dismissible={!saving} testID="tabung-settings">
      <View style={{ gap: 12 }}>
        {options.map((o) => {
          const selected = mode === o.value;
          return (
            <Pressable
              key={o.value}
              onPress={() => setMode(o.value)}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              style={{ flexDirection: 'row', gap: 12, padding: 16, borderRadius: radius.md, borderWidth: 2, borderColor: selected ? colors.secondary : 'transparent', backgroundColor: colors['surface-container'] }}
            >
              <View style={{ width: 24, height: 24, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: selected ? colors.secondary : 'transparent', borderWidth: selected ? 0 : 1.5, borderColor: colors['on-surface-variant'] }}>
                {selected ? <Check size={14} color={colors['on-secondary']} strokeWidth={2.5} /> : null}
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text variant="label-lg">{o.title}</Text>
                <Text variant="body-md" size={13} tone="meta">{o.body}</Text>
                <Text variant="label-sm" weight={600} tabular>Now: {formatRM(o.now)}{t > 0 ? ` · ${pct(o.now)}%` : ''}</Text>
              </View>
            </Pressable>
          );
        })}
        <TextInput label="Name" value={name} onChangeText={setName} autoCapitalize="words" />
        <AmountField label="Target" value={target} onChangeText={setTarget} />
        {error ? <Text variant="label-sm" accessibilityRole="alert">{error}</Text> : null}
        <View style={{ gap: 4, marginTop: 4 }}>
          <Button label="Save" onPress={save} loading={saving} loadingLabel="Saving…" fullWidth />
          <Button label="Delete Tabung" variant="text" muted disabled={saving} onPress={onDelete} style={{ alignSelf: 'center' }} />
        </View>
        {focusTarget ? <Text variant="label-sm" tone="muted">Raise the target to keep this goal going.</Text> : null}
      </View>
    </Sheet>
  );
}
