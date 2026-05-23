import { View, Text, Pressable } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

interface SettingsRowProps {
  label: string;
  value?: string;
  onPress?: () => void;
  icon?: React.ReactNode;
  danger?: boolean;
  badge?: string;
  hasChevron?: boolean;
}

export function SettingsRow({
  label,
  value,
  onPress,
  icon,
  danger = false,
  badge,
  hasChevron = true,
}: SettingsRowProps) {
  return (
    <Pressable
      accessible
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      disabled={!onPress}
      className="flex-row items-center justify-between py-3 px-1"
    >
      <View className="flex-row items-center gap-3">
        {icon && <View className="w-5 h-5">{icon}</View>}
        <Text className={`text-sm ${danger ? 'text-destructive' : 'text-foreground'}`}>
          {label}
        </Text>
      </View>
      <View className="flex-row items-center gap-2">
        {value && (
          <Text className="text-sm text-muted-foreground">{value}</Text>
        )}
        {badge && (
          <View className="px-2 py-0.5 rounded-full bg-income/20">
            <Text className="text-xs text-income font-medium">{badge}</Text>
          </View>
        )}
        {hasChevron && onPress && <ChevronRight size={16} color="#a0a0a0" />}
      </View>
    </Pressable>
  );
}