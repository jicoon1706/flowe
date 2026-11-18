import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Line, Polygon } from 'react-native-svg';
import { Sprout } from 'lucide-react-native';
import { chart, colors, radius } from '@/theme/tokens';
import { formatRM, roundCents } from '@/src/lib/money';
import { CashflowCard } from './CashflowCard';
import { Money } from '../ui/Money';
import { Text } from '../ui/Text';

/** The canvas draws the diagram 326 wide; x positions scale with the card, y stays. */
const BASE_W = 326;
const HEIGHT = 372;
const BOX_W = 140;
const MAX_ARROW = 16;
const MIN_ARROW = 3;
const LIGHT = chart[2];
const STRONG = chart[1];

export interface FlowLine { name: string; amount: number }

export interface CashFlowDiagramCardProps {
  monthLabel: string;
  income: number;
  incomeLines: string[];
  expenses: number;
  expenseLines: string[];
  assets: number;
  assetLines: string[];
  liabilities: number;
  liabilityLines: string[];
  passive: { total: number; items: FlowLine[] };
  repayments: { total: number; items: FlowLine[] };
  loading: boolean;
  onRetry?: (() => void) | null;
  masked?: boolean;
}

const names = (items: FlowLine[]) => (items.length > 1 ? `${items[0].name} + ${items.length - 1} more` : items[0]?.name ?? '');
const perMonth = (v: number) => `RM ${Math.round(v).toLocaleString('en-MY')}/mo`;

/** "Your assets pay RM X a month…" under the diagram. */
export function diagramInsight(passive: number, expenses: number): string {
  return passive > 0
    ? `Your assets pay ${formatRM(passive)} a month. Grow that line to pass your ${formatRM(expenses)} expenses.`
    : `None of your assets pay you yet. Income-producing assets are what eventually cover your ${formatRM(expenses)} expenses.`;
}

/**
 * Cash flow diagram (ins-cashflow): income statement over balance sheet, with
 * arrows sized by amount. Assets → Income (passive income) is the only strong
 * cobalt arrow. Read-only.
 */
