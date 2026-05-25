import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, Pressable } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import './global.css';
import { supabase } from '../src/lib/supabase';
import { authRepository } from '../src/repositories';
import { flags } from '../src/lib/secureStore';
import { OnboardingProvider } from '../context/OnboardingContext';

type GateState = 'loading' | 'error' | 'auth' | 'onboarding' | 'main';

export default function RootLayout() {
  const [state, setState] = useState<GateState>('loading');
  const router = useRouter();
  const segments = useSegments();

  async function resolve() {
    setState('loading');
    const sessionResult = await authRepository.getSession();
    if (!sessionResult.ok) { setState('error'); return; }
    let session = sessionResult.data;
    if (!session) {
      const anon = await authRepository.signInAnonymously();
      if (!anon.ok) { setState('error'); return; }
    }
    const pinSet = await flags.pinSet();
    const onboardingDone = await flags.onboardingDone();
    if (!pinSet) setState('auth');
    else if (!onboardingDone) setState('onboarding');
    else setState('main');
  }

  useEffect(() => { resolve(); }, []);

  useEffect(() => {
    if (state === 'loading' || state === 'error') return;
    const top = segments[0];
    if (state === 'auth' && top !== '(auth)') router.replace('/(auth)/welcome');
    if (state === 'onboarding' && top !== '(onboarding)') router.replace('/(onboarding)/name');
    if (state === 'main' && top !== '(main)') router.replace('/(main)');
  }, [state, segments]);

  if (state === 'loading') {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#C5FF00" />
      </View>
    );
  }
  if (state === 'error') {
    return (
      <View className="flex-1 bg-background items-center justify-center px-6">
        <Text className="text-foreground text-lg mb-4">Couldn't connect</Text>
        <Pressable className="bg-primary rounded-2xl py-3 px-6" onPress={resolve}>
          <Text className="text-primary-foreground font-semibold">Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <OnboardingProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(main)" />
      </Stack>
    </OnboardingProvider>
  );
}