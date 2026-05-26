import { useCallback, useEffect, useState } from 'react';
import { useSettings } from '@/context/SettingsContext';
import { useAuth } from '../../../context/AuthContext';
import { useFocusEffect, useRouter } from 'expo-router';
import { supabase } from '../../../src/lib/supabase';

function autoLockLabel(min: number | null | undefined): string {
  if (min === null || min === undefined) return 'Never';
  return `${min} min`;
}

function timeLabel(t: string | null | undefined): string {
  if (!t) return '8:00 AM';
  const [hStr, mStr] = String(t).split(':');
  const h = parseInt(hStr, 10);
  const m = mStr ?? '00';
  if (Number.isNaN(h)) return '8:00 AM';
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${period}`;
}

function categoryLabel(cat: string | null | undefined): string {
  if (!cat) return 'All';
  return cat.charAt(0).toUpperCase() + cat.slice(1);
}
import { AlertTriangle, Bell, ChevronRight, Database, Heart, Settings, Shield, User } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { SettingsGroup } from '../../../components/ui/SettingsGroup';
import { SettingsRow } from '../../../components/ui/SettingsRow';

export default function SettingsScreen() {
  const router = useRouter();
  const { state } = useSettings();
  const { user, signOut } = useAuth();
  const [displayName, setDisplayName] = useState<string>(state.profile.displayName);
  const [fingerprintEnabled, setFingerprintEnabled] = useState(false);
  const [autoLockMin, setAutoLockMin] = useState<number | null>(5);
  const [showAffirmations, setShowAffirmations] = useState(true);
  const [dailyReminderTime, setDailyReminderTime] = useState<string | null>(null);
  const [affirmationCategory, setAffirmationCategory] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.display_name) setDisplayName(data.display_name);
      });
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      supabase
        .from('auth_config')
        .select('fingerprint_enabled, auto_lock_minutes')
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setFingerprintEnabled(!!data.fingerprint_enabled);
            setAutoLockMin(data.auto_lock_minutes);
          }
        });
      supabase
        .from('settings')
        .select('show_affirmations, daily_reminder_time, affirmation_category')
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setShowAffirmations(!!data.show_affirmations);
            setDailyReminderTime(data.daily_reminder_time);
            setAffirmationCategory(data.affirmation_category);
          }
        });
    }, [user])
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScreenHeader title="Settings" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View className="px-4 mb-6">
          <Pressable
            onPress={() => router.push('/settings/account')}
            className="flex-row items-center gap-4 bg-card border border-border rounded-2xl p-4"
          >
            <View className="w-16 h-16 rounded-2xl bg-primary items-center justify-center">
              <User size={28} color="#000000" />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-semibold text-foreground mb-0.5">{displayName}</Text>
              <Text className="text-sm text-muted-foreground">Tap to edit profile</Text>
            </View>
            <ChevronRight size={20} color="#a0a0a0" />
          </Pressable>
        </View>

        {/* Settings Groups */}
        <SettingsGroup title="Account">
          <SettingsRow
            label="Display Name"
            value={displayName}
            icon={<User size={16} color="#a0a0a0" />}
            onPress={() => router.push('/settings/account')}
          />
        </SettingsGroup>

        <SettingsGroup title="Security">
          <SettingsRow
            label="Change PIN"
            icon={<Shield size={16} color="#a0a0a0" />}
            onPress={() => router.push('/settings/change-pin')}
          />
          <View className="border-t border-border" />
          <SettingsRow
            label="Fingerprint"
            badge={fingerprintEnabled ? 'Enabled' : 'Disabled'}
            badgeDanger={!fingerprintEnabled}
            icon={<Shield size={16} color="#a0a0a0" />}
            onPress={() => router.push('/settings/security')}
          />
          <View className="border-t border-border" />
          <SettingsRow
            label="Auto-lock Timer"
            value={autoLockLabel(autoLockMin)}
            icon={<Shield size={16} color="#a0a0a0" />}
            onPress={() => router.push('/settings/security')}
          />
        </SettingsGroup>

        <SettingsGroup title="App Settings">
          <SettingsRow
            label="Currency"
            value="RM"
            icon={<Settings size={16} color="#a0a0a0" />}
          />
          <View className="border-t border-border" />
          <SettingsRow
            label="Notifications"
            icon={<Bell size={16} color="#a0a0a0" />}
            onPress={() => router.push('/settings/notifications')}
          />
          <View className="border-t border-border" />
          <SettingsRow
            label="Manage Categories"
            icon={<Settings size={16} color="#a0a0a0" />}
            onPress={() => router.push('/settings/categories')}
          />
          <View className="border-t border-border" />
          <SettingsRow
            label="Recurring Payments"
            icon={<Settings size={16} color="#a0a0a0" />}
            onPress={() => router.push('/settings/recurring')}
          />
          <View className="border-t border-border" />
        </SettingsGroup>

        <SettingsGroup title="Affirmations">
          <SettingsRow
            label="Show on Home"
            badge={showAffirmations ? 'On' : 'Off'}
            badgeDanger={!showAffirmations}
            icon={<Heart size={16} color="#a0a0a0" />}
            onPress={() => router.push('/settings/affirmations')}
          />
          <View className="border-t border-border" />
          <SettingsRow
            label="Daily Reminder"
            value={timeLabel(dailyReminderTime)}
            icon={<Bell size={16} color="#a0a0a0" />}
            onPress={() => router.push('/settings/affirmations')}
          />
          <View className="border-t border-border" />
          <SettingsRow
            label="Category Preference"
            value={categoryLabel(affirmationCategory)}
            icon={<Heart size={16} color="#a0a0a0" />}
            onPress={() => router.push('/settings/affirmations')}
          />
        </SettingsGroup>

        <SettingsGroup title="Data">
          <SettingsRow
            label="Export Data"
            icon={<Database size={16} color="#a0a0a0" />}
            onPress={() => router.push('/settings/data')}
          />
          <View className="border-t border-border" />
          <SettingsRow
            label="Reset App"
            icon={<AlertTriangle size={16} color="#ff4444" />}
            danger
            hasChevron={false}
            onPress={() => router.push('/settings/data')}
          />
        </SettingsGroup>

        {/* Footer */}
        <View className="items-center pb-8 pt-4">
          <Text className="text-xs text-muted-foreground">Flowe v1.0.0</Text>
          <Text className="text-xs text-muted-foreground">Personal Finance Tracker</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}