import { View, Text } from 'react-native';

interface FinancialClassBadgeProps {
  emoji: string;
  label: string;
  description: string;
}

export function FinancialClassBadge({ emoji, label, description }: FinancialClassBadgeProps) {
  return (
    <View className="bg-card border border-border rounded-2xl p-4 flex-row items-center gap-4">
      <View className="w-14 h-14 rounded-2xl bg-primary/10 items-center justify-center">
        <Text className="text-3xl">{emoji}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-primary mb-1">{label}</Text>
        <Text className="text-sm text-muted-foreground">{description}</Text>
      </View>
    </View>
  );
}