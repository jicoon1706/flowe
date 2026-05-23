import { View, Text } from 'react-native';
import { Numpad } from './Numpad';

interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  currency?: string;
}

export function AmountInput({ value = '', onChange, currency = 'RM' }: AmountInputProps) {
  const displayValue = value || '0.00';

  return (
    <View className="items-center">
      <View className="flex-row items-center gap-2 mb-4">
        <Text className="text-2xl font-bold text-muted-foreground">{currency}</Text>
        <Text className="text-4xl font-bold text-foreground">{displayValue}</Text>
      </View>
      <Numpad value={value} onChange={onChange} />
    </View>
  );
}