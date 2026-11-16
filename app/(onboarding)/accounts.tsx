import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Plus } from 'lucide-react-native';
import { colors } from '@/theme/tokens';
import { Button } from '@/components/ui/Button';
import { HeroScreen } from '@/components/ui/HeroScreen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useToast } from '@/components/ui/ToastProvider';
import { AccountDraftForm } from '@/components/onboarding/AccountDraftForm';
import { DraftAccountCard } from '@/components/onboarding/DraftAccountCard';
import { OnboardingHero } from '@/components/onboarding/OnboardingHero';
import { useOnboarding } from '@/context/OnboardingContext';
import { useCompleteOnboarding } from '@/src/hooks/useCompleteOnboarding';
import * as FloweNotifications from '@/modules/flowe-notifications';
import { refreshGate } from '../_layout';

/**
 * (onboarding)/accounts — Bank / E-wallet / Tabung form (C2–C4), then the list
 * with a dashed "Add another" (C5). Continue → notification access on Android.
 */
export default function Accounts() {
  const { state, dispatch } = useOnboarding();
  const router = useRouter();
  const toast = useToast();
  const { saving, complete } = useCompleteOnboarding();
  const [adding, setAdding] = useState(state.draftAccounts.length === 0);
  const count = state.draftAccounts.length;

  const finish = async () => {
    if (FloweNotifications.isAvailable) {
      router.push('/(onboarding)/notification-access');
      return;
    }
    const res = await complete(state.name, state.draftAccounts);
    if (!res.ok) {
      toast.failure('Something went wrong', { label: 'Retry', onPress: finish });
      return;
    }
    if (res.data.failed) toast.failure(`Couldn’t add ${res.data.failed} account${res.data.failed > 1 ? 's' : ''}`);
    refreshGate();
    router.replace('/(main)');
  };

  const title = adding ? (count ? 'Add another account' : 'Add your first account') : 'Your accounts';

  return (
    <HeroScreen
      hero={<OnboardingHero title={title} step={2} onBack={() => (adding && count ? setAdding(false) : router.back())} />}
      bottomPadding={32}
      sheetPadding={{ top: 24, horizontal: 24 }}
    >
      {adding ? (
        <AccountDraftForm
          onAdd={(draft) => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            dispatch({ type: 'ADD_DRAFT', draft });
            setAdding(false);
          }}
        />
      ) : (
        <View style={{ gap: 12 }}>
          <SectionHeader title={`${count} account${count === 1 ? '' : 's'} added`} />
          {state.draftAccounts.map((d, i) => (
            <DraftAccountCard key={`${d.kind}-${i}`} draft={d} onRemove={() => dispatch({ type: 'REMOVE_DRAFT', index: i })} />
          ))}
          <Button
            label="Add another"
            icon={Plus}
            variant="text"
            onPress={() => setAdding(true)}
            style={{ borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors['on-surface-variant'], height: 52 }}
          />
          <View style={{ height: 12 }} />
          <Button label={count ? 'Continue' : 'Skip for now'} variant={count ? 'primary' : 'action'} onPress={finish} loading={saving} fullWidth />
        </View>
      )}
    </HeroScreen>
  );
}
