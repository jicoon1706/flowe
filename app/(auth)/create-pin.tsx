import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { PinEntryScreen } from '@/components/auth/PinEntryScreen';

/** (auth)/create-pin — advances automatically on the 6th digit. */
export default function CreatePin() {
  const [pin, setPin] = useState('');
  const router = useRouter();
  useEffect(() => {
    if (pin.length !== 6) return;
    const t = setTimeout(() => {
      router.push({ pathname: '/(auth)/confirm-pin', params: { firstPin: pin } });
      setPin('');
    }, 200);
    return () => clearTimeout(t);
  }, [pin, router]);
  return (
    <PinEntryScreen
      title="Create your PIN"
      subtitle="6 digits. You’ll use it every time you open Flowe."
      pin={pin}
      onChange={setPin}
      onBack={router.canGoBack() ? () => router.back() : undefined}
    />
  );
}
