import { View } from 'react-native';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react-native';
import { colors, type TypeToken, type FontWeight } from '@/theme/tokens';
import { splitMoney, type MoneyDirection } from '@/src/lib/money';
import { Text } from './Text';

export interface MoneyProps {
  amount: number;
  /** Sign + arrow; never colour. */
  direction?: MoneyDirection;
  /** Draw the ↗ / ↘ after the figure (rows, detail). */
  arrow?: boolean;
  variant?: TypeToken;
  weight?: FontWeight;
  size?: number;
  /** 'surface' = on white; 'gradient' = on the hero field. */
  on?: 'surface' | 'gradient' | 'grey';
  /** Hero style: the currency label drawn smaller than the figure. */
  smallCurrency?: boolean;
  /** Locked app: show dots instead of the figure. */
  masked?: boolean;
  accessibilityLabel?: string;
}

/**
 * An amount as a strong integer and muted cents — the signature detail of every
 * figure in Flowe. Cents use #737373 on white, #666666 on grey fills and 55%
 * white on the gradient.
 */
export function Money({
  amount,
  direction = 'none',
  arrow = false,
  variant = 'body-lg',
  weight,
  size,
  on = 'surface',
  smallCurrency = false,
  masked = false,
  accessibilityLabel,
}: MoneyProps) {
  const { sign, integer, cents } = splitMoney(amount, direction);
  const strong = on === 'gradient' ? 'inverse' : 'default';
  const centsTone = on === 'gradient' ? 'faint' : on === 'grey' ? 'meta' : 'muted';
  const label = accessibilityLabel ?? `${sign === '+' ? 'plus ' : sign ? 'minus ' : ''}RM ${integer}${cents}`;
  const iconSize = Math.max(14, Math.round((size ?? 16) * (variant === 'numeric-lg' || variant === 'display-lg' ? 0.43 : 0.875)));
  const iconColor = on === 'gradient' ? colors['on-primary'] : colors['on-surface'];
  const Icon = direction === 'income' ? ArrowUpRight : ArrowDownRight;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }} accessible accessibilityLabel={label}>
      <Text variant={variant} weight={weight} size={size} tone={strong} tabular>
        {sign}
        {smallCurrency ? (
          <Text variant="body-lg" weight={weight ?? 500} size={24} tone="inherit" style={{ letterSpacing: 0 }}>RM </Text>
        ) : (
          'RM '
        )}
        {masked ? '•••••' : integer}
        {masked ? null : <Text variant={variant} weight={weight} size={size} tone={centsTone} tabular>{cents}</Text>}
      </Text>
      {arrow && direction !== 'none' ? (
        <View style={{ marginLeft: 4 }}>
          <Icon size={iconSize} color={iconColor} strokeWidth={1.75} />
        </View>
      ) : null}
    </View>
  );
}
