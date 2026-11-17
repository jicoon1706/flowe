import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Gauge, LayoutGrid } from 'lucide-react-native';
import { AmountField } from '@/components/ui/AmountField';
import { Button } from '@/components/ui/Button';
import { ConfirmSheet } from '@/components/ui/ConfirmSheet';
import { HeroScreen } from '@/components/ui/HeroScreen';
import { Money } from '@/components/ui/Money';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { SettingsRow } from '@/components/ui/SettingsRow';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { TopBar } from '@/components/ui/TopBar';
import { useToast } from '@/components/ui/ToastProvider';
import { useAuth } from '@/context/AuthContext';
import { useBudgetSettings } from '@/src/hooks/useBudgetSettings';
import { useTodaySpend } from '@/src/hooks/useTodaySpend';
import { useTransactions } from '@/src/hooks/useTransactions';
import { budgetStatus, dailyFromMonthly, defaultLiveMode, spentInMonth } from '@/src/lib/budget';
import { formatRM, parseAmount } from '@/src/lib/money';
import * as FloweNotifications from '@/modules/flowe-notifications';

/**
 * settings/budget — today's limit as a glass ring; monthly + daily limits.
 * Daily pre-fills as monthly ÷ days. Turning daily off asks first. Primary: Save limits.
 */
export default function BudgetScreen() {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const { value, loading, fetch, save } = useBudgetSettings(user?.id);
  const { spent } = useTodaySpend();
  const now = new Date();
  const { transactions } = useTransactions(now.getFullYear(), now.getMonth() + 1);
  const [monthly, setMonthly] = useState('');
  const [daily, setDaily] = useState('');
  const [dailyTouched, setDailyTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmOff, setConfirmOff] = useState(false);
  const [widgetPinned, setWidgetPinned] = useState(false);

  useFocusEffect(useCallback(() => { fetch(); setWidgetPinned(FloweNotifications.isBudgetWidgetPinned()); }, [fetch]));
  useEffect(() => {
    if (!value) return;
    setMonthly(value.monthly ? String(value.monthly) : '');
    setDaily(value.daily ? String(value.daily) : '');
    setDailyTouched(!!value.daily);
  }, [value]);

  // Daily pre-fills as monthly ÷ days until the user types their own.
  const onMonthly = (v: string) => {
    setMonthly(v);
    const m = parseAmount(v);
    if (!dailyTouched && m && m > 0) setDaily(String(dailyFromMonthly(m, now)));
  };

  const d = parseAmount(daily);
  const m = parseAmount(monthly);
  const status = value?.daily ? budgetStatus(value.daily, spent ?? 0) : null;
  const monthSpent = spentInMonth(transactions, `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);

  const persist = async (nextDaily: number | null) => {
    setSaving(true);
    const nextMonthly = m && m > 0 ? m : null;
    const mode = value?.liveMode === 'off' ? 'off' : value?.monthly ? value.liveMode : defaultLiveMode(nextMonthly);
    const res = await save({ daily: nextDaily, monthly: nextMonthly, liveMode: mode });
    setSaving(false);
    if (!res.ok) { toast.failure('Save failed', { label: 'Retry', onPress: () => persist(nextDaily) }); return false; }
    toast.success('Budget saved');
    return true;
  };

  const saveLimits = () => {
    const nextDaily = d && d > 0 ? d : null;
    if (value?.daily && !nextDaily) { setConfirmOff(true); return; }
    persist(nextDaily);
  };

  return (
    <HeroScreen
      contentWidth="form"
      heroHeight={300}
      bottomPadding={112}
      hero={
        <View>
          <TopBar title="Budget" onBack={() => router.back()} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20, paddingHorizontal: 24, marginTop: 20 }}>
            <ProgressRing progress={status ? status.used : 0} size={132} stroke={10} accessibilityLabel={status ? `${Math.round(status.used * 100)}% of today used` : 'No daily budget'}>
              <Text variant="headline-md" tone="inverse">{status ? `${Math.round(status.used * 100)}%` : '—'}</Text>
              <Text variant="caption" tone="soft">of today</Text>
            </ProgressRing>
            <View style={{ flex: 1, gap: 4 }}>
              {loading && !value ? <Skeleton width={120} height={32} tone="glass" /> : (
                <>
                  <Text variant="body-md" tone="soft">Left today</Text>
                  {status ? <Money amount={status.left} variant="display-md" on="gradient" /> : <Text variant="body-lg" tone="inverse">No daily limit</Text>}
                  {value?.monthly ? <Text variant="label-sm" weight={400} tone="soft">Month: {formatRM(monthSpent)} of {formatRM(value.monthly).replace('RM ', '')}</Text> : null}
                </>
              )}
            </View>
          </View>
        </View>
      }
      overlay={
        <ConfirmSheet
          visible={confirmOff}
          icon={Gauge}
          title="Turn off daily budget?"
          message={`“Left today” and limit alerts will stop.${m ? ` Your ${formatRM(m)} monthly limit stays.` : ''}`}
          confirmLabel="Turn off"
          cancelLabel="Keep it on"
          onConfirm={async () => { if (await persist(null)) setConfirmOff(false); }}
          onCancel={() => { setConfirmOff(false); if (value?.daily) setDaily(String(value.daily)); }}
        />
      }
    >
      <AmountField label="Monthly limit" value={monthly} onChangeText={onMonthly} placeholder="Not set" />
      <AmountField label="Daily limit" value={daily} onChangeText={(v) => { setDaily(v); setDailyTouched(true); }} placeholder="Not set" />
      {FloweNotifications.isAvailable && !widgetPinned && FloweNotifications.canRequestBudgetWidget() ? (
        <SettingsRow label="Add the budget widget" value="Left today on your home screen" icon={LayoutGrid} onPress={() => FloweNotifications.requestBudgetWidget()} />
      ) : null}
      <View style={{ height: 8 }} />
      <Button label="Save limits" onPress={saveLimits} loading={saving} loadingLabel="Saving…" fullWidth />
      {value?.daily ? <Button label="Turn off daily budget" variant="text" muted onPress={() => setConfirmOff(true)} style={{ alignSelf: 'center' }} /> : null}
    </HeroScreen>
  );
}
