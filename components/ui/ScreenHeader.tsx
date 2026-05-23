import { View, Text, Pressable } from 'react-native';
import { ChevronLeft } from './icons';

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export function ScreenHeader({ title, onBack, rightAction }: ScreenHeaderProps) {
  return (
    <View className="flex-row items-center justify-between px-4 py-3">
      <View className="flex-row items-center gap-3">
        {onBack && (
          <Pressable
            onPress={onBack}
            accessible
            accessibilityLabel="Go back"
            accessibilityRole="button"
            className="p-2 -ml-2"
          >
            <ChevronLeft size={24} color="#ffffff" />
          </Pressable>
        )}
        <Text className="text-xl font-semibold text-foreground">{title}</Text>
      </View>
      {rightAction && <View>{rightAction}</View>}
    </View>
  );
}