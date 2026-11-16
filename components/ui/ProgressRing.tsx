import type { ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '@/theme/tokens';

export interface ProgressRingProps {
  /** 0..1, clamped. */
  progress: number;
  size?: number;
  stroke?: number;
  /** 'glass' = glass track + white arc on the gradient; 'surface' = #EFEFEF track + black arc on white. */
  on?: 'glass' | 'surface';
  children?: ReactNode;
  accessibilityLabel?: string;
}

/** Ring drawn from 12 o'clock clockwise with a round cap. */
export function ProgressRing({ progress, size = 168, stroke = 12, on = 'glass', children, accessibilityLabel }: ProgressRingProps) {
  const p = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const track = on === 'glass' ? colors.glass : colors['surface-container-high'];
  const arc = on === 'glass' ? colors['on-primary'] : colors.secondary;
  return (
    <View
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
      accessible={!!accessibilityLabel}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(p * 100) }}
    >
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        {p > 0 ? (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={arc}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap={p >= 1 ? 'butt' : 'round'}
            strokeDasharray={`${c * p} ${c}`}
          />
        ) : null}
      </Svg>
      {children}
    </View>
  );
}
