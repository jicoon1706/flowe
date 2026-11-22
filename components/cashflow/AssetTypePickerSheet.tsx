import { View } from 'react-native';
import { colors, radius } from '@/theme/tokens';
import { ASSET_TYPES } from '@/constants/balanceSheetTypes';
import type { AssetType } from '@/src/types';
import { Button } from '../ui/Button';
import { Pressable } from '../ui/Pressable';
import { Sheet } from '../ui/Sheet';
import { Text } from '../ui/Text';
import { SheetHeader } from './AssetFormParts';

/** mn-asset-type-picker / t-mn-asset-type-picker: "What are you adding?", two columns; KWSP / EPF carries "New". */
export function AssetTypePickerSheet({ visible, onClose, onPick }: { visible: boolean; onClose: () => void; onPick: (type: AssetType) => void }) {
  return (
    <Sheet visible={visible} onClose={onClose} scroll>
      <SheetHeader title="Add asset" onClose={onClose} />
      <Text variant="body-md" tone="muted" style={{ marginBottom: 10 }}>What are you adding?</Text>
      <View accessibilityRole="radiogroup" accessibilityLabel="Asset type" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {ASSET_TYPES.map((t) => (
          <Pressable
            key={t.value}
            accessibilityRole="button"
            accessibilityLabel={t.label}
            onPress={() => onPick(t.value)}
            style={({ pressed }) => ({
              width: '48.8%', height: 56, borderRadius: radius.md, backgroundColor: pressed ? colors['surface-container-high'] : colors['surface-container'],
              flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 8, paddingRight: 12,
            })}
          >
            <View style={{ width: 40, height: 40, borderRadius: 9999, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
              <t.icon size={20} color={colors['on-surface']} strokeWidth={1.75} />
            </View>
            <Text variant="label-lg" weight={500} numberOfLines={1} style={{ flex: 1 }}>{t.label}</Text>
            {t.value === 'kwsp' ? (
              <View style={{ height: 22, paddingHorizontal: 8, borderRadius: 9999, backgroundColor: colors.secondary, justifyContent: 'center' }}>
                <Text variant="caption" weight={600} tone="inverse">New</Text>
              </View>
            ) : null}
          </Pressable>
        ))}
      </View>
      <Button label="Pick a type to continue" disabled onPress={() => undefined} style={{ marginTop: 16 }} />
    </Sheet>
  );
}
