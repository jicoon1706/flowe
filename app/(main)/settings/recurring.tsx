import { useCallback, useMemo, useState } from 'react';
import { Platform, ScrollView, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { CalendarDays, CalendarX, Landmark, Plus, Repeat, Wallet } from 'lucide-react-native';
import { expenseCategories, incomeCategories } from '@/constants/categories';
import { categoryIcon, categoryOptions } from '@/constants/categoryIcons';
import { SettingsScreen } from '@/components/settings/SettingsScreen';
import { AccountPill } from '@/components/ui/AccountPill';
import { AccountSelector } from '@/components/ui/AccountSelector';
import { AmountField } from '@/components/ui/AmountField';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { ConfirmSheet } from '@/components/ui/ConfirmSheet';
import { EmptyState } from '@/components/ui/EmptyState';
import { InlineError } from '@/components/ui/InlineError';
import { SegmentedToggle } from '@/components/ui/SegmentedToggle';
import { Sheet } from '@/components/ui/Sheet';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatTile } from '@/components/ui/StatTile';
import { TextInput } from '@/components/ui/TextInput';
import { TransactionRow } from '@/components/ui/TransactionRow';
import { useToast } from '@/components/ui/ToastProvider';
import { useAuth } from '@/context/AuthContext';
import { useAccounts } from '@/src/hooks/useAccounts';
import { useCustomCategories } from '@/src/hooks/useCustomCategories';
import { useRecurring } from '@/src/hooks/useRecurring';
import { addInterval, scheduleRecurringReminders } from '@/src/services/recurring';
import { readLastUsed } from '@/src/lib/lastUsed';
import { parseAmount, roundCents } from '@/src/lib/money';
import { accountDomain, spendableAccounts, type AnyAccount } from '@/src/utils/accountDisplay';
import { localYMD } from '@/src/utils/date';
import type { RecurringFrequency, RecurringRule } from '@/src/types';

