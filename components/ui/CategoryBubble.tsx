import { Pressable, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import type { LucideIcon } from 'lucide-react-native';
import { colors } from '@/theme/tokens';
import { Text } from './Text';

export interface CategoryBubbleProps {
  label: string;
  /** 0..1 share of spend; drives the bright arc. */
  share: number;
  icon: LucideIcon;
  size: number;
  onPress?: () => void;
  /** Dashed ghost disc for the empty state. */
  ghost?: boolean;
}

/** Translucent glass disc sized by share, brighter arc = %, icon + caption + percentage. */
export function CategoryBubble({ label, share, icon: Icon, size, onPress, ghost }: CategoryBubbleProps) {
  const stroke = 3;
  const r = size / 2 - stroke;
  const c = 2 * Math.PI * r;
  const pct = Math.round(Math.max(0, Math.min(1, share)) * 1000) / 10;
  const content = (
    <View style={{ width: size, height: size, borderRadius: 9999, backgroundColor: ghost ? 'transparent' : colors.glass, alignItems: 'center', justifyContent: 'center', gap: 4 }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        {ghost ? (
          <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors['on-primary-muted']} strokeWidth={1.5} strokeDasharray="6 6" fill="none" />
        ) : (
          <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors['on-primary']} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={`${(c * pct) / 100} ${c}`} />
        )}
      </Svg>
      {ghost ? null : (
        <>
          <Icon size={size >= 110 ? 18 : 14} color={colors['on-primary']} strokeWidth={1.75} />
          {size >= 84 ? <Text variant="caption" tone="inverse" numberOfLines={1} style={{ paddingHorizontal: 8 }}>{label}</Text> : null}
          <Text variant="label-lg" size={size >= 110 ? 15 : 12} tone="inverse" tabular>{pct}%</Text>
        </>
      )}
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${label}, ${pct}% of spending`}>
      {content}
    </Pressable>
  );
}
