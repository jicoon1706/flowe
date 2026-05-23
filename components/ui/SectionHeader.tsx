import { View, Text, Pressable } from 'react-native';
import { ChevronRight } from './icons';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, actionLabel, onAction }: SectionHeaderProps) {
  return (
    <View className="flex-row items-center justify-between px-4 mb-3">
      <Text className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
        {title}
      </Text>
      {actionLabel && (
        <Pressable
          onPress={onAction}
          accessible
          accessibilityLabel={actionLabel}
          accessibilityRole="button"
          className="flex-row items-center gap-1"
        >
          <Text className="text-xs text-primary font-medium">{actionLabel}</Text>
          <ChevronRight size={14} color="#C5FF00" />
        </Pressable>
      )}
    </View>
  );
}