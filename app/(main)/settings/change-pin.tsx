import { View, Text, Pressable } from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { Numpad } from '../../../components/ui/Numpad';

const MOCK_PIN = '123456';

export default function ChangePinScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');

  const pins = [currentPin, newPin, confirmPin];
  const setPins = [setCurrentPin, setNewPin, setConfirmPin];

  const handlePinChange = (value: string) => {
    setError('');
    setPins[step](value);
    if (value.length === 6) {
      setTimeout(() => {
        if (step === 0) {
          if (value === MOCK_PIN) {
            setStep(1);
          } else {
            setError('Incorrect PIN');
            setCurrentPin('');
          }
        } else if (step === 1) {
          setStep(2);
        } else {
          if (value === newPin) {
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
