import { View, type ViewStyle } from 'react-native';
import { chart, colors } from '@/theme/tokens';
import type { SplitBarModel, SplitPart } from '@/src/lib/incomeSplitView';
import { Text } from '../ui/Text';

/** Fill per part: the chart's monochrome blues; Left over is grey with a hairline. */
export function partFill(part: SplitPart): ViewStyle {
  if (part === 'needs') return { backgroundColor: chart[0] };
  if (part === 'wants') return { backgroundColor: chart[1] };
  if (part === 'invest') return { backgroundColor: chart[2] };
  return { backgroundColor: colors['surface-container-high'], borderWidth: 1, borderColor: colors['on-surface-variant'] + '55' };
}

/**
 * The 100% stacked bar (mo-cashflow-card 14 dp, mo-split 18 dp, history strip 8 dp); overspent adds
 * the "Income 100%" line, labelled except on the 8 dp mini bar.
 */
export function SplitBar({ model, height }: { model: SplitBarModel; height: 8 | 14 | 18 }) {
  const mini = height === 8;
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={model.label} style={{ position: 'relative' }}>
      <View style={{ flexDirection: 'row', gap: 3, borderRadius: 9999, overflow: 'hidden' }}>
        {model.segments.map((s) => <View key={s.part} style={{ width: `${s.width}%`, height, ...partFill(s.part) }} />)}
      </View>
      {model.incomeAt !== null ? (
        <>
          <View style={{ position: 'absolute', left: `${model.incomeAt}%`, top: mini ? -3 : -5, bottom: mini ? -3 : -5, width: 2, backgroundColor: colors.secondary }} />
          {mini ? null : (
            <View style={{ position: 'absolute', left: `${model.incomeAt}%`, top: -24, transform: [{ translateX: -36 }], width: 72, alignItems: 'center' }}>
              <View style={{ backgroundColor: colors.surface, borderRadius: 9999, paddingHorizontal: 6 }}>
                <Text variant="caption" weight={600}>Income 100%</Text>
              </View>
            </View>
          )}
        </>
      ) : null}
    </View>
  );
}

/** Swatch dot for legends, group cards and rows. */
export function PartDot({ part, size = 10 }: { part: SplitPart; size?: number }) {
  return <View style={{ width: size, height: size, borderRadius: 9999, ...partFill(part) }} />;
}
