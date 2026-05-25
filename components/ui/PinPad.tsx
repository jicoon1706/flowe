import { View, Text, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export function appendDigit(current: string, digit: string): string {
  if (current.length >= 6) return current;
  return current + digit;
}
export function backspace(current: string): string {
  return current.slice(0, -1);
}

const KEYS: Array<{ kind: 'digit' | 'blank' | 'del'; value?: string }> = [
  { kind: 'digit', value: '1' }, { kind: 'digit', value: '2' }, { kind: 'digit', value: '3' },
  { kind: 'digit', value: '4' }, { kind: 'digit', value: '5' }, { kind: 'digit', value: '6' },
  { kind: 'digit', value: '7' }, { kind: 'digit', value: '8' }, { kind: 'digit', value: '9' },
  { kind: 'blank' }, { kind: 'digit', value: '0' }, { kind: 'del' },
];

export function PinPad({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  function press(k: typeof KEYS[number]) {
    Haptics.selectionAsync().catch(() => {});
    if (k.kind === 'digit' && k.value) onChange(appendDigit(value, k.value));
    if (k.kind === 'del') onChange(backspace(value));
  }
  return (
    <View className="flex-row flex-wrap px-6 pb-8">
      {KEYS.map((k, i) => {
        if (k.kind === 'blank') return <View key={i} className="w-1/3 h-20" />;
        return (
          <Pressable
            key={i}
            onPress={() => press(k)}
            accessibilityRole="button"
            accessibilityLabel={k.kind === 'del' ? 'Delete' : `Number ${k.value}`}
            className="w-1/3 h-20 items-center justify-center"
          >
            <View className="bg-card rounded-2xl w-full mx-1 h-16 items-center justify-center active:opacity-70">
              {k.kind === 'digit' ? (
                <Text className="text-foreground text-2xl font-semibold">{k.value}</Text>
              ) : (
                <Feather name="delete" size={22} color="#fff" />
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}