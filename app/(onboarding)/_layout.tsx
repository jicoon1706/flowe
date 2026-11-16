import { Stack } from 'expo-router';
import { colors } from '@/theme/tokens';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, gestureEnabled: false, animation: 'fade', contentStyle: { backgroundColor: colors.surface } }}>
      <Stack.Screen name="name" />
      <Stack.Screen name="accounts" />
      <Stack.Screen name="notification-access" />
    </Stack>
  );
}
