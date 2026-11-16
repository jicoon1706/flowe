import { View } from 'react-native';
import { chart, colors } from '@/theme/tokens';
import type { TabungMonth } from '@/src/lib/tabungProgress';
import { formatRM } from '@/src/lib/money';
import { Text } from '../ui/Text';

export interface TabungMonthStripProps {
  months: TabungMonth[];
  /** Next month's on-track amount, drawn dashed ("Projected"). */
  projected?: number | null;
  /** How many months to show (latest last). */
  count?: number;
}

const BAR = 72;

function shortMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-MY', { month: 'short' });
}

function nextMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Paired bars per month: In (navy) and Out (#7B9DBC); dashed projected bar. Monochrome blues only. */
export function TabungMonthStrip({ months, projected, count = 4 }: TabungMonthStripProps) {
  const shown = months.slice(-count);
  const max = Math.max(1, ...shown.flatMap((m) => [m.toppedUp, m.paidOut]), projected ?? 0);
  const h = (v: number) => Math.max(v > 0 ? 6 : 0, Math.round((v / max) * BAR));
  const label = shown.map((m) => `${shortMonth(m.month)}: in ${formatRM(m.toppedUp)}, out ${formatRM(m.paidOut)}`).join('; ');
  const last = shown[shown.length - 1]?.month;

  return (
    <View style={{ gap: 10 }} accessible accessibilityRole="image" accessibilityLabel={`Monthly money in and out. ${label}`}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        {shown.map((m) => (
          <View key={m.month} style={{ alignItems: 'center', gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: BAR }}>
              <View style={{ width: 14, height: h(m.toppedUp), borderRadius: 9999, backgroundColor: chart[0] }} />
              <View style={{ width: 14, height: h(m.paidOut), borderRadius: 9999, backgroundColor: chart[2] }} />
            </View>
            <Text variant="label-sm" tone="muted">{shortMonth(m.month)}</Text>
          </View>
        ))}
        {projected && last ? (
          <View style={{ alignItems: 'center', gap: 6 }}>
            <View style={{ height: BAR, justifyContent: 'flex-end' }}>
              <View style={{ width: 14, height: h(projected), borderRadius: 9999, borderWidth: 1.5, borderStyle: 'dashed', borderColor: chart[0] }} />
            </View>
            <Text variant="label-sm" tone="muted">{shortMonth(nextMonth(last))}</Text>
          </View>
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', gap: 16 }}>
        {[{ c: chart[0], t: 'In ↗' }, { c: chart[2], t: 'Out ↘' }].map((k) => (
          <View key={k.t} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 10, height: 10, borderRadius: 9999, backgroundColor: k.c }} />
            <Text variant="label-sm" weight={400} tone="muted">{k.t}</Text>
          </View>
        ))}
        {projected ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 10, height: 10, borderRadius: 9999, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.primary }} />
            <Text variant="label-sm" weight={400} tone="muted">Projected</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}
