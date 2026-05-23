import { View, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Heart } from 'lucide-react-native';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { Chip } from '../../../components/ui/Chip';
import { Toggle } from '../../../components/ui/Toggle';
import { useSettings } from '@/context/SettingsContext';

const CATEGORIES = ['All', 'Saving', 'Investing', 'Mindset', 'Awareness'] as const;

export default function AffirmationsScreen() {
  const router = useRouter();
  const { state, dispatch } = useSettings();

  const update = (payload: Partial<typeof state.affirmations>) => {
    dispatch({ type: 'UPDATE_AFFIRMATIONS', payload });
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScreenHeader title="Affirmations" onBack={() => router.back()} />
      <View className="flex-1 px-4 pt-4">
        <View className="bg-card border border-border rounded-2xl p-5 mb-6">
          {/* Show on Home */}
          <View className="flex-row items-center justify-between py-3">
            <View className="flex-row items-center gap-3">
              <Heart size={20} color="#a0a0a0" />
              <Text className="text-foreground text-base">Show on Home</Text>
            </View>
            <Toggle
              value={state.affirmations.showOnHome}
              onValueChange={v => update({ showOnHome: v })}
            />
          </View>

          <View className="border-t border-border my-1" />

          {/* Daily Reminder */}
          <View className="py-3">
            <Text className="text-foreground text-base mb-2">Daily Reminder</Text>
            <View className="flex-row items-center gap-2">
              <View className="bg-input-background border border-border rounded-xl px-4 py-2">
                <TextInput
                  value={state.affirmations.dailyReminder}
                  onChangeText={v => update({ dailyReminder: v })}
                  className="text-foreground text-sm outline-none"
                  placeholder="08:00"
                  placeholderTextColor="#a0a0a0"
                  maxLength={5}
                />
              </View>
              <Text className="text-xs text-muted-foreground">HH:MM</Text>
            </View>
          </View>

          <View className="border-t border-border my-1" />

          {/* Category Preference */}
          <View className="py-3">
            <Text className="text-foreground text-base mb-3">Category Preference</Text>
            <View className="flex-row flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <Chip
                  key={cat}
                  label={cat}
                  selected={state.affirmations.categoryPreference === cat}
                  onPress={() => update({ categoryPreference: cat })}
                />
              ))}
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}