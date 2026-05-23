import { useState } from 'react';
import { ChevronLeft, ChevronRight, Fingerprint, Lock, Clock, Shield } from 'lucide-react';

interface Props {
  onBack: () => void;
  onChangePIN: () => void;
}

const AUTO_LOCK_OPTIONS = [
  { label: '1 minute', value: '1m' },
  { label: '5 minutes', value: '5m' },
  { label: '15 minutes', value: '15m' },
  { label: '30 minutes', value: '30m' },
  { label: 'Never', value: 'never' },
];

export function SecuritySettings({ onBack, onChangePIN }: Props) {
  const [fingerprintEnabled, setFingerprintEnabled] = useState(true);
  const [faceIdEnabled, setFaceIdEnabled] = useState(false);
  const [autoLock, setAutoLock] = useState('5m');
  const [showAutoLock, setShowAutoLock] = useState(false);

  const selectedAutoLock = AUTO_LOCK_OPTIONS.find((o) => o.value === autoLock);

  return (
    <div className="min-h-screen p-4 pb-6">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-card border border-border hover:bg-muted transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">Security</h1>
      </div>

      {/* Security Status Banner */}
      <div className="bg-primary/10 border border-primary/30 rounded-2xl p-4 mb-6 flex items-center gap-3">
        <Shield className="w-6 h-6 text-primary" />
        <div>
          <p className="font-semibold text-sm">Your account is protected</p>
          <p className="text-xs text-muted-foreground">PIN + Fingerprint enabled</p>
        </div>
      </div>

      {/* PIN Section */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-3 px-2">PIN</h3>
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <button
            onClick={onChangePIN}
            className="w-full flex items-center justify-between p-4 hover:bg-muted transition-colors"
          >
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5" />
              <span className="font-medium">Change PIN</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Biometrics Section */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-3 px-2">Biometrics</h3>
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <Fingerprint className="w-5 h-5" />
              <div>
                <p className="font-medium">Fingerprint</p>
                <p className="text-xs text-muted-foreground">Use fingerprint to unlock</p>
              </div>
            </div>
            <button
              onClick={() => setFingerprintEnabled(!fingerprintEnabled)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                fingerprintEnabled ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  fingerprintEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 flex items-center justify-center">
                <span className="text-base">⬛</span>
              </div>
              <div>
                <p className="font-medium">Face ID</p>
                <p className="text-xs text-muted-foreground">Use Face ID to unlock</p>
              </div>
            </div>
            <button
              onClick={() => setFaceIdEnabled(!faceIdEnabled)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                faceIdEnabled ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  faceIdEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Auto-lock Section */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-3 px-2">Auto-lock</h3>
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <button
            onClick={() => setShowAutoLock(!showAutoLock)}
            className="w-full flex items-center justify-between p-4 hover:bg-muted transition-colors"
          >
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5" />
              <span className="font-medium">Auto-lock Timer</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{selectedAutoLock?.label}</span>
              <ChevronRight
                className={`w-5 h-5 text-muted-foreground transition-transform ${showAutoLock ? 'rotate-90' : ''}`}
              />
            </div>
          </button>

          {showAutoLock && (
            <div className="border-t border-border">
              {AUTO_LOCK_OPTIONS.map((opt, i) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setAutoLock(opt.value);
                    setShowAutoLock(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 hover:bg-muted transition-colors ${
                    i !== AUTO_LOCK_OPTIONS.length - 1 ? 'border-b border-border' : ''
                  }`}
                >
                  <span className="font-medium pl-8">{opt.label}</span>
                  {autoLock === opt.value && (
                    <span className="text-primary font-bold">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Security Tips */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <p className="text-sm font-medium mb-3">Security Tips</p>
        <ul className="space-y-2 text-xs text-muted-foreground">
          <li className="flex gap-2"><span className="text-primary">•</span> Use a unique PIN not used elsewhere</li>
          <li className="flex gap-2"><span className="text-primary">•</span> Enable biometrics for quick & secure access</li>
          <li className="flex gap-2"><span className="text-primary">•</span> Short auto-lock keeps your data safe</li>
        </ul>
      </div>
    </div>
  );
}
