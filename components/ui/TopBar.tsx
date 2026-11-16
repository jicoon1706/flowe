import type { ReactNode } from 'react';
import { View } from 'react-native';
import { ArrowLeft, X } from 'lucide-react-native';
import { GlassIconButton } from './GlassIconButton';
import { Text } from './Text';

export interface TopBarProps {
  title?: string;
  onBack?: () => void;
  /** Close (×) instead of back (←), for modal-style screens. */
  close?: boolean;
  right?: ReactNode;
}

/** Row of glass controls at the top of a hero: back/close · title · action. */
export function TopBar({ title, onBack, close, right }: TopBarProps) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, minHeight: 44 }}>
      {onBack ? (
        <GlassIconButton icon={close ? X : ArrowLeft} onPress={onBack} accessibilityLabel={close ? 'Close' : 'Back'} />
      ) : (
        <View style={{ width: 44 }} />
      )}
      {title ? (
        <Text variant="body-lg" weight={500} tone="inverse" numberOfLines={1} style={{ flex: 1, textAlign: 'center', marginHorizontal: 8 }} accessibilityRole="header">
          {title}
        </Text>
      ) : (
        <View style={{ flex: 1 }} />
      )}
      {right ?? <View style={{ width: 44 }} />}
    </View>
  );
}