type Kind = 'expense' | 'income' | 'transfer';
const FREQ_LABEL: Record<RecurringFrequency, string> = { weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly' };
const PER_MONTH: Record<RecurringFrequency, number> = { weekly: 52 / 12, monthly: 1, yearly: 1 / 12 };

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function parseYMD(s: string): Date {
  const [y, m, d] = s.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

/**
 * settings/recurring — bills that feed the due-today modal. Add sheet defaults:
 * Monthly, last-used account, next date one cycle from today.
 */
export default function RecurringScreen() {
  const toast = useToast();
  const { user } = useAuth();
  const { recurringRules, loading, fetchRecurring, createRecurring, updateRecurring, deleteRecurring, updateStatus } = useRecurring();
  const { accounts, fetchAccounts } = useAccounts();
  const { categories: custom, fetchCategories } = useCustomCategories();
  const [editing, setEditing] = useState<{ rule: RecurringRule | null } | null>(null);
  const [kind, setKind] = useState<Kind>('expense');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [freq, setFreq] = useState<RecurringFrequency>('monthly');
  const [accountId, setAccountId] = useState<string | null>(null);
  const [category, setCategory] = useState('bills');
  const [next, setNext] = useState(new Date());
  const [end, setEnd] = useState<Date | null>(null);
  const [datePicker, setDatePicker] = useState<'next' | 'end' | null>(null);
  const [accPicker, setAccPicker] = useState(false);
  const [catPicker, setCatPicker] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; amount?: string }>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<RecurringRule | null>(null);
  const [fetched, setFetched] = useState(false);

  const load = useCallback(async () => { await fetchRecurring(); setFetched(true); fetchAccounts(); if (user) fetchCategories(user.id); }, [fetchRecurring, fetchAccounts, fetchCategories, user]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const spendable = spendableAccounts(accounts as AnyAccount[]);
  const account = spendable.find((a) => a.id === accountId);
  const active = recurringRules.filter((r) => r.status !== 'ended');
  const monthlyTotal = roundCents(active.filter((r) => r.status === 'active' && r.type === 'expense').reduce((s, r) => s + Number(r.amount) * PER_MONTH[r.frequency], 0));
  const nextDue = [...active].filter((r) => r.status === 'active').sort((a, b) => (a.next_date ?? a.start_date).localeCompare(b.next_date ?? b.start_date))[0];
  const options = useMemo(() => categoryOptions(kind === 'income' ? incomeCategories : expenseCategories, custom, kind === 'income' ? 'income' : 'expense'), [kind, custom]);
  const endInvalid = !!end && localYMD(end) < localYMD(next);

  const open = async (rule: RecurringRule | null) => {
    const last = await readLastUsed();
    setKind(rule?.type ?? 'expense');
    setName(rule?.name ?? '');
    setAmount(rule ? String(rule.amount) : '');
    setFreq(rule?.frequency ?? 'monthly');
    setAccountId(rule ? (rule.type === 'income' ? rule.to_account_id : rule.from_account_id) ?? null : last.accountId ?? spendable[0]?.id ?? null);
    setCategory(rule?.category ?? 'bills');
    const today = localYMD(new Date());
    setNext(parseYMD(rule ? rule.next_date ?? rule.start_date : addInterval(today, 'monthly', new Date().getDate())));
    setEnd(rule?.end_date ? parseYMD(rule.end_date) : null);
    setErrors({});
    setEditing({ rule });
  };

  const save = async () => {
    if (!user || kind === 'transfer' || endInvalid) return;
    const amt = parseAmount(amount);
    const next_errors = { name: name.trim() ? undefined : 'Give the bill a name', amount: amt && amt > 0 ? undefined : 'Enter an amount above RM 0.00' };
    setErrors(next_errors);
    if (next_errors.name || next_errors.amount || !amt) return;
    setSaving(true);
    const accountField = kind === 'income' ? { to_account_id: accountId ?? undefined } : { from_account_id: accountId ?? undefined };
    const rule = editing?.rule;
    const res = rule
      ? await updateRecurring(rule.id, { name: name.trim(), amount: amt, frequency: freq, category, next_date: localYMD(next), end_date: end ? localYMD(end) : undefined, ...accountField })
      : await createRecurring({ user_id: user.id, type: kind, name: name.trim(), amount: amt, category, frequency: freq, start_date: localYMD(next), next_date: localYMD(next), end_date: end ? localYMD(end) : undefined, ...accountField });
    setSaving(false);
    if (!res.ok) { toast.failure('Couldn’t save recurring', { label: 'Retry', onPress: save }); return; }
    scheduleRecurringReminders();
    setEditing(null);
    toast.success(rule ? 'Recurring updated' : `Recurring added · ${name.trim()}`);
    load();
  };

  const togglePause = async (rule: RecurringRule) => {
    const res = await updateStatus(rule.id, rule.status === 'paused' ? 'active' : 'paused');
    if (!res.ok) { toast.failure('Couldn’t update that bill', { label: 'Retry', onPress: () => togglePause(rule) }); return; }
    setEditing(null);
    scheduleRecurringReminders();
    load();
  };

  const remove = async () => {
    if (!deleting) return;
    const res = await deleteRecurring(deleting.id);
    if (!res.ok) { toast.failure('Delete failed', { label: 'Retry', onPress: remove }); return; }
    toast.success(`${deleting.name} deleted`);
    setDeleting(null);
    scheduleRecurringReminders();
    load();
  };

  const accountName = (r: RecurringRule) => spendable.find((a) => a.id === (r.type === 'income' ? r.to_account_id : r.from_account_id))?.name;

  return (
    <SettingsScreen
      title="Recurring"
      overlay={
        <>
          <Sheet visible={!!editing} onClose={() => setEditing(null)} title={editing?.rule ? 'Edit recurring' : 'Add recurring'} scroll dismissible={!saving}>
            <View style={{ gap: 16 }}>
              {!editing?.rule ? (
                <SegmentedToggle options={[{ value: 'expense', label: 'Expense' }, { value: 'income', label: 'Income' }, { value: 'transfer', label: 'Transfer' }]} value={kind} onChange={(k) => { setKind(k); setCategory(k === 'income' ? 'salary' : 'bills'); }} accessibilityLabel="Type" />
              ) : null}
              <TextInput label="Name" value={name} onChangeText={(t) => { setName(t); setErrors((e) => ({ ...e, name: undefined })); }} error={errors.name} autoCapitalize="words" />
              <AmountField label="Amount" value={amount} onChangeText={(t) => { setAmount(t); setErrors((e) => ({ ...e, amount: undefined })); }} error={errors.amount} />
              <SegmentedToggle options={(['weekly', 'monthly', 'yearly'] as const).map((f) => ({ value: f, label: FREQ_LABEL[f] }))} value={freq} onChange={setFreq} accessibilityLabel="How often" />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <AccountPill label={account?.name ?? 'Account'} domain={accountDomain(account)} icon={account?.type === 'wallet' ? Wallet : Landmark} onPress={() => setAccPicker(true)} />
                <AccountPill label={`Next: ${next.toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}`} plainIcon={CalendarDays} onPress={() => setDatePicker('next')} accessibilityLabel="Next date" />
                {kind !== 'transfer' ? <AccountPill label={options.find((o) => o.value === category)?.label ?? category} plainIcon={categoryIcon(category)} onPress={() => setCatPicker(true)} accessibilityLabel="Category" /> : null}
                <AccountPill label={end ? `Ends ${end.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}` : 'No end date'} plainIcon={CalendarX} onPress={() => setDatePicker('end')} invalid={endInvalid} accessibilityLabel="End date" />
              </View>
              {kind === 'transfer' ? <InlineError message="Recurring transfers aren’t supported yet." /> : null}
              {endInvalid ? <InlineError message="The end date must be on or after the next date." /> : null}
              {end ? <Button label="Remove end date" variant="text" muted onPress={() => setEnd(null)} style={{ alignSelf: 'flex-start' }} /> : null}
              <View style={{ gap: 4 }}>
                <Button label="Save recurring" onPress={save} loading={saving} loadingLabel="Saving…" disabled={kind === 'transfer' || endInvalid} fullWidth />
                {editing?.rule ? (
                  <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                    <Button label={editing.rule.status === 'paused' ? 'Resume' : 'Pause'} variant="text" muted onPress={() => editing.rule && togglePause(editing.rule)} />
                    <Button label="Delete" variant="text" muted onPress={() => { const r = editing.rule; setEditing(null); setDeleting(r); }} />
                  </View>
                ) : null}
              </View>
            </View>
            {datePicker ? (
              <DateTimePicker
                value={datePicker === 'next' ? next : end ?? next}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={(e: DateTimePickerEvent, d?: Date) => { const which = datePicker; setDatePicker(null); if (d && e.type === 'set') (which === 'next' ? setNext : setEnd)(d); }}
              />
            ) : null}
            <AccountSelector visible={accPicker} onClose={() => setAccPicker(false)} accounts={spendable} selectedId={accountId} onSelect={setAccountId} title={kind === 'income' ? 'Pay into' : 'Pay from'} />
            <Sheet visible={catPicker} onClose={() => setCatPicker(false)} title="Category" scroll>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {options.map((o) => <Chip key={o.value} label={o.label} icon={o.icon} selected={o.value === category} onPress={() => { setCategory(o.value); setCatPicker(false); }} />)}
              </View>
            </Sheet>
          </Sheet>
          <ConfirmSheet
            visible={!!deleting}
            icon={Repeat}
            title={`Delete ${deleting?.name ?? 'this bill'}?`}
            message="It stops appearing in the due-today list and its reminders stop. Payments already logged stay."
            confirmLabel="Delete recurring"
            loadingLabel="Deleting…"
            onConfirm={remove}
            onCancel={() => setDeleting(null)}
          />
        </>
      }
    >
      {loading && !fetched ? (
        <View style={{ gap: 12 }}><View style={{ flexDirection: 'row', gap: 8 }}><Skeleton height={84} radius={12} flex={1} /><Skeleton height={84} radius={12} flex={1} /></View>{[0, 1, 2].map((i) => <Skeleton key={i} height={48} radius={12} />)}</View>
      ) : (
        <>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <StatTile label="Monthly total" icon={Repeat} amount={monthlyTotal} />
            <StatTile label="Next due" icon={CalendarDays} amount={nextDue ? Number(nextDue.amount) : 0} />
          </View>
          {active.length === 0 ? (
            <EmptyState icon={Repeat} title="No recurring bills yet" body="Add the bills you pay every month and Flowe asks you to confirm each one on its day." />
          ) : (
            <ScrollView scrollEnabled={false}>
              {active.map((r) => {
                const day = parseYMD(r.next_date ?? r.start_date).getDate();
                const when = r.frequency === 'monthly' ? ordinal(day) : parseYMD(r.next_date ?? r.start_date).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' });
                return (
                  <TransactionRow
                    key={r.id}
                    title={r.name}
                    meta={[FREQ_LABEL[r.frequency], when, accountName(r), r.status === 'paused' ? 'paused' : null].filter(Boolean).join(' · ')}
                    amount={Number(r.amount)}
                    direction={r.type === 'income' ? 'income' : 'expense'}
                    icon={categoryIcon(r.category)}
                    onPress={() => open(r)}
                  />
                );
              })}
            </ScrollView>
          )}
          <Button label="Add recurring" icon={Plus} onPress={() => open(null)} fullWidth />
        </>
      )}
    </SettingsScreen>
  );
}
