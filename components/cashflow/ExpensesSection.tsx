import { useState } from 'react';
import { View } from 'react-native';
import { Plus, RefreshCw, type LucideIcon } from 'lucide-react-native';
import { colors, radius } from '@/theme/tokens';
import type { CategoryShare } from '@/src/lib/cashflow';
import { Button } from '../ui/Button';
import { CategoryBubble } from '../ui/CategoryBubble';
import { GradientFill } from '../ui/GradientFill';
import { Money } from '../ui/Money';
import { SectionHeader } from '../ui/SectionHeader';
import { Skeleton } from '../ui/Skeleton';
import { StatTile } from '../ui/StatTile';
import { Text } from '../ui/Text';

/** Bubble slots [left, top, size], largest first, on the canvas' panel width. */
const LAYOUTS = {
  phone: { width: 374, height: 426, slots: [[14, 24, 150], [196, 34, 134], [120, 168, 122], [258, 206, 108], [16, 236, 92], [150, 318, 76]] },
  tablet: { width: 368, height: 332, slots: [[16, 20, 120], [156, 26, 107], [100, 162, 98], [270, 70, 86], [16, 236, 74], [226, 196, 64]] },
} as const;

export interface ExpensesSectionProps {
  monthName: string;
  total: number;
  items: CategoryShare[];
  labelOf: (category: string) => string;
  iconOf: (category: string) => LucideIcon;
  onCategory: (category: string) => void;
  onViewAll: () => void;
  onAdd: () => void;
  loading: boolean;
  onRetry?: (() => void) | null;
  layout: 'phone' | 'tablet';
  masked?: boolean;
}

/** Expenses (ins-cashflow): header + View All, month total, category bubbles on blue, category tiles. */
export function ExpensesSection(p: ExpensesSectionProps) {
  const [panelW, setPanelW] = useState(0);
  const spec = LAYOUTS[p.layout];
  const scale = panelW > 0 ? panelW / spec.width : 0;
  const panelH = panelW > 0 ? Math.round(spec.height * scale) : spec.height;
  const columns = p.layout === 'tablet' ? 3 : 2;
  const empty = !p.loading && !p.onRetry && p.items.length === 0;

  const bubbles = p.loading || p.onRetry
    ? spec.slots.slice(0, p.onRetry ? 2 : spec.slots.length).map(([l, t, s], i) => (
        <View key={i} style={{ position: 'absolute', left: l * scale, top: t * scale, width: s * scale, height: s * scale, borderRadius: 9999, backgroundColor: colors.glass }} />
      ))
    : empty
    ? spec.slots.slice(0, 2).map(([l, t, s], i) => (
        <View key={i} style={{ position: 'absolute', left: l * scale, top: t * scale }}>
          <CategoryBubble label="" share={0} icon={Plus} size={s * scale} ghost />
        </View>
      ))
    : p.items.slice(0, spec.slots.length).map((c, i) => {
        const [l, t, s] = spec.slots[i];
        return (
          <View key={c.category} style={{ position: 'absolute', left: l * scale, top: t * scale }}>
            <CategoryBubble label={p.labelOf(c.category)} share={c.share} icon={p.iconOf(c.category)} size={s * scale} onPress={() => p.onCategory(c.category)} />
          </View>
        );
      });

  const rows: CategoryShare[][] = [];
  for (let i = 0; i < p.items.length; i += columns) rows.push(p.items.slice(i, i + columns));

  return (
    <View style={{ gap: 12 }}>
      <SectionHeader title="Expenses" onAction={p.onViewAll} />
      <View style={{ alignItems: 'center' }}>
        {p.loading ? <Skeleton width={180} height={32} /> : <Money amount={p.total} variant="display-md" masked={p.masked} />}
      </View>

      <View
        onLayout={(e) => setPanelW(e.nativeEvent.layout.width)}
        accessibilityLabel={p.items.length ? 'Spending by category' : undefined}
        style={{ marginHorizontal: p.layout === 'phone' ? -8 : 0, height: panelH, borderRadius: radius.lg, overflow: 'hidden' }}
      >
        {/* Keyed by height: the gradient keeps the size it was first drawn at. */}
        <GradientFill key={panelH} />
        {panelW > 0 ? bubbles : null}
        {empty ? (
          <View style={{ position: 'absolute', left: 24, right: 24, bottom: 24, alignItems: 'center', gap: 12 }}>
            <Text variant="headline-md" tone="inverse" align="center">No spending in {p.monthName} yet</Text>
            <Text variant="body-md" tone="soft" align="center">Log or confirm a transaction and your categories will bubble up here.</Text>
            <Button label="Add transaction" icon={Plus} variant="white" onPress={p.onAdd} />
          </View>
        ) : null}
        {p.onRetry ? (
          <View style={{ position: 'absolute', left: 24, right: 24, bottom: 24, alignItems: 'center', gap: 12 }}>
            <Text variant="headline-md" tone="inverse" align="center">Couldn’t load this month</Text>
            <Text variant="body-md" tone="soft" align="center">Your transactions are safe. We couldn’t total them just now.</Text>
            <Button label="Try again" icon={RefreshCw} variant="white" onPress={p.onRetry} />
          </View>
        ) : null}
      </View>

      {p.loading ? (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {Array.from({ length: columns }, (_, i) => <View key={i} style={{ flex: 1 }}><Skeleton height={84} radius={radius.sm} /></View>)}
        </View>
      ) : (
        rows.map((row, r) => (
          <View key={r} style={{ flexDirection: 'row', gap: 8 }}>
            {Array.from({ length: columns }, (_, c) => {
              const item = row[c];
              return (
                <View key={c} style={{ flex: 1, minWidth: 0 }}>
                  {item ? <StatTile label={p.labelOf(item.category)} icon={p.iconOf(item.category)} amount={item.amount} masked={p.masked} onPress={() => p.onCategory(item.category)} /> : null}
                </View>
              );
            })}
          </View>
        ))
      )}
    </View>
  );
}
