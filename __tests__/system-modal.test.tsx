import { Dimensions, Platform, StyleSheet } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Sheet } from '../components/ui/Sheet';
import { Text } from '../components/ui/Text';

// The screen's provider: what the screen behind the modal sees.
const screenMetrics = { frame: { x: 0, y: 0, width: 411, height: 731 }, insets: { top: 24, left: 0, right: 0, bottom: 24 } };

function renderSheet() {
  render(
    <SafeAreaProvider initialMetrics={screenMetrics}>
      <Sheet visible onClose={jest.fn()} title="Pay from" testID="test-sheet">
        <Text>body</Text>
      </Sheet>
    </SafeAreaProvider>,
  );
}

const flat = (testID: string) => StyleSheet.flatten(screen.getByTestId(testID).props.style);

describe('SystemModal / Sheet sizing', () => {
  const realOS = Platform.OS;
  afterEach(() => { Object.defineProperty(Platform, 'OS', { value: realOS, configurable: true }); });

  it('Android: the modal root is pinned to the full window, not left to the Modal host size', () => {
    Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
    renderSheet();
    const { width, height } = Dimensions.get('window');
    expect(flat('system-modal-root')).toMatchObject({ position: 'absolute', top: 0, left: 0, width, height });
  });

  it('iOS: the modal root keeps the default flex fill (presentation styles still work)', () => {
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
    renderSheet();
    const style = flat('system-modal-root');
    expect(style.height).toBeUndefined();
    expect(style.position).not.toBe('absolute');
  });

  it("pads the panel from the modal window's insets, 12 dp above the nav bar", () => {
    Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
    renderSheet();
    // First frame: inherits the screen's insets (no null frame, no remount).
    expect(flat('test-sheet').paddingBottom).toBe(24 + 12);
    // The modal's own provider then measures its window (here: 3-button nav, 48 dp).
    act(() => {
      fireEvent(screen.getByTestId('system-modal-root'), 'insetsChange', {
        nativeEvent: { frame: { x: 0, y: 0, width: 411, height: 731 }, insets: { top: 24, left: 0, right: 0, bottom: 48 } },
      });
    });
    expect(flat('test-sheet').paddingBottom).toBe(48 + 12);
  });

  it('keeps 24 dp at the bottom when the window has no bottom inset', () => {
    renderSheet();
    act(() => {
      fireEvent(screen.getByTestId('system-modal-root'), 'insetsChange', {
        nativeEvent: { frame: { x: 0, y: 0, width: 411, height: 731 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } },
      });
    });
    expect(flat('test-sheet').paddingBottom).toBe(24);
  });
});
