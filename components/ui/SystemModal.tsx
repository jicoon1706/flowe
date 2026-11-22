import { Modal, Platform, useWindowDimensions, type ModalProps } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

export type SystemModalProps = Omit<ModalProps, 'statusBarTranslucent' | 'navigationBarTranslucent'>;

/**
 * The one way to open a React Native `<Modal>` in Flowe.
 *
 * - Android: the Modal is its own window. Both translucency props make that window
 *   draw under the status bar AND the navigation bar, so a scrim or sheet can reach
 *   the physical bottom edge. (RN 0.81 forces both on when the build has
 *   `edgeToEdgeEnabled`; setting them here keeps the window edge-to-edge even if it
 *   doesn't.)
 * - Android: the modal's JS root is NOT sized from that window on the first frames.
 *   RN 0.81.5 seeds it with `screen height − status bar` (ReactModalHostView
 *   `getScreenDisplayMetricsWithoutInsets`) and only corrects it after the dialog's
 *   first native layout reports back. Until then — and for good if that update is
 *   late — everything inside is a status bar short, which leaves an undrawn band
 *   above the gesture bar. So the content gets the window's size explicitly and no
 *   longer depends on that round trip (fixed upstream in RN PR #52835, not in 0.81).
 * - The nested SafeAreaProvider measures the insets of the modal's own window, so
 *   `useSafeAreaInsets()` below it is right for that window: it reports the nav bar
 *   only when the modal actually draws under it. Inset padding is then applied once.
 *   Call `useSafeAreaInsets()` in a component rendered inside SystemModal, not in
 *   the component that renders it; that one still reads the screen's provider.
 */
export function SystemModal({ children, ...props }: SystemModalProps) {
  const { width, height } = useWindowDimensions();
  // Edge-to-edge: the activity window (what `window` reports) is the dialog window.
  const fill = Platform.OS === 'android' ? { position: 'absolute' as const, top: 0, left: 0, width, height } : undefined;
  return (
    <Modal {...props} statusBarTranslucent navigationBarTranslucent>
      <SafeAreaProvider style={fill} testID="system-modal-root">{children}</SafeAreaProvider>
    </Modal>
  );
}

/**
 * Bottom padding for a surface that touches the bottom edge inside a SystemModal:
 * `gap` above the nav bar / home indicator, and never less than `min` when there is none.
 */
export function useModalBottomPadding(min = 24, gap = 12): number {
  return Math.max(min, useSafeAreaInsets().bottom + gap);
}
