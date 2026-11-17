import { useState } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { Image as ImageIcon } from 'lucide-react-native';
import { colors } from '@/theme/tokens';
import { PHOTOS, type PhotoKey } from '@/constants/photos';
import { GradientFill } from './GradientFill';
import { Text } from './Text';

export interface PhotoSlotProps {
  photo: PhotoKey;
  style?: StyleProp<ViewStyle>;
  /** Draw the credit line over the image (caption, 80% white). */
  showCredit?: boolean;
}

/**
 * An Unsplash photo with attribution. Falls back to the brand gradient when
 * the slot has no URL or the image fails to load.
 */
export function PhotoSlot({ photo, style, showCredit = true }: PhotoSlotProps) {
  const spec = PHOTOS[photo];
  const [failed, setFailed] = useState(false);
  const label = `${spec.alt}. Photo by ${spec.credit} on Unsplash`;
  return (
    <View style={[{ overflow: 'hidden' }, style]} accessible accessibilityRole="image" accessibilityLabel={label}>
      <GradientFill />
      {spec.uri && !failed ? (
        <Image source={{ uri: spec.uri }} onError={() => setFailed(true)} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} contentFit="cover" cachePolicy="memory-disk" />
      ) : null}
      {showCredit ? (
        <View style={{ position: 'absolute', left: 12, bottom: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <ImageIcon size={14} color={colors['on-primary-soft']} strokeWidth={1.75} />
          <Text variant="caption" tone="soft">Photo by {spec.credit} on Unsplash</Text>
        </View>
      ) : null}
    </View>
  );
}
