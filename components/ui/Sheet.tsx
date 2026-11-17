import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius } from '@/theme/tokens';
import { TABLET_SHEET_MAX_HEIGHT, TABLET_WIDTH, useBreakpoint } from '@/src/hooks/useBreakpoint';
import { Text } from './Text';

export interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** Scrollable body for long forms. */
  scroll?: boolean;
  /** Max height as a share of the screen (default 0.9). */
  maxHeightRatio?: number;
  /** Disable scrim-tap / back-button close while something runs. */
  dismissible?: boolean;
  /** Override the default sheet test id. */
  testID?: string;
  /** Tablet only: max sheet width in dp (default 560). Phones always span the screen. */
  tabletMaxWidth?: number;
}

/**
 * White bottom sheet: 32 px top radius, grabber, 45% ink scrim, 12/24/24 padding.
 * No shadow — separation comes from the scrim and the colour jump.
 */
export function Sheet({ visible, onClose, title, children, scroll, maxHeightRatio = 0.9, dismissible = true, testID, tabletMaxWidth = TABLET_WIDTH.sheet }: SheetProps) {
  const insets = useSafeAreaInsets();
  const { isTablet } = useBreakpoint();
  // Tablet: still bottom-anchored, but centred, width-capped and at most 85% tall.
  const heightRatio = isTablet ? Math.min(maxHeightRatio, TABLET_SHEET_MAX_HEIGHT) : maxHeightRatio;
  const close = () => { if (dismissible) onClose(); };
  const Body = scroll ? ScrollView : View;
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={close} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Animated.View entering={FadeIn.duration(160)} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.scrim }}>
          <Pressable style={{ flex: 1 }} onPress={close} accessibilityRole="button" accessibilityLabel="Close sheet" />
        </Animated.View>
        <Animated.View
          entering={SlideInDown.duration(240)}
          testID={testID ?? 'sheet'}
          accessibilityViewIsModal
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: radius.lg,
            borderTopRightRadius: radius.lg,
            paddingTop: 12,
            paddingHorizontal: 24,
            paddingBottom: Math.max(24, insets.bottom + 12),
            maxHeight: `${Math.round(heightRatio * 100)}%`,
            ...(isTablet ? { width: '100%', maxWidth: tabletMaxWidth, alignSelf: 'center' } as const : null),
          }}
        >
          <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 9999, backgroundColor: colors['surface-container-high'], marginBottom: 16 }} />
          {title ? (
            <Text variant="headline-md" accessibilityRole="header" style={{ marginBottom: 16 }}>{title}</Text>
          ) : null}
          <Body {...(scroll ? { keyboardShouldPersistTaps: 'handled' as const, showsVerticalScrollIndicator: false } : {})}>
            {children}
          </Body>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
