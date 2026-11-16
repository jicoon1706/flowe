import { useEffect, useState } from 'react';
import { LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';

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
import { loadMerchantLogos } from '../src/services/merchantLogos';
import { fontFamily } from '../theme/tokens';
import { ToastProvider } from '../components/ui/ToastProvider';
import { LaunchScreen } from '../components/ui/LaunchScreen';

// No 'error' state: a failed session or anonymous sign-in continues offline.
type GateState = 'loading' | 'auth' | 'onboarding' | 'main';

let _refreshGate: (() => void) | null = null;
export function refreshGate() { _refreshGate?.(); }

export default function RootLayout() {
  const [state, setState] = useState<GateState>('loading');
  const [fontsLoaded] = useFonts({
    [fontFamily.regular]: require('../assets/fonts/Inter-Regular.ttf'),
    [fontFamily.medium]: require('../assets/fonts/Inter-Medium.ttf'),
    [fontFamily.semibold]: require('../assets/fonts/Inter-SemiBold.ttf'),
  });
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
    // Refreshes the merchant list in the background; the bundled copy is
    // already in force, so nothing on screen waits for this.
    loadMerchantLogos();
    return () => { _refreshGate = null; };
  }, []);

  useEffect(() => {
    if (state === 'loading') return;
    const top = segments[0];
    if (state === 'auth' && top !== '(auth)') router.replace('/(auth)/welcome');
    else if (state === 'onboarding' && top !== '(onboarding)') router.replace('/(onboarding)/name');
    else if (state === 'main' && top !== '(main)') router.replace('/(main)');
  }, [state, segments, router]);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <OnboardingProvider>
          <ToastProvider>
            <StatusBar style="light" />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(onboarding)" />
              <Stack.Screen name="(main)" />
            </Stack>
            {(state === 'loading' || !fontsLoaded) && <LaunchScreen />}
          </ToastProvider>
        </OnboardingProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}