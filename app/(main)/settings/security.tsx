import { View, Text, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Shield } from 'lucide-react-native';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { Toggle } from '../../../components/ui/Toggle';
import { Chip } from '../../../components/ui/Chip';
import { useAuth } from '../../../context/AuthContext';
import { authConfigRepository } from '../../../src/repositories/authConfig.repository';
import { flags } from '../../../src/lib/secureStore';
import { LoadingView } from '../../../components/ui/LoadingView';

const AUTO_LOCK_OPTIONS = [
  { label: '1 min', value: 1 },
  { label: '5 min', value: 5 },
  { label: '15 min', value: 15 },
  { label: 'Never', value: null as number | null },
] as const;

function minutesToLabel(min: number | null): string {
  const opt = AUTO_LOCK_OPTIONS.find((o) => o.value === min);
  return opt?.label ?? '5 min';
}

export default function SecurityScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [fingerprint, setFingerprint] = useState(false);
  const [autoLockLabel, setAutoLockLabel] = useState<string>('5 min');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // The fingerprint switch shows the device flag, because that is what the
      // lock screen reads (AUDIT #5). The server copy only mirrors it.
      const deviceFingerprint = await flags.fingerprintEnabled().catch(() => false);
      if (cancelled) return;
      setFingerprint(deviceFingerprint);
      if (user) {
        const res = await authConfigRepository.fetch(user.id);
        if (cancelled) return;
        if (!res.ok) console.warn('[security] fetch auth_config failed:', res.error);
        else if (res.data) setAutoLockLabel(minutesToLabel(res.data.auto_lock_minutes));
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  if (loading) return <LoadingView />;

  const persist = async (patch: { fingerprint_enabled?: boolean; auto_lock_minutes?: number | null }) => {
    if (!user) return;
    const res = await authConfigRepository.update(user.id, patch);
    if (!res.ok) Alert.alert('Save failed', res.error.message);
  };

  const toggleFingerprint = async (val: boolean) => {
    setFingerprint(val);
    // The device flag is the one that changes how the app unlocks; writing
    // only the server column left the switch with no effect.
    try {
      await flags.setFingerprintEnabled(val);
    } catch {
      setFingerprint(!val);
      Alert.alert('Save failed', 'Could not update fingerprint unlock on this device.');
      return;
    }
    await persist({ fingerprint_enabled: val });
  };

  const setAutoLock = async (opt: typeof AUTO_LOCK_OPTIONS[number]) => {
    setAutoLockLabel(opt.label);
    await persist({ auto_lock_minutes: opt.value });
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
            <Toggle value={fingerprint} onValueChange={toggleFingerprint} />
          </View>

          <View className="border-t border-border my-1" />

          {/* Auto-lock */}
          <View className="py-3">
            <Text className="text-foreground text-base mb-3">Auto-lock Timer</Text>
            <View className="flex-row flex-wrap gap-2">
              {AUTO_LOCK_OPTIONS.map((opt) => (
                <Chip
                  key={opt.label}
                  label={opt.label}
                  selected={autoLockLabel === opt.label}
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
