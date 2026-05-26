import { View, ActivityIndicator, Text } from 'react-native';

interface LoadingViewProps {
  label?: string;
}

export function LoadingView({ label }: LoadingViewProps) {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator color="#C5FF00" size="large" />
      {label && <Text className="text-muted-foreground text-sm mt-3">{label}</Text>}
    </View>
  );
}