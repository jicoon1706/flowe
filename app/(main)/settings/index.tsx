import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { BellRing, Database, Gauge, Lock, Repeat, Shield, Sparkles, Store, Tags, User, Bell } from 'lucide-react-native';
import { colors } from '@/theme/tokens';
import { GlassChip } from '@/components/ui/GlassChip';
import { HeroScreen } from '@/components/ui/HeroScreen';
import { SettingsGroup } from '@/components/ui/SettingsGroup';
import { SettingsRow } from '@/components/ui/SettingsRow';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/context/AuthContext';
import { useAccounts } from '@/src/hooks/useAccounts';
import { useDailyBudget } from '@/src/hooks/useDailyBudget';
import { useProfile } from '@/src/hooks/useProfile';
import { useRecurring } from '@/src/hooks/useRecurring';
import { flags } from '@/src/lib/secureStore';
import { formatRM } from '@/src/lib/money';
import * as FloweNotifications from '@/modules/flowe-notifications';

/** settings — short profile header, grouped rows with icon wells; each row is one tap to its sub-screen. */
export default function SettingsIndex() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile, displayName, fetchProfile } = useProfile(user?.id);
  const { accounts, fetchAccounts } = useAccounts();
  const { budget, fetchBudget } = useDailyBudget(user?.id);
  const { recurringRules, fetchRecurring } = useRecurring();
  const [fingerprint, setFingerprint] = useState(false);

  useFocusEffect(useCallback(() => {
    fetchProfile(); fetchAccounts(); fetchBudget(); fetchRecurring();
    flags.fingerprintEnabled().then(setFingerprint).catch(() => setFingerprint(false));
  }, [fetchProfile, fetchAccounts, fetchBudget, fetchRecurring]));

  const since = profile?.member_since ? new Date(profile.member_since).toLocaleDateString('en-MY', { month: 'short', year: 'numeric' }) : null;
  const detectOn = FloweNotifications.isAvailable && FloweNotifications.isEnabled();
  const sources = detectOn ? FloweNotifications.getWatchedPackages().length : 0;
  const activeBills = recurringRules.filter((r) => r.status === 'active').length;
  const initial = (displayName.trim()[0] ?? 'F').toUpperCase();

  return (
    <HeroScreen
      contentWidth="form"
      heroHeight={236}
      hero={
        <View style={{ paddingHorizontal: 24, marginTop: 16, gap: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <View style={{ width: 64, height: 64, borderRadius: 9999, backgroundColor: colors.glass, alignItems: 'center', justifyContent: 'center' }}>
              <Text variant="display-md" size={24} tone="inverse">{initial}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="headline-md" tone="inverse" accessibilityRole="header">{displayName || 'You'}</Text>
              <Text variant="body-md" tone="soft">{accounts.length} account{accounts.length === 1 ? '' : 's'}{since ? ` · since ${since}` : ''}</Text>
            </View>
          </View>
          <GlassChip icon={Shield} label={fingerprint ? 'PIN + fingerprint on' : 'PIN on'} />
        </View>
      }
    >
      <SettingsGroup title="You">
        <SettingsRow label="Account" icon={User} onPress={() => router.push('/settings/account')} />
        <SettingsRow label="Security" value="PIN, fingerprint" icon={Lock} onPress={() => router.push('/settings/security')} />
        <SettingsRow label="Auto-detect" value={!FloweNotifications.isAvailable ? 'Android only' : detectOn ? `${sources} bank${sources === 1 ? '' : 's'} & wallets on` : 'Off'} icon={BellRing} onPress={() => router.push('/settings/auto-detect')} />
      </SettingsGroup>
      <SettingsGroup title="Money">
        <SettingsRow label="Categories" icon={Tags} onPress={() => router.push('/settings/categories')} />
        <SettingsRow label="Budget" value={budget ? `${formatRM(budget)} a day` : 'Not set'} icon={Gauge} onPress={() => router.push('/settings/budget')} />
        <SettingsRow label="Recurring" value={`${activeBills} bill${activeBills === 1 ? '' : 's'}`} icon={Repeat} onPress={() => router.push('/settings/recurring')} />
      </SettingsGroup>
      <SettingsGroup title="App">
        <SettingsRow label="Notifications" icon={Bell} onPress={() => router.push('/settings/notifications')} />
        <SettingsRow label="Affirmations" icon={Sparkles} onPress={() => router.push('/settings/affirmations')} />
        <SettingsRow label="Data" value="Export, import, reset" icon={Database} onPress={() => router.push('/settings/data')} />
        <SettingsRow label="Request a merchant" icon={Store} onPress={() => router.push('/settings/merchant-request')} />
      </SettingsGroup>
    </HeroScreen>
  );
}
