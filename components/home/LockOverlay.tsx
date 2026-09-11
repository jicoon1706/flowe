import { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { PinPad } from '../ui/PinPad';
import { PinDots } from '../ui/PinDots';
import { supabase } from '../../src/lib/supabase';
import { hashPin } from '../../src/lib/pinCrypto';
import { flags } from '../../src/lib/secureStore';
import { useAuth } from '../../context/AuthContext';

interface LockOverlayProps {
  onUnlock: () => void;
  /**
   * Lets the user step back without unlocking. The app is usable while locked
   * (home with balances hidden, and the add-transaction form), so declining
   * isn't a dead end — the caller takes them back to somewhere open.
   */
  onCancel?: () => void;
}

export function LockOverlay({ onUnlock, onCancel }: LockOverlayProps) {
  const { user } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  const promptBiometric = useCallback(async () => {
    const enabled = await flags.fingerprintEnabled();
    if (!enabled) return false;
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!hasHardware || !enrolled) return false;
    const res = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock Flowe',
      fallbackLabel: 'Use PIN',
    });
    if (res.success) {
      onUnlock();
      return true;
    }
    return false;
  }, [onUnlock]);

  // On mount, auto-prompt fingerprint if enabled, and remember availability for the button.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const enabled = await flags.fingerprintEnabled();
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (cancelled) return;
      const available = enabled && hasHardware && enrolled;
      setBiometricAvailable(available);
      if (available) promptBiometric();
    })();
    return () => { cancelled = true; };
  }, [promptBiometric]);

  // The hardware back button means the same as "Not now": the prompt covers
  // whatever screen was opened, and backing out of it must not strand the
  // user behind an overlay they can't dismiss.
  useEffect(() => {
    if (!onCancel) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onCancel();
      return true;
    });
    return () => sub.remove();
  }, [onCancel]);

  useEffect(() => {
    if (pin.length !== 6) return;
    let cancelled = false;
    (async () => {
      if (!user) { fail(); return; }
      const { data, error: fetchErr } = await supabase
        .from('auth_config')
        .select('pin_hash')
        .eq('user_id', user.id)
        .single();
      if (cancelled) return;
      if (fetchErr || !data) { fail(); return; }
      const hashedInput = await hashPin(pin);
      if (cancelled) return;
      if (hashedInput === data.pin_hash) {
        onUnlock();
      } else {
        fail();
      }
    })();
    return () => { cancelled = true; };
  }, [pin]);

  function fail() {
    setError(true);
    setTimeout(() => { setError(false); setPin(''); }, 700);
  }

  return (
    // Above the detection island (zIndex 100): a PIN pad with a payment
    // capsule floating over it is confusing, and the island is still there
    // once the prompt is gone.
    <SafeAreaView className="flex-1 bg-background" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 200 }}>
      <View className="flex-1 items-center px-6 max-w-md mx-auto w-full">
        {onCancel && (
          <View className="w-full flex-row items-center pt-2">
            <Pressable onPress={onCancel} hitSlop={10} className="flex-row items-center gap-1 py-2 pr-3 active:opacity-70">
              <Feather name="chevron-left" size={20} color="#a0a0a0" />
              <Text className="text-muted-foreground text-sm font-medium">Not now</Text>
            </Pressable>
          </View>
        )}
        <View className={`w-14 h-14 rounded-2xl bg-primary/20 border border-primary items-center justify-center mb-4 ${onCancel ? 'mt-6' : 'mt-16'}`}>
          <Feather name="lock" size={24} color="#C5FF00" />
        </View>
        <Text className="text-foreground text-2xl font-bold">Unlock Flowe</Text>
        <Text className="text-muted-foreground text-sm mt-1">Enter your 6-digit PIN to continue</Text>
        <PinDots length={pin.length} error={error} />
        {error && <Text className="text-destructive text-xs mt-2">Incorrect PIN. Try again.</Text>}
        {biometricAvailable && (
          <Pressable onPress={promptBiometric} className="mt-6 flex-row items-center gap-2 py-3 active:opacity-70">
            <Feather name="unlock" size={18} color="#C5FF00" />
            <Text className="text-primary text-sm font-medium">Use fingerprint</Text>
          </Pressable>
        )}
      </View>
      <PinPad value={pin} onChange={setPin} />
    </SafeAreaView>
  );
}
