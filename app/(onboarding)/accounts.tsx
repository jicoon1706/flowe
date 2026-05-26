import { useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { OnboardingProgress } from '../../components/ui/OnboardingProgress';
import { TypeChip } from '../../components/onboarding/TypeChip';
import { AccountChip } from '../../components/onboarding/AccountChip';
import { BankForm } from '../../components/onboarding/BankForm';
import { WalletForm } from '../../components/onboarding/WalletForm';
import { TabungForm } from '../../components/onboarding/TabungForm';
import { useOnboarding } from '../../context/OnboardingContext';
import { accountsRepository } from '../../src/repositories/accounts.repository';
import { supabase } from '../../src/lib/supabase';
import { flags } from '../../src/lib/secureStore';
import { refreshGate } from '../_layout';
import type { DraftAccount, DraftBank, DraftTabung, DraftWallet } from '../../src/types/onboarding';

type Phase = 'type' | 'formBank' | 'formWallet' | 'formTabung';

export default function Accounts() {
  const { state, dispatch } = useOnboarding();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('type');
  const [saving, setSaving] = useState(false);

  function addBank(draft: DraftBank) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    dispatch({ type: 'ADD_DRAFT', draft });
    setPhase('type');
  }

  function addWallet(draft: DraftWallet) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    dispatch({ type: 'ADD_DRAFT', draft });
    setPhase('type');
  }

  function addTabung(draft: DraftTabung) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    dispatch({ type: 'ADD_DRAFT', draft });
    setPhase('type');
  }

  function removeDraft(index: number) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    dispatch({ type: 'REMOVE_DRAFT', index });
  }

  async function done() {
    if (state.draftAccounts.length === 0) {
      // Skip — just write name + onboarding_done
      await finishOnboarding([], true);
      return;
    }

    setSaving(true);
    await finishOnboarding(state.draftAccounts, false);
  }

  async function finishOnboarding(drafts: DraftAccount[], skipped: boolean) {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        if (!skipped) {
          await supabase
            .from('profiles')
            .update({ display_name: state.name })
            .eq('id', user.id);
        }

        for (const draft of drafts) {
          if (draft.kind === 'bank') {
            await accountsRepository.createBankAccount({
              user_id: user.id,
              name: draft.customName ?? draft.bankId,
              bank_name: draft.bankId,
              account_number: draft.accountLast4,
              opening_balance: draft.openingBalance,
            });
          } else if (draft.kind === 'wallet') {
            await accountsRepository.createWalletAccount({
              user_id: user.id,
              name: draft.name,
              opening_balance: draft.openingBalance,
            });
          } else {
            await accountsRepository.createTabungAccount({
              user_id: user.id,
              name: draft.name,
              icon: draft.icon,
              target_amount: draft.target,
              from_date: draft.fromDate,
              to_date: draft.toDate,
              linked_bank_id: draft.linkedBankId,
            });
          }
        }
      } else {
        console.warn('[onboarding] no auth user — finishing locally only');
      }

      await flags.markOnboardingDone();
      refreshGate();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      await new Promise((r) => setTimeout(r, 1800));

      router.replace('/(main)');
    } catch (e) {
      console.warn('[onboarding] finish failed:', e);
      setSaving(false);
      Alert.alert('Something went wrong', 'Please try again.');
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <OnboardingProgress step={2} />
      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        {state.draftAccounts.length > 0 && (
          <View className="mb-6">
            <Text className="text-muted-foreground text-sm font-medium mb-3">
              ADDED ({state.draftAccounts.length})
            </Text>
            {state.draftAccounts.map((draft, i) => (
              <AccountChip key={i} draft={draft} onRemove={() => removeDraft(i)} />
            ))}
          </View>
        )}

        {phase === 'type' && (
          <View className="gap-4">
            <Text className="text-foreground text-2xl font-bold">Add your{'\n'}accounts</Text>
            <Text className="text-muted-foreground text-sm">Choose the type of account you want to add</Text>
            <View className="flex-row gap-3 mb-8">
              <TypeChip label="Bank" emoji="🏦" active={false} onPress={() => setPhase('formBank')} />
              <TypeChip label="Tabung" emoji="✈️" active={false} onPress={() => setPhase('formTabung')} />
              <TypeChip label="Wallet" emoji="🍎" active={false} onPress={() => setPhase('formWallet')} />
            </View>
          </View>
        )}

        {phase === 'formBank' && (
          <View className="gap-4">
            <Pressable onPress={() => setPhase('type')} className="flex-row items-center gap-2">
              <Feather name="arrow-left" size={20} color="#a0a0a0" />
              <Text className="text-muted-foreground">Back</Text>
            </Pressable>
            <Text className="text-foreground text-xl font-bold">Add Bank Account</Text>
            <BankForm onAdd={addBank} />
          </View>
        )}

        {phase === 'formWallet' && (
          <View className="gap-4">
            <Pressable onPress={() => setPhase('type')} className="flex-row items-center gap-2">
              <Feather name="arrow-left" size={20} color="#a0a0a0" />
              <Text className="text-muted-foreground">Back</Text>
            </Pressable>
            <Text className="text-foreground text-xl font-bold">Add Wallet</Text>
            <WalletForm onAdd={addWallet} />
          </View>
        )}

        {phase === 'formTabung' && (
          <View className="gap-4 pb-4">
            <Pressable onPress={() => setPhase('type')} className="flex-row items-center gap-2">
              <Feather name="arrow-left" size={20} color="#a0a0a0" />
              <Text className="text-muted-foreground">Back</Text>
            </Pressable>
            <Text className="text-foreground text-xl font-bold">Add Tabung</Text>
            <TabungForm onAdd={addTabung} />
          </View>
        )}
      </ScrollView>

      {phase === 'type' && (
        <View className="px-6 pb-8 gap-3">
          {state.draftAccounts.length === 0 ? (
            <Pressable
              onPress={done}
              className="rounded-2xl py-4 flex-row items-center justify-center gap-2 bg-primary active:opacity-90"
            >
              <Text className="text-primary-foreground font-bold">Skip for now</Text>
              <Feather name="chevron-right" size={20} color="#000" />
            </Pressable>
          ) : (
            <Pressable
              onPress={done}
              disabled={saving}
              className="rounded-2xl py-4 flex-row items-center justify-center gap-2 bg-primary active:opacity-90"
            >
              <Text className="text-primary-foreground font-bold">
                {saving ? 'Saving...' : "Done, Let's Go!"}
              </Text>
              <Feather name="chevron-right" size={20} color="#000" />
            </Pressable>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}