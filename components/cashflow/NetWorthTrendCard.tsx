import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Polygon, Polyline, Text as SvgText } from 'react-native-svg';
import { chart, colors, fontFamily, type as typeScale } from '@/theme/tokens';
import { monthsWithValue, type NetWorthPoint } from '@/src/lib/cashflow';
import { formatRM } from '@/src/lib/money';
import { CashflowCard } from './CashflowCard';
import { Money } from '../ui/Money';
import { Text } from '../ui/Text';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const shortMonth = (m: string) => MONTHS[Number(m.slice(5, 7)) - 1];
const longMonth = (m: string) => `${shortMonth(m)} ${m.slice(0, 4)}`;

const NET = chart[1];
const ASSETS = chart[2];
const LIAB = colors['on-surface-variant'];
const GRID = colors['surface-container-high'];
const AXIS = colors['on-surface-variant-aa'];
const CAPTION = typeScale.caption.size;
const CHART_HEIGHT = 176;
const PLOT = { left: 36, top: 10, bottom: 150 };
/** Opacity of the cobalt fill under the net worth line (the canvas' "light fill"). */
const FILL_OPACITY = 0.1;

/** '10k', '2.5k', '800'. */
export function axisLabel(v: number): string {
  const a = Math.abs(v);
  const s = a >= 1000 ? `${Math.round((a / 1000) * 10) / 10}k` : `${Math.round(a)}`;
  return v < 0 ? `−${s}` : s;
}

/** A round top for the y axis: 1, 2, 2.5 or 5 × 10ⁿ, at least `max`. */
function niceMax(max: number): number {
  if (max <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(max));
  for (const step of [1, 2, 2.5, 5, 10]) if (step * pow >= max) return step * pow;
  return 10 * pow;
}

export interface NetWorthTrendCardProps {
  points: NetWorthPoint[];
  loading: boolean;
  onRetry?: (() => void) | null;
  masked?: boolean;
}

/** Net worth trend (ins-cashflow): six months of net worth, assets and liabilities. */
export function NetWorthTrendCard({ points, loading, onRetry, masked }: NetWorthTrendCardProps) {
  const [width, setWidth] = useState(0);
  const first = points[0];
  const last = points[points.length - 1];
  const range = first && last ? `${shortMonth(first.month)} – ${longMonth(last.month)}` : undefined;

  if (loading || onRetry) {
    return <CashflowCard title="Net worth trend" meta={range} loadingHeight={loading && !onRetry ? CHART_HEIGHT + 60 : undefined} error={onRetry ? { message: 'Couldn’t load the trend.', onRetry } : null} />;
  }
  if (!first || monthsWithValue(points) < 2) {
    return (
      <CashflowCard title="Net worth trend" meta={range}>
        <Text variant="body-md" tone="meta">Your trend appears once you have two months of history.</Text>
      </CashflowCard>
    );
  }

  const change = last.netWorth - first.netWorth;
  const values = points.flatMap((p) => [p.assets, p.liabilities, p.netWorth]);
  const top = niceMax(Math.max(...values));
  const bottom = Math.min(0, ...values) < 0 ? -niceMax(-Math.min(...values)) : 0;
  const plotRight = width - 10;
  const x = (i: number) => PLOT.left + 4 + (i * (plotRight - PLOT.left - 4)) / Math.max(1, points.length - 1);
  const y = (v: number) => PLOT.bottom - ((v - bottom) / (top - bottom)) * (PLOT.bottom - PLOT.top);
  const line = (key: keyof Omit<NetWorthPoint, 'month'>) => points.map((p, i) => `${x(i)},${y(p[key])}`).join(' ');
  const ticks = bottom < 0 ? [bottom, 0, top] : [0, top / 2, top];
  const label = `Net worth trend, ${longMonth(first.month)} to ${longMonth(last.month)}. Net worth from ${formatRM(first.netWorth)} to ${formatRM(last.netWorth)}. Assets from ${formatRM(first.assets)} to ${formatRM(last.assets)}. Liabilities from ${formatRM(first.liabilities)} to ${formatRM(last.liabilities)}.`;

  const legend = (name: string, value: number, swatch: 'solid' | 'light' | 'dashed') => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={swatch === 'dashed'
          ? { width: 16, height: 0, borderTopWidth: 2, borderStyle: 'dashed', borderColor: LIAB }
          : { width: 16, height: 3, borderRadius: 2, backgroundColor: swatch === 'solid' ? NET : ASSETS }} />
        <Text variant="body-md">{name}</Text>
      </View>
      <Money amount={value} variant="body-md" weight={600} on="grey" masked={masked} />
    </View>
  );

  return (
    <CashflowCard title="Net worth trend" meta={range}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
        <Text variant="headline-md" weight={600} tabular>
          {masked ? '•••••' : `${change >= 0 ? '+' : '−'}RM ${Math.round(Math.abs(change)).toLocaleString('en-MY')}`}
        </Text>
        <Text variant="body-md" tone="meta">since {shortMonth(first.month)}</Text>
      </View>
      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} accessible accessibilityRole="image" accessibilityLabel={label} style={{ height: CHART_HEIGHT }}>
        {width > 0 ? (
          <Svg width={width} height={CHART_HEIGHT}>
            {ticks.map((t) => (
              <Line key={`g${t}`} x1={PLOT.left} x2={width} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={1} />
            ))}
            {ticks.map((t) => (
              <SvgText key={`t${t}`} x={0} y={y(t) + 3} fontSize={CAPTION} fontFamily={fontFamily.regular} fill={AXIS}>{axisLabel(t)}</SvgText>
            ))}
            <Polygon points={`${x(0)},${y(Math.max(0, bottom))} ${line('netWorth')} ${x(points.length - 1)},${y(Math.max(0, bottom))}`} fill={NET} fillOpacity={FILL_OPACITY} />
            <Polyline points={line('assets')} fill="none" stroke={ASSETS} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            <Polyline points={line('liabilities')} fill="none" stroke={LIAB} strokeWidth={2} strokeDasharray="4 4" strokeLinecap="round" />
            <Polyline points={line('netWorth')} fill="none" stroke={NET} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
            <Circle cx={x(points.length - 1)} cy={y(last.netWorth)} r={4.5} fill={NET} stroke={colors['surface-container']} strokeWidth={2} />
            <Circle cx={x(points.length - 1)} cy={y(last.assets)} r={3.5} fill={ASSETS} />
            <Circle cx={x(points.length - 1)} cy={y(last.liabilities)} r={3.5} fill={LIAB} />
            {points.map((p, i) => {
              const current = i === points.length - 1;
              return (
                <SvgText
                  key={p.month}
                  x={x(i)}
                  y={CHART_HEIGHT - 6}
                  textAnchor={current ? 'end' : 'middle'}
                  fontSize={CAPTION}
                  fontFamily={current ? fontFamily.semibold : fontFamily.regular}
                  fill={current ? colors['on-surface'] : AXIS}
                >
                  {shortMonth(p.month)}
                </SvgText>
              );
            })}
          </Svg>
        ) : null}
      </View>
      <View style={{ gap: 8 }}>
        {legend('Net worth', last.netWorth, 'solid')}
        {legend('Assets', last.assets, 'light')}
        {legend('Liabilities', last.liabilities, 'dashed')}
      </View>
    </CashflowCard>
  );
}
