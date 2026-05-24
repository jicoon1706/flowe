import { View, Text, Pressable, Modal, TextInput } from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { expenseCategories, incomeCategories } from '../../../constants/categories';
import { Plus, X } from '../../../components/ui/icons';

const PRESET_COLORS = [
  '#F97316', '#3B82F6', '#8B5CF6', '#EC4899', '#EF4444',
  '#F59E0B', '#6B7280', '#22C55E', '#6366F1', '#14B8A6',
];

const PRESET_EMOJIS = ['🍔', '🚗', '🧾', '🛍️', '💊', '🎬', '📦', '💼', '💻', '🎁', '💰', '📈', '🏠'];

export default function CategoriesScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<'expense' | 'income'>('expense');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmoji, setNewEmoji] = useState('📦');
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#6B7280');

  const categories = tab === 'expense' ? expenseCategories : incomeCategories;

  const handleAddCategory = () => {
    console.log('Add category:', { emoji: newEmoji, name: newName, color: newColor, type: tab });
    setShowAddModal(false);
    setNewEmoji('📦');
    setNewName('');
    setNewColor('#6B7280');
  };

  const renderAddModal = () => (
    <Modal
      visible={showAddModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowAddModal(false)}
    >
      <Pressable className="flex-1 bg-black/50 justify-end" onPress={() => setShowAddModal(false)}>
        <Pressable className="bg-card rounded-t-3xl p-6 pb-8" onPress={(e) => e.stopPropagation()}>
          <View className="w-12 h-1 bg-border rounded-full mx-auto mb-6" />

          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-lg font-semibold text-foreground">
              Add {tab === 'expense' ? 'Expense' : 'Income'} Category
            </Text>
            <Pressable onPress={() => setShowAddModal(false)} className="p-2">
              <X size={20} color="#a0a0a0" />
            </Pressable>
          </View>

          <Text className="text-sm text-muted-foreground mb-2">Icon</Text>
          <View className="flex-row flex-wrap gap-2 mb-5">
            {PRESET_EMOJIS.map((emoji) => (
              <Pressable
                key={emoji}
                onPress={() => setNewEmoji(emoji)}
                className={`w-12 h-12 rounded-xl items-center justify-center ${
                  newEmoji === emoji ? 'bg-primary' : 'bg-background border border-border'
                }`}
              >
                <Text className="text-xl">{emoji}</Text>
              </Pressable>
            ))}
          </View>

          <Text className="text-sm text-muted-foreground mb-2">Name</Text>
          <TextInput
            value={newName}
            onChangeText={setNewName}
            placeholder="Category name"
            placeholderTextColor="#6b7280"
            className="bg-background border border-border rounded-xl px-4 py-3 text-foreground mb-5"
          />

          <Text className="text-sm text-muted-foreground mb-2">Color</Text>
          <View className="flex-row flex-wrap gap-3 mb-6">
            {PRESET_COLORS.map((color) => (
              <Pressable
                key={color}
                onPress={() => setNewColor(color)}
                className={`w-10 h-10 rounded-full items-center justify-center ${
                  newColor === color ? 'ring-2 ring-primary ring-offset-2 ring-offset-card' : ''
                }`}
              >
                <View className="w-8 h-8 rounded-full" style={{ backgroundColor: color }} />
              </Pressable>
            ))}
          </View>

          <View className="flex-row gap-3">
            <Pressable
              onPress={() => setShowAddModal(false)}
              className="flex-1 py-3.5 rounded-xl bg-background border border-border items-center"
            >
              <Text className="text-foreground font-medium">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleAddCategory}
              disabled={!newName.trim()}
              className="flex-1 py-3.5 rounded-xl bg-primary items-center disabled:opacity-50"
            >
              <Text className="text-black font-semibold">Save</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScreenHeader
        title="Categories"
        onBack={() => router.back()}
        rightAction={
          <Pressable
            onPress={() => setShowAddModal(true)}
            className="w-10 h-10 rounded-full bg-primary items-center justify-center"
          >
            <Plus size={20} color="#000" />
          </Pressable>
        }
      />
      <View className="flex-1 px-4 pt-4">
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
        <View className="bg-card border border-border rounded-2xl p-4">
          {categories.map((cat, i) => (
            <View key={cat.id}>
              {i > 0 && <View className="border-t border-border" />}
              <View className="flex-row items-center gap-3 py-3">
                <Text className="text-lg">{cat.emoji}</Text>
                <View className="flex-1">
                  <Text className="text-foreground text-sm">{cat.name}</Text>
                </View>
                <View className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
              </View>
            </View>
          ))}
        </View>
      </View>
      {renderAddModal()}
    </SafeAreaView>
  );
}
