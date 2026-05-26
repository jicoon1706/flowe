import { View, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { SettingsGroup } from '../../../components/ui/SettingsGroup';
import { SettingsRow } from '../../../components/ui/SettingsRow';
import { Toggle } from '../../../components/ui/Toggle';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../src/lib/supabase';
import { LoadingView } from '../../../components/ui/LoadingView';

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

const KEYS = ['cashflow', 'alert', 'milestone', 'expense', 'income', 'recurring', 'tabung', 'affirmation'] as const;
type Key = typeof KEYS[number];

const dbCol = (k: Key) => `notif_${k}` as const;

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [toggles, setToggles] = useState<Record<Key, boolean>>(() =>
    Object.fromEntries(KEYS.map((k) => [k, true])) as Record<Key, boolean>
  );

  useEffect(() => {
    if (!user) return;
    (async () => {
      const cols = KEYS.map(dbCol).join(',');
      const { data, error } = await supabase
        .from('settings')
        .select(cols)
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) console.warn('[notifications] fetch failed:', error);

      if (!data) {
        // No row yet — create one with defaults
        const { data: created, error: insertErr } = await supabase
          .from('settings')
          .insert({ user_id: user.id })
          .select(cols)
          .maybeSingle();
        if (insertErr) console.warn('[notifications] insert failed:', insertErr);
        if (created) applyRow(created);
      } else {
        applyRow(data);
      }
      setLoading(false);
    })();
  }, [user]);

  function applyRow(row: any) {
    const next = { ...toggles };
    for (const k of KEYS) next[k] = !!row[dbCol(k)];
    setToggles(next);
  }

  if (loading) return <LoadingView />;

  const toggle = (key: Key) => async (val: boolean) => {
    const updated = { ...toggles, [key]: val };
    setToggles(updated);
    if (!user) return;
    const { error } = await supabase
      .from('settings')
      .update({ [dbCol(key)]: val, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);
    if (error) Alert.alert('Save failed', error.message);
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
                      value={toggles[key]}
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
