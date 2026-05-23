import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Repeat, Pause, Play } from 'lucide-react-native';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';

const MOCK_RECURRING = [
  { id: '1', name: 'Unifi', amount: 89, frequency: 'Monthly', paused: false },
  { id: '2', name: 'Netflix', amount: 53, frequency: 'Monthly', paused: false },
  { id: '3', name: 'Axiata', amount: 30, frequency: 'Monthly', paused: true },
];

export default function RecurringScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScreenHeader title="Recurring Payments" onBack={() => router.back()} />
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-4 pt-4">
        <View className="bg-card border border-border rounded-2xl overflow-hidden">
          {MOCK_RECURRING.map((item, i) => (
            <View key={item.id}>
              {i > 0 && <View className="border-t border-border" />}
              <View className="flex-row items-center justify-between p-4">
                <View className="flex-row items-center gap-3">
                  <Repeat size={18} color="#a0a0a0" />
                  <View>
                    <Text className="text-foreground text-sm font-medium">{item.name}</Text>
                    <Text className="text-muted-foreground text-xs">RM {item.amount} · {item.frequency}</Text>
                  </View>
                </View>
                <Pressable onPress={() => {}} className="p-2">
                  {item.paused
                    ? <Play size={18} color="#a0a0a0" />
                    : <Pause size={18} color="#a0a0a0" />
                  }
                </Pressable>
              </View>
            </View>
          ))}
        </View>
        <Text className="text-center text-xs text-muted-foreground mt-4 pb-8">
          Tap pause to temporarily stop a payment
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}