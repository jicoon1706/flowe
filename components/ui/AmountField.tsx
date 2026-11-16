import { forwardRef } from 'react';
import { TextInput as RNTextInput, View } from 'react-native';
import { colors, familyForWeight, type } from '@/theme/tokens';
import { InlineError } from './InlineError';
import { Text } from './Text';

export interface AmountFieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  error?: string | null;
  placeholder?: string;
}

/**
 * Keyboard amount in numeric-lg ("Starting balance", "Target"): "RM" small,
 * figure large, tabular. Used where the canvas shows a big typed amount on white.
 */
export const AmountField = forwardRef<RNTextInput, AmountFieldProps>(function AmountField({ label, value, onChangeText, error, placeholder = '0.00' }, ref) {
  const spec = type['numeric-lg'];
  return (
    <View style={{ gap: 8 }}>
      <Text variant="label-sm" tone="muted">{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, borderBottomWidth: error ? 1.5 : 0, borderColor: colors.secondary }}>
        <Text variant="body-lg" weight={500} size={24}>RM</Text>
        <RNTextInput
          ref={ref}
          value={value}
          onChangeText={(t) => onChangeText(t.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1').replace(/^(\d*\.\d{0,2}).*$/, '$1'))}
          keyboardType="decimal-pad"
          placeholder={placeholder}
          placeholderTextColor={colors['on-surface-variant']}
          accessibilityLabel={label}
          style={{ flex: 1, fontFamily: familyForWeight[500], fontSize: spec.size, letterSpacing: spec.trackingEm * spec.size, color: colors['on-surface'], padding: 0, fontVariant: ['tabular-nums'] }}
        />
      </View>
      {error ? <InlineError message={error} /> : null}
    </View>
  );
});
