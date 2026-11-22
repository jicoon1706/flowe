import { forwardRef, useState, type ReactNode } from 'react';
import { TextInput as RNTextInput, View, type TextInputProps as RNTextInputProps } from 'react-native';
import { colors, familyForWeight } from '@/theme/tokens';
import { InlineError } from './InlineError';
import { Text } from './Text';

export interface TextInputProps extends Omit<RNTextInputProps, 'style'> {
  label?: string;
  error?: string | null;
  /** Multi-line note field (rounded rect instead of a pill). */
  area?: boolean;
  /** Trailing element inside the pill (e.g. "RM" or a unit). */
  prefix?: string;
  /** After the value inside the pill ("g", "/ g", "%"). */
  suffix?: string;
  /** Right of the label ("Price as of 15 Nov 2026", "Edited"). */
  labelAside?: ReactNode;
  /** Black outline without an error (a changed field, n-tabung-edit-dirty). */
  highlight?: boolean;
}

/** #F5F5F5 pill, 52 tall, label above in label-sm muted. Error: black outline + chip. */
export const TextInput = forwardRef<RNTextInput, TextInputProps>(function TextInput(
  { label, error, area, prefix, suffix, labelAside, highlight, onFocus, onBlur, ...rest },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const outline = error || highlight ? colors.secondary : focused ? colors['on-surface-variant'] : 'transparent';
  return (
    <View style={{ gap: 8 }}>
      {label && labelAside ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <Text variant="label-sm" tone="muted">{label}</Text>
          {typeof labelAside === 'string' ? <Text variant="label-sm" tone="muted">{labelAside}</Text> : labelAside}
        </View>
      ) : label ? <Text variant="label-sm" tone="muted">{label}</Text> : null}
      <View
        style={{
          flexDirection: 'row',
          alignItems: area ? 'flex-start' : 'center',
          minHeight: area ? 112 : 52,
          borderRadius: area ? 20 : 9999,
          backgroundColor: colors['surface-container'],
          paddingHorizontal: 20,
          paddingVertical: area ? 14 : 0,
          borderWidth: 1.5,
          borderColor: outline,
          gap: 6,
        }}
      >
        {prefix ? <Text variant="body-lg" tone="muted">{prefix}</Text> : null}
        <RNTextInput
          ref={ref}
          accessibilityLabel={label}
          placeholderTextColor={colors['on-surface-variant-aa']}
          multiline={area}
          textAlignVertical={area ? 'top' : 'center'}
          onFocus={(e) => { setFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); onBlur?.(e); }}
          style={{ flex: 1, fontFamily: familyForWeight[400], fontSize: 16, color: colors['on-surface'], minHeight: area ? 84 : 48, padding: 0 }}
          {...rest}
        />
        {suffix ? <Text variant="body-lg" tone="muted">{suffix}</Text> : null}
      </View>
      {error ? <InlineError message={error} /> : null}
    </View>
  );
});
