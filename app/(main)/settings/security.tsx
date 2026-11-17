import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import { Check, Clock, FingerprintPattern, Lock, Monitor, Pen } from 'lucide-react-native';
import { colors } from '@/theme/tokens';
import { DesktopPairingSheet } from '@/components/settings/DesktopPairingSheet';
import { SettingsScreen } from '@/components/settings/SettingsScreen';
import { AccountPill } from '@/components/ui/AccountPill';
import { SettingsRow } from '@/components/ui/SettingsRow';
import { Sheet } from '@/components/ui/Sheet';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { Toggle } from '@/components/ui/Toggle';
import { useToast } from '@/components/ui/ToastProvider';
import { useAuth } from '@/context/AuthContext';
import { authConfigRepository } from '@/src/repositories/authConfig.repository';
import { flags } from '@/src/lib/secureStore';
import { DEFAULT_AUTO_LOCK_MINUTES } from '@/src/utils/autoLock';

const LOCK_OPTIONS: { label: string; value: number | null }[] = [
  { label: '1 minute', value: 1 },
  { label: '5 minutes', value: 5 },
  { label: '15 minutes', value: 15 },
  { label: 'Never', value: null },
];

/** settings/security — toggles apply instantly (no Save). Change PIN → change-pin. */
export default function SecurityScreen() {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [fingerprint, setFingerprint] = useState(false);
  const [lockAfter, setLockAfter] = useState<number | null>(DEFAULT_AUTO_LOCK_MINUTES);
  const [picker, setPicker] = useState(false);
  const [pairing, setPairing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const fp = await flags.fingerprintEnabled().catch(() => false);
      if (cancelled) return;
      setFingerprint(fp);
      if (user) {
        const res = await authConfigRepository.fetch(user.id);
        if (!cancelled && res.ok && res.data) setLockAfter(res.data.auto_lock_minutes);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const persist = async (patch: { fingerprint_enabled?: boolean; auto_lock_minutes?: number | null }) => {
    if (!user) return true;
    const res = await authConfigRepository.update(user.id, patch);
    if (!res.ok) toast.failure('Couldn’t save that setting', { label: 'Retry', onPress: () => { persist(patch); } });
    return res.ok;
  };

  const toggleFingerprint = async (on: boolean) => {
    if (on) {
      const ok = (await LocalAuthentication.hasHardwareAsync()) && (await LocalAuthentication.isEnrolledAsync());
      if (!ok) { toast.failure('No fingerprint set up on this phone'); return; }
      const res = await LocalAuthentication.authenticateAsync({ promptMessage: 'Turn on fingerprint unlock' });
      if (!res.success) return;
    }
    setFingerprint(on);
    try {
      await flags.setFingerprintEnabled(on);
    } catch {
      setFingerprint(!on);
      toast.failure('Couldn’t update fingerprint unlock on this phone');
      return;
    }
    await persist({ fingerprint_enabled: on });
  };

  const chooseLock = async (value: number | null) => {
    const prev = lockAfter;
    setLockAfter(value);
    setPicker(false);
    if (!(await persist({ auto_lock_minutes: value }))) setLockAfter(prev);
  };

  const lockLabel = LOCK_OPTIONS.find((o) => o.value === lockAfter)?.label ?? `${lockAfter} minutes`;

  return (
    <SettingsScreen
      title="Security"
      overlay={
        <>
        <DesktopPairingSheet visible={pairing} onClose={() => setPairing(false)} />
        <Sheet visible={picker} onClose={() => setPicker(false)} title="Lock after">
          {LOCK_OPTIONS.map((o) => (
            <Pressable key={o.label} onPress={() => chooseLock(o.value)} accessibilityRole="radio" accessibilityState={{ checked: o.value === lockAfter }} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 52 }}>
              <Text variant="body-lg">{o.label}</Text>
              {o.value === lockAfter ? <Check size={18} color={colors['on-surface']} strokeWidth={2} /> : null}
            </Pressable>
          ))}
        </Sheet>
        </>
      }
    >
      {loading ? (
        <View style={{ gap: 12 }}>{[0, 1, 2].map((i) => <Skeleton key={i} height={48} radius={12} />)}</View>
      ) : (
        <View style={{ gap: 4 }}>
          <SettingsRow label="App PIN" value="Required to open Flowe" icon={Lock} />
          <SettingsRow label="Fingerprint" value="Unlock with a touch" icon={FingerprintPattern} right={<Toggle value={fingerprint} onValueChange={toggleFingerprint} accessibilityLabel="Fingerprint" />} />
          <SettingsRow label="Lock after" icon={Clock} right={<AccountPill label={lockLabel} plainIcon={Clock} onPress={() => setPicker(true)} accessibilityLabel={`Lock after: ${lockLabel}`} />} />
          <SettingsRow label="Change PIN" icon={Pen} onPress={() => router.push('/settings/change-pin')} />
          <SettingsRow label="Use Flowe on desktop" value="Get a one-time code" icon={Monitor} onPress={() => setPairing(true)} />
        </View>
      )}
    </SettingsScreen>
  );
}
