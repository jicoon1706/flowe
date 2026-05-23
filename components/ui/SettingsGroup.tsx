import { View, Text } from 'react-native';

interface SettingsGroupProps {
  title: string;
  children: React.ReactNode;
}

export function SettingsGroup({ title, children }: SettingsGroupProps) {
  return (
    <View className="mb-6">
      <Text className="text-xs text-muted-foreground uppercase tracking-wider font-semibold px-4 mb-2">
        {title}
      </Text>
      <View className="bg-card border border-border rounded-2xl mx-4 px-4">
        {children}
      </View>
    </View>
  );
}