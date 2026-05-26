import { View } from 'react-native';
import { useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { SettingsGroup } from '../../../components/ui/SettingsGroup';
import { SettingsRow } from '../../../components/ui/SettingsRow';
import { Toggle } from '../../../components/ui/Toggle';
import { useAuth } from '../../../context/AuthContext';
import { useSettings } from '../../../src/hooks/useSettings';
import { LoadingView } from '../../../components/ui/LoadingView';
import { ErrorView } from '../../../components/ui/ErrorView';

const GROUPS = {
  Alerts: ['cashflow', 'alert', 'milestone'] as const,
  Activity: ['expense', 'income', 'recurring', 'tabung'] as const,
  Reminders: ['affirmation'] as const,
};

const LABELS: Record<string, string> = {
  cashflow: 'Cashflow Updates', alert: 'Bill Alerts', milestone: 'Milestones',
  expense: 'Expenses', income: 'Income', recurring: 'Recurring', tabung: 'Tabung',
  affirmation: 'Affirmations',
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { settings, loading, error, fetchSettings, updateSettings } = useSettings();
  const [localToggles, setLocalToggles] = useState<Record<string, boolean>>({});

  useFocusEffect(useCallback(() => {
    if (user) fetchSettings(user.id);
  }, [user, fetchSettings]));

  useFocusEffect(useCallback(() => {
    if (settings?.notifications) {
      setLocalToggles({ ...settings.notifications });
    }
  }, [settings]));

  if (loading) return <LoadingView />;
  if (error) return <ErrorView error={error} onRetry={() => user && fetchSettings(user.id)} />;

  const toggle = (key: string) => async (val: boolean) => {
    const updated = { ...localToggles, [key]: val };
    setLocalToggles(updated);
    if (user && settings) {
      await updateSettings(user.id, { notifications: updated as any });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScreenHeader title="Notifications" onBack={() => router.back()} />
      <View className="flex-1 px-4 pt-4">
        {Object.entries(GROUPS).map(([groupName, keys]) => (
          <SettingsGroup key={groupName} title={groupName}>
            {keys.map((key, i) => (
              <View key={key}>
                {i > 0 && <View className="border-t border-border" />}
                <SettingsRow
                  label={LABELS[key]}
                  icon={<Bell size={16} color="#a0a0a0" />}
                  hasChevron={false}
                  rightElement={
                    <Toggle
                      value={localToggles[key] ?? false}
                      onValueChange={toggle(key)}
                    />
                  }
                />
              </View>
            ))}
          </SettingsGroup>
        ))}
      </View>
    </SafeAreaView>
  );
}