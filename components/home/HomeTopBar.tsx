import { View, Text, Pressable } from 'react-native';
import { Bell, Lock, CalendarClock } from 'lucide-react-native';

interface HomeTopBarProps {
  name: string;
  onBellPress: () => void;
  onLockPress: () => void;
  onPendingPress: () => void;
  pendingCount: number;
  hasNotification: boolean;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function HomeTopBar({ name, onBellPress, onLockPress, onPendingPress, pendingCount, hasNotification }: HomeTopBarProps) {
  return (
    <View className="flex-row items-center justify-between px-4 pt-2 pb-4">
      <View>
        <Text className="text-sm text-muted-foreground">{getGreeting()}</Text>
        <Text className="text-xl font-semibold text-foreground">{name}</Text>
      </View>
      <View className="flex-row items-center gap-4">
        <Pressable onPress={onPendingPress} className="relative p-2">
          <CalendarClock size={22} color="#ffffff" />
          {pendingCount > 0 && (
            <View className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-primary items-center justify-center">
              <Text className="text-[10px] font-bold text-black">{pendingCount > 9 ? '9+' : pendingCount}</Text>
            </View>
          )}
        </Pressable>
        <Pressable onPress={onBellPress} className="relative p-2">
          <Bell size={22} color="#ffffff" />
          {hasNotification && (
            <View className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500" />
          )}
        </Pressable>
        <Pressable onPress={onLockPress} className="p-2">
          <Lock size={22} color="#ffffff" />
        </Pressable>
      </View>
    </View>
  );
}
