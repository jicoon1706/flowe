import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { SettingsGroup } from '../../../components/ui/SettingsGroup';
import { SettingsRow } from '../../../components/ui/SettingsRow';
import { Toggle } from '../../../components/ui/Toggle';
import { useSettings } from '@/context/SettingsContext';

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
  const { state, dispatch } = useSettings();

  const toggle = (key: string) => (val: boolean) => {
    dispatch({ type: 'UPDATE_NOTIFICATIONS', payload: { [key]: val } });
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
                      value={state.notifications[key as keyof typeof state.notifications]}
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