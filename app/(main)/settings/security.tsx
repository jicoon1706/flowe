import { View, Text, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Shield } from 'lucide-react-native';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { Toggle } from '../../../components/ui/Toggle';
import { Chip } from '../../../components/ui/Chip';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../src/lib/supabase';
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
    if (!user) return;
    supabase
      .from('auth_config')
      .select('fingerprint_enabled, auto_lock_minutes')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) console.warn('[security] fetch auth_config failed:', error);
        if (data) {
          setFingerprint(!!data.fingerprint_enabled);
          setAutoLockLabel(minutesToLabel(data.auto_lock_minutes));
        }
        setLoading(false);
      });
  }, [user]);

  if (loading) return <LoadingView />;

  const persist = async (patch: { fingerprint_enabled?: boolean; auto_lock_minutes?: number | null }) => {
    if (!user) return;
    const { error } = await supabase
      .from('auth_config')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);
    if (error) Alert.alert('Save failed', error.message);
  };

  const toggleFingerprint = async (val: boolean) => {
    setFingerprint(val);
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
