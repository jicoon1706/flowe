import { View, Text, Pressable, Alert } from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { Numpad } from '../../../components/ui/Numpad';
import { useAuth } from '../../../context/AuthContext';
import { authConfigRepository } from '../../../src/repositories/authConfig.repository';
import { supabase } from '../../../src/lib/supabase';
import { hashPin } from '../../../src/lib/pinCrypto';

export default function ChangePinScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');

  const pins = [currentPin, newPin, confirmPin];
  const setPins = [setCurrentPin, setNewPin, setConfirmPin];

  const handlePinChange = async (value: string) => {
    setError('');
    setPins[step](value);
    if (value.length === 6) {
      setTimeout(async () => {
        if (step === 0) {
          // Verify current PIN against stored hash
          if (!user) { setError('Not authenticated'); setCurrentPin(''); return; }
          const { data, error: fetchErr } = await supabase
            .from('auth_config')
            .select('pin_hash')
            .eq('user_id', user.id)
            .single();
          if (fetchErr || !data) { setError('PIN not set up'); setCurrentPin(''); return; }
          const hashedInput = await hashPin(value);
          if (hashedInput !== data.pin_hash) { setError('Incorrect PIN'); setCurrentPin(''); return; }
          setStep(1);
        } else if (step === 1) {
          setStep(2);
        } else {
          if (value === newPin) {
            // Save new PIN
            if (!user) return;
            const newHash = await hashPin(value);
            await authConfigRepository.upsert({ userId: user.id, pinHash: newHash, fingerprintEnabled: false });
            Alert.alert('PIN Changed', 'Your PIN has been updated successfully.');
            router.back();
          } else {
            setError('PINs don\'t match. Try again.');
            setConfirmPin('');
          }
        }
      }, 250);
    }
  };

  const labels = ['Enter Current PIN', 'Enter New PIN', 'Confirm New PIN'];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScreenHeader title="Change PIN" onBack={() => router.back()} />
      <View className="flex-1 px-4 pt-6 items-center">
        <Text className="text-foreground text-lg font-medium mb-2">{labels[step]}</Text>

        {/* PIN Dots */}
        <View className="flex-row gap-3 mb-8">
          {[0,1,2,3,4,5].map(i => (
            <View key={i} className={`w-4 h-4 rounded-full border-2 ${
              i < pins[step].length
                ? 'bg-primary border-primary'
                : 'border-muted-foreground'
            }`} />
          ))}
        </View>

        {error ? <Text className="text-xs text-red-400 mb-4">{error}</Text> : null}

        <Numpad value={pins[step]} onChange={handlePinChange} maxLength={6} />

        {step > 0 && (
          <Pressable onPress={() => { setStep(s => s - 1); setError(''); }} className="mt-6">
            <Text className="text-sm text-muted-foreground">← Choose a different PIN</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}
