import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';
import { FingerprintPattern } from 'lucide-react-native';
import { colors } from '@/theme/tokens';
import { Button } from '@/components/ui/Button';
import { GlassChip } from '@/components/ui/GlassChip';
import { GradientFill } from '@/components/ui/GradientFill';
import { Text } from '@/components/ui/Text';
import { TopBar } from '@/components/ui/TopBar';
import { useOnboarding } from '@/context/OnboardingContext';
import { useColumnPadding } from '@/src/hooks/useBreakpoint';

/** (auth)/fingerprint — Enable (white pill) → system prompt; Skip = text button. */
export default function Fingerprint() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const padX = useColumnPadding(24);
  const { dispatch } = useOnboarding();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const finish = (enabled: boolean) => {
    dispatch({ type: 'SET_FINGERPRINT', enabled });
    router.replace('/(auth)/success');
  };

  async function enable() {
    setBusy(true);
    setNote(null);
    const has = await LocalAuthentication.hasHardwareAsync();
    const enrolled = has && (await LocalAuthentication.isEnrolledAsync());
    if (!enrolled) {
      setBusy(false);
      setNote('No fingerprint set up on this phone. Your PIN will do.');
      return;
    }
    const res = await LocalAuthentication.authenticateAsync({ promptMessage: 'Enable fingerprint' });
    setBusy(false);
    if (res.success) finish(true);
    else setNote('Fingerprint not confirmed. Try again or skip.');
  }

  return (
    <View style={{ flex: 1, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 }}>
      <GradientFill />
      <TopBar onBack={() => router.back()} />
      <View style={{ alignItems: 'center', paddingHorizontal: padX, marginTop: 64, gap: 32 }}>
        <View style={{ width: 200, height: 200, borderRadius: 9999, backgroundColor: colors.glass, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 136, height: 136, borderRadius: 9999, backgroundColor: colors.glass, alignItems: 'center', justifyContent: 'center' }}>
            <FingerprintPattern size={64} color={colors['on-primary']} strokeWidth={1.5} />
          </View>
        </View>
        <View style={{ gap: 12 }}>
          <Text variant="display-md" tone="inverse" align="center" accessibilityRole="header">Unlock with fingerprint</Text>
          <Text variant="body-lg" tone="soft" align="center">Open Flowe with a touch. Your PIN still works as a backup.</Text>
        </View>
        {note ? <GlassChip role="alert" label={note} /> : null}
      </View>
      <View style={{ flex: 1 }} />
      <View style={{ paddingHorizontal: padX, gap: 8, alignItems: 'center' }}>
        <Button label="Enable" variant="white" onPress={enable} loading={busy} fullWidth />
        <Button label="Skip" variant="text" onGradient onPress={() => finish(false)} disabled={busy} />
      </View>
    </View>
  );
}
