import { Pressable, Text, View } from 'react-native';

interface ChipProps {
  label: string;
  emoji?: string;
  selected?: boolean;
  onPress?: () => void;
  color?: string;
}

export function Chip({ label, emoji, selected = false, onPress, color }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`
        flex-row items-center gap-1.5 px-3 py-2 rounded-xl
        ${selected ? 'bg-primary/10 border border-primary' : 'bg-card border border-border'}
        ${onPress ? 'active:scale-[0.97] transition-transform' : ''}
      `}
    >
      {emoji && <Text className="text-sm">{emoji}</Text>}
      <Text className={`text-xs font-medium ${selected ? 'text-primary' : 'text-foreground'}`}>
        {label}
      </Text>
      {color && (
        <View className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      )}
    </Pressable>
  );
}