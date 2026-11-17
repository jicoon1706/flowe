import type { ReactElement, ReactNode } from 'react';
import { ScrollView, View, type RefreshControlProps } from 'react-native';
import { colors, radius } from '@/theme/tokens';
import { TABLET_WIDTH, useBreakpoint, type ContentWidth } from '@/src/hooks/useBreakpoint';
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
}

/**
 * The standard screen: a gradient hero holding one key metric, and a white
 * working sheet (32 px top radius) that overlaps its bottom edge. Scrolls as one.
 */
export function HeroScreen({
  hero, heroHeight, overlap = 24, children, bottomPadding = 120, refreshControl, sheetPadding, overlay, heroDimmed, scrollEnabled = true, testID, contentWidth = 'dashboard', heroColumn = true,
}: HeroScreenProps) {
  const { isTablet, width } = useBreakpoint();
  const maxWidth = TABLET_WIDTH[contentWidth];
  const padX = sheetPadding?.horizontal ?? 16;
  // Tablet: hero content and sheet content share one centred column; both surfaces stay full width.
  const sheetPadX = isTablet ? Math.max(padX, (width - maxWidth) / 2 + padX) : padX;
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }} testID={testID}>
      <ScrollView
        refreshControl={refreshControl}
        scrollEnabled={scrollEnabled}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: bottomPadding }}
      >
        <Hero height={heroHeight} dimmed={heroDimmed} style={{ paddingBottom: overlap }} contentMaxWidth={heroColumn ? maxWidth : undefined}>{hero}</Hero>
        <View
          style={{
            marginTop: -overlap,
            backgroundColor: overlap > 0 ? colors.surface : 'transparent',
            borderTopLeftRadius: overlap > 0 ? radius.lg : 0,
            borderTopRightRadius: overlap > 0 ? radius.lg : 0,
            paddingTop: sheetPadding?.top ?? 20,
            paddingHorizontal: sheetPadX,
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
