import { Stack } from 'expo-router';
import { SettingsProvider } from '@/context/SettingsContext';

export default function SettingsLayout() {
  return (
    <SettingsProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SettingsProvider>
  );
}