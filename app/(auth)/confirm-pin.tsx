import { useState, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { PinPad } from '../../components/ui/PinPad';
import { PinDots } from '../../components/ui/PinDots';
import { ProgressDots } from '../../components/ui/ProgressDots';
import { useOnboarding } from '../../context/OnboardingContext';

export default function ConfirmPin() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const router = useRouter();
  const { firstPin } = useLocalSearchParams<{ firstPin: string }>();
  const { dispatch } = useOnboarding();

  useEffect(() => {
    if (pin.length === 6) {
      if (pin === firstPin) {
        dispatch({ type: 'SET_PIN', pin });
        router.replace('/(auth)/fingerprint');
      } else {
        setError(true);
        const t = setTimeout(() => { setError(false); setPin(''); }, 700);
        return () => clearTimeout(t);
      }
    }
  }, [pin]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ProgressDots total={3} active={0} />
      <View className="flex-1 items-center px-6 max-w-md mx-auto w-full">
        <View className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary items-center justify-center mt-6 mb-4">
          <Feather name="shield" size={24} color="#C5FF00" />
        </View>
        <Text className="text-foreground text-2xl font-bold">Confirm Your PIN</Text>
        <Text className="text-muted-foreground text-sm mt-1">Re-enter the same 6-digit PIN</Text>
        <PinDots length={pin.length} error={error} />
        {error && <Text className="text-destructive text-xs mt-2">PINs do not match. Try again.</Text>}
        <Pressable onPress={() => router.back()} className="mt-6 py-3">
          <Text className="text-muted-foreground text-sm">← Choose a different PIN</Text>
        </Pressable>
      </View>
      <PinPad value={pin} onChange={setPin} />
    </SafeAreaView>
  );
}