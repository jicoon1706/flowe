import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Text } from './Text';

/** Group label (label-sm muted) over a column of rows. No card, no borders. */
export function SettingsGroup({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <View>
      {title ? <Text variant="label-sm" tone="muted" style={{ paddingHorizontal: 4, paddingBottom: 8 }} accessibilityRole="header">{title}</Text> : null}
      <View style={{ gap: 4 }}>{children}</View>
    </View>
  );
}
