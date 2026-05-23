import { useState, useEffect, useRef } from 'react';
import { Delete, Fingerprint, ShieldCheck, ChevronRight, Wallet } from 'lucide-react';

interface Props {
  onComplete: (pin: string, fingerprintEnabled: boolean) => void;
}

type Screen = 'welcome' | 'set-pin' | 'confirm-pin' | 'fingerprint' | 'success';

// ── Logo ──────────────────────────────────────────────────────────────────────
function AppLogo({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <rect width="80" height="80" rx="22" fill="#C5FF00" />
      <rect x="16" y="26" width="48" height="32" rx="6" fill="#1a1a1a" />
      <rect x="16" y="32" width="48" height="8" fill="#1a1a1a" />
      <rect x="16" y="30" width="48" height="6" rx="2" fill="#333" />
      <circle cx="52" cy="42" r="5" fill="#C5FF00" />
      <circle cx="52" cy="42" r="2.5" fill="#1a1a1a" />
      <rect x="20" y="46" width="16" height="3" rx="1.5" fill="#555" />
      <rect x="20" y="36" width="12" height="2" rx="1" fill="#C5FF00" fillOpacity="0.5" />
    </svg>
  );
}

// ── PIN Numpad (shared) ────────────────────────────────────────────────────────
function PinDots({ length, filled }: { length: number; filled: number }) {
  return (
    <div className="flex justify-center gap-5">
      {Array.from({ length }).map((_, i) => (
        <div
          key={i}
          className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
            i < filled
              ? 'bg-primary border-primary scale-110'
              : 'bg-transparent border-muted-foreground/50'
          }`}
        />
      ))}
    </div>
  );
}

function Numpad({ onKey, onDelete }: { onKey: (k: string) => void; onDelete: () => void }) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];
  return (
    <div className="grid grid-cols-3 gap-3">
      {keys.map((key, i) => {
        if (key === '') return <div key={i} />;
        if (key === 'del') {
          return (
            <button
              key={i}
              onPointerDown={onDelete}
              className="flex items-center justify-center h-16 rounded-2xl bg-card border border-border active:bg-muted transition-colors"
            >
              <Delete className="w-6 h-6 text-muted-foreground" />
            </button>
          );
        }
        return (
          <button
            key={i}
            onPointerDown={() => onKey(key)}
            className="flex items-center justify-center h-16 rounded-2xl bg-card border border-border active:bg-primary active:text-black transition-all text-xl font-semibold"
          >
            {key}
          </button>
        );
      })}
    </div>
  );
}

// ── Animated checkmark SVG ────────────────────────────────────────────────────
function AnimatedCheck() {
  return (
    <svg viewBox="0 0 80 80" className="w-20 h-20">
      <circle cx="40" cy="40" r="38" fill="#C5FF00" fillOpacity="0.15" stroke="#C5FF00" strokeWidth="2" />
      <circle cx="40" cy="40" r="30" fill="#C5FF00" />
      <polyline
        points="24,40 35,51 56,29"
        fill="none"
        stroke="#000"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="50"
        strokeDashoffset="0"
        style={{ animation: 'dash 0.45s ease-out 0.1s both' }}
      />
      <style>{`@keyframes dash { from { stroke-dashoffset: 50; } to { stroke-dashoffset: 0; } }`}</style>
    </svg>
  );
}

// ── Fingerprint icon animation ────────────────────────────────────────────────
function FingerprintAnimation({ scanning }: { scanning: boolean }) {
  return (
    <div className={`relative flex items-center justify-center w-28 h-28 rounded-full border-2 transition-all duration-500 ${
      scanning ? 'border-primary bg-primary/10' : 'border-muted bg-muted/20'
    }`}>
      {scanning && (
        <span className="absolute inset-0 rounded-full border-2 border-primary animate-ping opacity-40" />
      )}
      <Fingerprint
        className={`w-14 h-14 transition-colors duration-300 ${scanning ? 'text-primary' : 'text-muted-foreground'}`}
      />
    </div>
  );
}

// ── SCREEN 1.1 — Welcome ──────────────────────────────────────────────────────
function WelcomeScreen({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-between px-6 pt-16 pb-10">
      {/* Logo + Branding */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="absolute inset-0 blur-2xl bg-primary/30 rounded-full scale-150" />
          <div className="relative">
            <AppLogo size={96} />
          </div>
        </div>

        <div className="text-center space-y-2 mt-4">
          <h1 className="text-4xl font-bold tracking-tight">MyWallet</h1>
          <p className="text-muted-foreground text-base leading-relaxed">
            Your personal finance companion
          </p>
        </div>

        {/* Feature pills */}
        <div className="flex flex-col gap-3 w-full max-w-xs mt-4">
          {[
            { icon: '💰', text: 'Track income & expenses effortlessly' },
            { icon: '📈', text: 'Build assets like the rich do' },
            { icon: '💎', text: 'Achieve financial freedom' },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3">
              <span className="text-xl">{icon}</span>
              <p className="text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground/50 text-center mt-2 italic">
          Inspired by Rich Dad Poor Dad
        </p>
      </div>

      {/* CTA */}
      <button
        onClick={onNext}
        className="w-full py-4 bg-primary text-black rounded-2xl font-bold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
      >
        Get Started <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}

// ── SCREEN 1.2a — Set PIN ──────────────────────────────────────────────────────
function SetPinScreen({ onComplete }: { onComplete: (pin: string) => void }) {
  const [pin, setPin] = useState('');
  const [shake, setShake] = useState(false);

  const handleKey = (key: string) => {
    if (pin.length >= 6) return;
    const next = pin + key;
    setPin(next);
    if (next.length === 6) {
      setTimeout(() => onComplete(next), 250);
    }
  };

  const handleDelete = () => setPin((p) => p.slice(0, -1));

  return (
    <div className="flex-1 flex flex-col px-6 pt-10 pb-8">
      {/* Progress dots */}
      <div className="flex gap-2 mb-10">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`flex-1 h-1 rounded-full ${i === 0 ? 'bg-primary' : 'bg-muted'}`} />
        ))}
      </div>

      <div className="text-center mb-10">
        <div className="w-14 h-14 bg-primary/15 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <ShieldCheck className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Create Your PIN</h2>
        <p className="text-sm text-muted-foreground">Choose a 6-digit PIN to secure your wallet</p>
      </div>

      <div className={`mb-12 ${shake ? 'animate-shake' : ''}`}>
        <PinDots length={6} filled={pin.length} />
      </div>

      <div className="mt-auto">
        <Numpad onKey={handleKey} onDelete={handleDelete} />
      </div>
    </div>
  );
}

// ── SCREEN 1.2b — Confirm PIN ─────────────────────────────────────────────────
function ConfirmPinScreen({
  originalPin,
  onComplete,
  onRetry,
}: {
  originalPin: string;
  onComplete: () => void;
  onRetry: () => void;
}) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const handleKey = (key: string) => {
    if (pin.length >= 6) return;
    setError('');
    const next = pin + key;
    setPin(next);
    if (next.length === 6) {
      if (next === originalPin) {
        setTimeout(() => onComplete(), 250);
      } else {
        setShake(true);
        setError("PINs don't match. Try again.");
        setTimeout(() => {
          setShake(false);
          setPin('');
          setError('');
        }, 700);
      }
    }
  };

  const handleDelete = () => {
    setError('');
    setPin((p) => p.slice(0, -1));
  };

  return (
    <div className="flex-1 flex flex-col px-6 pt-10 pb-8">
      <div className="flex gap-2 mb-10">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`flex-1 h-1 rounded-full ${i <= 1 ? 'bg-primary' : 'bg-muted'}`} />
        ))}
      </div>

      <div className="text-center mb-10">
        <div className="w-14 h-14 bg-primary/15 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <ShieldCheck className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Confirm Your PIN</h2>
        <p className="text-sm text-muted-foreground">Re-enter your PIN to confirm</p>
        {error && (
          <p className="text-sm text-red-400 mt-3 font-medium">{error}</p>
        )}
      </div>

      <div className={`mb-12 transition-transform ${shake ? 'translate-x-2' : ''}`}>
        <PinDots length={6} filled={pin.length} />
      </div>

      <div className="mt-auto space-y-3">
        <Numpad onKey={handleKey} onDelete={handleDelete} />
        <button
          onClick={onRetry}
          className="w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Choose a different PIN
        </button>
      </div>
    </div>
  );
}

// ── SCREEN 1.2c — Fingerprint ─────────────────────────────────────────────────
function FingerprintScreen({
  onEnable,
  onSkip,
}: {
  onEnable: () => void;
  onSkip: () => void;
}) {
  const [scanning, setScanning] = useState(false);
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleEnable = () => {
    setScanning(true);
    timerRef.current = setTimeout(() => {
      setScanning(false);
      setDone(true);
      setTimeout(onEnable, 600);
    }, 1800);
  };

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return (
    <div className="flex-1 flex flex-col px-6 pt-10 pb-8">
      <div className="flex gap-2 mb-10">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`flex-1 h-1 rounded-full ${i <= 2 ? 'bg-primary' : 'bg-muted'}`} />
        ))}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center">
        <FingerprintAnimation scanning={scanning} />

        <div className="space-y-2">
          <h2 className="text-2xl font-bold">
            {done ? 'Fingerprint Enabled!' : 'Enable Fingerprint Login'}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
            {done
              ? 'Your biometric is set up. You can change this anytime in Settings.'
              : scanning
              ? 'Place your finger on the sensor…'
              : 'Log in faster with your fingerprint. Your PIN remains as backup.'}
          </p>
        </div>

        {!done && !scanning && (
          <div className="w-full bg-primary/10 border border-primary/20 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <span className="text-xl">🔒</span>
              <p className="text-xs text-muted-foreground text-left leading-relaxed">
                Biometric data never leaves your device. Your PIN always works as backup.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {!done && (
          <button
            onClick={handleEnable}
            disabled={scanning}
            className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all ${
              scanning
                ? 'bg-primary/50 text-black/50 cursor-not-allowed'
                : 'bg-primary text-black active:scale-[0.98]'
            }`}
          >
            <Fingerprint className="w-5 h-5" />
            {scanning ? 'Scanning…' : 'Enable Fingerprint'}
          </button>
        )}
        {!scanning && !done && (
          <button
            onClick={onSkip}
            className="w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip for now
          </button>
        )}
      </div>
    </div>
  );
}

