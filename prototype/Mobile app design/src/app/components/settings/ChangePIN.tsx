import { useState } from 'react';
import { ChevronLeft, Delete } from 'lucide-react';

interface Props {
  onBack: () => void;
}

type Step = 'current' | 'new' | 'confirm';

const STEP_LABELS: Record<Step, string> = {
  current: 'Enter Current PIN',
  new: 'Enter New PIN',
  confirm: 'Confirm New PIN',
};

const STEP_SUBTITLES: Record<Step, string> = {
  current: 'Enter your 6-digit current PIN',
  new: 'Choose a new 6-digit PIN',
  confirm: 'Re-enter your new PIN to confirm',
};

export function ChangePIN({ onBack }: Props) {
  const [step, setStep] = useState<Step>('current');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const getActivePin = () => {
    if (step === 'current') return currentPin;
    if (step === 'new') return newPin;
    return confirmPin;
  };

  const setActivePin = (val: string) => {
    setError('');
    if (step === 'current') setCurrentPin(val);
    else if (step === 'new') setNewPin(val);
    else setConfirmPin(val);
  };

  const handleKey = (key: string) => {
    const pin = getActivePin();
    if (pin.length < 6) {
      const next = pin + key;
      setActivePin(next);
      if (next.length === 6) handleComplete(next);
    }
  };

  const handleDelete = () => {
    const pin = getActivePin();
    setActivePin(pin.slice(0, -1));
  };

  const handleComplete = (pin: string) => {
    if (step === 'current') {
      if (pin === '123456') {
        setTimeout(() => setStep('new'), 300);
      } else {
        setError('Incorrect PIN. Try again.');
        setTimeout(() => setCurrentPin(''), 600);
      }
    } else if (step === 'new') {
      setTimeout(() => setStep('confirm'), 300);
    } else {
      if (pin === newPin) {
        setSuccess(true);
      } else {
        setError("PINs don't match. Try again.");
        setTimeout(() => {
          setNewPin('');
          setConfirmPin('');
          setStep('new');
        }, 800);
      }
    }
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

  if (success) {
    return (
      <div className="min-h-screen p-4 pb-6 flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-card border border-border hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Change PIN</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center">
            <span className="text-4xl">✓</span>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold mb-2">PIN Changed!</p>
            <p className="text-sm text-muted-foreground">Your PIN has been updated successfully.</p>
          </div>
          <button
            onClick={onBack}
            className="w-full py-4 bg-primary text-black rounded-2xl font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  const activePin = getActivePin();

  return (
    <div className="min-h-screen p-4 pb-6 flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-card border border-border hover:bg-muted transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">Change PIN</h1>
      </div>

      {/* Step Indicator */}
      <div className="flex gap-2 mb-8">
        {(['current', 'new', 'confirm'] as Step[]).map((s, i) => (
          <div
            key={s}
            className={`flex-1 h-1 rounded-full transition-colors ${
              i === 0 && (step === 'current' ? 'bg-primary' : 'bg-primary')
              || i === 1 && (step === 'new' || step === 'confirm' ? 'bg-primary' : 'bg-muted')
              || 'bg-muted'
            } ${
              (i === 0) ? 'bg-primary' :
              (i === 1 && (step === 'new' || step === 'confirm')) ? 'bg-primary' :
              (i === 2 && step === 'confirm') ? 'bg-primary' :
              'bg-muted'
            }`}
          />
        ))}
      </div>

      {/* Label */}
      <div className="text-center mb-10">
        <p className="text-xl font-bold mb-2">{STEP_LABELS[step]}</p>
        <p className="text-sm text-muted-foreground">{STEP_SUBTITLES[step]}</p>
        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
      </div>

      {/* PIN Dots */}
      <div className="flex justify-center gap-4 mb-12">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full border-2 transition-all ${
              i < activePin.length
                ? 'bg-primary border-primary scale-110'
                : 'bg-transparent border-muted-foreground'
            }`}
          />
        ))}
      </div>

      {/* Number Pad */}
      <div className="grid grid-cols-3 gap-3 mt-auto">
        {keys.map((key, i) => {
          if (key === '') return <div key={i} />;
          if (key === 'del') {
            return (
              <button
                key={i}
                onPointerDown={handleDelete}
                className="flex items-center justify-center h-16 rounded-2xl bg-card border border-border active:bg-muted transition-colors"
              >
                <Delete className="w-6 h-6 text-muted-foreground" />
              </button>
            );
          }
          return (
            <button
              key={i}
              onPointerDown={() => handleKey(key)}
              className="flex items-center justify-center h-16 rounded-2xl bg-card border border-border active:bg-primary active:text-black transition-colors text-xl font-semibold"
            >
              {key}
            </button>
          );
        })}
      </div>
    </div>
  );
}
