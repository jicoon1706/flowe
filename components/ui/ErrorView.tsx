import { View, Text, Pressable } from 'react-native';

interface ErrorViewProps {
  error?: { message: string };
  onRetry: () => void;
}

export function ErrorView({ error, onRetry }: ErrorViewProps) {
  return (
    <View className="flex-1 items-center justify-center bg-background px-6">
      <Text className="text-destructive text-sm text-center mb-2">
        {error?.message ?? 'Something went wrong'}
      </Text>
      <Pressable
        onPress={onRetry}
        className="bg-primary rounded-2xl py-3 px-6"
      >
        <Text className="text-primary-foreground font-semibold">Retry</Text>
      </Pressable>
    </View>
  );
}