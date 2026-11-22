import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, radius } from '@/theme/tokens';
import { TABUNG_GOALS, type TabungGoalKey } from '@/constants/tabungGoals';
import { Button } from '@/components/ui/Button';
import { HeroScreen } from '@/components/ui/HeroScreen';
import { Text } from '@/components/ui/Text';
import { TopBar } from '@/components/ui/TopBar';

/** tabung/new — step 1: pick a goal type (sets the icon and name). Primary: Continue. */
export default function NewTabung() {
  const router = useRouter();
  const [goal, setGoal] = useState<TabungGoalKey>('emergency');
  return (
    <HeroScreen
      contentWidth="form"
      bottomPadding={32}
      hero={
        <View style={{ paddingBottom: 40 }}>
          <TopBar onBack={() => router.back()} close />
          <Text variant="display-md" tone="inverse" style={{ paddingHorizontal: 24, marginTop: 28 }} accessibilityRole="header">What are you saving for?</Text>
        </View>
      }
    >
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {TABUNG_GOALS.map((g) => {
          const selected = g.key === goal;
          return (
            <Pressable
              key={g.key}
              onPress={() => setGoal(g.key)}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={`${g.label}, ${g.hint}`}
              style={{ width: '48.8%', height: 128, padding: 16, borderRadius: radius.md, borderWidth: 2, borderColor: selected ? colors.secondary : 'transparent', backgroundColor: colors['surface-container'], justifyContent: 'space-between' }}
            >
              <View style={{ width: 40, height: 40, borderRadius: radius.full, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
                <g.icon size={19} color={colors['on-surface']} strokeWidth={1.75} />
              </View>
              <View>
                <Text variant="label-lg">{g.label}</Text>
                <Text variant="label-sm" weight={400} tone="meta">{g.hint}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      <View style={{ flex: 1, minHeight: 16 }} />
      <Button label="Continue" onPress={() => router.push({ pathname: '/tabung/new/form', params: { goal } })} fullWidth />
    </HeroScreen>
  );
}
