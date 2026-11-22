import { useCallback, useMemo, useState } from 'react';
import { RefreshControl, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { BellRing, Ellipsis, Landmark, Pen, Plus, RefreshCw, Trash2, Wallet, ArrowDownRight, ArrowUpRight } from 'lucide-react-native';
import { colors } from '@/theme/tokens';
import { TransactionDetail } from '@/components/home/TransactionDetail';
import { TransactionList } from '@/components/home/TransactionList';
import { Button } from '@/components/ui/Button';
import { ConfirmSheet } from '@/components/ui/ConfirmSheet';
import { EmptyState } from '@/components/ui/EmptyState';
import { GlassChip } from '@/components/ui/GlassChip';
import { GlassIconButton } from '@/components/ui/GlassIconButton';
import { HeroScreen } from '@/components/ui/HeroScreen';
import { LogoWell } from '@/components/ui/LogoWell';
import { Money } from '@/components/ui/Money';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SegmentedToggle } from '@/components/ui/SegmentedToggle';
import { SettingsRow } from '@/components/ui/SettingsRow';
import { Sheet } from '@/components/ui/Sheet';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatTile } from '@/components/ui/StatTile';
import { Text } from '@/components/ui/Text';
import { TextInput } from '@/components/ui/TextInput';
import { TopBar } from '@/components/ui/TopBar';
import { useToast } from '@/components/ui/ToastProvider';
import { useAuth } from '@/context/AuthContext';
import { useLock } from '@/context/LockContext';
import { useAccounts } from '@/src/hooks/useAccounts';
import { useAccountTransactions } from '@/src/hooks/useAccountTransactions';
import { accountsRepository } from '@/src/repositories/accounts.repository';
import { verifyPin } from '@/src/lib/pinVerify';
import { parseAmount } from '@/src/lib/money';
import { HISTORY_PAGE_SIZE, historyPage, monthTotals } from '@/src/utils/accountHistory';
import { accountBalance, accountDomain, accountMask, type AnyAccount } from '@/src/utils/accountDisplay';
import { editParams, type TxWithAccounts } from '@/src/utils/transactionDisplay';
import { localYMD } from '@/src/utils/date';

type Filter = 'all' | 'in' | 'out';

/**
 * Bank (acc-account-id) and e-wallet (acc-wallet-id) detail: balance hero with
 * logo, this month's in/out tiles, full history. ⋯ = edit, auto-detect, delete.
 */
