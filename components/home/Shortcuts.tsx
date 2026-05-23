import { View, Text, Pressable } from 'react-native';
import { BarChart3, BookOpen, PiggyBank, CreditCard } from 'lucide-react-native';

const shortcuts = [
  { id: 'analysis', icon: BarChart3, label: 'Analysis' },
  { id: 'learn', icon: BookOpen, label: 'Learn' },
  { id: 'newTabung', icon: PiggyBank, label: 'New Tabung' },
  { id: 'accounts', icon: CreditCard, label: 'Accounts' },
];

interface ShortcutsProps {
  onPress: (id: string) => void;
}

export function Shortcuts({ onPress }: ShortcutsProps) {
  return (
    <View className="px-4 mb-5">
      <View className="flex-row justify-between items-start">
        {shortcuts.map((shortcut) => {
          const Icon = shortcut.icon;
          return (
            <Pressable
              key={shortcut.id}
              onPress={() => onPress(shortcut.id)}
              className="items-center active:scale-[0.97] transition-transform flex-1"
            >
              <View className="w-14 h-14 rounded-full bg-primary/10 items-center justify-center mb-2">
                <Icon size={22} color="#C5FF00" />
              </View>
              <Text className="text-xs text-foreground font-medium text-center" numberOfLines={1}>{shortcut.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}