export function CashFlowDiagramCard(p: CashFlowDiagramCardProps) {
  const [width, setWidth] = useState(0);
  if (p.loading || p.onRetry) {
    return <CashflowCard title="Cash flow diagram" meta={p.monthLabel} loadingHeight={p.loading && !p.onRetry ? HEIGHT : undefined} error={p.onRetry ? { message: 'Couldn’t load this month.', onRetry: p.onRetry } : null} />;
  }

  const sx = width / BASE_W;
  const X = (v: number) => v * sx;
  const boxW = X(BOX_W);
  const saved = roundCents(p.income - p.expenses);
  const spent = p.income > 0 && p.expenses > 0 ? Math.min(p.income, p.expenses) : 0;
  const flows = [spent, Math.max(0, saved), p.passive.total, p.repayments.total];
  const maxFlow = Math.max(...flows, 0);
  const thick = (amount: number) => (maxFlow > 0 ? Math.max(MIN_ARROW, (MAX_ARROW * amount) / maxFlow) : MIN_ARROW);
  const head = (t: number) => Math.max(8, t / 2 + 5);

  // Narrow columns (tablet, 368 wide) drop the amount one step so it stays on one line.
  const amountVariant = boxW < 150 ? 'body-md' : 'body-lg';
  const box = (left: number, top: number, height: number, label: string, amount: number, lines: string[]) => (
    <View style={{ position: 'absolute', left: X(left), top, width: boxW, height, backgroundColor: colors.surface, borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 12, gap: 4 }}>
      <Text variant="label-sm" weight={400} tone="meta">{label}</Text>
      <Money amount={amount} variant={amountVariant} weight={600} masked={p.masked} />
      {lines.slice(0, 2).map((l) => <Text key={l} variant="caption" tone="meta" numberOfLines={1}>{l}</Text>)}
    </View>
  );
  const flowLabel = (left: number, top: number, title: string, sub: string, opts: { strong?: boolean; right?: boolean } = {}) => (
    <View style={{ position: 'absolute', top, ...(opts.right ? { right: width - X(left) } : { left: X(left) }), maxWidth: X(110), alignItems: opts.right ? 'flex-end' : 'flex-start' }}>
      <Text variant="caption" weight={600} style={opts.strong ? { color: STRONG } : undefined} numberOfLines={1}>{title}</Text>
      <Text variant="caption" tone={opts.strong ? 'inherit' : 'meta'} style={opts.strong ? { color: STRONG } : undefined}>{sub}</Text>
    </View>
  );

  const label = [
    `Cash flow diagram for ${p.monthLabel}.`,
    `Income ${formatRM(p.income)}, expenses ${formatRM(p.expenses)}.`,
    saved > 0 ? `${formatRM(saved)} is saved into assets.` : null,
    `Assets ${formatRM(p.assets)}${p.passive.total > 0 ? ` pay ${formatRM(p.passive.total)} a month back into income` : ''}.`,
    `Liabilities ${formatRM(p.liabilities)}${p.repayments.total > 0 ? ` add ${formatRM(p.repayments.total)} a month of repayments to expenses` : ''}.`,
  ].filter(Boolean).join(' ');

  return (
    <CashflowCard title="Cash flow diagram" meta={p.monthLabel}>
      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} accessible accessibilityRole="image" accessibilityLabel={label} style={{ height: HEIGHT }}>
        {width > 0 ? (
          <>
            <Svg width={width} height={HEIGHT} style={{ position: 'absolute' }}>
              {spent > 0 ? (() => { const t = thick(spent); const h = head(t); return (<>
                <Line x1={X(140)} y1={70} x2={X(170)} y2={70} stroke={LIGHT} strokeWidth={t} />
                <Polygon points={`${X(170)},${70 - h} ${X(186)},70 ${X(170)},${70 + h}`} fill={LIGHT} />
              </>); })() : null}
              {saved > 0 ? (() => { const t = thick(saved); const h = head(t); return (<>
                <Line x1={X(28)} y1={118} x2={X(28)} y2={250} stroke={LIGHT} strokeWidth={t} />
                <Polygon points={`${X(28) - h},250 ${X(28) + h},250 ${X(28)},266`} fill={LIGHT} />
              </>); })() : null}
              {p.passive.total > 0 ? (() => { const t = thick(p.passive.total); const h = head(t); return (<>
                <Line x1={X(118)} y1={266} x2={X(118)} y2={132} stroke={STRONG} strokeWidth={t} />
                <Polygon points={`${X(118) - h},132 ${X(118) + h},132 ${X(118)},118`} fill={STRONG} />
              </>); })() : null}
              {p.repayments.total > 0 ? (() => { const t = thick(p.repayments.total); const h = head(t); return (<>
                <Line x1={X(262)} y1={266} x2={X(262)} y2={132} stroke={LIGHT} strokeWidth={t} />
                <Polygon points={`${X(262) - h},132 ${X(262) + h},132 ${X(262)},118`} fill={LIGHT} />
              </>); })() : null}
            </Svg>
            <Text variant="caption" weight={600} tone="meta" align="center" style={{ position: 'absolute', top: 0, left: 0, right: 0, letterSpacing: 1 }}>INCOME STATEMENT</Text>
            {box(0, 22, 96, 'Income', p.income, p.incomeLines)}
            {box(186, 22, 96, 'Expenses', p.expenses, p.expenseLines)}
            {saved > 0 ? flowLabel(44, 136, `+${formatRM(saved)}`, 'saved') : null}
            {p.passive.total > 0 ? flowLabel(128, 136, names(p.passive.items), perMonth(p.passive.total), { strong: true }) : null}
            {p.repayments.total > 0 ? flowLabel(252, 180, names(p.repayments.items), perMonth(p.repayments.total), { right: true }) : null}
            <Text variant="caption" weight={600} tone="meta" align="center" style={{ position: 'absolute', top: 244, left: 0, right: 0, letterSpacing: 1 }}>BALANCE SHEET</Text>
            {box(0, 266, 106, 'Assets', p.assets, p.assetLines)}
            {box(186, 266, 106, 'Liabilities', p.liabilities, p.liabilityLines)}
          </>
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: colors.surface, borderRadius: radius.sm, padding: 12 }}>
        <View style={{ width: 28, height: 28, borderRadius: 9999, backgroundColor: STRONG, alignItems: 'center', justifyContent: 'center' }}>
          <Sprout size={16} color={colors['on-primary']} strokeWidth={1.75} />
        </View>
        <Text variant="body-md" style={{ flex: 1 }}>{diagramInsight(p.passive.total, p.expenses)}</Text>
      </View>
    </CashflowCard>
  );
}
