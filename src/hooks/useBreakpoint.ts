import { useWindowDimensions } from 'react-native';

/**
 * Tablet layouts start when the window's SHORTER side reaches this (dp), so a
 * phone turned to landscape (e.g. 844 × 390) keeps the phone layout and a
 * tablet keeps the tablet layout in both orientations.
 */
export const TABLET_MIN_WIDTH = 600;

/**
 * Max widths (dp) for content on tablet. Phones never read these: every use is
 * gated on `isTablet`, so the phone layout is unchanged.
 */
export const TABLET_WIDTH = {
  /** Forms, PIN screens, onboarding, settings. */
  form: 640,
  /** Dashboards (home, cashflow, analysis, lists). */
  dashboard: 960,
  /** Bottom sheets. */
  sheet: 560,
  /** Confirmation dialogs and toasts. */
  dialog: 480,
  /** PIN pad, numpad screens (Add, Tabung money) and lock content: keys stay phone-sized. */
  keypad: 400,
  /** Floating nav pill and the detected-transaction island. */
  nav: 480,
} as const;

/**
 * The two tablet screen families on the canvas (Tablet page notes):
 * - 'card'  — white page; the gradient is an inset card (16 dp margin, 40 dp
 *   radius) whose content sits in a 560 dp column; content below in two
 *   columns (home, accounts, cashflow, calendar, learn, settings).
 * - 'panel' — blue page; hero content in a 640 dp column; the white working
 *   sheet is an inset card (16 dp margin, 32 dp radius) with the same column
 *   (detail screens, forms, settings sub-screens).
 */
export type TabletLayout = 'card' | 'panel';

export const TABLET_LAYOUT = {
  /** Margin around the inset hero card / white panel. */
  inset: 16,
  /** Hero content column inside the 'card' hero. */
  cardHeroColumn: 560,
  /** Content column of a 'panel' screen. */
  panelColumn: 640,
  /** Horizontal padding of the 'card' content area. */
  cardPadding: 24,
} as const;

/** Bottom sheets on tablet never cover more than this share of the screen height. */
export const TABLET_SHEET_MAX_HEIGHT = 0.85;

export type ContentWidth = 'form' | 'dashboard';

export interface Breakpoint {
  isTablet: boolean;
  width: number;
  /** Columns for card grids: 1 on phone, 2 on tablet. */
  columns: 1 | 2;
}

/** Pure breakpoint logic (tested in tests/breakpoint.test.ts). `height` defaults to `width`. */
export function breakpointFor(width: number, height: number = width): Breakpoint {
  const isTablet = Math.min(width, height) >= TABLET_MIN_WIDTH;
  return { isTablet, width, columns: isTablet ? 2 : 1 };
}

/**
 * Horizontal padding that keeps content within `maxWidth` on a `width`-wide
 * container, never less than `base` (the phone padding).
 */
export function centeredPadding(width: number, maxWidth: number, base: number): number {
  return Math.max(base, (width - maxWidth) / 2);
}

/** Width of one item in an n-column row with `gap` between items. */
export function columnWidth(containerWidth: number, columns: number, gap: number): number {
  if (columns <= 1) return containerWidth;
  return Math.floor((containerWidth - gap * (columns - 1)) / columns);
}

export function useBreakpoint(): Breakpoint {
  const { width, height } = useWindowDimensions();
  return breakpointFor(width, height);
}

/**
 * Horizontal padding for a full-width screen region: `base` on phones; on tablet,
 * enough to centre the content in a `maxWidth` column (default: the form width).
 */
export function useColumnPadding(base: number, maxWidth: number = TABLET_WIDTH.form): number {
  const { isTablet, width } = useBreakpoint();
  return isTablet ? centeredPadding(width, maxWidth, base) : base;
}
