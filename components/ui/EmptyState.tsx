import { View, Text, Pressable } from 'react-native';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: { label: string; onPress: () => void };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center py-16 px-6">
      {icon && <Text className="text-4xl mb-3">{icon}</Text>}
      <Text className="text-foreground font-medium text-base text-center">{title}</Text>
      {description && (
        <Text className="text-muted-foreground text-sm text-center mt-1">{description}</Text>
      )}
      {action && (
        <Pressable onPress={action.onPress} className="mt-4 bg-primary rounded-2xl py-3 px-6">
          <Text className="text-primary-foreground font-semibold">{action.label}</Text>
        </Pressable>
      )}
    </View>
  );
}