export function AccountDetailScreen({ accountId, kind }: { accountId: string; kind: 'bank' | 'wallet' }) {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const { locked } = useLock();
  const { accounts, fetchAccounts, loading: accLoading } = useAccounts();
  const { transactions, loading, error, refetch } = useAccountTransactions(accountId);
  const [filter, setFilter] = useState<Filter>('all');
  // Rows mounted in the history; grows by a page per "Show more", back to one page on a new filter.
  const [shown, setShown] = useState(HISTORY_PAGE_SIZE);
  const [menu, setMenu] = useState(false);
  const [filterSheet, setFilterSheet] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [detail, setDetail] = useState<TxWithAccounts | null>(null);
  const [form, setForm] = useState({ name: '', balance: '', last4: '' });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);

  useFocusEffect(useCallback(() => { fetchAccounts().then(() => setFetched(true)); refetch(); }, [fetchAccounts, refetch]));

  const all = accounts as AnyAccount[];
  const account = all.find((a) => a.id === accountId);
  const balance = account ? accountBalance(account) : 0;
  const ym = localYMD(new Date()).slice(0, 7);
  const monthName = new Date().toLocaleDateString('en-MY', { month: 'short' });
  const rows = transactions as TxWithAccounts[];
  // Direction relative to this account: money arriving is "+", leaving is "−".
  const dirFor = (t: TxWithAccounts) => (t.to_account_id === accountId && t.from_account_id !== accountId ? 'income' : 'expense') as 'income' | 'expense';
  const inOut = useMemo(() => {
    const totals = monthTotals(rows, ym);
    let tin = totals.income;
    let tout = totals.expense;
    for (const t of rows) {
      if (t.date.slice(0, 7) !== ym || t.type === 'income' || t.type === 'expense') continue;
      if (dirFor(t) === 'income') tin += Number(t.amount); else tout += Number(t.amount);
    }
    return { tin: Math.round(tin * 100) / 100, tout: Math.round(tout * 100) / 100 };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, ym, accountId]);
  const filtered = rows.filter((t) => filter === 'all' || (filter === 'in' ? dirFor(t) === 'income' : dirFor(t) === 'expense'));
  const page = historyPage(filtered, shown);

  const openEdit = () => {
    if (!account) return;
    setForm({ name: account.name, balance: balance.toFixed(2), last4: account.bank_accounts?.account_number ?? '' });
    setFormError(null);
    setMenu(false);
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!account) return;
    const name = form.name.trim();
    const bal = parseAmount(form.balance);
    if (!name) { setFormError('Name is required'); return; }
    if (bal === null) { setFormError('Enter a valid balance'); return; }
    setSaving(true);
    const r1 = await accountsRepository.updateAccount(account.id, { name });
    const r2 = bal !== balance ? await accountsRepository.setBalance(account.id, kind, bal) : { ok: true as const, data: undefined };
    const r3 = kind === 'bank' && form.last4 !== (account.bank_accounts?.account_number ?? '') ? await accountsRepository.updateBankAccountNumber(account.id, form.last4) : { ok: true as const, data: undefined };
    setSaving(false);
    if (!r1.ok || !r2.ok || !r3.ok) { toast.failure('Couldn’t save changes', { label: 'Retry', onPress: saveEdit }); return; }
    setEditing(false);
    await fetchAccounts();
    toast.success('Account updated');
  };

  const remove = async () => {
    if (!account) return;
    if (!(await verifyPin(pin, user?.id))) { setPinError('Wrong PIN. Try again.'); setPin(''); return; }
    const res = await accountsRepository.softDeleteAccount(account.id);
    if (!res.ok) { toast.failure('Couldn’t remove account', { label: 'Retry', onPress: remove }); return; }
    setDeleting(false);
    toast.success(`${account.name} deleted`);
    router.back();
  };

  const loadingHero = !fetched && accLoading;
  const Icon = kind === 'wallet' ? Wallet : Landmark;

  return (
    <HeroScreen
      contentWidth="form"
      heroHeight={360}
      refreshControl={<RefreshControl refreshing={loading && fetched} onRefresh={() => { refetch(); fetchAccounts(); }} tintColor={colors['on-primary']} />}
      hero={
        <View>
          <TopBar onBack={() => router.back()} right={<GlassIconButton icon={Ellipsis} accessibilityLabel="More options" onPress={() => setMenu(true)} disabled={!account} />} />
          <View style={{ alignItems: 'center', gap: 12, marginTop: 8 }}>
            {loadingHero ? (
              <>
                <Skeleton width={56} height={56} tone="glass" />
                <Skeleton width={140} height={14} tone="glass" />
                <Skeleton width={220} height={56} tone="glass" />
              </>
            ) : (
              <>
                <LogoWell domain={accountDomain(account)} brand={account?.name} fallback={Icon} size={56} on="gradient" />
                <Text variant="body-lg" tone="soft">{account?.name ?? ''}</Text>
                <Money amount={balance} variant="numeric-lg" on="gradient" smallCurrency masked={locked} />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <GlassChip label={kind === 'wallet' ? 'E-wallet' : accountMask(account ?? ({} as AnyAccount)) ?? 'Bank'} />
                  <GlassChip icon={BellRing} label="Auto-detect" onPress={() => router.push('/settings/auto-detect')} />
                </View>
              </>
            )}
          </View>
        </View>
      }
      overlay={
        <>
          <Sheet visible={menu} onClose={() => setMenu(false)} title={account?.name}>
            <SettingsRow label="Edit details" value={kind === 'bank' ? 'Name, balance, last 4 digits' : 'Name, balance'} icon={Pen} onPress={openEdit} />
            <SettingsRow label="Add transaction" icon={Plus} onPress={() => { setMenu(false); router.push({ pathname: '/add-transaction', params: { presetAccountId: accountId, returnTo: `/home/${kind === 'wallet' ? 'wallet' : 'account'}/${accountId}`, nonce: String(Date.now()) } }); }} />
            <SettingsRow label="Auto-detect" value="Which alerts file into this account" icon={BellRing} onPress={() => { setMenu(false); router.push('/settings/auto-detect'); }} />
            <SettingsRow label="Delete account" icon={Trash2} onPress={() => { setMenu(false); setPin(''); setPinError(null); setDeleting(true); }} />
          </Sheet>
          <Sheet visible={editing} onClose={() => setEditing(false)} title="Edit account" scroll dismissible={!saving}>
            <View style={{ gap: 14 }}>
              <TextInput label="Name" value={form.name} onChangeText={(name) => setForm((f) => ({ ...f, name }))} />
              <TextInput label="Balance" prefix="RM" keyboardType="decimal-pad" value={form.balance} onChangeText={(b) => setForm((f) => ({ ...f, balance: b }))} />
              {kind === 'bank' ? (
                <TextInput label="Last 4 digits (matches bank alerts)" keyboardType="number-pad" maxLength={4} value={form.last4} onChangeText={(l) => setForm((f) => ({ ...f, last4: l.replace(/\D/g, '') }))} />
              ) : null}
              {formError ? <Text variant="label-sm" accessibilityRole="alert">{formError}</Text> : null}
              <Button label="Save" onPress={saveEdit} loading={saving} loadingLabel="Saving…" fullWidth />
            </View>
          </Sheet>
          <ConfirmSheet
            visible={deleting}
            title={`Delete ${account?.name ?? 'this account'}?`}
            message={`It leaves your accounts and totals. Its ${rows.length} transaction${rows.length === 1 ? '' : 's'} stay in your history. Enter your PIN to confirm.`}
            confirmLabel="Delete account"
            loadingLabel="Deleting…"
            confirmDisabled={pin.length !== 6}
            onConfirm={remove}
            onCancel={() => setDeleting(false)}
          >
            <TextInput label="PIN" value={pin} onChangeText={(v) => { setPin(v.replace(/\D/g, '').slice(0, 6)); setPinError(null); }} keyboardType="number-pad" secureTextEntry maxLength={6} error={pinError} />
          </ConfirmSheet>
          <TransactionDetail
            visible={!!detail}
            transaction={detail}
            accounts={all}
            masked={locked}
            onClose={() => setDetail(null)}
            onChanged={() => { refetch(); fetchAccounts(); }}
            onEdit={(tx) => router.push({ pathname: '/add-transaction', params: { ...editParams(tx), returnTo: `/home/${kind === 'wallet' ? 'wallet' : 'account'}/${accountId}` } })}
          />
          <Sheet visible={filterSheet} onClose={() => setFilterSheet(false)} title="Show">
            <SegmentedToggle options={[{ value: 'all', label: 'All' }, { value: 'in', label: 'Money in' }, { value: 'out', label: 'Money out' }]} value={filter} onChange={(f) => { setFilter(f); setShown(HISTORY_PAGE_SIZE); setFilterSheet(false); }} />
          </Sheet>
        </>
      }
    >
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <StatTile label={`In · ${monthName}`} icon={ArrowUpRight} amount={inOut.tin} direction="income" masked={locked} />
        <StatTile label={`Out · ${monthName}`} icon={ArrowDownRight} amount={inOut.tout} direction="expense" masked={locked} />
      </View>
      <SectionHeader title="History" actionLabel={filter === 'all' ? 'Filter' : filter === 'in' ? 'Money in' : 'Money out'} onAction={() => setFilterSheet(true)} />
      {loading && rows.length === 0 ? (
        <TransactionList transactions={[]} loading skeletonRows={4} />
      ) : error && rows.length === 0 ? (
        <EmptyState icon={RefreshCw} title="Couldn’t load history" body="Check your connection and try again." ctaLabel="Try again" onCta={refetch} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Icon} title="Nothing here yet" body="Transactions for this account show up here." />
      ) : (
        <>
          <TransactionList transactions={page.visible} directionFor={dirFor} masked={locked} onPress={setDetail} />
          {page.remaining > 0 ? (
            <Button
              label="Show more"
              variant="action"
              onPress={() => setShown((n) => n + HISTORY_PAGE_SIZE)}
              accessibilityHint={`${page.remaining} more transactions`}
            />
          ) : null}
        </>
      )}
    </HeroScreen>
  );
}
