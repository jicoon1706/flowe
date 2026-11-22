import { View } from 'react-native';
import { chart, colors, radius } from '@/theme/tokens';
import type { TabungMonth } from '@/src/lib/tabungProgress';
import { Money } from '../ui/Money';
import { Sheet } from '../ui/Sheet';
import { Text } from '../ui/Text';

export interface TabungBreakdownSheetProps {
  visible: boolean;
  onClose: () => void;
  name: string;
  months: TabungMonth[];
  target: number;
}

/** Month-by-month in / out and the running "toward goal", which only ever climbs. */
export function TabungBreakdownSheet({ visible, onClose, name, months, target }: TabungBreakdownSheetProps) {
  return (
    <Sheet visible={visible} onClose={onClose} title={`${name} by month`} scroll testID="tabung-breakdown">
      {months.length === 0 ? <Text variant="body-md" tone="muted">No top-ups or pay-outs yet.</Text> : null}
      {[...months].reverse().map((m) => {
        const [y, mm] = m.month.split('-').map(Number);
        const share = target > 0 ? Math.min(1, m.towardGoal / target) : 0;
        return (
          <View key={m.month} style={{ gap: 8, paddingVertical: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text variant="body-lg">{new Date(y, mm - 1, 1).toLocaleDateString('en-MY', { month: 'short', year: 'numeric' })}</Text>
              <Text variant="label-sm" tone="muted">Toward goal</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Money amount={m.toppedUp} direction="income" arrow variant="body-md" weight={500} />
                {m.paidOut ? <Money amount={m.paidOut} direction="expense" arrow variant="body-md" weight={500} /> : null}
              </View>
              <Money amount={m.towardGoal} weight={600} />
            </View>
            <View accessible accessibilityRole="progressbar" accessibilityLabel={`${Math.round(share * 1000) / 10}% of target`} style={{ height: 8, borderRadius: radius.full, backgroundColor: colors['surface-container-high'], overflow: 'hidden' }}>
              <View style={{ width: `${share * 100}%`, height: 8, borderRadius: radius.full, backgroundColor: chart[0] }} />
            </View>
          </View>
        );
      })}
    </Sheet>
  );
}
