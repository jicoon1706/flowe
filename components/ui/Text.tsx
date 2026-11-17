import { Platform, Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';
import { colors, type, familyForWeight, type ColorToken, type FontWeight, type TypeToken } from '@/theme/tokens';

export type TextTone =
  | 'default' | 'muted' | 'meta' | 'inverse' | 'soft' | 'faint' | 'inherit';

const TONE: Record<Exclude<TextTone, 'inherit'>, ColorToken> = {
  default: 'on-surface',
  muted: 'on-surface-variant',
  meta: 'on-surface-variant-aa',
  inverse: 'on-primary',
  soft: 'on-primary-soft',
  faint: 'on-primary-muted',
};

export interface TextProps extends RNTextProps {
  variant?: TypeToken;
  weight?: FontWeight;
  tone?: TextTone;
  /** Tabular figures; on by default for numeric variants. */
  tabular?: boolean;
  align?: TextStyle['textAlign'];
  size?: number;
}

/**
 * Typography primitive. Inter in three weights (400/500/600), the DESIGN.md scale,
 * tabular figures on numbers. Use instead of react-native's Text everywhere.
 */
/**
 * Android clips glyphs that rise above the line box, so the tight display
 * line heights (numeric-lg 1.0, display-lg 1.1) cut the top off big figures.
 * Large text gets at least 1.2 there; iOS and the web keep the design values.
 */
export function lineHeightFor(ratio: number, fontSize: number, os: string = Platform.OS): number {
  return os === 'android' && fontSize >= 32 ? Math.max(ratio, 1.2) : ratio;
}

export function Text({ variant = 'body-md', weight, tone = 'default', tabular, align, size, style, ...rest }: TextProps) {
  const spec = type[variant];
  const w = weight ?? spec.weight;
  const fontSize = size ?? spec.size;
  const numeric = variant === 'numeric-lg';
  const base: TextStyle = {
    fontFamily: familyForWeight[w],
    fontSize,
    letterSpacing: spec.trackingEm * fontSize,
    lineHeight: Math.round(fontSize * lineHeightFor(spec.lineHeight, fontSize)),
    textAlign: align,
    fontVariant: tabular ?? numeric ? ['tabular-nums'] : undefined,
  };
  if (tone !== 'inherit') base.color = colors[TONE[tone]];
  return <RNText style={[base, style]} {...rest} />;
}
