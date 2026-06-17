import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, Pressable, LogBox } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

LogBox.ignoreLogs([
  '[Reanimated] Reading from `value` during component render',
  // expo-notifications warns that remote push isn't available in Expo Go on
  // Android (SDK 53+). We only use local notifications, which work fine — so
  // these are noise during Expo Go testing. A dev build removes them entirely.
  '`expo-notifications` functionality is not fully supported in Expo Go',
  'expo-notifications: Android Push notifications (remote notifications)',
]);
import { StatusBar } from 'expo-status-bar';
import './global.css';
import { authRepository } from '../src/repositories';
import { flags } from '../src/lib/secureStore';
import { OnboardingProvider } from '../context/OnboardingContext';
import { AuthProvider } from '../context/AuthContext';
import { setupNotifications } from '../src/services/notifications';

type GateState = 'loading' | 'error' | 'auth' | 'onboarding' | 'main';

let _refreshGate: (() => void) | null = null;
export function refreshGate() { _refreshGate?.(); }

export default function RootLayout() {
  const [state, setState] = useState<GateState>('loading');
  const [fontsLoaded] = useFonts(MaterialIcons.font);
  const router = useRouter();
  const segments = useSegments();

  async function resolve() {
    setState('loading');
    const pinSet = await flags.pinSet();
    const onboardingDone = await flags.onboardingDone();

    const sessionResult = await authRepository.getSession();
    let session = sessionResult.ok ? sessionResult.data : null;
    if (!sessionResult.ok) console.warn('[gate] getSession failed:', sessionResult.error);

    if (!session) {
      const anon = await authRepository.signInAnonymously();
      if (!anon.ok && anon.error.code !== 'anonymous_provider_disabled') {
        console.warn('[gate] signInAnonymously failed (continuing offline):', anon.error);
      }
    }

    if (!pinSet) setState('auth');
    else if (!onboardingDone) setState('onboarding');
    else setState('main');
  }

  useEffect(() => {
    _refreshGate = resolve;
    resolve();
    setupNotifications();
    return () => { _refreshGate = null; };
  }, []);

  useEffect(() => {
    if (state === 'loading' || state === 'error') return;
    const top = segments[0];
    if (state === 'auth' && top !== '(auth)') router.replace('/(auth)/welcome');
    else if (state === 'onboarding' && top !== '(onboarding)') router.replace('/(onboarding)/name');
    else if (state === 'main' && top !== '(main)') router.replace('/(main)');
  }, [state, segments, router]);

  if (state === 'error') {
    return (
      <View className="flex-1 bg-background items-center justify-center px-6">
        <Text className="text-foreground text-lg mb-4">Could not connect</Text>
        <Pressable className="bg-primary rounded-2xl py-3 px-6" onPress={resolve}>
          <Text className="text-primary-foreground font-semibold">Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <AuthProvider>
      <OnboardingProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="(main)" />
        </Stack>
        {(state === 'loading' || !fontsLoaded) && (
          <View
            className="bg-background items-center justify-center"
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          >
            <ActivityIndicator color="#C5FF00" />
          </View>
        )}
      </OnboardingProvider>
    </AuthProvider>
  );
}