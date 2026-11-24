import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRight, Check } from 'lucide-react-native';
import { colors, radius } from '@/theme/tokens';
import { Button } from '@/components/ui/Button';
import { GradientFill } from '@/components/ui/GradientFill';
import { IconButton } from '@/components/ui/IconButton';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Text } from '@/components/ui/Text';
import { useToast } from '@/components/ui/ToastProvider';
import { authRepository } from '@/src/repositories';
import { edgeFunctionsService } from '@/src/services/edgeFunctions';
import { hashPin } from '@/src/lib/pinCrypto';
import { flags } from '@/src/lib/secureStore';
import { useOnboarding } from '@/context/OnboardingContext';
import { refreshGate } from '../_layout';
import { useColumnPadding } from '@/src/hooks/useBreakpoint';

type Status = 'saving' | 'ready' | 'error';

/** (auth)/success — ring sweeps to a check; Primary: Set up my accounts. */
export default function Success() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const padX = useColumnPadding(24);
  const toast = useToast();
  const { state, dispatch } = useOnboarding();
  const [status, setStatus] = useState<Status>('saving');
  const fingerprint = state.fingerprintEnabled;

  const persist = useCallback(async () => {
    setStatus('saving');
    if (!state.pin) { setStatus('error'); return; }
    const pinHash = await hashPin(state.pin);
    const userRes = await authRepository.getUser();
    if (userRes.ok && userRes.data) {
      // The server PIN is set by verify-pin, never written directly. It refuses
      // to replace an existing PIN ('409'): that needs the old PIN (Change PIN).
      const saved = await edgeFunctionsService.setPin(state.pin, state.fingerprintEnabled);
      if (!saved.ok) console.warn('[success] server PIN not saved:', saved.error.code ?? saved.error.message);
    }
    try {
      await flags.setPin(pinHash, state.fingerprintEnabled);
    } catch {
      setStatus('error');
      toast.failure('Couldn’t save your PIN', { label: 'Retry', onPress: () => { persist(); } });
      return;
    }
    dispatch({ type: 'CLEAR_PIN' });
    setStatus('ready');
  }, [state.pin, state.fingerprintEnabled, dispatch, toast]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { persist(); }, []);

  const next = () => { refreshGate(); router.replace('/(onboarding)/name'); };

  return (
    <View style={{ flex: 1, paddingTop: insets.top + 176, paddingBottom: insets.bottom + 32, paddingHorizontal: padX }}>
      <GradientFill />
      <View style={{ gap: 32 }}>
        <ProgressRing progress={status === 'ready' ? 1 : 0.72} size={168} stroke={10} accessibilityLabel={status === 'ready' ? 'Done' : 'Saving'}>
          <View style={{ width: 112, height: 112, borderRadius: radius.full, backgroundColor: colors.glass, alignItems: 'center', justifyContent: 'center' }}>
            <Check size={56} color={colors['on-primary']} strokeWidth={2} />
          </View>
        </ProgressRing>
        <View style={{ gap: 12 }}>
          <Text variant="display-lg" tone="inverse" accessibilityRole="header">You’re all set</Text>
          <Text variant="body-lg" tone="soft">{fingerprint ? 'Your PIN and fingerprint are ready.' : 'Your PIN is ready.'}</Text>
        </View>
      </View>
      <View style={{ flex: 1 }} />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Button label={status === 'error' ? 'Try again' : 'Set up my accounts'} variant="white" loading={status === 'saving'} onPress={status === 'error' ? persist : next} style={{ flex: 1 }} />
        <IconButton icon={ArrowRight} accessibilityLabel="Continue" onPress={next} disabled={status !== 'ready'} />
      </View>
    </View>
  );
}
