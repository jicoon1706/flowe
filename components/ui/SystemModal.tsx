import { Modal, type ModalProps } from 'react-native';
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
 * - The nested SafeAreaProvider measures the insets of the modal's own window, so
 *   `useSafeAreaInsets()` below it is right for that window: it reports the nav bar
 *   only when the modal actually draws under it. Inset padding is then applied once.
 *   Call `useSafeAreaInsets()` in a component rendered inside SystemModal, not in
 *   the component that renders it; that one still reads the screen's provider.
 */
export function SystemModal({ children, ...props }: SystemModalProps) {
  return (
    <Modal {...props} statusBarTranslucent navigationBarTranslucent>
      <SafeAreaProvider>{children}</SafeAreaProvider>
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
