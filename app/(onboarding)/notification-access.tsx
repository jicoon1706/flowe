import { useEffect, useState } from 'react';
import { AppState, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowDownRight, BellRing, Shield, Smartphone } from 'lucide-react-native';
import { colors, radius } from '@/theme/tokens';
import { Button } from '@/components/ui/Button';
import { HeroScreen } from '@/components/ui/HeroScreen';
import { LogoWell } from '@/components/ui/LogoWell';
import { Text } from '@/components/ui/Text';
import { useToast } from '@/components/ui/ToastProvider';
import { useOnboarding } from '@/context/OnboardingContext';
import { useCompleteOnboarding } from '@/src/hooks/useCompleteOnboarding';
import * as FloweNotifications from '@/modules/flowe-notifications';
import { refreshGate } from '../_layout';

const POINTS = [
  { icon: BellRing, text: 'We only read notifications from the banks and wallets you added.' },
  { icon: Shield, text: 'Alerts are parsed on your phone. Nothing is sent anywhere.' },
  { icon: Smartphone, text: 'You confirm every one before it is saved. Turn it off any time in Settings.' },
];

/** (onboarding)/notification-access — Allow (black) → system listener settings; Later = text button. */
export default function NotificationAccess() {
  const router = useRouter();
  const toast = useToast();
  const { state } = useOnboarding();
  const { saving, complete } = useCompleteOnboarding();
  const [asked, setAsked] = useState(false);

  const finish = async () => {
    const res = await complete(state.name, state.draftAccounts);
    if (!res.ok) {
      toast.failure('Something went wrong', { label: 'Retry', onPress: finish });
      return;
    }
    if (res.data.failed) toast.failure(`Couldn’t add ${res.data.failed} account${res.data.failed > 1 ? 's' : ''}`);
    refreshGate();
    router.replace('/(main)');
  };

  // Back from system settings with access granted: switch auto-detect on and finish.
  useEffect(() => {
    if (!asked) return;
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active' && FloweNotifications.isPermissionGranted()) {
        FloweNotifications.setEnabled(true);
        finish();
      }
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asked]);

  return (
    <HeroScreen
      heroHeight={416}
      bottomPadding={32}
      sheetPadding={{ top: 28, horizontal: 24 }}
      hero={
        <View style={{ alignItems: 'center', gap: 16, marginTop: 24 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <View style={{ width: 300, borderRadius: radius.md, backgroundColor: colors.glass, padding: 14, flexDirection: 'row', gap: 12 }}>
            <LogoWell domain="maybank2u.com.my" size={36} on="gradient" />
            <View style={{ flex: 1 }}>
              <Text variant="label-sm" tone="soft">Bank alert · now</Text>
              <Text variant="body-md" tone="inverse">You spent RM 12.50 with your card.</Text>
            </View>
          </View>
          <View style={{ width: 44, height: 44, borderRadius: 9999, backgroundColor: colors.glass, alignItems: 'center', justifyContent: 'center' }}>
            <ArrowDownRight size={20} color={colors['on-primary']} strokeWidth={1.75} />
          </View>
          <View style={{ width: 300, borderRadius: radius.md, backgroundColor: colors.surface, paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text variant="body-md" style={{ flex: 1 }}>RM 12.50 · one tap to log</Text>
            <View style={{ height: 32, paddingHorizontal: 12, borderRadius: 9999, backgroundColor: colors.secondary, justifyContent: 'center' }}>
              <Text variant="label-sm" weight={600} tone="inherit" style={{ color: colors['on-secondary'] }}>Confirm</Text>
            </View>
          </View>
        </View>
      }
    >
      <Text variant="display-md" accessibilityRole="header">Let Flowe read bank alerts</Text>
      {POINTS.map((p) => (
        <View key={p.text} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 36, height: 36, borderRadius: 9999, backgroundColor: colors['surface-container'], alignItems: 'center', justifyContent: 'center' }}>
            <p.icon size={17} color={colors['on-surface']} strokeWidth={1.75} />
          </View>
          <Text variant="body-md" style={{ flex: 1 }}>{p.text}</Text>
        </View>
      ))}
      <View style={{ flex: 1, minHeight: 16 }} />
      <Button label="Allow" onPress={() => { setAsked(true); FloweNotifications.openSettings(); }} loading={saving} fullWidth />
      <Button label="Later" variant="text" onPress={finish} disabled={saving} style={{ alignSelf: 'center' }} />
    </HeroScreen>
  );
}
