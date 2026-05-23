import { View, Text, Pressable } from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { expenseCategories, incomeCategories } from '../../../constants/categories';

export default function CategoriesScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<'expense' | 'income'>('expense');

  const categories = tab === 'expense' ? expenseCategories : incomeCategories;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScreenHeader title="Categories" onBack={() => router.back()} />
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
    </SafeAreaView>
  );
}
