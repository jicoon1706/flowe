import { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { authRepository, authConfigRepository } from '../../src/repositories';
import { hashPin } from '../../src/lib/pinCrypto';
import { flags } from '../../src/lib/secureStore';
import { useOnboarding } from '../../context/OnboardingContext';
import { refreshGate } from '../_layout';

type Status = 'saving' | 'ready' | 'error';

export default function Success() {
  const router = useRouter();
  const { state, dispatch } = useOnboarding();
  const [status, setStatus] = useState<Status>('saving');

  async function persist() {
    setStatus('saving');
    if (!state.pin) { setStatus('error'); return; }
    const pinHash = await hashPin(state.pin);

    const userRes = await authRepository.getUser();
    if (userRes.ok && userRes.data) {
      const upsert = await authConfigRepository.upsert({
        userId: userRes.data.id,
        pinHash,
        fingerprintEnabled: state.fingerprintEnabled,
      });
      if (!upsert.ok) console.warn('[success] auth_config upsert failed:', upsert.error);
    } else {
      console.warn('[success] no auth user — saving PIN locally only');
    }

    try {
      await flags.setPin(pinHash, state.fingerprintEnabled);
    } catch (e) {
      console.warn('[success] secure-store setPin failed:', e);
      setStatus('error');
      return;
    }
    refreshGate();
    dispatch({ type: 'CLEAR_PIN' });
    setStatus('ready');
  }

  useEffect(() => { persist(); }, []);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center px-6 max-w-md mx-auto w-full">
        <View className="w-24 h-24 rounded-full bg-primary items-center justify-center mb-8">
          {status === 'saving'
            ? <ActivityIndicator color="#000" />
            : <Feather name="check" size={48} color="#000" />}
        </View>
        <Text className="text-foreground text-2xl font-bold">
          {status === 'error' ? 'Save failed' : 'Your wallet is secured!'}
        </Text>
        <Text className="text-muted-foreground text-sm text-center mt-2">
          {status === 'error'
            ? "Could not save your PIN. Tap retry to try again."
            : '6-digit PIN configured · Fingerprint ' + (state.fingerprintEnabled ? 'enabled' : 'disabled')}
        </Text>
      </View>
      <View className="px-6 pb-8">
        {status === 'error' ? (
          <Pressable onPress={persist} className="bg-primary rounded-2xl py-4 items-center">
            <Text className="text-primary-foreground font-bold">Retry</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => router.replace('/(onboarding)/name')}
            disabled={status !== 'ready'}
            className={`rounded-2xl py-4 items-center ${status === 'ready' ? 'bg-primary' : 'bg-muted'}`}
          >
            <Text className="text-primary-foreground font-bold">Continue to App</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}