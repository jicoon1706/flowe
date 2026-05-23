import { View, Text, ScrollView } from 'react-native';
import { Chip } from '../ui/Chip';

interface Category {
  id: string;
  emoji: string;
  name: string;
  color?: string;
}

interface CategoryChipsProps {
  categories: readonly Category[];
  selected: string;
  onSelect: (id: string) => void;
}

export function CategoryChips({ categories, selected, onSelect }: CategoryChipsProps) {
  if (categories.length === 0) {
    return (
      <View className="px-4 py-2">
        <Text className="text-sm text-muted-foreground">No categories available</Text>
      </View>
    );
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
      <View className="flex-row gap-2 px-4">
        {categories.map((cat) => (
          <Chip
            key={cat.id}
            label={cat.name}
            emoji={cat.emoji}
            selected={selected === cat.id}
            onPress={() => onSelect(cat.id)}
          />
        ))}
      </View>
    </ScrollView>
  );
}