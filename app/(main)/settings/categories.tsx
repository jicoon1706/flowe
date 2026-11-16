import { useCallback, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Pen, Plus, Tag } from 'lucide-react-native';
import { colors } from '@/theme/tokens';
import { expenseCategories, incomeCategories } from '@/constants/categories';
import { CUSTOM_ICONS, CUSTOM_ICON_KEYS, categoryIcon, categoryOptions } from '@/constants/categoryIcons';
import { SettingsScreen } from '@/components/settings/SettingsScreen';
import { Button } from '@/components/ui/Button';
import { ConfirmSheet } from '@/components/ui/ConfirmSheet';
import { SegmentedToggle } from '@/components/ui/SegmentedToggle';
import { SettingsRow } from '@/components/ui/SettingsRow';
import { Sheet } from '@/components/ui/Sheet';
import { Text } from '@/components/ui/Text';
import { TextInput } from '@/components/ui/TextInput';
import { useToast } from '@/components/ui/ToastProvider';
import { useAuth } from '@/context/AuthContext';
import { useCustomCategories } from '@/src/hooks/useCustomCategories';
import { useTransactions } from '@/src/hooks/useTransactions';
import type { CustomCategory } from '@/src/types';

type Kind = 'expense' | 'income';

/**
 * settings/categories — ordered by most used this month (drives the 6 chips on
 * Add). Built-ins are fixed; your own can be edited (monochrome line icons only).
 */
export default function CategoriesScreen() {
  const toast = useToast();
  const { user } = useAuth();
  const now = new Date();
  const { transactions, refetch } = useTransactions(now.getFullYear(), now.getMonth() + 1);
  const { categories: custom, fetchCategories, createCategory, updateCategory, deleteCategory } = useCustomCategories();
  const [kind, setKind] = useState<Kind>('expense');
  const [editing, setEditing] = useState<{ row: CustomCategory | null } | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('tag');
  const [formKind, setFormKind] = useState<Kind>('expense');
  const [nameError, setNameError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<CustomCategory | null>(null);

  const load = useCallback(() => { if (user) fetchCategories(user.id); refetch(); }, [user, fetchCategories, refetch]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const usage = useMemo(() => {
    const u: Record<string, number> = {};
    for (const t of transactions) if (t.category && t.type === kind) u[t.category] = (u[t.category] ?? 0) + 1;
    return u;
  }, [transactions, kind]);
  const options = categoryOptions(kind === 'expense' ? expenseCategories : incomeCategories, custom, kind, usage);

  const open = (row: CustomCategory | null) => {
    setName(row?.name ?? '');
    setIcon(row?.icon && CUSTOM_ICONS[row.icon] ? row.icon : 'tag');
    setFormKind(row?.transaction_type ?? kind);
    setNameError(null);
    setEditing({ row });
  };

  const save = async () => {
    if (!user) return;
    const n = name.trim();
    if (!n) { setNameError('Give the category a name'); return; }
    const clash = options.some((o) => o.label.toLowerCase() === n.toLowerCase() && o.value !== editing?.row?.name);
    if (clash) { setNameError('You already have a category with that name'); return; }
    setSaving(true);
    const res = editing?.row
      ? await updateCategory(editing.row.id, { name: n, icon })
      : await createCategory({ user_id: user.id, name: n, icon, transaction_type: formKind });
    setSaving(false);
    if (!res.ok) { toast.failure('Couldn’t save category', { label: 'Retry', onPress: save }); return; }
    setEditing(null);
    toast.success(editing?.row ? 'Category updated' : `Category added · ${n}`);
    load();
  };

  const remove = async () => {
    if (!deleting) return;
    const res = await deleteCategory(deleting.id);
    if (!res.ok) { toast.failure('Delete failed', { label: 'Retry', onPress: remove }); return; }
    toast.success(`${deleting.name} deleted`);
    setDeleting(null);
    load();
  };

  const deletingCount = deleting ? usage[deleting.name] ?? 0 : 0;

  return (
    <SettingsScreen
      title="Categories"
      overlay={
        <>
          <Sheet visible={!!editing} onClose={() => setEditing(null)} title={editing?.row ? 'Edit category' : 'New category'} scroll dismissible={!saving}>
            <View style={{ gap: 16 }}>
              <TextInput label="Name" value={name} onChangeText={(t) => { setName(t); setNameError(null); }} error={nameError} autoCapitalize="words" />
              <View style={{ gap: 8 }}>
                <Text variant="label-sm" tone="muted">Icon</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {CUSTOM_ICON_KEYS.map((k) => {
                    const Icon = CUSTOM_ICONS[k];
                    const sel = k === icon;
                    return (
                      <Pressable key={k} onPress={() => setIcon(k)} accessibilityRole="radio" accessibilityLabel={k.replace(/-/g, ' ')} accessibilityState={{ checked: sel }}
                        style={{ width: '14.9%', height: 52, borderRadius: 9999, backgroundColor: sel ? colors.secondary : colors['surface-container'], alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={20} color={sel ? colors['on-secondary'] : colors['on-surface']} strokeWidth={1.75} />
                      </Pressable>
                    );
                  })}
                </View>
              </View>
              {!editing?.row ? (
                <SegmentedToggle options={[{ value: 'expense', label: 'Expense' }, { value: 'income', label: 'Income' }]} value={formKind} onChange={setFormKind} accessibilityLabel="Category type" />
              ) : null}
              <View style={{ gap: 4 }}>
                <Button label="Save category" onPress={save} loading={saving} loadingLabel="Saving…" fullWidth />
                {editing?.row ? <Button label="Delete category" variant="text" muted disabled={saving} onPress={() => { const r = editing.row; setEditing(null); setDeleting(r); }} style={{ alignSelf: 'center' }} /> : null}
              </View>
            </View>
          </Sheet>
          <ConfirmSheet
            visible={!!deleting}
            icon={categoryIcon(deleting?.icon ?? 'tag')}
            title={`Delete ${deleting?.name ?? 'category'}?`}
            message={deletingCount
              ? `${deletingCount} transaction${deletingCount === 1 ? '' : 's'} this month keep the label “${deleting?.name}”. It won’t be offered for new ones.`
              : 'It won’t be offered for new transactions.'}
            confirmLabel="Delete category"
            loadingLabel="Deleting…"
            onConfirm={remove}
            onCancel={() => setDeleting(null)}
          />
        </>
      }
    >
      <SegmentedToggle options={[{ value: 'expense', label: 'Expense' }, { value: 'income', label: 'Income' }]} value={kind} onChange={setKind} accessibilityLabel="Category type" />
      <View>
        {options.map((o) => {
          const row = o.custom ? custom.find((c) => c.name === o.value && c.transaction_type === kind) ?? null : null;
          const n = usage[o.value] ?? 0;
          return (
            <SettingsRow
              key={o.value}
              label={o.label}
              value={`${n} this month`}
              icon={o.icon ?? Tag}
              onPress={row ? () => open(row) : undefined}
              right={row ? <Pen size={18} color={colors['on-surface-variant']} strokeWidth={1.75} /> : undefined}
              accessibilityLabel={row ? `Edit ${o.label}` : undefined}
            />
          );
        })}
      </View>
      <Button label="Add category" icon={Plus} onPress={() => open(null)} fullWidth />
    </SettingsScreen>
  );
}
