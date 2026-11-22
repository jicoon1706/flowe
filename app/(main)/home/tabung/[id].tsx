import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { Pressable } from '@/components/ui/Pressable';
import { ArrowDownRight, CalendarDays, Check, Pencil, PiggyBank, Plus, RefreshCw, SlidersHorizontal } from 'lucide-react-native';
import { colors, radius } from '@/theme/tokens';
import { TabungBreakdownSheet } from '@/components/tabung/TabungBreakdownSheet';
import { TabungMoneySheet } from '@/components/tabung/TabungMoneySheet';
import { TabungMonthStrip } from '@/components/tabung/TabungMonthStrip';
import { TabungSettingsSheet, type TabungSettingsValues } from '@/components/tabung/TabungSettingsSheet';
import { Button } from '@/components/ui/Button';
import { ConfirmSheet } from '@/components/ui/ConfirmSheet';
import { EmptyState } from '@/components/ui/EmptyState';
import { GlassChip } from '@/components/ui/GlassChip';
import { GlassIconButton } from '@/components/ui/GlassIconButton';
import { HeroScreen } from '@/components/ui/HeroScreen';
import { ResponsiveColumns } from '@/components/ui/ResponsiveGrid';
import { Money } from '@/components/ui/Money';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Sheet } from '@/components/ui/Sheet';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatTile } from '@/components/ui/StatTile';
import { Text } from '@/components/ui/Text';
import { TopBar } from '@/components/ui/TopBar';
import { useToast } from '@/components/ui/ToastProvider';
import { AccountPill } from '@/components/ui/AccountPill';
import { AccountSelector } from '@/components/ui/AccountSelector';
import { useAuth } from '@/context/AuthContext';
import { useLock } from '@/context/LockContext';
import { useAccounts } from '@/src/hooks/useAccounts';
import { checkTabungMilestone } from '@/src/services/alerts';
import { useTabungProgress } from '@/src/hooks/useTabungProgress';
import { accountsRepository } from '@/src/repositories/accounts.repository';
import { transactionsRepository } from '@/src/repositories/transactions.repository';
import { mostUsedFunding, monthsLeft, onTrackMonthly, usualAmount } from '@/src/lib/tabungProgress';
import { formatRM } from '@/src/lib/money';
import { readLastUsed, writeLastUsed } from '@/src/lib/lastUsed';
import { notify } from '@/src/services/notifications';
import { accountDomain, spendableAccounts, type AnyAccount } from '@/src/utils/accountDisplay';
import { localYMD } from '@/src/utils/date';
import * as FloweNotifications from '@/modules/flowe-notifications';

function monthYear(ymd: string): string {
  const [y, m] = ymd.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-MY', { month: 'short', year: 'numeric' });
}

/**
 * tabung/[id] — section N. Ring = Σ tabung_topup since from_date ÷ target
 * (pay-outs never move it back); balance and paid-out shown separately; month
 * strip + breakdown; goal reached; per-Tabung progress mode.
 */
