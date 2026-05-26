import { View, Text, Pressable } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

interface SettingsRowProps {
  label: string;
  value?: string;
  onPress?: () => void;
  icon?: React.ReactNode;
  danger?: boolean;
  badge?: string;
  badgeDanger?: boolean;
  hasChevron?: boolean;
  rightElement?: React.ReactNode;
}

export function SettingsRow({
  label,
  value,
  onPress,
  icon,
  danger = false,
  badge,
  badgeDanger = false,
  hasChevron = true,
  rightElement,
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
          <View className={`px-2 py-0.5 rounded-full ${badgeDanger ? 'bg-destructive/20' : 'bg-income/20'}`}>
            <Text className={`text-xs font-medium ${badgeDanger ? 'text-destructive' : 'text-income'}`}>{badge}</Text>
          </View>
        )}
        {rightElement}
        {hasChevron && onPress && <ChevronRight size={16} color="#a0a0a0" />}
      </View>
    </Pressable>
  );
}