import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { CircleAlert } from 'lucide-react-native';
import { colors } from '@/theme/tokens';
import { expenseCategories } from '@/constants/categories';
import { useAuth } from '@/context/AuthContext';
import { useCategoryGroups } from '@/src/hooks/useCategoryGroups';
import { useCustomCategories } from '@/src/hooks/useCustomCategories';
import { DEFAULT_SPLIT_TARGETS, SPLIT_HISTORY_NOTE, targetsProblem } from '@/src/lib/incomeSplit';
import { groupCategories } from '@/src/lib/incomeSplitView';
import type { SplitGroup, SplitTargets } from '@/src/types';
import { Button } from '../ui/Button';
import { Pressable } from '../ui/Pressable';
import { Sheet } from '../ui/Sheet';
import { Skeleton } from '../ui/Skeleton';
import { Text } from '../ui/Text';
import { TextInput } from '../ui/TextInput';
import { useToast } from '../ui/ToastProvider';
import { SheetHeader } from '../cashflow/AssetFormParts';

const PILLS: { value: SplitGroup; label: string }[] = [
  { value: 'needs', label: 'Needs' },
  { value: 'wants', label: 'Wants' },
  { value: 'skip', label: 'Skip' },
];
const TARGETS: { key: keyof SplitTargets; label: string }[] = [
  { key: 'needs', label: 'Needs' },
  { key: 'wants', label: 'Wants' },
  { key: 'invest', label: 'Invest & save' },
];

/**
 * Edit groups (mo-edit-groups, t-mo-edit-groups): every expense category as
 * Needs | Wants | Skip, and the three targets. Targets that don't add up to
 * 100 show the error chip and keep Save groups disabled; the server checks too.
 */
export function EditGroupsSheet({ visible, onClose, onSaved, pillWidth }: { visible: boolean; onClose: () => void; onSaved: () => void; pillWidth?: number }) {
  const toast = useToast();
  const { user } = useAuth();
  const { categories, fetchCategories } = useCustomCategories();
  const { groups, targets, loading, error, saving, refresh, save } = useCategoryGroups(visible);
  const [picked, setPicked] = useState<Record<string, SplitGroup>>({});
  const [typed, setTyped] = useState<Partial<Record<keyof SplitTargets, string>>>({});
  const [lastEdited, setLastEdited] = useState<keyof SplitTargets | null>(null);

  useEffect(() => {
    if (!visible) return;
    if (user) fetchCategories(user.id);
    setPicked({});
    setTyped({});
    setLastEdited(null);
  }, [visible, fetchCategories, user]);

  const custom = useMemo(() => categories.filter((c) => c.transaction_type === 'expense' && c.is_active), [categories]);
  const list = useMemo(() => groupCategories(expenseCategories, custom, groups), [custom, groups]);
  const base = targets ?? DEFAULT_SPLIT_TARGETS;
  const value = (k: keyof SplitTargets) => typed[k] ?? String(base[k]);
  const next: SplitTargets = { needs: Number(value('needs') || 0), wants: Number(value('wants') || 0), invest: Number(value('invest') || 0) };
  const problem = loading ? null : targetsProblem(next);

  const submit = async () => {
    if (problem || loading) return;
    const res = await save(list.map((c) => ({ category: c.category, group: picked[c.category] ?? c.group })), next);
    if (!res.ok) { toast.failure('Couldn’t save groups', { label: 'Retry', onPress: submit }); return; }
    toast.success('Groups saved');
    onSaved();
    onClose();
  };

  return (
    <Sheet visible={visible} onClose={onClose} scroll dismissible={!saving}>
      <SheetHeader title="Edit groups" onClose={onClose} />
      {error && !loading ? (
        <Pressable accessibilityRole="button" onPress={refresh}><Text variant="body-md" tone="meta">Couldn’t load your groups · Try again</Text></Pressable>
      ) : (
        <View style={{ gap: 6 }}>
          <Text variant="label-sm" weight={600} tone="muted" style={{ paddingVertical: 4 }}>Categories</Text>
          {loading
            ? [0, 1, 2, 3].map((i) => <Skeleton key={i} width="100%" height={44} />)
            : list.map((c) => {
                const current = picked[c.category] ?? c.group;
                return (
                  <View key={c.category} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52 }}>
                    <Text variant="label-lg" weight={400} numberOfLines={1} style={{ flex: 1, minWidth: 0 }}>{c.label}</Text>
                    <View accessibilityRole="radiogroup" accessibilityLabel={c.label} style={{ width: pillWidth ?? 240, flexDirection: 'row', gap: 2, padding: 3, borderRadius: 9999, backgroundColor: colors['surface-container'] }}>
                      {PILLS.map((p) => {
                        const on = current === p.value;
                        return (
                          <Pressable
                            key={p.value}
                            accessibilityRole="radio"
                            accessibilityState={{ checked: on }}
                            onPress={() => setPicked((x) => ({ ...x, [c.category]: p.value }))}
                            style={{ flex: 1, height: 44, borderRadius: 9999, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? colors.secondary : 'transparent' }}
                          >
                            <Text variant="body-md" size={13} weight={600} tone={on ? 'inverse' : 'default'}>{p.label}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
          <Text variant="body-md" size={13} tone="muted" style={{ marginTop: 8 }}>Invest &amp; save is filled automatically from Tabung and asset top-ups.</Text>
          <Text variant="label-sm" weight={600} tone="muted" style={{ paddingTop: 12, paddingBottom: 4 }}>Targets (% of income)</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {TARGETS.map((t) => (
              <View key={t.key} style={{ flex: 1 }}>
                <TextInput
                  label={t.label}
                  keyboardType="number-pad"
                  suffix="%"
                  value={value(t.key)}
                  highlight={!!problem && lastEdited === t.key}
                  onChangeText={(v) => { setTyped((x) => ({ ...x, [t.key]: v.replace(/\D/g, '').slice(0, 3) })); setLastEdited(t.key); }}
                />
              </View>
            ))}
          </View>
          {problem ? (
            <View accessibilityRole="alert" style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', minHeight: 32, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 9999, backgroundColor: colors['surface-container-high'], marginTop: 6 }}>
              <CircleAlert size={14} color={colors['on-surface']} strokeWidth={1.75} />
              <Text variant="body-md" size={13} weight={500}>{problem}</Text>
            </View>
          ) : null}
          <Text variant="label-sm" weight={400} tone="muted" style={{ marginTop: 12 }}>{SPLIT_HISTORY_NOTE}</Text>
          <Button label="Save groups" disabled={!!problem || loading || !!error} loading={saving} loadingLabel="Saving…" onPress={submit} style={{ marginTop: 12 }} />
        </View>
      )}
    </Sheet>
  );
}
