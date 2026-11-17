import type { ReactElement, ReactNode } from 'react';
import { ScrollView, View, type RefreshControlProps } from 'react-native';
import { colors, radius } from '@/theme/tokens';
import { TABLET_LAYOUT, TABLET_WIDTH, useBreakpoint, type ContentWidth, type TabletLayout } from '@/src/hooks/useBreakpoint';
import { useFocusStatusBar } from '@/src/hooks/useFocusStatusBar';
import { GradientFill } from './GradientFill';
import { Hero } from './Hero';

export interface HeroScreenProps {
  /** Content of the gradient field. */
  hero: ReactNode;
  heroHeight?: number;
  /** How far the white sheet rides up over the hero (canvas: 24). 0 = no sheet edge. */
  overlap?: number;
  children?: ReactNode;
  /** Leaves room for the floating nav (120) or a bottom bar. */
  bottomPadding?: number;
  refreshControl?: ReactElement<RefreshControlProps>;
  /** Sheet padding (canvas: 20 16). */
  sheetPadding?: { top?: number; horizontal?: number };
  /** Rendered after the scroll view (fixed bottom bars, sheets). */
  overlay?: ReactNode;
  heroDimmed?: boolean;
  scrollEnabled?: boolean;
  testID?: string;
  /** Tablet column: 'dashboard' (≈960 dp, default) or 'form' (≈640 dp). Ignored on phones. */
  contentWidth?: ContentWidth;
  /** Tablet: centre the hero content in the column too (default). Off for full-bleed hero art. */
  heroColumn?: boolean;
  /**
   * Tablet screen family (see TabletLayout). Defaults to 'card' for
   * contentWidth 'dashboard' and 'panel' for 'form'.
   */
  tabletLayout?: TabletLayout;
}

/**
 * The standard screen: a gradient hero holding one key metric, and a white
 * working sheet (32 px top radius) that overlaps its bottom edge. Scrolls as one.
 */
export function HeroScreen({
  hero, heroHeight, overlap = 24, children, bottomPadding = 120, refreshControl, sheetPadding, overlay, heroDimmed, scrollEnabled = true, testID, contentWidth = 'dashboard', heroColumn = true, tabletLayout,
}: HeroScreenProps) {
  const { isTablet, width } = useBreakpoint();
  const padX = sheetPadding?.horizontal ?? 16;
  const layout = tabletLayout ?? (contentWidth === 'dashboard' ? 'card' : 'panel');
  // Tablet 'card' screens are white above the inset hero: dark status-bar icons.
  useFocusStatusBar('dark', isTablet && layout === 'card');
  if (isTablet) {
    return layout === 'card' ? (
      // t-* MAIN layout: inset gradient card, content below across the screen (two columns where the screen asks).
      <View style={{ flex: 1, backgroundColor: colors.surface }} testID={testID}>
        <ScrollView refreshControl={refreshControl} scrollEnabled={scrollEnabled} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, paddingBottom: bottomPadding }}>
          <Hero tablet="card" height={heroHeight} dimmed={heroDimmed} contentMaxWidth={heroColumn ? TABLET_LAYOUT.cardHeroColumn : undefined}>{hero}</Hero>
          <View style={{ paddingTop: (sheetPadding?.top ?? 20) - 4, paddingHorizontal: Math.max(TABLET_LAYOUT.cardPadding, (width - TABLET_WIDTH.dashboard) / 2 + TABLET_LAYOUT.cardPadding), gap: 16, flexGrow: 1 }}>
            {children}
          </View>
        </ScrollView>
        {overlay}
      </View>
    ) : (
      // t-* DETAIL layout: blue page, hero content and the inset white card share a 640 dp column.
      <View style={{ flex: 1 }} testID={testID}>
        <GradientFill />
        <ScrollView refreshControl={refreshControl} scrollEnabled={scrollEnabled} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, paddingBottom: TABLET_LAYOUT.inset }}>
          <Hero tablet="clear" height={heroHeight} dimmed={heroDimmed} contentMaxWidth={heroColumn ? TABLET_LAYOUT.panelColumn : undefined}>{hero}</Hero>
          <View
            style={{
              marginTop: 8,
              marginHorizontal: TABLET_LAYOUT.inset,
              backgroundColor: colors.surface,
              borderRadius: radius.lg,
              paddingTop: (sheetPadding?.top ?? 20) + 4,
              paddingBottom: Math.max(24, bottomPadding - 8),
              paddingHorizontal: Math.max(padX, (width - 2 * TABLET_LAYOUT.inset - TABLET_LAYOUT.panelColumn) / 2),
              gap: 16,
              flexGrow: 1,
            }}
          >
            {children}
          </View>
        </ScrollView>
        {overlay}
      </View>
    );
  }
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }} testID={testID}>
      <ScrollView
        refreshControl={refreshControl}
        scrollEnabled={scrollEnabled}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: bottomPadding }}
      >
        <Hero height={heroHeight} dimmed={heroDimmed} style={{ paddingBottom: overlap }}>{hero}</Hero>
        <View
          style={{
            marginTop: -overlap,
            backgroundColor: overlap > 0 ? colors.surface : 'transparent',
            borderTopLeftRadius: overlap > 0 ? radius.lg : 0,
            borderTopRightRadius: overlap > 0 ? radius.lg : 0,
            paddingTop: sheetPadding?.top ?? 20,
            paddingHorizontal: padX,
            gap: 16,
            flexGrow: 1,
          }}
        >
          {children}
        </View>
      </ScrollView>
      {overlay}
    </View>
  );
}
