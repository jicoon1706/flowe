import { View } from 'react-native';
import { CircleAlert } from 'lucide-react-native';
import { colors, radius } from '@/theme/tokens';
import { Text } from './Text';

export interface InlineErrorProps {
  message: string;
  /** 'gradient' = glass chip on the hero; 'surface' = grey chip on white. */
  on?: 'gradient' | 'surface';
  testID?: string;
}

/**
 * Validation shown next to the field it is about (section K). Never red: an
 * alert icon, a message and, on the field, a black outline.
 */
export function InlineError({ message, on = 'surface', testID }: InlineErrorProps) {
  const glass = on === 'gradient';
  return (
    <View
      testID={testID}
      accessible
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      accessibilityLabel={message}
      style={{
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: radius.full,
        backgroundColor: glass ? colors.glass : colors['surface-container-high'],
      }}
    >
      <CircleAlert size={14} color={glass ? colors['on-primary'] : colors['on-surface']} strokeWidth={2} />
      <Text variant="label-sm" tone={glass ? 'inverse' : 'default'}>{message}</Text>
    </View>
  );
}
