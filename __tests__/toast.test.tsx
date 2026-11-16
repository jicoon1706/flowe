import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Toast } from '../components/ui/Toast';
import { ToastProvider, toastDuration, useToast, type ToastInput } from '../components/ui/ToastProvider';

const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, left: 0, right: 0, bottom: 34 } };

function Trigger({ input }: { input: ToastInput }) {
  const toast = useToast();
  return (
    <Pressable onPress={() => toast.show(input)} accessibilityRole="button">
      <Text>show</Text>
    </Pressable>
  );
}

function renderWithProvider(input: ToastInput) {
  render(
    <SafeAreaProvider initialMetrics={metrics}>
      <ToastProvider>
        <Trigger input={input} />
      </ToastProvider>
    </SafeAreaProvider>,
  );
  fireEvent.press(screen.getByText('show'));
}

describe('Toast', () => {
  it('renders a success message with its action', () => {
    const onUndo = jest.fn();
    render(<Toast kind="success" message="Transaction deleted" action={{ label: 'Undo', onPress: onUndo }} />);
    expect(screen.getByText('Transaction deleted')).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('button', { name: 'Undo' }));
    expect(onUndo).toHaveBeenCalledTimes(1);
  });

  it('announces failures as alerts', () => {
    render(<Toast kind="failure" message="Save failed. Your entry is kept." />);
    expect(screen.getByRole('alert')).toBeOnTheScreen();
  });
});

describe('toastDuration', () => {
  it('uses 3 s for success, 5 s with an action, and keeps failures until dismissed', () => {
    expect(toastDuration({ kind: 'success', message: 'Saved' })).toBe(3000);
    expect(toastDuration({ kind: 'success', message: 'Deleted', action: { label: 'Undo', onPress: () => {} } })).toBe(5000);
    expect(toastDuration({ kind: 'failure', message: 'Delete failed' })).toBeNull();
    expect(toastDuration({ kind: 'failure', message: 'x', duration: 100 })).toBe(100);
  });
});

describe('ToastProvider', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('hides a success toast after 3 s', () => {
    renderWithProvider({ kind: 'success', message: 'PIN changed' });
    expect(screen.getByText('PIN changed')).toBeOnTheScreen();
    act(() => { jest.advanceTimersByTime(3100); });
    expect(screen.queryByText('PIN changed')).toBeNull();
  });

  it('keeps a failure toast until Retry, which re-runs the action and dismisses', () => {
    const retry = jest.fn();
    renderWithProvider({ kind: 'failure', message: 'Save failed. Your entry is kept.', action: { label: 'Retry', onPress: retry } });
    act(() => { jest.advanceTimersByTime(60_000); });
    expect(screen.getByText('Save failed. Your entry is kept.')).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('button', { name: 'Retry' }));
    expect(retry).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Save failed. Your entry is kept.')).toBeNull();
  });

  it('dismisses when the toast body is tapped', () => {
    renderWithProvider({ kind: 'failure', message: 'Delete failed' });
    fireEvent.press(screen.getByRole('button', { name: 'Delete failed. Dismiss' }));
    expect(screen.queryByText('Delete failed')).toBeNull();
  });
});
