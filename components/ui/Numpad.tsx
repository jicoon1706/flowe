import { View, Text, Pressable } from 'react-native';
import { Delete } from './icons';

interface NumpadProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
}

export function Numpad({ value, onChange, maxLength = 12 }: NumpadProps) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'];

  const handlePress = (key: string) => {
    if (key === 'del') {
      onChange(value.slice(0, -1));
    } else if (key === '.') {
      if (!value.includes('.') && value.length < maxLength) {
        onChange(value + '.');
      }
    } else {
      const newValue = value + key;
      const parts = newValue.split('.');
      if (parts[0].length <= maxLength - (parts[1] ? parts[1].length + 1 : 0)) {
        if (parts.length > 1 && parts[1].length > 2) return;
        onChange(newValue);
      }
    }
  };

  return (
    <View className="flex-row flex-wrap justify-between p-4">
      {keys.map((key) => (
        <Pressable
          key={key}
          onPress={() => handlePress(key)}
          accessible
          accessibilityLabel={key === 'del' ? 'Delete' : `Number ${key}`}
          accessibilityRole="button"
          className="w-[30%] h-14 rounded-2xl bg-card border border-border items-center justify-center active:scale-95 transition-transform mb-3"
        >
          {key === 'del' ? (
            <Delete size={20} color="#a0a0a0" />
          ) : (
            <Text className="text-2xl font-medium text-foreground">{key}</Text>
          )}
        </Pressable>
      ))}
    </View>
  );
}