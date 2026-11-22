import type { ReactNode } from 'react';
import { View } from 'react-native';
import { X } from 'lucide-react-native';
import { colors, radius } from '@/theme/tokens';
import { assetTypeOption } from '@/constants/balanceSheetTypes';
import type { AssetType } from '@/src/types';
import { IconButton } from '../ui/IconButton';
import { Money } from '../ui/Money';
import { Pressable } from '../ui/Pressable';
import { Text } from '../ui/Text';

/** Sheet header of the K forms: title left, ✕ right (mn-gold-empty, t-mn-asset-type-picker). */
export function SheetHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
      <Text variant="headline-md" accessibilityRole="header">{title}</Text>
      <IconButton icon={X} variant="action" size={44} accessibilityLabel="Close" onPress={onClose} />
    </View>
  );
}

/** "Type  Gold  [Change]" pill row; Change goes back to the type picker. */
export function AssetTypeRow({ type, onChange }: { type: AssetType; onChange?: () => void }) {
  const opt = assetTypeOption(type);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, paddingLeft: 16, paddingRight: 4, borderRadius: 9999, backgroundColor: colors['surface-container'] }}>
      <Text variant="label-sm" tone="muted">Type</Text>
      <Text variant="label-lg" style={{ flex: 1 }}>{opt.label}</Text>
      {onChange ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Type: ${opt.label}. Change type`}
          onPress={onChange}
          style={({ pressed }) => ({ height: 44, paddingHorizontal: 14, borderRadius: 9999, backgroundColor: colors.surface, justifyContent: 'center', opacity: pressed ? 0.8 : 1 })}
        >
          <Text variant="body-md" weight={600}>Change</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** The live value box at the foot of the Gold / KWSP form (32 dp figure, grey while empty). */
export function ValuePreview({ label, aside, value, empty, children }: { label: string; aside?: string; value: number; empty: boolean; children?: ReactNode }) {
  return (
    <View accessibilityLiveRegion="polite" style={{ backgroundColor: colors['surface-container'], borderRadius: radius.md, paddingVertical: 14, paddingHorizontal: 16, gap: 6 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
        <Text variant="body-md" weight={600} size={13}>{label}</Text>
        {aside ? <Text variant="label-sm" weight={400} tone="muted" tabular>{aside}</Text> : null}
      </View>
      {empty ? (
        <Text variant="display-md" tone="muted" tabular>
          <Text variant="body-md" size={14} tone="muted">RM </Text>0.00
        </Text>
      ) : (
        <Money amount={value} variant="display-md" />
      )}
      {children}
    </View>
  );
}
