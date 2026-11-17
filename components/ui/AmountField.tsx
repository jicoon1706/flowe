import { forwardRef } from 'react';
import { TextInput as RNTextInput, View, type ViewStyle } from 'react-native';
import { colors, familyForWeight, radius, type } from '@/theme/tokens';
import { InlineError } from './InlineError';
import { Text } from './Text';

export type AmountFieldLook = 'hero' | 'tile' | 'pill';

export interface AmountFieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  error?: string | null;
  placeholder?: string;
  /**
   * 'hero' (default): big figure on white, "RM" small (tabung/new/form "Target").
   * 'tile': 32 dp figure in a #F5F5F5 tile, radius 20 (settings/budget limits).
   * 'pill': 52 dp #F5F5F5 pill with 16 dp text, like the text fields beside it
   * (onboarding "Starting balance").
   */
  look?: AmountFieldLook;
}

const LOOK: Record<AmountFieldLook, { figure: number; currency: number; weight: 400 | 500; box: ViewStyle }> = {
  hero: { figure: type['numeric-lg'].size, currency: 24, weight: 500, box: {} },
  tile: { figure: 32, currency: 13, weight: 500, box: { backgroundColor: colors['surface-container'], borderRadius: radius.md, paddingVertical: 16, paddingHorizontal: 20 } },
  pill: { figure: 16, currency: 16, weight: 400, box: { backgroundColor: colors['surface-container'], borderRadius: radius.full, minHeight: 52, paddingHorizontal: 16, alignItems: 'center' } },
};

/** Keyboard amount field: "RM" plus a tabular figure, in one of the canvas' three looks. */
export const AmountField = forwardRef<RNTextInput, AmountFieldProps>(function AmountField({ label, value, onChangeText, error, placeholder = '0.00', look = 'hero' }, ref) {
  const l = LOOK[look];
  const tracking = look === 'pill' ? 0 : type['numeric-lg'].trackingEm * l.figure;
  return (
    <View style={{ gap: 8 }}>
      <Text variant="label-sm" tone="muted">{label}</Text>
      <View
        style={[
          { flexDirection: 'row', alignItems: 'baseline', gap: look === 'pill' ? 4 : 6, borderColor: colors.secondary },
          l.box,
          // Error outline: underline on the hero figure, full outline on tiles and pills.
          look === 'hero' ? { borderBottomWidth: error ? 1.5 : 0 } : { borderWidth: error ? 1.5 : 0 },
        ]}
      >
        <Text variant="body-lg" weight={l.weight} size={l.currency}>RM</Text>
        <RNTextInput
          ref={ref}
          value={value}
          onChangeText={(t) => onChangeText(t.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1').replace(/^(\d*\.\d{0,2}).*$/, '$1'))}
          keyboardType="decimal-pad"
          placeholder={placeholder}
          placeholderTextColor={colors['on-surface-variant']}
          accessibilityLabel={label}
          style={{ flex: 1, fontFamily: familyForWeight[l.weight], fontSize: l.figure, letterSpacing: tracking, color: colors['on-surface'], padding: 0, fontVariant: ['tabular-nums'] }}
        />
      </View>
      {error ? <InlineError message={error} /> : null}
    </View>
  );
});
