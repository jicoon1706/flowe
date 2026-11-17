import { useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { Trash2, type LucideIcon } from 'lucide-react-native';
import { colors } from '@/theme/tokens';
import { TABLET_WIDTH } from '@/src/hooks/useBreakpoint';
import { Button } from './Button';
import { Sheet } from './Sheet';
import { Text } from './Text';

export interface ConfirmSheetProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  /** May be async; the confirm button shows its loading state until it settles. */
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  icon?: LucideIcon;
  cancelLabel?: string;
  /** Extra inputs between the copy and the buttons (PIN, typed RESET, return account). */
  children?: ReactNode;
  confirmDisabled?: boolean;
  loadingLabel?: string;
}

/**
 * Destructive confirmation (section J): 64 px icon well, headline, one sentence
 * saying exactly what happens, black confirm, plain Cancel. Never red.
 */
export function ConfirmSheet({
  visible, title, message, confirmLabel, onConfirm, onCancel, icon: Icon = Trash2, cancelLabel = 'Cancel', children, confirmDisabled, loadingLabel,
}: ConfirmSheetProps) {
  const [busy, setBusy] = useState(false);
  const confirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };
  return (
    <Sheet visible={visible} onClose={onCancel} dismissible={!busy} testID="confirm-sheet" tabletMaxWidth={TABLET_WIDTH.dialog}>
      <View style={{ gap: 14 }}>
        <View style={{ width: 64, height: 64, borderRadius: 9999, backgroundColor: colors['surface-container'], alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={30} color={colors['on-surface']} strokeWidth={1.5} />
        </View>
        <Text variant="headline-md" accessibilityRole="header">{title}</Text>
        <Text variant="body-md" tone="muted">{message}</Text>
        {children}
        <View style={{ gap: 4, marginTop: 8 }}>
          <Button label={confirmLabel} onPress={confirm} loading={busy} loadingLabel={loadingLabel} disabled={confirmDisabled} fullWidth testID="confirm-sheet-confirm" />
          <Button label={cancelLabel} variant="text" onPress={onCancel} disabled={busy} style={{ alignSelf: 'center' }} testID="confirm-sheet-cancel" />
        </View>
      </View>
    </Sheet>
  );
}
