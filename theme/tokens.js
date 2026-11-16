/**
 * Flowe design tokens — the one module every style in the app reads from.
 *
 * Generated from `design/tailwind.theme.json` (read-only source; never edit it)
 * plus the AA additions the v2 design rules require. CommonJS on purpose:
 * `tailwind.config.js` requires it, TypeScript imports it through
 * `tokens.d.ts`, and `scripts/generate-native-tokens.js` turns it into the
 * Android widget colours, so the three can never disagree.
 */
const source = require('../design/tailwind.theme.json').theme.extend;

/** AA overrides from the design rules. They win over DESIGN.md. */
const aa = {
  /** Meta text on #F5F5F5 / #EFEFEF fills (≥4.9:1). */
  'on-surface-variant-aa': '#666666',
  /** Small labels on the gradient (80% white). */
  'on-primary-soft': 'rgba(255,255,255,0.8)',
};

/**
 * Values the canvas uses that are compositions of the base palette rather than
 * new colours: the sheet scrim (ink at 45%), the stacked card silhouettes behind
 * the hero card (white at 10% / 13%), and transparent white for fades.
 */
const derived = {
  scrim: 'rgba(2,2,2,0.45)',
  'glass-faint': 'rgba(255,255,255,0.10)',
  'glass-soft': 'rgba(255,255,255,0.13)',
  'surface-transparent': 'rgba(255,255,255,0)',
};

const colors = { ...source.colors, ...aa, ...derived };

/** Vertical hero field, navy on top. The only gradient in the product. */
const gradient = { from: colors.primary, to: colors['primary-container'] };

/** Chart series: monochrome blues only (design rules). */
const chart = [colors.primary, colors['primary-container'], colors.outline];

const px = (v) => Number(String(v).replace('px', ''));

const radius = Object.fromEntries(
  Object.entries(source.borderRadius).map(([k, v]) => [k, k === 'full' ? 9999 : px(v)]),
);
const spacing = Object.fromEntries(Object.entries(source.spacing).map(([k, v]) => [k, px(v)]));

/** Inter faces as loaded by expo-font (assets/fonts). */
const fontFamily = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semibold: 'Inter-SemiBold',
};
const familyForWeight = { 400: fontFamily.regular, 500: fontFamily.medium, 600: fontFamily.semibold };

/** Type scale: size in px, weight, tracking in em, line height multiplier. */
const lineHeights = {
  'display-lg': 1.1, 'display-md': 1.15, 'headline-md': 1.3, 'body-lg': 1.4, 'body-md': 1.4,
  'label-lg': 1.2, 'label-sm': 1.3, caption: 1.3, 'numeric-lg': 1,
};
const type = Object.fromEntries(
  Object.entries(source.fontSize).map(([k, [size, opts]]) => {
    const weight = Number(opts.fontWeight);
    const trackingEm = opts.letterSpacing ? Number(String(opts.letterSpacing).replace('em', '')) : 0;
    return [k, { size: px(size), weight, trackingEm, lineHeight: lineHeights[k], fontFamily: familyForWeight[weight] }];
  }),
);

module.exports = { colors, gradient, chart, radius, spacing, type, fontFamily, familyForWeight, source };
