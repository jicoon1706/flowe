import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { BellRing, ChartPie, Gauge, Repeat, Sparkles, Target } from 'lucide-react-native';
import { SettingsScreen } from '@/components/settings/SettingsScreen';
import { SegmentedToggle } from '@/components/ui/SegmentedToggle';
import { SettingsRow } from '@/components/ui/SettingsRow';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { Toggle } from '@/components/ui/Toggle';
import { useToast } from '@/components/ui/ToastProvider';
import { useAuth } from '@/context/AuthContext';
import { useBudgetSettings } from '@/src/hooks/useBudgetSettings';
import { useSettings } from '@/src/hooks/useSettings';
import { defaultLiveMode, type LiveBudgetMode } from '@/src/lib/budget';
import type { Settings } from '@/src/types';
import * as FloweNotifications from '@/modules/flowe-notifications';

type Col = keyof Pick<Settings, 'notif_expense' | 'notif_income' | 'notif_alert' | 'notif_recurring' | 'notif_tabung' | 'notif_milestone' | 'notif_cashflow' | 'notif_affirmation'>;

const ROWS: { label: string; meta: string; icon: typeof BellRing; cols: Col[] }[] = [
  { label: 'Detected transactions', meta: 'Ask me to confirm', icon: BellRing, cols: ['notif_expense', 'notif_income'] },
  { label: 'Budget alerts', meta: 'At 80% and 100% of daily limit', icon: Gauge, cols: ['notif_alert'] },
  { label: 'Recurring reminders', meta: 'Day before and on the day', icon: Repeat, cols: ['notif_recurring'] },
  { label: 'Tabung milestones', meta: 'Every 20% saved toward a goal', icon: Target, cols: ['notif_tabung', 'notif_milestone'] },
  { label: 'Monthly summary', meta: 'On the 1st', icon: ChartPie, cols: ['notif_cashflow'] },
  { label: 'Affirmations', meta: 'Once a day', icon: Sparkles, cols: ['notif_affirmation'] },
];

/**
 * settings/notifications — toggles save instantly; no primary button. Live
 * budget updates (Android) start the pinned notification: Daily / Monthly / Both.
 */
export default function NotificationSettingsScreen() {
  const toast = useToast();
  const { user } = useAuth();
  const { settings, loading, fetchSettings, updateSettings } = useSettings();
  const budget = useBudgetSettings(user?.id);
  const fetchBudget = budget.fetch;
  const [local, setLocal] = useState<Partial<Record<Col, boolean>>>({});

  useFocusEffect(useCallback(() => { if (user) { fetchSettings(user.id); fetchBudget(); } }, [user, fetchSettings, fetchBudget]));
  useEffect(() => { if (settings) setLocal(Object.fromEntries(ROWS.flatMap((r) => r.cols).map((c) => [c, !!settings[c]]))); }, [settings]);

  const toggle = async (cols: Col[], on: boolean) => {
    if (!user) return;
    const prev = { ...local };
    setLocal((l) => ({ ...l, ...Object.fromEntries(cols.map((c) => [c, on])) }));
    const res = await updateSettings(user.id, Object.fromEntries(cols.map((c) => [c, on])) as Partial<Settings>);
    if (!res.ok) { setLocal(prev); toast.failure('Couldn’t save that setting', { label: 'Retry', onPress: () => toggle(cols, on) }); }
  };

  const b = budget.value;
  const liveOn = !!b && b.liveMode !== 'off';
  const setLive = async (mode: LiveBudgetMode) => {
    if (!b) return;
    const res = await budget.save({ ...b, liveMode: mode });
    if (!res.ok) toast.failure('Couldn’t save that setting', { label: 'Retry', onPress: () => setLive(mode) });
  };

  return (
    <SettingsScreen title="Notifications">
      {loading && !settings ? (
        <View style={{ gap: 12 }}>{[0, 1, 2, 3].map((i) => <Skeleton key={i} height={48} radius={12} />)}</View>
      ) : (
        <View style={{ gap: 6 }}>
          {FloweNotifications.isAvailable && b ? (
            <>
              <SettingsRow
                label="Live budget updates"
                value="Pinned notification you can glance at"
                icon={Gauge}
                right={<Toggle value={liveOn} onValueChange={(on) => setLive(on ? defaultLiveMode(b.monthly) : 'off')} accessibilityLabel="Live budget updates" />}
              />
              {liveOn ? (
                <View style={{ gap: 8, marginBottom: 6 }}>
                  <SegmentedToggle
                    accessibilityLabel="Live update shows"
                    options={[{ value: 'daily', label: 'Daily' }, { value: 'monthly', label: 'Monthly' }, { value: 'both', label: 'Both' }]}
                    value={b.liveMode === 'off' ? 'daily' : b.liveMode}
                    onChange={(m) => setLive(m)}
                  />
                  {!b.monthly && b.liveMode !== 'daily' ? <Text variant="label-sm" weight={400} tone="muted">Monthly needs a monthly limit (Settings › Budget).</Text> : null}
                  {!b.daily && b.liveMode !== 'monthly' ? <Text variant="label-sm" weight={400} tone="muted">Daily needs a daily limit (Settings › Budget).</Text> : null}
                </View>
              ) : null}
            </>
          ) : null}
          {ROWS.map((r) => (
            <SettingsRow
              key={r.label}
              label={r.label}
              value={r.meta}
              icon={r.icon}
              right={<Toggle value={r.cols.every((c) => local[c])} onValueChange={(on) => toggle(r.cols, on)} accessibilityLabel={r.label} />}
            />
          ))}
        </View>
      )}
    </SettingsScreen>
  );
}
