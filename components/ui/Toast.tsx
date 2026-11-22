import { Pressable, View } from 'react-native';
import { Check, CircleAlert } from 'lucide-react-native';
import { colors, radius } from '@/theme/tokens';
import { Text } from './Text';

export type ToastKind = 'success' | 'failure';

export interface ToastAction {
  label: string;
  onPress: () => void;
}

export interface ToastProps {
  kind: ToastKind;
  message: string;
  action?: ToastAction;
  /** Tapping the body dismisses it (failures stay until then). */
  onDismiss?: () => void;
}

/** #EFEFEF pill, 52 tall, white icon well; optional underlined action (Undo, Retry, Open). */
export function Toast({ kind, message, action, onDismiss }: ToastProps) {
  const Icon = kind === 'success' ? Check : CircleAlert;
  return (
    <View
      accessibilityRole={kind === 'failure' ? 'alert' : 'text'}
      accessibilityLiveRegion={kind === 'failure' ? 'assertive' : 'polite'}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        minHeight: 52,
        paddingVertical: 4,
        paddingLeft: 8,
        paddingRight: action ? 6 : 18,
        borderRadius: radius.full,
        backgroundColor: colors['surface-container-high'],
        alignSelf: 'center',
        maxWidth: '100%',
      }}
    >
      <Pressable
        onPress={onDismiss}
        accessibilityRole="button"
        accessibilityLabel={`${message}. Dismiss`}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 }}
      >
        <View style={{ width: 36, height: 36, borderRadius: radius.full, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={18} color={colors['on-surface']} strokeWidth={2} />
        </View>
        <Text variant="body-md" weight={500} style={{ flexShrink: 1 }} accessibilityRole={kind === 'failure' ? 'alert' : undefined}>{message}</Text>
      </Pressable>
      {action ? (
        <Pressable onPress={action.onPress} accessibilityRole="button" accessibilityLabel={action.label} style={{ height: 44, paddingHorizontal: 12, justifyContent: 'center' }}>
          <Text variant="body-md" weight={600} style={{ textDecorationLine: 'underline' }}>{action.label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
