import { useState } from 'react';
import { TextInput as RNTextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, familyForWeight, type, radius } from '@/theme/tokens';
import { Button } from '@/components/ui/Button';
import { HeroScreen } from '@/components/ui/HeroScreen';
import { InlineError } from '@/components/ui/InlineError';
import { Text } from '@/components/ui/Text';
import { OnboardingHero } from '@/components/onboarding/OnboardingHero';
import { useOnboarding } from '@/context/OnboardingContext';

/** (onboarding)/name — keyboard opens on load; Primary: Continue (black). */
export default function Name() {
  const { state, dispatch } = useOnboarding();
  const router = useRouter();
  const [value, setValue] = useState(state.name);
  const [error, setError] = useState<string | null>(null);
  const spec = type['display-md'];

  const next = () => {
    const trimmed = value.trim();
    if (!trimmed) { setError('Enter a name'); return; }
    dispatch({ type: 'SET_NAME', name: trimmed });
    router.push('/(onboarding)/accounts');
  };

  return (
    <HeroScreen contentWidth="form" hero={<OnboardingHero title="What should we call you?" step={1} onBack={router.canGoBack() ? () => router.back() : undefined} />} bottomPadding={32} sheetPadding={{ top: 28, horizontal: 24 }}>
      <View style={{ gap: 8 }}>
        <Text variant="label-sm" tone="muted">Your name</Text>
        <View style={{ backgroundColor: colors['surface-container'], borderRadius: radius.md, paddingHorizontal: 20, paddingVertical: 16, borderWidth: 1.5, borderColor: error ? colors.secondary : 'transparent' }}>
          <RNTextInput
            value={value}
            onChangeText={(t) => { setValue(t); setError(null); }}
            autoFocus
            autoCapitalize="words"
            maxLength={30}
            returnKeyType="done"
            onSubmitEditing={next}
            accessibilityLabel="Your name"
            placeholder="Your name"
            placeholderTextColor={colors['on-surface-variant-aa']}
            style={{ fontFamily: familyForWeight[500], fontSize: spec.size, letterSpacing: spec.trackingEm * spec.size, color: colors['on-surface'], padding: 0 }}
          />
        </View>
        {error ? <InlineError message={error} /> : null}
      </View>
      <Text variant="body-md" tone="muted" style={{ paddingHorizontal: 4 }}>We’ll use it on your home screen. Nothing else.</Text>
      <View style={{ flex: 1, minHeight: 24 }} />
      <Button label="Continue" onPress={next} fullWidth />
    </HeroScreen>
  );
}
