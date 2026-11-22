import { View } from 'react-native';
import { colors, radius } from '@/theme/tokens';
import { Text } from '../ui/Text';
import { TopBar } from '../ui/TopBar';

export interface OnboardingHeroProps {
  title: string;
  step: 1 | 2;
  onBack?: () => void;
}

/** Back · "Step n of 2" glass progress pill · display-md title. */
export function OnboardingHero({ title, step, onBack }: OnboardingHeroProps) {
  return (
    <View style={{ paddingBottom: 48 }}>
      <TopBar
        onBack={onBack}
        title={undefined}
        right={<View style={{ width: 44 }} />}
      />
      <View style={{ position: 'absolute', top: 6, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 10, height: 32, paddingHorizontal: 12, borderRadius: radius.full, backgroundColor: colors.glass }} accessible accessibilityRole="progressbar" accessibilityLabel={`Step ${step} of 2`}>
        <View style={{ width: 120, height: 6, borderRadius: radius.full, backgroundColor: colors.glass, overflow: 'hidden' }}>
          <View style={{ width: step === 1 ? '50%' : '100%', height: 6, borderRadius: radius.full, backgroundColor: colors['on-primary'] }} />
        </View>
        <Text variant="label-sm" tone="inverse">Step {step} of 2</Text>
      </View>
      <Text variant="display-md" tone="inverse" style={{ paddingHorizontal: 24, marginTop: 28 }} accessibilityRole="header">{title}</Text>
    </View>
  );
}
