import type { ReactNode } from 'react';
import { View } from 'react-native';
import { RefreshCw } from 'lucide-react-native';
import { colors, radius } from '@/theme/tokens';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { Text } from '../ui/Text';

export interface CashflowCardProps {
  title: string;
  /** Muted text on the right of the title (range, month, "Cash flow class"). */
  meta?: string;
  children?: ReactNode;
  /** Grey block in the card's final position. */
  loadingHeight?: number;
  /** Card-level error: message + Try again. */
  error?: { message: string; onRetry: () => void } | null;
  gap?: number;
}

/** A Cashflow tab card: #F5F5F5, 20 px radius, title row, then its body, skeleton or error. */
export function CashflowCard({ title, meta, children, loadingHeight, error, gap = 12 }: CashflowCardProps) {
  return (
    <View accessibilityLabel={title} style={{ backgroundColor: colors['surface-container'], borderRadius: radius.md, padding: 16, gap }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <Text variant="label-lg" accessibilityRole="header">{title}</Text>
        {meta ? <Text variant="label-sm" weight={400} tone="meta">{meta}</Text> : null}
      </View>
      {error ? (
        <View style={{ gap: 12, alignItems: 'flex-start', paddingVertical: 8 }}>
          <Text variant="body-md" tone="meta">{error.message}</Text>
          <Button label="Try again" icon={RefreshCw} variant="action" onPress={error.onRetry} />
        </View>
      ) : loadingHeight ? (
        <Skeleton height={loadingHeight} radius={radius.sm} tone="pill" />
      ) : (
        children
      )}
    </View>
  );
}
