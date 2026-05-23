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
      <View className="flex-row flex-wrap gap-3">
        {shortcuts.map((shortcut) => {
          const Icon = shortcut.icon;
          return (
            <Pressable
              key={shortcut.id}
              onPress={() => onPress(shortcut.id)}
              className="bg-card border border-border rounded-2xl p-3 items-center active:scale-[0.97] transition-transform w-[23%] mb-3"
            >
              <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center mb-2">
                <Icon size={20} color="#C5FF00" />
              </View>
              <Text className="text-xs text-foreground font-medium text-center">{shortcut.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}