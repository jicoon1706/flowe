import { View, Text, Pressable } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';

interface BalanceBannerProps {
  balance: string;
  visible: boolean;
  onToggle: () => void;
}

export function BalanceBanner({ balance = '4,250.00', visible, onToggle }: BalanceBannerProps) {
  return (
    <View className="mx-4 mb-5 bg-card rounded-2xl p-5 border border-border shadow-lg">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-sm text-muted-foreground font-medium">Total Balance</Text>
        <Pressable onPress={onToggle} className="p-1">
          {visible ? <Eye size={18} color="#a0a0a0" /> : <EyeOff size={18} color="#a0a0a0" />}
        </Pressable>
      </View>
      <Text className="text-3xl font-bold text-foreground">
        {visible ? `RM ${balance}` : 'RM ••••••'}
      </Text>
    </View>
  );
}