import { Pressable, View } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { colors, radius } from '@/theme/tokens';
import { GradientFill } from '../ui/GradientFill';
import { Text } from '../ui/Text';

export interface AffirmationCardProps {
  text: string;
  /** Tap for the next one. */
  onNext?: () => void;
}

/** "Today's affirmation" — the one gradient card allowed on a white sheet. */
export function AffirmationCard({ text, onNext }: AffirmationCardProps) {
  return (
    <Pressable
      onPress={onNext}
      disabled={!onNext}
      accessibilityRole={onNext ? 'button' : 'text'}
      accessibilityHint={onNext ? 'Shows the next affirmation' : undefined}
      style={{ borderRadius: radius.md, overflow: 'hidden', padding: 20, gap: 10 }}
    >
      <GradientFill />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Sparkles size={14} color={colors['on-primary-soft']} strokeWidth={1.75} />
        <Text variant="label-sm" tone="soft">Today’s affirmation</Text>
      </View>
      <Text variant="headline-md" tone="inverse">{text}</Text>
    </Pressable>
  );
}
