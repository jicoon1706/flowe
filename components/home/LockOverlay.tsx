import { useCallback, useEffect, useState } from 'react';
import { BackHandler, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';
import { verifyPin } from '@/src/lib/pinVerify';
import { flags } from '@/src/lib/secureStore';
import { useAuth } from '@/context/AuthContext';
import { centeredPadding, TABLET_WIDTH, useBreakpoint } from '@/src/hooks/useBreakpoint';
import { useOverlayStatusBar } from '@/src/hooks/useFocusStatusBar';
import { BrandMark } from '../ui/BrandMark';
import { Button } from '../ui/Button';
import { GlassChip } from '../ui/GlassChip';
import { GradientFill } from '../ui/GradientFill';
import { PinDots } from '../ui/PinDots';
import { PinPad } from '../ui/PinPad';
import { Text } from '../ui/Text';

export interface LockOverlayProps {
  onUnlock: () => void;
  /** Steps back without unlocking (home and add stay usable while locked). */
  onCancel?: () => void;
  displayName?: string;
}

/**
 * Lock on re-open (core-lock): full gradient, mark, greeting, PIN dots, glass
 * numpad with a fingerprint key. Fingerprint prompts automatically; the PIN
 * auto-submits on the 6th digit. A wrong PIN shakes the dots — no red.
 */
export function LockOverlay({ onUnlock, onCancel, displayName }: LockOverlayProps) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { isTablet, width } = useBreakpoint();
  // Drawn on the gradient: light status-bar icons even over a white tablet screen.
  useOverlayStatusBar();
  // Tablet: full-screen gradient, but greeting + keypad keep a 400 dp column so keys never stretch.
  const padX = isTablet ? centeredPadding(width, TABLET_WIDTH.keypad, 24) : 24;
  const [pin, setPin] = useState('');
  const [errorKey, setErrorKey] = useState(0);
  const [wrong, setWrong] = useState(false);
  const [bio, setBio] = useState(false);

  const promptBiometric = useCallback(async () => {
    if (!(await flags.fingerprintEnabled())) return;
    if (!(await LocalAuthentication.hasHardwareAsync()) || !(await LocalAuthentication.isEnrolledAsync())) return;
    const res = await LocalAuthentication.authenticateAsync({ promptMessage: 'Unlock Flowe', fallbackLabel: 'Use PIN' });
    if (res.success) onUnlock();
  }, [onUnlock]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const enabled = await flags.fingerprintEnabled();
      const ok = enabled && (await LocalAuthentication.hasHardwareAsync()) && (await LocalAuthentication.isEnrolledAsync());
      if (cancelled) return;
      setBio(ok);
      if (ok) promptBiometric();
    })();
    return () => { cancelled = true; };
  }, [promptBiometric]);

  useEffect(() => {
    if (!onCancel) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => { onCancel(); return true; });
    return () => sub.remove();
  }, [onCancel]);

  useEffect(() => {
    if (pin.length !== 6) return;
    let cancelled = false;
    (async () => {
      const ok = await verifyPin(pin, user?.id);
      if (cancelled) return;
      if (ok) { onUnlock(); return; }
      setWrong(true);
      setErrorKey((k) => k + 1);
      setTimeout(() => setPin(''), 260);
    })();
    return () => { cancelled = true; };
  }, [pin, user?.id, onUnlock]);

  return (
    <View
      accessibilityViewIsModal
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 200, paddingTop: insets.top + 64, paddingBottom: insets.bottom + 40, paddingHorizontal: padX }}
    >
      <GradientFill />
      <View style={{ alignItems: 'center', gap: 8 }}>
        <BrandMark size={40} />
        <Text variant="display-md" tone="inverse" align="center" style={{ marginTop: 16 }}>
          {displayName ? `Welcome back, ${displayName}` : 'Welcome back'}
        </Text>
        <Text variant="body-md" tone="soft" align="center">{bio ? 'Enter your PIN or use fingerprint' : 'Enter your PIN'}</Text>
        <View style={{ marginTop: 32 }}>
          <PinDots length={pin.length} errorKey={errorKey} />
        </View>
        {wrong ? <View style={{ marginTop: 16 }}><GlassChip role="alert" label="Wrong PIN. Try again." /></View> : null}
      </View>
      <View style={{ flex: 1 }} />
      <View style={{ paddingHorizontal: 8 }}>
        <PinPad value={pin} onChange={(v) => { setWrong(false); setPin(v); }} onBiometric={bio ? promptBiometric : undefined} />
      </View>
      {onCancel ? <Button label="Not now" variant="text" onGradient onPress={onCancel} style={{ alignSelf: 'center', marginTop: 8 }} accessibilityHint="Goes back without unlocking" /> : null}
    </View>
  );
}
