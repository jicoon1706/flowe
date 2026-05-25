import { Pressable, View, Text } from 'react-native';

export function TypeChip({
  label, emoji, active, onPress,
}: { label: string; emoji: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 items-center justify-center py-3 rounded-2xl border ${
        active ? 'border-primary bg-primary/10' : 'border-border bg-card'
      }`}
    >
      <Text className="text-2xl mb-1">{emoji}</Text>
      <Text className={`text-sm font-semibold ${active ? 'text-primary' : 'text-muted-foreground'}`}>{label}</Text>
    </Pressable>
  );
}