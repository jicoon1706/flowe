import { Numpad, type NumpadKey } from './Numpad';

export function appendDigit(current: string, digit: string): string {
  if (current.length >= 6) return current;
  return current + digit;
}
export function backspace(current: string): string {
  return current.slice(0, -1);
}

export interface PinPadProps {
  value: string;
  onChange: (next: string) => void;
  /** Shows the fingerprint key (lock screen) and calls this on tap. */
  onBiometric?: () => void;
  disabled?: boolean;
}

/** Glass numpad wired to a 6-digit PIN string. */
export function PinPad({ value, onChange, onBiometric, disabled }: PinPadProps) {
  const onKey = (k: NumpadKey) => {
    if (k === 'del') onChange(backspace(value));
    else if (k === 'bio') onBiometric?.();
    else if (k !== '.') onChange(appendDigit(value, k));
  };
  return <Numpad variant="glass" extra={onBiometric ? 'biometric' : 'none'} onKey={onKey} disabled={disabled} />;
}
