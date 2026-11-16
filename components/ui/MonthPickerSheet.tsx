import { Pressable, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { colors } from '@/theme/tokens';
import { Sheet } from './Sheet';
import { Text } from './Text';

export interface MonthPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  /** First day of the selected month. */
  value: Date;
  onChange: (firstOfMonth: Date) => void;
  /** How many months back to offer (default 12). */
  count?: number;
}

/** Month list for the month pill (cashflow, analysis): current month first. */
export function MonthPickerSheet({ visible, onClose, value, onChange, count = 12 }: MonthPickerSheetProps) {
  const now = new Date();
  const months = Array.from({ length: count }, (_, i) => new Date(now.getFullYear(), now.getMonth() - i, 1));
  return (
    <Sheet visible={visible} onClose={onClose} title="Choose month" scroll>
      <View>
        {months.map((m) => {
          const selected = m.getFullYear() === value.getFullYear() && m.getMonth() === value.getMonth();
          return (
            <Pressable
              key={m.toISOString()}
              onPress={() => { onChange(m); onClose(); }}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 52, opacity: pressed ? 0.7 : 1 })}
            >
              <Text variant="body-lg" weight={selected ? 600 : 400}>{m.toLocaleDateString('en-MY', { month: 'long', year: 'numeric' })}</Text>
              {selected ? <Check size={18} color={colors['on-surface']} strokeWidth={2} /> : null}
            </Pressable>
          );
        })}
      </View>
    </Sheet>
  );
}
