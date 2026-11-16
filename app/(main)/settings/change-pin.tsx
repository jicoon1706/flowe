import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { PinEntryScreen } from '@/components/auth/PinEntryScreen';
import { useToast } from '@/components/ui/ToastProvider';
import { useAuth } from '@/context/AuthContext';
import { authConfigRepository } from '@/src/repositories/authConfig.repository';
import { hashPin } from '@/src/lib/pinCrypto';
import { verifyPin } from '@/src/lib/pinVerify';
import { flags } from '@/src/lib/secureStore';

const STEPS = [
  { title: 'Enter current PIN', subtitle: 'Then choose a new 6-digit PIN.' },
  { title: 'Choose a new PIN', subtitle: '6 digits you’ll remember.' },
  { title: 'Confirm new PIN', subtitle: 'Enter the new PIN again.' },
];

/** settings/change-pin — current → new → confirm on the glass numpad; success → toast "PIN changed". */
export default function ChangePinScreen() {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [pin, setPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState(0);
  const [busy, setBusy] = useState(false);

  const fail = (msg: string) => { setError(msg); setErrorKey((k) => k + 1); setTimeout(() => setPin(''), 260); };

  useEffect(() => {
    if (pin.length !== 6 || busy) return;
    let cancelled = false;
    (async () => {
      if (step === 0) {
        setBusy(true);
        const ok = await verifyPin(pin, user?.id);
        setBusy(false);
        if (cancelled) return;
        if (!ok) { fail('Wrong PIN. Try again.'); return; }
        setStep(1); setPin('');
      } else if (step === 1) {
        setNewPin(pin); setStep(2); setPin('');
      } else {
        if (pin !== newPin) { fail('PINs don’t match. Try again.'); return; }
        setBusy(true);
        const hash = await hashPin(pin);
        const fingerprintEnabled = await flags.fingerprintEnabled().catch(() => false);
        if (user) {
          const res = await authConfigRepository.upsert({ userId: user.id, pinHash: hash, fingerprintEnabled });
          if (!res.ok) { setBusy(false); fail('Couldn’t save your new PIN. Check your connection.'); return; }
        }
        try {
          await flags.setPin(hash, fingerprintEnabled);
        } catch {
          if (!user) { setBusy(false); fail('Couldn’t save your new PIN. Try again.'); return; }
        }
        setBusy(false);
        toast.success('PIN changed');
        router.back();
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  return (
    <PinEntryScreen
      title={STEPS[step].title}
      subtitle={STEPS[step].subtitle}
      step={`Step ${step + 1} of 3`}
      pin={pin}
      onChange={(v) => { setError(null); setPin(v); }}
      onBack={() => (step > 0 ? (setStep(step - 1), setPin('')) : router.back())}
      error={error}
      errorKey={errorKey}
      disabled={busy}
    />
  );
}
