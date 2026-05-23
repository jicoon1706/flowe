import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Shield } from 'lucide-react-native';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { Toggle } from '../../../components/ui/Toggle';
import { Chip } from '../../../components/ui/Chip';
import { useSettings } from '@/context/SettingsContext';

const AUTO_LOCK_OPTIONS = ['1 min', '5 min', '15 min', 'Never'] as const;

export default function SecurityScreen() {
  const router = useRouter();
  const { state, dispatch } = useSettings();

  const toggleFingerprint = (val: boolean) => {
    dispatch({ type: 'UPDATE_SECURITY', payload: { fingerprintEnabled: val } });
  };

  const setAutoLock = (timer: typeof AUTO_LOCK_OPTIONS[number]) => {
    dispatch({ type: 'UPDATE_SECURITY', payload: { autoLockTimer: timer } });
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScreenHeader title="Security" onBack={() => router.back()} />
      <View className="flex-1 px-4 pt-4">
        <View className="bg-card border border-border rounded-2xl p-5 mb-6">
          {/* Fingerprint */}
          <View className="flex-row items-center justify-between py-3">
            <View className="flex-row items-center gap-3">
              <Shield size={20} color="#a0a0a0" />
              <Text className="text-foreground text-base">Fingerprint</Text>
            </View>
            <Toggle
              value={state.security.fingerprintEnabled}
              onValueChange={toggleFingerprint}
            />
          </View>

          <View className="border-t border-border my-1" />

          {/* Auto-lock */}
          <View className="py-3">
            <Text className="text-foreground text-base mb-3">Auto-lock Timer</Text>
            <View className="flex-row flex-wrap gap-2">
              {AUTO_LOCK_OPTIONS.map(opt => (
                <Chip
                  key={opt}
                  label={opt}
                  selected={state.security.autoLockTimer === opt}
                  onPress={() => setAutoLock(opt)}
                />
              ))}
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}