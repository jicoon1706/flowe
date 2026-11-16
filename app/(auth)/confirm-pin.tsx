import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { PinEntryScreen } from '@/components/auth/PinEntryScreen';
import { useOnboarding } from '@/context/OnboardingContext';

/** (auth)/confirm-pin — auto-submits on the 6th digit; mismatch shakes and clears. */
export default function ConfirmPin() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState(0);
  const router = useRouter();
  const { firstPin } = useLocalSearchParams<{ firstPin: string }>();
  const { dispatch } = useOnboarding();

  useEffect(() => {
    if (pin.length !== 6) return;
    if (firstPin && pin === firstPin) {
      dispatch({ type: 'SET_PIN', pin });
      router.replace('/(auth)/fingerprint');
      return;
    }
    setError('PINs don’t match. Try again.');
    setErrorKey((k) => k + 1);
    const t = setTimeout(() => setPin(''), 260);
    return () => clearTimeout(t);
  }, [pin, firstPin, dispatch, router]);

  return (
    <PinEntryScreen
      title="Confirm your PIN"
      subtitle="Enter the same 6 digits again."
      pin={pin}
      onChange={(v) => { setError(null); setPin(v); }}
      onBack={() => router.replace('/(auth)/create-pin')}
      error={error}
      errorKey={errorKey}
    />
  );
}
