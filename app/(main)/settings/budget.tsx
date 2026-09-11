import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert, Platform, AppState } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Target, BellRing, AlertCircle } from 'lucide-react-native';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { Input } from '../../../components/ui/Input';
import { Chip } from '../../../components/ui/Chip';
import { Button } from '../../../components/ui/Button';
import { LoadingView } from '../../../components/ui/LoadingView';
import { KeyboardAvoider } from '../../../components/ui/KeyboardAvoider';
import { useAuth } from '../../../context/AuthContext';
import { useDailyBudget } from '../../../src/hooks/useDailyBudget';
import { parseBudgetInput, budgetProgress } from '../../../src/utils/dailyBudget';
import * as FloweNotifications from '../../../modules/flowe-notifications';

const QUICK_AMOUNTS = [30, 50, 80, 100, 150, 200];

/**
 * Settings → Daily Budget. One number: how much the user means to spend in a
 * day. With it set, every payment Flowe catches outside the app raises a
 * short-lived live update showing how much of today is left.
 */
export default function DailyBudgetScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { budget, loaded, saving, fetchBudget, saveBudget } = useDailyBudget(user?.id);
  const [draft, setDraft] = useState('');
  const [liveUpdatesAllowed, setLiveUpdatesAllowed] = useState(true);
  const [spentToday, setSpentToday] = useState(0);

  useEffect(() => { fetchBudget(); }, [fetchBudget]);
  useEffect(() => {
    if (loaded) setDraft(budget === null ? '' : String(budget));
  }, [loaded, budget]);

  // Android 16 lets the user switch Live Updates off per app in system
  // settings; re-read on every foreground so coming back from there is
  // reflected without a restart.
  const readNativeState = useCallback(() => {
    if (!FloweNotifications.isAvailable) return;
    setLiveUpdatesAllowed(FloweNotifications.canPostLiveUpdates());
    setSpentToday(FloweNotifications.getBudgetSnapshot().spent);
  }, []);
  useEffect(() => {
    readNativeState();
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') readNativeState(); });
    return () => sub.remove();
  }, [readNativeState]);

  if (!loaded) return <LoadingView />;

  const parsed = parseBudgetInput(draft);
  const dirty = parsed !== budget;
  const progress = budget ? budgetProgress(budget, spentToday) : null;

  const save = async (value: number | null) => {
    const result = await saveBudget(value);
    if (!result.ok) Alert.alert('Save failed', 'error' in result ? result.error.message : 'Please try again.');
  };

  const clear = () => {
    Alert.alert('Turn off daily budget?', 'Live updates stop until you set a budget again.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Turn off', style: 'destructive', onPress: () => { setDraft(''); save(null); } },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScreenHeader title="Daily Budget" onBack={() => router.back()} />
      <KeyboardAvoider>
        <ScrollView className="flex-1 px-4 pt-4" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View className="bg-card border border-border rounded-2xl p-5 mb-4">
            <View className="flex-row items-center gap-3 mb-4">
              <View className="w-10 h-10 rounded-xl bg-primary/15 items-center justify-center">
                <Target size={20} color="#C5FF00" />
              </View>
              <View className="flex-1">
                <Text className="text-foreground text-base font-semibold">How much per day?</Text>
                <Text className="text-muted-foreground text-xs mt-0.5">
                  {budget ? `Currently RM ${budget.toFixed(2)}` : 'No budget set'}
                </Text>
              </View>
            </View>

            <Input
              label="Amount (RM)"
              value={draft}
              onChangeText={setDraft}
              placeholder="e.g. 100"
              keyboardType="decimal-pad"
              returnKeyType="done"
            />

            <View className="flex-row flex-wrap gap-2 mt-3">
              {QUICK_AMOUNTS.map((amount) => (
                <Chip
                  key={amount}
                  label={`RM ${amount}`}
                  selected={parsed === amount}
                  onPress={() => setDraft(String(amount))}
                />
              ))}
            </View>

            <View className="mt-4">
              <Button
                title={budget === null ? 'Set budget' : 'Save'}
                onPress={() => parsed !== null && save(parsed)}
                disabled={parsed === null || !dirty}
                loading={saving}
              />
            </View>
            {budget !== null && (
              <Pressable onPress={clear} className="items-center py-3 mt-1 active:opacity-70">
                <Text className="text-destructive text-sm font-medium">Turn off daily budget</Text>
              </Pressable>
            )}
          </View>

          {/* Today, as the native side sees it — the same figures the live
              update will show, so a preview here is an honest one. */}
          {budget !== null && progress && (
            <View className="bg-card border border-border rounded-2xl p-5 mb-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-sm text-muted-foreground font-medium">Today</Text>
                <Text className={`text-sm font-semibold ${progress.over ? 'text-expense' : 'text-foreground'}`}>
                  {progress.over
                    ? `RM ${(-progress.remaining).toFixed(2)} over`
                    : `RM ${progress.remaining.toFixed(2)} left`}
                </Text>
              </View>
              <View className="h-2 bg-muted rounded-full overflow-hidden">
                <View
                  className="h-full rounded-full"
                  style={{ width: `${progress.percent}%`, backgroundColor: progress.over ? '#ff4444' : '#C5FF00' }}
                />
              </View>
              <Text className="text-xs text-muted-foreground mt-2">
                RM {spentToday.toFixed(2)} of RM {budget.toFixed(2)} spent
              </Text>
            </View>
          )}

          <View className="bg-card border border-border rounded-2xl p-5 mb-4">
            <View className="flex-row items-center gap-3 mb-2">
              <BellRing size={18} color="#a0a0a0" />
              <Text className="text-foreground text-sm font-semibold">Live updates</Text>
            </View>
            <Text className="text-muted-foreground text-xs leading-5">
              Whenever Flowe records a payment it spotted in a bank or e-wallet notification,
              a live update shows how much of today&apos;s budget is left — then disappears on
              its own after a minute. On Android 16 it is pinned above your notifications
              with a chip in the status bar.
            </Text>

            {Platform.OS !== 'android' && (
              <Text className="text-muted-foreground text-xs mt-3">
                Available on Android only.
              </Text>
            )}

            {Platform.OS === 'android' && FloweNotifications.isAvailable && !liveUpdatesAllowed && (
              <Pressable
                onPress={() => FloweNotifications.openAppNotificationSettings()}
                className="flex-row items-center gap-2 mt-3 bg-destructive/10 border border-destructive/40 rounded-xl px-3 py-2.5"
              >
                <AlertCircle size={16} color="#ff4444" />
                <Text className="text-xs text-destructive flex-1">
                  Live updates are switched off for Flowe in system settings. Tap to turn them on.
                </Text>
              </Pressable>
            )}

            {Platform.OS === 'android' && FloweNotifications.isAvailable && budget !== null && (
              <View className="mt-4">
                <Button
                  title="Preview live update"
                  variant="secondary"
                  onPress={() => FloweNotifications.showBudgetLiveUpdate()}
                />
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoider>
    </SafeAreaView>
  );
}
