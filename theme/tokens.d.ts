export type ColorToken =
  | 'primary' | 'on-primary' | 'primary-container' | 'on-primary-container'
  | 'secondary' | 'on-secondary' | 'tertiary' | 'on-tertiary'
  | 'surface' | 'on-surface' | 'surface-container' | 'surface-container-high'
  | 'on-surface-variant' | 'glass' | 'on-primary-muted' | 'outline'
  | 'on-surface-variant-aa' | 'on-primary-soft'
  | 'scrim' | 'glass-faint' | 'glass-soft' | 'surface-transparent';

export type TypeToken =
  | 'display-lg' | 'display-md' | 'headline-md' | 'body-lg' | 'body-md'
  | 'label-lg' | 'label-sm' | 'caption' | 'numeric-lg';

export type FontWeight = 400 | 500 | 600;

export interface TypeSpec {
  size: number;
  weight: FontWeight;
  trackingEm: number;
  lineHeight: number;
  fontFamily: string;
}

export const colors: Record<ColorToken, string>;
/** Gold gain / loss tag colours (not in `colors`, so not in the Android resources). */
export const status: Record<'gain-container' | 'on-gain' | 'loss-container' | 'on-loss', string>;
export const gradient: { from: string; to: string };
export const chart: readonly [string, string, string];
export const radius: Record<'sm' | 'md' | 'lg' | 'xl' | 'full', number>;
export const spacing: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl', number>;
export const type: Record<TypeToken, TypeSpec>;
export const fontFamily: { regular: string; medium: string; semibold: string };
export const familyForWeight: Record<FontWeight, string>;
