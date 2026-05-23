import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { User, Shield, Bell, Settings, Heart, Database, ChevronRight, AlertTriangle } from 'lucide-react-native';
import { useSettings } from '@/context/SettingsContext';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { SettingsGroup } from '../../components/ui/SettingsGroup';
import { SettingsRow } from '../../components/ui/SettingsRow';

export default function SettingsScreen() {
  const router = useRouter();
  const { state } = useSettings();

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
              <Text className="text-lg font-semibold text-foreground mb-0.5">{state.profile.displayName}</Text>
              <Text className="text-sm text-muted-foreground">Tap to edit profile</Text>
            </View>
            <ChevronRight size={20} color="#a0a0a0" />
          </Pressable>
        </View>

        {/* Settings Groups */}
        <SettingsGroup title="Account">
          <SettingsRow
            label="Display Name"
            value={state.profile.displayName}
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
            badge={state.security.fingerprintEnabled ? "Enabled" : "Disabled"}
            icon={<Shield size={16} color="#a0a0a0" />}
            onPress={() => router.push('/settings/security')}
          />
          <View className="border-t border-border" />
          <SettingsRow
            label="Auto-lock Timer"
            value="5 min"
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
          <SettingsRow
            label="Balance Visibility"
            value="Visible"
            icon={<Settings size={16} color="#a0a0a0" />}
            onPress={() => router.push('/settings/data')}
          />
        </SettingsGroup>

        <SettingsGroup title="Affirmations">
          <SettingsRow
            label="Show on Home"
            badge="On"
            icon={<Heart size={16} color="#a0a0a0" />}
            onPress={() => router.push('/settings/affirmations')}
          />
          <View className="border-t border-border" />
          <SettingsRow
            label="Daily Reminder"
            value="8:00 AM"
            icon={<Bell size={16} color="#a0a0a0" />}
            onPress={() => router.push('/settings/affirmations')}
          />
          <View className="border-t border-border" />
          <SettingsRow
            label="Category Preference"
            value="All"
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