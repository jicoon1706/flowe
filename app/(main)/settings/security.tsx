import { View, Text } from 'react-native';
import { useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Shield } from 'lucide-react-native';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { Toggle } from '../../../components/ui/Toggle';
import { Chip } from '../../../components/ui/Chip';
import { useAuth } from '../../../context/AuthContext';
import { useSettings } from '../../../src/hooks/useSettings';
import { LoadingView } from '../../../components/ui/LoadingView';
import { ErrorView } from '../../../components/ui/ErrorView';

const AUTO_LOCK_OPTIONS = ['1 min', '5 min', '15 min', 'Never'] as const;

export default function SecurityScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { settings, loading, error, fetchSettings, updateSettings } = useSettings();
  const [localFingerprint, setLocalFingerprint] = useState(false);
  const [localAutoLock, setLocalAutoLock] = useState<string>('5 min');

  useFocusEffect(useCallback(() => {
    if (user) fetchSettings(user.id);
  }, [user, fetchSettings]));

  useFocusEffect(useCallback(() => {
    if (settings?.security) {
      setLocalFingerprint(settings.security.fingerprintEnabled);
      setLocalAutoLock(settings.security.autoLockTimer);
    }
  }, [settings]));

  if (loading) return <LoadingView />;
  if (error) return <ErrorView error={error} onRetry={() => user && fetchSettings(user.id)} />;

  const toggleFingerprint = async (val: boolean) => {
    setLocalFingerprint(val);
    if (user) {
      await updateSettings(user.id, { security: { fingerprintEnabled: val, autoLockTimer: localAutoLock } });
    }
  };

  const setAutoLock = async (timer: typeof AUTO_LOCK_OPTIONS[number]) => {
    setLocalAutoLock(timer);
    if (user) {
      await updateSettings(user.id, { security: { fingerprintEnabled: localFingerprint, autoLockTimer: timer } });
    }
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
              value={localFingerprint}
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
                  selected={localAutoLock === opt}
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