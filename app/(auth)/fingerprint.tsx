import { useState , useEffect } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';
import { ProgressDots } from '../../components/ui/ProgressDots';
import { useOnboarding } from '../../context/OnboardingContext';

export default function Fingerprint() {
  const router = useRouter();
  const { dispatch } = useOnboarding();
  const [scanning, setScanning] = useState(false);
  const scale = useSharedValue(1);

  const pulse = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  // Pulse animation only runs when actively scanning
  useEffect(() => {
    if (scanning) {
      scale.value = withRepeat(withTiming(1.15, { duration: 900 }), -1, true);
    } else {
      scale.value = withTiming(1, { duration: 200 });
    }
  }, [scanning]);

  async function enable() {
    setScanning(true);
    const has = await LocalAuthentication.hasHardwareAsync();
    if (!has) {
      dispatch({ type: 'SET_FINGERPRINT', enabled: false });
      router.replace('/(auth)/success');
      return;
    }
    const res = await LocalAuthentication.authenticateAsync({ promptMessage: 'Enable fingerprint' });
    if (res.success) {
      setTimeout(() => {
        dispatch({ type: 'SET_FINGERPRINT', enabled: true });
        router.replace('/(auth)/success');
      }, 1800);
    } else {
      setScanning(false);
    }
  }

  function skip() {
    dispatch({ type: 'SET_FINGERPRINT', enabled: false });
    router.replace('/(auth)/success');
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ProgressDots total={3} active={1} />
      <View className="flex-1 items-center justify-center px-6 max-w-md mx-auto w-full">
        <Animated.View style={pulse} className="w-24 h-24 rounded-full bg-primary/20 items-center justify-center mb-8">
          {scanning
            ? <ActivityIndicator color="#C5FF00" />
            : <Feather name="fingerprint" size={48} color="#C5FF00" />}
        </Animated.View>
        <Text className="text-foreground text-2xl font-bold text-center">Enable Fingerprint Login</Text>
        <Text className="text-muted-foreground text-sm text-center mt-2 px-4">
          Biometric data never leaves your device. Your PIN always works as backup.
        </Text>
      </View>
      <View className="px-6 pb-8 gap-3">
        <Pressable onPress={enable} disabled={scanning} className="bg-primary rounded-2xl py-4 items-center active:opacity-90">
          <Text className="text-primary-foreground font-bold">Enable Fingerprint</Text>
        </Pressable>
        <Pressable onPress={skip} className="py-3 items-center">
          <Text className="text-muted-foreground text-sm">Skip for now</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}