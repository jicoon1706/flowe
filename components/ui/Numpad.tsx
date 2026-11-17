import { View } from 'react-native';
import { Pressable } from '@/components/ui/Pressable';
import * as Haptics from 'expo-haptics';
import { Delete, FingerprintPattern } from 'lucide-react-native';
import { colors } from '@/theme/tokens';
import { Text } from './Text';

export type NumpadKey = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '.' | 'del' | 'bio';

export interface NumpadProps {
  onKey: (key: NumpadKey) => void;
  /** 'glass' on the gradient (PIN, tabung amount); 'white' on a sheet (amount). */
  variant?: 'glass' | 'white';
  /** Bottom-left key: decimal point (amounts), fingerprint (lock) or nothing (PIN). */
  extra?: 'decimal' | 'biometric' | 'none';
  keyHeight?: number;
  gap?: number;
  disabled?: boolean;
}

const ROWS: NumpadKey[][] = [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9']];

/** 3×4 grid of pill keys. Glass keys on the gradient, #F5F5F5 keys on white. */
export function Numpad({ onKey, variant = 'white', extra = 'decimal', keyHeight, gap, disabled }: NumpadProps) {
  const glass = variant === 'glass';
  const h = keyHeight ?? (glass ? 64 : 56);
  const g = gap ?? (glass ? 14 : 8);
  const fill = glass ? colors.glass : colors['surface-container'];
  const ink = glass ? colors['on-primary'] : colors['on-surface'];

  const press = (k: NumpadKey) => {
    if (disabled) return;
    Haptics.selectionAsync().catch(() => {});
    onKey(k);
  };

  const key = (k: NumpadKey | null, i: number) => {
    if (!k) return <View key={`blank-${i}`} style={{ flex: 1, height: h }} />;
    const isIcon = k === 'del' || k === 'bio';
    const label = k === 'del' ? 'Delete' : k === 'bio' ? 'Use fingerprint' : k === '.' ? 'Decimal point' : k;
    return (
      <Pressable
        key={k}
        onPress={() => press(k)}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={({ pressed }) => ({
          flex: 1,
          height: h,
          borderRadius: 9999,
          backgroundColor: isIcon ? 'transparent' : fill,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.6 : disabled ? 0.5 : 1,
        })}
      >
        {k === 'del' ? (
          <Delete size={24} color={ink} strokeWidth={1.75} />
        ) : k === 'bio' ? (
          <FingerprintPattern size={26} color={ink} strokeWidth={1.75} />
        ) : (
          <Text variant="body-lg" weight={500} size={24} tone="inherit" style={{ color: ink }} tabular>{k}</Text>
        )}
      </Pressable>
    );
  };

  const last: (NumpadKey | null)[] = [extra === 'decimal' ? '.' : extra === 'biometric' ? 'bio' : null, '0', 'del'];
  return (
    <View style={{ gap: g }}>
      {[...ROWS, last].map((row, r) => (
        <View key={r} style={{ flexDirection: 'row', gap: g }}>
          {row.map((k, i) => key(k, r * 3 + i))}
        </View>
      ))}
    </View>
  );
}

/** Applies a numpad key to an amount string: max 2 decimals, max `maxIntDigits` before the point. */
export function applyAmountKey(current: string, k: NumpadKey, maxIntDigits = 6): string {
  if (k === 'del') return current.slice(0, -1);
  if (k === 'bio') return current;
  if (k === '.') return current.includes('.') ? current : (current || '0') + '.';
  const next = current === '0' ? k : current + k;
  const [int, dec] = next.split('.');
  if (dec !== undefined && dec.length > 2) return current;
  if (int.length > maxIntDigits) return current;
  return next;
}
