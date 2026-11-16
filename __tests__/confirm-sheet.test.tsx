import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ConfirmSheet } from '../components/ui/ConfirmSheet';

const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, left: 0, right: 0, bottom: 34 } };

function renderSheet(props: Partial<React.ComponentProps<typeof ConfirmSheet>> = {}) {
  const onConfirm = jest.fn();
  const onCancel = jest.fn();
  render(
    <SafeAreaProvider initialMetrics={metrics}>
      <ConfirmSheet
        visible
        title="Delete this transaction?"
        message="RM 12.50 at Tealive will be removed and Maybank Savings goes back up by RM 12.50."
        confirmLabel="Delete"
        onConfirm={onConfirm}
        onCancel={onCancel}
        {...props}
      />
    </SafeAreaProvider>,
  );
  return { onConfirm, onCancel };
}

describe('ConfirmSheet', () => {
  it('shows the title, the consequence and both actions', () => {
    renderSheet();
    expect(screen.getByText('Delete this transaction?')).toBeOnTheScreen();
    expect(screen.getByText(/goes back up by RM 12.50/)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeOnTheScreen();
  });

  it('calls onConfirm once and shows the loading label while it runs', async () => {
    let resolve!: () => void;
    const pending = new Promise<void>((r) => { resolve = r; });
    const onConfirm = jest.fn(() => pending);
    renderSheet({ onConfirm, loadingLabel: 'Deleting…' });
    fireEvent.press(screen.getByTestId('confirm-sheet-confirm'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Deleting…')).toBeOnTheScreen();
    // A second press while busy does nothing.
    fireEvent.press(screen.getByTestId('confirm-sheet-confirm'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    await act(async () => { resolve(); await pending; });
    await waitFor(() => expect(screen.getByText('Delete')).toBeOnTheScreen());
  });

  it('cancels without confirming', () => {
    const { onConfirm, onCancel } = renderSheet();
    fireEvent.press(screen.getByTestId('confirm-sheet-cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('keeps the confirm button inert when disabled (e.g. RESET not typed)', () => {
    const { onConfirm } = renderSheet({ confirmDisabled: true });
    fireEvent.press(screen.getByTestId('confirm-sheet-confirm'));
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('renders nothing when hidden', () => {
    renderSheet({ visible: false });
    expect(screen.queryByText('Delete this transaction?')).toBeNull();
  });
});