// ── SCREEN 1.3 — Success ──────────────────────────────────────────────────────
function SuccessScreen({
  fingerprintEnabled,
  onContinue,
}: {
  fingerprintEnabled: boolean;
  onContinue: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-between px-6 pt-16 pb-10">
      <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center">
        {/* Glow rings */}
        <div className="relative flex items-center justify-center">
          <div className="absolute w-40 h-40 rounded-full bg-primary/10 animate-pulse" />
          <div className="absolute w-28 h-28 rounded-full bg-primary/15" />
          <div className="relative">
            <AnimatedCheck />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-bold">Your wallet is secured!</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Everything is set up and ready to go.
          </p>
        </div>

        {/* Summary */}
        <div className="w-full bg-card border border-border rounded-2xl p-5 space-y-3 text-left">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Setup complete</p>
          <div className="space-y-2.5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/15 rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">6-digit PIN</p>
                <p className="text-xs text-muted-foreground">Your primary unlock method</p>
              </div>
              <span className="ml-auto text-primary text-lg">✓</span>
            </div>
            <div className="w-full h-px bg-border" />
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${fingerprintEnabled ? 'bg-primary/15' : 'bg-muted/30'}`}>
                <Fingerprint className={`w-4 h-4 ${fingerprintEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <p className="text-sm font-semibold">Fingerprint</p>
                <p className="text-xs text-muted-foreground">
                  {fingerprintEnabled ? 'Enabled for quick access' : 'Not enabled — you can set it up in Settings'}
                </p>
              </div>
              <span className={`ml-auto text-lg ${fingerprintEnabled ? 'text-primary' : 'text-muted-foreground'}`}>
                {fingerprintEnabled ? '✓' : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={onContinue}
        className="w-full py-4 bg-primary text-black rounded-2xl font-bold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
      >
        Continue to App <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}

// ── MAIN AUTH SETUP ───────────────────────────────────────────────────────────
export function AuthSetup({ onComplete }: Props) {
  const [screen, setScreen] = useState<Screen>('welcome');
  const [pin, setPin] = useState('');
  const [fingerprintEnabled, setFingerprintEnabled] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-background text-foreground max-w-md mx-auto">
      {screen === 'welcome' && (
        <WelcomeScreen onNext={() => setScreen('set-pin')} />
      )}

      {screen === 'set-pin' && (
        <SetPinScreen
          onComplete={(newPin) => {
            setPin(newPin);
            setScreen('confirm-pin');
          }}
        />
      )}

      {screen === 'confirm-pin' && (
        <ConfirmPinScreen
          originalPin={pin}
          onComplete={() => setScreen('fingerprint')}
          onRetry={() => { setPin(''); setScreen('set-pin'); }}
        />
      )}

      {screen === 'fingerprint' && (
        <FingerprintScreen
          onEnable={() => { setFingerprintEnabled(true); setScreen('success'); }}
          onSkip={() => setScreen('success')}
        />
      )}

      {screen === 'success' && (
        <SuccessScreen
          fingerprintEnabled={fingerprintEnabled}
          onContinue={() => onComplete(pin, fingerprintEnabled)}
        />
      )}
    </div>
  );
}
