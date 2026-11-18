import { View } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { colors, radius } from '@/theme/tokens';
import { CLASS_LABEL, PATTERNS, type FinancialClass } from '@/src/lib/cashflow';
import { Text } from '../ui/Text';

/** Three cash flow patterns (m-cashflow-pattern); yours gets the black outline + "You" pill. Read-only. */
export function CashFlowPatternDiagram({ current }: { current: FinancialClass }) {
  return (
    <View style={{ gap: 10 }}>
      {PATTERNS.map((p) => {
        const you = p.key === current;
        return (
          <View
            key={p.key}
            accessible
            accessibilityLabel={`${CLASS_LABEL[p.key]}${you ? ', your pattern' : ''}: ${p.steps.join(' to ')}. ${p.body}`}
            style={{ borderRadius: radius.md, backgroundColor: colors['surface-container'], borderWidth: 2, borderColor: you ? colors.secondary : 'transparent', padding: 14, gap: 8 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text variant="label-lg">{CLASS_LABEL[p.key]}</Text>
              {you ? (
                <View style={{ height: 28, paddingHorizontal: 10, borderRadius: 9999, backgroundColor: colors.secondary, justifyContent: 'center' }}>
                  <Text variant="label-sm" weight={600} tone="inherit" style={{ color: colors['on-secondary'] }}>You</Text>
                </View>
              ) : null}
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {p.steps.map((s, i) => (
                <View key={s} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, height: 28, paddingHorizontal: 10, borderRadius: 9999, backgroundColor: colors.surface }}>
                  <Text variant="label-sm">{s}</Text>
                  {i < p.steps.length - 1 ? <ArrowRight size={14} color={colors['on-surface']} strokeWidth={1.75} /> : null}
                </View>
              ))}
            </View>
            <Text variant="label-sm" weight={400} tone="meta">{p.body}</Text>
          </View>
        );
      })}
    </View>
  );
}
