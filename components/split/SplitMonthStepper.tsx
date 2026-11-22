import { View } from 'react-native';
import { ChevronDown, ChevronLeft, ChevronRight, History } from 'lucide-react-native';
import { colors } from '@/theme/tokens';
import { addMonths, monthName, stepState, type MonthBounds } from '@/src/lib/splitMonth';
import { GlassIconButton } from '../ui/GlassIconButton';
import { Pressable } from '../ui/Pressable';
import { Text } from '../ui/Text';

/**
 * Income split hero: ‹ November 2026 ⌄ ›. The middle pill opens the month
 * picker; › is off on the current month, ‹ on the first month with data.
 */
export function SplitMonthStepper({ month, bounds, onChange, onPick }: {
  month: Date;
  bounds: MonthBounds;
  onChange: (month: Date) => void;
  onPick: () => void;
}) {
  const { prev, next } = stepState(month, bounds);
  const before = addMonths(month, -1);
  const after = addMonths(month, 1);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <GlassIconButton icon={ChevronLeft} accessibilityLabel={`Previous month, ${monthName(before)}`} disabled={!prev} onPress={() => onChange(before)} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Month: ${monthName(month)}. Choose month`}
        onPress={onPick}
        style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, paddingLeft: 16, paddingRight: 14, borderRadius: 9999, backgroundColor: colors.glass, opacity: pressed ? 0.8 : 1 })}
      >
        <Text variant="body-md" weight={600} tone="inverse">{monthName(month)}</Text>
        <ChevronDown size={16} color={colors['on-primary']} strokeWidth={1.75} />
      </Pressable>
      <GlassIconButton icon={ChevronRight} accessibilityLabel={`Next month, ${monthName(after)}`} disabled={!next} onPress={() => onChange(after)} />
    </View>
  );
}

/** Past month: "Viewing August 2026 · Back to this month". */
export function SplitPastMonthChip({ month, onBack }: { month: Date; onBack: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Viewing ${monthName(month)}. Back to this month`}
      onPress={onBack}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 32, paddingHorizontal: 12, borderRadius: 9999, backgroundColor: colors.glass, opacity: pressed ? 0.8 : 1 })}
    >
      <History size={14} color={colors['on-primary']} strokeWidth={1.75} />
      <Text variant="label-sm" tone="inverse">Viewing {monthName(month)} · <Text variant="label-sm" weight={600} tone="inverse">Back to this month</Text></Text>
    </Pressable>
  );
}