export default function TabungScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const accountId = id ?? '';
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const { locked } = useLock();
  const { account, tabung, rows, flows, progress, loading, error, refresh } = useTabungProgress(accountId);
  const { accounts, fetchAccounts } = useAccounts();
  const [money, setMoney] = useState<'in' | 'out' | null>(null);
  const [breakdown, setBreakdown] = useState(false);
  const [settings, setSettings] = useState<{ focusTarget: boolean } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [returnTo, setReturnTo] = useState<string | null>(null);
  const [returnPicker, setReturnPicker] = useState(false);
  const [reachedOpen, setReachedOpen] = useState(false);
  const [lastFunding, setLastFunding] = useState<string | null>(null);

  useFocusEffect(useCallback(() => { fetchAccounts(); refresh(); }, [fetchAccounts, refresh]));
  useEffect(() => { readLastUsed().then((l) => setLastFunding(l.tabungFunding?.[accountId] ?? null)); }, [accountId]);

  const spendable = spendableAccounts(accounts as AnyAccount[]);
  const target = Number(tabung?.target_amount) || 0;
  const name = account?.name ?? 'Tabung';
  const counted = progress ? (tabung?.progress_mode === 'balance' ? progress.balance : progress.contributed) : 0;
  const onTrack = progress && tabung ? onTrackMonthly(progress.remaining, tabung.to_date) : 0;
  const fundedMost = useMemo(() => mostUsedFunding(rows), [rows]);
  const defaultFunding = lastFunding ?? fundedMost ?? spendable[0]?.id ?? null;
  const reachedMonths = progress?.months.length ?? 0;

  // Goal reached: show its sheet once per visit.
  useEffect(() => { if (progress?.reached) setReachedOpen(true); }, [progress?.reached]);

  // The Tabung widget follows the Tabung last opened, with the same rule as this ring.
  useEffect(() => {
    if (!progress || !account || !tabung) return;
    FloweNotifications.setTabungWidget({
      id: account.id,
      name: account.name,
      counted: tabung.progress_mode === 'balance' ? progress.balance : progress.contributed,
      target: Number(tabung.target_amount) || 0,
      balance: progress.balance,
      percent: progress.percent,
    });
    // Settings › Notifications › Tabung milestones (every 20 %).
    checkTabungMilestone({
      id: account.id,
      name: account.name,
      percent: progress.percent,
      target: Number(tabung.target_amount) || 0,
      counted: tabung.progress_mode === 'balance' ? progress.balance : progress.contributed,
    });
  }, [progress, account, tabung]);

  const statusChip = !progress || !tabung ? null
    : target <= 0 ? <GlassChip icon={Plus} label="Set a target" onPress={() => setSettings({ focusTarget: true })} />
    : progress.reached ? <GlassChip icon={Check} label={`Goal reached · ${monthYear(localYMD(new Date()))}`} />
    : <GlassChip icon={CalendarDays} label={onTrack > 0 ? `${formatRM(onTrack)}/month · done by ${monthYear(tabung.to_date)}` : `Target · ${monthYear(tabung.to_date)}`} />;

  const submitMoney = async (amount: number, fundingId: string) => {
    if (!user || !account) return false;
    const res = await transactionsRepository.create({
      user_id: user.id,
      type: money === 'in' ? 'tabung_topup' : 'tabung_withdraw',
      name: money === 'in' ? `Top up · ${name}` : `Pay out · ${name}`,
      amount,
      to_account_id: account.id,
      from_account_id: fundingId,
      date: localYMD(new Date()),
    });
    if (!res.ok) {
      toast.failure(money === 'in' ? `Top up failed · nothing was moved` : 'Pay out failed · nothing was moved', { label: 'Retry', onPress: () => submitMoney(amount, fundingId) });
      return false;
    }
    if (money === 'in') await writeLastUsed({ tabungFunding: { [account.id]: fundingId } });
    notify({ type: 'tabung', emoji: '🐷', message: money === 'in' ? 'Tabung top-up' : 'Tabung pay-out', sub_text: `${name} • ${formatRM(amount)}`, related_entity_id: account.id });
    toast.success(money === 'in' ? `Added ${formatRM(amount)} to ${name}` : `Paid out ${formatRM(amount)}`);
    fetchAccounts();
    return true;
  };

  const saveSettings = async (v: TabungSettingsValues) => {
    if (!account) return false;
    const res = await accountsRepository.updateTabungGoal(account.id, { name: v.name, target_amount: v.target, progress_mode: v.mode });
    if (!res.ok) { toast.failure('Couldn’t save Tabung', { label: 'Retry', onPress: () => saveSettings(v) }); return false; }
    toast.success('Tabung updated');
    refresh();
    return true;
  };

  const remove = async () => {
    if (!user || !account || !tabung) return;
    const saved = Number(tabung.saved_amount) || 0;
    const dest = returnTo ?? fundedMost ?? spendable[0]?.id ?? null;
    if (saved > 0 && dest) {
      const back = await transactionsRepository.create({ user_id: user.id, type: 'tabung_withdraw', name: `Closed · ${name}`, amount: saved, to_account_id: account.id, from_account_id: dest, date: localYMD(new Date()) });
      if (!back.ok) { toast.failure('Couldn’t move the money back', { label: 'Retry', onPress: remove }); return; }
    }
    const res = await accountsRepository.softDeleteAccount(account.id);
    if (!res.ok) { toast.failure('Couldn’t delete Tabung', { label: 'Retry', onPress: remove }); return; }
    FloweNotifications.setTabungWidget(null);
    setDeleting(false);
    toast.success(`${name} deleted`);
    router.back();
  };

  const returnAccount = spendable.find((a) => a.id === (returnTo ?? fundedMost ?? spendable[0]?.id));
  const saved = Number(tabung?.saved_amount) || 0;
  const firstLoad = loading && !progress;

  return (
    <HeroScreen
      tabletLayout="panel"
      heroHeight={400}
      refreshControl={<RefreshControl refreshing={loading && !!progress} onRefresh={refresh} tintColor={colors['on-primary']} />}
      hero={
        <View>
          <TopBar title={name} onBack={() => router.back()} right={
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {/* n-tabung-edit-entry / t-n-tabung-edit-entry: Edit beside Settings. */}
              {tabung ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Edit name, target and dates"
                  onPress={() => router.push(`/tabung/edit/${id}` as Href)}
                  style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, paddingLeft: 14, paddingRight: 18, borderRadius: radius.full, backgroundColor: colors.glass, opacity: pressed ? 0.8 : 1 })}
                >
                  <Pencil size={18} color={colors['on-primary']} strokeWidth={1.75} />
                  <Text variant="label-lg" tone="inverse">Edit</Text>
                </Pressable>
              ) : null}
              <GlassIconButton icon={SlidersHorizontal} accessibilityLabel="Tabung settings" onPress={() => setSettings({ focusTarget: false })} disabled={!tabung} />
            </View>
          } />
          <View style={{ alignItems: 'center', gap: 14, marginTop: 16 }}>
            <ProgressRing progress={firstLoad ? 0 : progress?.progress ?? 0} size={196} stroke={12} accessibilityLabel={progress ? `${progress.percent}% of goal` : 'Loading'}>
              {firstLoad ? (
                <Skeleton width={110} height={40} tone="glass" />
              ) : (
                <View style={{ alignItems: 'center' }}>
                  <Text variant="label-sm" weight={400} tone="soft">{tabung?.progress_mode === 'balance' ? 'In Tabung now' : 'Saved toward goal'}</Text>
                  <Money amount={counted} variant="display-md" on="gradient" masked={locked} />
                  {target > 0 ? <Text variant="label-sm" weight={400} tone="soft">of {formatRM(target)} · {progress?.percent ?? 0}%</Text> : null}
                </View>
              )}
            </ProgressRing>
            {statusChip}
          </View>
        </View>
      }
      overlay={
        <>
          {progress && tabung ? (
            <TabungMoneySheet
              visible={money !== null}
              mode={money ?? 'in'}
              tabungName={name}
              accounts={spendable}
              defaultAccountId={money === 'out' ? fundedMost ?? defaultFunding : defaultFunding}
              usual={usualAmount(flows, money === 'out' ? 'tabung_withdraw' : 'tabung_topup')}
              quickAmounts={money === 'in' ? [onTrack] : []}
              target={target}
              counted={counted}
              balance={saved}
              onClose={() => setMoney(null)}
              onSubmit={submitMoney}
            />
          ) : null}
          {progress ? <TabungBreakdownSheet visible={breakdown} onClose={() => setBreakdown(false)} name={name} months={progress.months} target={target} /> : null}
          <TabungSettingsSheet
            visible={settings !== null}
            focusTarget={settings?.focusTarget}
            onClose={() => setSettings(null)}
            initial={{ name, target, mode: tabung?.progress_mode ?? 'contributed' }}
            contributed={progress?.contributed ?? 0}
            balance={saved}
            onSave={saveSettings}
            onDelete={() => { setSettings(null); setDeleting(true); }}
          />
          <ConfirmSheet
            visible={deleting}
            icon={PiggyBank}
            title={`Delete ${name}?`}
            message={saved > 0 ? `${formatRM(saved)} saved moves back to ${returnAccount?.name ?? 'your account'}. Its history stays in your transactions.` : 'It leaves your accounts. Its history stays in your transactions.'}
            confirmLabel="Delete Tabung"
            loadingLabel="Deleting…"
            confirmDisabled={saved > 0 && !returnAccount}
            onConfirm={remove}
            onCancel={() => setDeleting(false)}
          >
            {saved > 0 ? (
              <AccountPill label={returnAccount?.name ?? 'Choose account'} domain={accountDomain(returnAccount)} onPress={() => setReturnPicker(true)} accessibilityLabel={`Return money to ${returnAccount?.name ?? 'an account'}`} />
            ) : null}
          </ConfirmSheet>
          <AccountSelector visible={returnPicker} onClose={() => setReturnPicker(false)} title="Move the money to" accounts={spendable} selectedId={returnAccount?.id} onSelect={setReturnTo} />
          <Sheet visible={reachedOpen && !!progress?.reached} onClose={() => setReachedOpen(false)} title="Goal reached">
            <View style={{ gap: 14 }}>
              <Text variant="body-md" tone="muted">
                You put {formatRM(progress?.contributed ?? 0)} in. {progress?.paidOut ? `${formatRM(progress.paidOut)} went to the payments you planned, so ${formatRM(saved)} is still here.` : `${formatRM(saved)} is in the Tabung.`}
              </Text>
              <View style={{ gap: 4 }}>
                <Button label="Raise the target" onPress={() => { setReachedOpen(false); setSettings({ focusTarget: true }); }} fullWidth />
                <Button label="Keep it as is" variant="text" onPress={() => setReachedOpen(false)} style={{ alignSelf: 'center' }} />
              </View>
            </View>
          </Sheet>
        </>
      }
    >
      {firstLoad ? (
        <View style={{ gap: 12 }} accessibilityLabel="Loading Tabung">
          <Skeleton height={84} radius={radius.sm} />
          <View style={{ flexDirection: 'row', gap: 8 }}><Skeleton height={84} radius={radius.sm} flex={1} /><Skeleton height={84} radius={radius.sm} flex={1} /></View>
          <Skeleton height={120} radius={radius.sm} />
        </View>
      ) : error && !progress ? (
        <EmptyState icon={RefreshCw} title="Couldn’t load this Tabung" body="Check your connection and try again." ctaLabel="Try again" onCta={refresh} />
      ) : progress ? (
        <>
          <ResponsiveColumns>
          <>
            <View style={{ backgroundColor: colors['surface-container'], borderRadius: radius.sm, padding: 16, gap: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text variant="label-sm" tone="meta">Saved toward goal</Text>
                <Money amount={progress.contributed} direction="income" variant="headline-md" weight={600} on="grey" masked={locked} />
              </View>
              <Text variant="label-sm" tone="meta">
                {progress.reached ? `Goal reached in ${reachedMonths} month${reachedMonths === 1 ? '' : 's'}.` : 'Every top-up counts. Pay-outs never move this back.'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <StatTile label="In Tabung now" icon={PiggyBank} amount={saved} masked={locked} />
              <StatTile label="Paid out" icon={ArrowDownRight} amount={progress.paidOut} direction={progress.paidOut ? 'expense' : 'none'} masked={locked} />
            </View>
          </>
          <>
            <SectionHeader title="This goal by month" actionLabel="Breakdown" onAction={() => setBreakdown(true)} />
            {progress.months.length ? (
              <TabungMonthStrip months={progress.months} projected={!progress.reached && tabung && monthsLeft(tabung.to_date) > 0 ? onTrack : null} />
            ) : (
              <Text variant="body-md" tone="muted">Your first top-up starts the month strip.</Text>
            )}
          </>
          </ResponsiveColumns>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button label="Add money" icon={Plus} onPress={() => setMoney('in')} style={{ flex: 1 }} />
            <Button label="Pay out" icon={ArrowDownRight} variant="action" onPress={() => setMoney('out')} disabled={saved <= 0} />
          </View>
        </>
      ) : null}
    </HeroScreen>
  );
}
