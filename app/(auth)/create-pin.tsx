import { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { PinPad } from '../../components/ui/PinPad';
import { PinDots } from '../../components/ui/PinDots';
import { ProgressDots } from '../../components/ui/ProgressDots';

export default function CreatePin() {
  const [pin, setPin] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (pin.length === 6) {
      const t = setTimeout(() => {
        router.push({ pathname: '/(auth)/confirm-pin', params: { firstPin: pin } });
      }, 250);
      return () => clearTimeout(t);
    }
  }, [pin]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ProgressDots total={3} active={0} />
      <View className="flex-1 items-center px-6 max-w-md mx-auto w-full">
        <View className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary items-center justify-center mt-6 mb-4">
          <Feather name="shield" size={24} color="#C5FF00" />
        </View>
        <Text className="text-foreground text-2xl font-bold">Create Your PIN</Text>
        <Text className="text-muted-foreground text-sm mt-1">Choose a 6-digit PIN to secure your wallet</Text>
        <PinDots length={pin.length} />
      </View>
      <PinPad value={pin} onChange={setPin} />
    </SafeAreaView>
  );
}