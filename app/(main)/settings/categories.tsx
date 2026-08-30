import { useEffect, useState } from 'react';
import { View, Text, Pressable, TextInput, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { expenseCategories, incomeCategories } from '../../../constants/categories';
import { Plus, X, Pencil, Trash2 } from '../../../components/ui/icons';
import { useAuth } from '../../../context/AuthContext';
import { useCustomCategories } from '../../../src/hooks/useCustomCategories';
import { LoadingView } from '../../../components/ui/LoadingView';
import { ErrorView } from '../../../components/ui/ErrorView';

const PRESET_COLORS = [
  '#F97316', '#3B82F6', '#8B5CF6', '#EC4899', '#EF4444',
  '#F59E0B', '#6B7280', '#22C55E', '#6366F1', '#14B8A6',
];

const PRESET_EMOJIS = ['🍔', '🚗', '🧾', '🛍️', '💊', '🎬', '📦', '💼', '💻', '🎁', '💰', '📈', '🏠'];

// A row in the list: built-in categories are read-only, custom ones can be
// edited and removed. `customId` being set is what makes a row editable.
interface CategoryRow {
  key: string;
  name: string;
  emoji: string;
  color?: string;
  customId?: string;
}

export default function CategoriesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    categories: customCats,
    loading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useCustomCategories();
  const [tab, setTab] = useState<'expense' | 'income'>('expense');
  // null = closed, 'new' = add, otherwise the custom category being edited.
  const [editing, setEditing] = useState<'new' | CategoryRow | null>(null);
  const [formEmoji, setFormEmoji] = useState('📦');
  const [formName, setFormName] = useState('');
  const [formColor, setFormColor] = useState('#6B7280');

  useEffect(() => {
    if (user) fetchCategories(user.id);
  }, [user, fetchCategories]);

  if (loading) return <LoadingView />;
  if (error) return <ErrorView error={error} onRetry={() => user && fetchCategories(user.id)} />;

  const builtIn: CategoryRow[] = (tab === 'expense' ? expenseCategories : incomeCategories).map((c: any) => ({
    key: c.id,
    name: c.name,
    emoji: c.emoji,
    color: c.color,
  }));
  const customForTab: CategoryRow[] = customCats
    .filter((c: any) => c.transaction_type === tab)
    .map((c: any) => ({ key: c.id, customId: c.id, name: c.name, emoji: c.icon, color: c.color }));
  const categories = [...builtIn, ...customForTab];

  const openAdd = () => {
    setFormEmoji('📦');
    setFormName('');
    setFormColor('#6B7280');
    setEditing('new');
  };

  const openEdit = (row: CategoryRow) => {
    setFormEmoji(row.emoji || '📦');
    setFormName(row.name);
    setFormColor(row.color ?? '#6B7280');
    setEditing(row);
  };

  const handleSave = async () => {
    const name = formName.trim();
    if (!name || !user || !editing) return;

    const result = editing === 'new'
      ? await createCategory({
          user_id: user.id,
          name,
          icon: formEmoji,
          color: formColor,
          transaction_type: tab,
        } as any)
      : await updateCategory(editing.customId!, { name, icon: formEmoji, color: formColor });

    if (result.ok) {
      setEditing(null);
      await fetchCategories(user.id);
    } else {
      Alert.alert('Could not save', result.error.message ?? 'Please try again.');
    }
  };

  const handleDelete = (row: CategoryRow) => {
    Alert.alert(
      `Delete "${row.name}"?`,
      'Transactions already using this category keep it — it just stops appearing when you add new ones.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteCategory(row.customId!);
            if (result.ok) {
              setEditing(null);
              if (user) await fetchCategories(user.id);
            } else {
              Alert.alert('Could not delete', result.error.message ?? 'Please try again.');
            }
          },
        },
      ]
    );
  };

  const isNew = editing === 'new';
  const editingRow = editing && editing !== 'new' ? editing : null;

  const renderFormModal = () => (
    editing ? (
    <View className="absolute inset-0 z-50" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      <Pressable className="flex-1 bg-black/50 justify-end" onPress={() => setEditing(null)}>
        <Pressable className="bg-card rounded-t-3xl p-6 pb-8" onPress={(e) => e.stopPropagation()}>
          <View className="w-12 h-1 bg-border rounded-full mx-auto mb-6" />

          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-lg font-semibold text-foreground">
              {isNew
                ? `Add ${tab === 'expense' ? 'Expense' : 'Income'} Category`
                : 'Edit Category'}
            </Text>
            <Pressable onPress={() => setEditing(null)} className="p-2">
              <X size={20} color="#a0a0a0" />
            </Pressable>
          </View>

          <Text className="text-sm text-muted-foreground mb-2">Icon</Text>
          <View className="flex-row flex-wrap gap-2 mb-5">
            {PRESET_EMOJIS.map((emoji) => (
              <Pressable
                key={emoji}
                onPress={() => setFormEmoji(emoji)}
                className={`w-12 h-12 rounded-xl items-center justify-center ${
                  formEmoji === emoji ? 'bg-primary' : 'bg-background border border-border'
                }`}
              >
                <Text className="text-xl">{emoji}</Text>
              </Pressable>
            ))}
          </View>

          <Text className="text-sm text-muted-foreground mb-2">Name</Text>
          <TextInput
            value={formName}
            onChangeText={setFormName}
            placeholder="Category name"
            placeholderTextColor="#6b7280"
            className="bg-background border border-border rounded-xl px-4 py-3 text-foreground mb-5"
          />

          <Text className="text-sm text-muted-foreground mb-2">Color</Text>
          <View className="flex-row flex-wrap gap-3 mb-6">
            {PRESET_COLORS.map((color) => {
              const isSelected = formColor === color;
              return (
                <Pressable
                  key={color}
                  onPress={() => setFormColor(color)}
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{
                    borderWidth: isSelected ? 2 : 0,
                    borderColor: '#C5FF00',
                    padding: isSelected ? 2 : 0,
                  }}
                >
                  <View className="w-8 h-8 rounded-full" style={{ backgroundColor: color }} />
                </Pressable>
              );
            })}
          </View>

          {editingRow && (
            <Pressable
              onPress={() => handleDelete(editingRow)}
              className="flex-row items-center justify-center gap-2 py-3.5 rounded-xl bg-background border border-border mb-3"
            >
              <Trash2 size={16} color="#ff4444" />
              <Text className="text-expense font-medium">Delete category</Text>
            </Pressable>
          )}

          <View className="flex-row gap-3">
            <Pressable
              onPress={() => setEditing(null)}
              className="flex-1 py-3.5 rounded-xl bg-background border border-border items-center"
            >
              <Text className="text-foreground font-medium">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={!formName.trim()}
              className="flex-1 py-3.5 rounded-xl bg-primary items-center disabled:opacity-50"
            >
              <Text className="text-black font-semibold">Save</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </View>
    ) : null
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScreenHeader
        title="Categories"
        onBack={() => router.back()}
        rightAction={
          <Pressable
            onPress={openAdd}
            className="w-10 h-10 rounded-full bg-primary items-center justify-center"
          >
            <Plus size={20} color="#000" />
          </Pressable>
        }
      />
      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        {/* Tab bar */}
        <View className="flex-row gap-3 mb-6">
          {(['expense', 'income'] as const).map(t => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              className={`flex-1 py-3 rounded-2xl items-center ${
                tab === t ? 'bg-primary' : 'bg-card border border-border'
              }`}
            >
              <Text className={`text-sm font-semibold ${tab === t ? 'text-black' : 'text-foreground'}`}>
                {t === 'expense' ? 'Expense' : 'Income'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Category list */}
        <View className="bg-card border border-border rounded-2xl p-4 mb-4">
          {categories.map((cat, i) => (
            <View key={cat.key}>
              {i > 0 && <View className="border-t border-border" />}
              <Pressable
                onPress={() => cat.customId && openEdit(cat)}
                disabled={!cat.customId}
                className="flex-row items-center gap-3 py-3"
              >
                <Text className="text-lg">{cat.emoji}</Text>
                <View className="flex-1">
                  <Text className="text-foreground text-sm">{cat.name}</Text>
                </View>
                {cat.customId ? (
                  <Pencil size={16} color="#a0a0a0" />
                ) : (
                  <Text className="text-[10px] text-muted-foreground uppercase tracking-wider">Built-in</Text>
                )}
                <View className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
              </Pressable>
            </View>
          ))}
        </View>

        <Text className="text-center text-xs text-muted-foreground mb-8">
          Tap a category you created to rename it, change its icon or colour, or remove it.
          Built-in categories can&apos;t be changed.
        </Text>
      </ScrollView>
      {renderFormModal()}
    </SafeAreaView>
  );
}
