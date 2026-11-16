import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from './Text';

export interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Custom trailing element instead of a text action. */
  right?: ReactNode;
}

/** headline-md title on the left, muted "View All" on the right. */
export function SectionHeader({ title, actionLabel = 'View All', onAction, right }: SectionHeaderProps) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 }}>
      <Text variant="headline-md" accessibilityRole="header">{title}</Text>
      {right ?? (onAction ? (
        <Pressable onPress={onAction} accessibilityRole="link" hitSlop={8} style={{ paddingVertical: 12, paddingLeft: 12 }}>
          <Text variant="body-md" tone="muted">{actionLabel}</Text>
        </Pressable>
      ) : null)}
    </View>
  );
}
