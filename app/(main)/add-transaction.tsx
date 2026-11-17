import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, ScrollView, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { ArrowRight, CalendarDays, Landmark, LayoutGrid, Plus, ReceiptText, Wallet } from 'lucide-react-native';
import { colors } from '@/theme/tokens';
import { expenseCategories, incomeCategories } from '@/constants/categories';
import { categoryOptions, type CategoryOption } from '@/constants/categoryIcons';
import { AccountPill } from '@/components/ui/AccountPill';
import { AccountSelector } from '@/components/ui/AccountSelector';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { GlassChip } from '@/components/ui/GlassChip';
import { Hero } from '@/components/ui/Hero';
import { InlineError } from '@/components/ui/InlineError';
import { Money } from '@/components/ui/Money';
import { Numpad, applyAmountKey, type NumpadKey } from '@/components/ui/Numpad';
import { SegmentedToggle } from '@/components/ui/SegmentedToggle';
import { Sheet } from '@/components/ui/Sheet';
import { TextInput } from '@/components/ui/TextInput';
import { TopBar } from '@/components/ui/TopBar';
import { useToast } from '@/components/ui/ToastProvider';
import { AddSuccess } from '@/components/add/AddSuccess';
import { useAccounts } from '@/src/hooks/useAccounts';
import { useAssets } from '@/src/hooks/useAssets';
import { useCustomCategories } from '@/src/hooks/useCustomCategories';
import { useReceiptScan } from '@/src/hooks/useReceiptScan';
import { useTransactions } from '@/src/hooks/useTransactions';
import { TABLET_WIDTH, useColumnPadding } from '@/src/hooks/useBreakpoint';
import { ResponsiveContainer } from '@/src/components/ui/ResponsiveContainer';
import { useAuth } from '@/context/AuthContext';
import { useLock } from '@/context/LockContext';
import { transactionsRepository, type CreateTransactionRequest } from '@/src/repositories/transactions.repository';
import { assetsRepository } from '@/src/repositories/assets.repository';
import { storageService } from '@/src/services/storage';
import { notify } from '@/src/services/notifications';
import { addFormError, type TxKind } from '@/src/lib/addTransactionValidation';
import { formatRM, parseAmount } from '@/src/lib/money';
import { readLastUsed, writeLastUsed } from '@/src/lib/lastUsed';
import { accountBalance, accountDomain, spendableAccounts, type AnyAccount } from '@/src/utils/accountDisplay';
import { merchantCategory } from '@/src/utils/merchantLogo';
import { localYMD } from '@/src/utils/date';
import { monthStart } from '@/src/utils/monthStart';
import type { Transaction } from '@/src/types';

/** Save waits this long before telling the user it may have failed (q-button-save-loading). */
const SLOW_SAVE_MS = 4000;

function parseDateParam(raw: string | undefined): Date | null {
  if (!raw) return null;
  const [y, m, d] = raw.slice(0, 10).split('-').map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1, 12);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dateLabel(d: Date): string {
  const today = localYMD(new Date());
  const ymd = localYMD(d);
  if (ymd === today) return 'Today';
  if (ymd === localYMD(new Date(Date.now() - 86_400_000))) return 'Yesterday';
  return d.toLocaleDateString('en-MY', { day: 'numeric', month: 'short' });
}

type Params = {
  editId?: string; type?: string; name?: string; amount?: string; category?: string;
  fromAccountId?: string; toAccountId?: string; assetId?: string; date?: string; note?: string;
  nonce?: string; presetAccountId?: string; returnTo?: string; scan?: string;
};

/**
 * Add / edit a transaction (section D). The "+" opens straight to the numpad.
 * Defaults: Expense, last-used account, Today. Amount → category chip → Save.
 */
export default function AddTransactionScreen() {
  const router = useRouter();
  // Tablet: the numpad column keeps phone-sized keys.
  const padX = useColumnPadding(16, TABLET_WIDTH.keypad - 32);
  const p = useLocalSearchParams<Params>();
  const toast = useToast();
  const { user } = useAuth();
  const { locked, suspend } = useLock();
  const editId = p.editId || undefined;
  const isEdit = !!editId;

  const [kind, setKind] = useState<TxKind>('expense');
  const [amountText, setAmountText] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [toId, setToId] = useState<string | null>(null);
  const [date, setDate] = useState(new Date());
  const [note, setNote] = useState('');
  const [noteOpen, setNoteOpen] = useState(false);
  const [receipt, setReceipt] = useState<{ base64: string } | null>(null);
  const [picker, setPicker] = useState<'from' | 'to' | null>(null);
  const [showDate, setShowDate] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<Transaction | null>(null);
  const submittingRef = useRef(false);

  const now = new Date();
  const { accounts, fetchAccounts } = useAccounts();
  const { transactions, create, update } = useTransactions(now.getFullYear(), now.getMonth() + 1);
  const { categories: custom, fetchCategories } = useCustomCategories();
  const { assets, fetchAssets } = useAssets();
  const { scan, loading: scanning } = useReceiptScan();

  useFocusEffect(useCallback(() => {
    fetchAccounts();
    fetchAssets();
    if (user) fetchCategories(user.id);
  }, [fetchAccounts, fetchAssets, fetchCategories, user]));

  // Each tap on "+" or Edit carries a fresh nonce: re-apply the params, because
  // this tab screen's instance is reused.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const last = await readLastUsed();
      if (cancelled) return;
      const t = p.type === 'income' || p.type === 'transfer' ? p.type : 'expense';
      setKind(t);
      setAmountText(p.amount ? String(Number(p.amount)) : '');
      setName(p.name ?? '');
      setCategory(p.category || null);
      setNote(p.note ?? '');
      setNoteOpen(!!p.note);
      setDate(parseDateParam(p.date) ?? new Date());
      setReceipt(null);
      setShowErrors(false);
      setSaved(null);
      if (isEdit) {
        setAccountId((t === 'income' ? p.toAccountId : p.fromAccountId) || null);
        setToId(t === 'transfer' ? (p.toAccountId || p.assetId || null) : null);
      } else if (p.presetAccountId) {
        setAccountId(p.presetAccountId);
        setToId(null);
      } else if (t === 'transfer') {
        setAccountId(last.transferFromId ?? last.accountId ?? null);
        setToId(last.transferToId ?? null);
      } else {
        setAccountId(last.accountId ?? null);
        setToId(null);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.nonce, p.editId]);

  // Opened from Home's "Scan": go straight to the camera.
  const scanStarted = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (p.scan !== '1' || scanStarted.current === p.nonce) return;
    scanStarted.current = p.nonce;
    scanReceipt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.scan, p.nonce]);

  const usage = useMemo(() => {
    const u: Record<string, number> = {};
    for (const t of transactions) if (t.category) u[t.category] = (u[t.category] ?? 0) + 1;
    return u;
  }, [transactions]);
  const allOptions = useMemo<CategoryOption[]>(() => {
    if (kind === 'transfer') return [];
    return categoryOptions(kind === 'expense' ? expenseCategories : incomeCategories, custom, kind, usage);
  }, [kind, custom, usage]);
  const chips = useMemo(() => {
    const top = allOptions.slice(0, 6);
    const sel = allOptions.find((o) => o.value === category);
    return sel && !top.includes(sel) ? [...top.slice(0, 5), sel] : top;
  }, [allOptions, category]);

  // A merchant guess (scan, edit) picks the chip until the user taps one.
  useEffect(() => {
    if (kind !== 'expense' || category || !name) return;
    const guess = merchantCategory(name);
    if (guess) setCategory(guess);
  }, [kind, name, category]);

  const all = accounts as AnyAccount[];
  const source = all.find((a) => a.id === accountId);
  const destAccount = all.find((a) => a.id === toId);
  const destAsset = assets.find((a) => a.id === toId);
  const amount = parseAmount(amountText);

  const origAmount = Number(p.amount ?? 0);
  const available = source && (kind === 'expense' || kind === 'transfer')
    ? accountBalance(source) + (isEdit && p.fromAccountId === source.id ? origAmount : 0)
    : null;
  const problem = addFormError({ kind, amount, accountId: source ? accountId : null, toId: kind === 'transfer' ? (destAccount || destAsset ? toId : null) : null, available, locked, sourceName: source?.name });
  const needsCategory = kind !== 'transfer' && !category;
  const canSave = !problem && !needsCategory && !saving;

  const onKey = (k: NumpadKey) => setAmountText((cur) => applyAmountKey(cur, k));

  async function scanReceipt() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      toast.failure('Camera access is off', { label: 'Try again', onPress: scanReceipt });
      return;
    }
    suspend();
    const res = await ImagePicker.launchCameraAsync({ quality: 0.7, base64: true });
    if (res.canceled || !res.assets[0]?.base64) return;
    const b64 = res.assets[0].base64;
    setReceipt({ base64: b64 });
    const data = await scan(b64);
    if (!data) {
      toast.failure('Couldn’t read that receipt. The photo is attached.');
      return;
    }
    setKind('expense');
    if (data.total_amount && data.total_amount > 0) setAmountText(String(data.total_amount));
    if (data.merchant_name) { setName(data.merchant_name); setCategory(null); }
    if (data.transaction_date) {
      const d = parseDateParam(data.transaction_date);
      if (d && d.getTime() <= Date.now()) setDate(d);
    }
  }

  const categoryLabel = allOptions.find((o) => o.value === category)?.label ?? category ?? '';

  async function save() {
    if (!canSave) { setShowErrors(true); return; }
    if (submittingRef.current || !user || amount === null || !accountId) return;
    submittingRef.current = true;
    setSaving(true);
    const slow = setTimeout(() => toast.failure('Save failed. Your entry is kept.', { label: 'Retry', onPress: save }), SLOW_SAVE_MS);
    try {
      const txName = name.trim() || (kind === 'transfer' ? `Transfer to ${destAccount?.name ?? destAsset?.name ?? 'account'}` : categoryLabel);
      const fromId = kind === 'expense' || kind === 'transfer' ? accountId : undefined;
      const toAccount = kind === 'income' ? accountId : kind === 'transfer' && destAccount ? destAccount.id : undefined;
      const wasInvestment = isEdit && p.type === 'transfer' && !p.toAccountId;
      const payload: CreateTransactionRequest = {
        user_id: user.id,
        type: kind,
        name: txName,
        amount,
        from_account_id: fromId,
        to_account_id: toAccount,
        category: destAsset ? destAsset.name : kind === 'transfer' ? undefined : category ?? undefined,
        date: localYMD(date),
        note: note.trim() || undefined,
        asset_id: destAsset ? destAsset.id : wasInvestment ? null : undefined,
      };
      const res = editId ? await update(editId, payload) : await create(payload);
      clearTimeout(slow);
      if (!res.ok) {
        toast.failure('Save failed. Your entry is kept.', { label: 'Retry', onPress: save });
        return;
      }
      toast.hide();

      // Investment: move the contribution into the asset (deltas, applied in the database).
      const thisMonth = monthStart(new Date());
      const origAsset = wasInvestment ? assets.find((a) => a.id === p.assetId) ?? assets.find((a) => a.name === p.category) : undefined;
      if (origAsset && origAsset.id !== destAsset?.id) await assetsRepository.adjustValue(origAsset.id, -origAmount, thisMonth);
      if (destAsset) {
        const already = origAsset && origAsset.id === destAsset.id ? origAmount : 0;
        const adj = await assetsRepository.adjustValue(destAsset.id, amount - already, thisMonth);
        if (!adj.ok) toast.failure(`Saved, but ${destAsset.name}’s value didn’t update`);
      }

      if (receipt) {
        const up = await storageService.uploadReceipt(user.id, res.data.id, receipt.base64);
        if (up.ok) await transactionsRepository.update(res.data.id, { receipt_url: `${user.id}/${res.data.id}.jpg` });
      }

      await writeLastUsed(kind === 'transfer' ? { transferFromId: accountId, transferToId: toId ?? undefined } : { accountId });
      const verb = isEdit ? 'updated' : 'added';
      notify({
        type: kind,
        emoji: kind === 'income' ? '💰' : kind === 'transfer' ? '🔄' : '💸',
        message: kind === 'transfer' ? (isEdit ? 'Transfer updated' : 'Transfer completed') : `${kind === 'income' ? 'Income' : 'Expense'} ${verb}`,
        sub_text: `${txName} • ${formatRM(amount)}`,
        related_entity_id: res.data.id,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setSaved(res.data);
    } finally {
      clearTimeout(slow);
      submittingRef.current = false;
      setSaving(false);
    }
  }

  const close = () => (p.returnTo ? router.replace(p.returnTo as Href) : router.back());

  /** Done / auto-close: back Home with the Undo toast (k-toast-saved). */
  const finish = useCallback((tx: Transaction) => {
    const label = tx.type === 'transfer' ? 'Transfer' : categoryLabel;
    if (!isEdit) {
      toast.show({
        kind: 'success',
        message: `Saved · ${formatRM(Number(tx.amount))}${label ? ` to ${label}` : ''}`,
        action: {
          label: 'Undo',
          onPress: async () => {
            const del = await transactionsRepository.delete(tx.id);
            if (del.ok) toast.success('Transaction removed');
            else toast.failure('Delete failed', { label: 'Retry', onPress: () => { transactionsRepository.delete(tx.id); } });
          },
        },
      });
    } else {
      toast.success('Transaction updated');
    }
    setSaved(null);
    close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryLabel, isEdit, toast]);

  if (saved) {
    return (
      <AddSuccess
        transaction={saved}
        categoryLabel={saved.type === 'transfer' ? 'Transfer' : categoryLabel}
        accountName={source?.name}
        onDone={() => finish(saved)}
        onAddAnother={() => { setSaved(null); setAmountText(''); setName(''); setCategory(null); setNote(''); setNoteOpen(false); setReceipt(null); setShowErrors(false); }}
      />
    );
  }

  const amountError = showErrors && problem?.field === 'amount' ? problem.message : null;
  const accountError = (showErrors || problem?.message.includes('available')) && problem?.field === 'account' ? problem.message : null;
  const toError = problem?.field === 'to' && (showErrors || problem.message.startsWith('Pick two')) ? problem.message : null;
  const saveLabel = problem && (showErrors || problem.field !== 'amount') ? problem.saveLabel : needsCategory && amount ? 'Choose a category' : 'Save';
  const spendable = spendableAccounts(all);
  const fromList = kind === 'transfer' ? all : kind === 'income' ? spendable : all;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <Hero height={undefined} style={{ paddingBottom: 48 }} contentMaxWidth={TABLET_WIDTH.keypad}>
        <TopBar title={isEdit ? 'Edit transaction' : 'Add transaction'} onBack={close} close />
        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
          <SegmentedToggle
            on="glass"
            accessibilityLabel="Transaction type"
            options={[{ value: 'expense', label: 'Expense' }, { value: 'income', label: 'Income' }, { value: 'transfer', label: 'Transfer' }]}
            value={kind}
            onChange={(k) => { setKind(k); setCategory(null); if (k !== 'transfer') setToId(null); }}
          />
        </View>
        <View style={{ alignItems: 'center', marginTop: 20, gap: 12 }}>
          <Money amount={amount ?? 0} variant="numeric-lg" on="gradient" smallCurrency accessibilityLabel={`Amount RM ${amount ?? 0}`} />
          {amountError ? <InlineError on="gradient" message={amountError} /> : null}
          {receipt ? <GlassChip icon={ReceiptText} label={scanning ? 'Reading receipt…' : 'Receipt attached'} /> : null}
        </View>
      </Hero>

      <View style={{ flex: 1, marginTop: -24, backgroundColor: colors.surface, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingTop: 20, paddingHorizontal: padX, paddingBottom: 24, gap: 12 }}>
        <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 12 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {kind === 'transfer' ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <AccountPill label={source?.name ?? 'From'} domain={accountDomain(source)} icon={source?.type === 'wallet' ? Wallet : Landmark} onPress={() => setPicker('from')} invalid={!!accountError} accessibilityLabel={`From account: ${source?.name ?? 'none'}`} />
              <ArrowRight size={18} color={colors['on-surface']} strokeWidth={1.75} />
              <AccountPill label={destAccount?.name ?? destAsset?.name ?? 'To'} domain={accountDomain(destAccount)} onPress={() => setPicker('to')} invalid={!!toError} accessibilityLabel={`To account: ${destAccount?.name ?? destAsset?.name ?? 'none'}`} />
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {chips.map((o) => (
                <Chip key={o.value} label={o.label} icon={o.icon} selected={o.value === category} onPress={() => setCategory(o.value)} />
              ))}
              <Chip label="More" icon={LayoutGrid} onPress={() => setMoreOpen(true)} />
            </ScrollView>
          )}
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {kind !== 'transfer' ? (
              <AccountPill
                label={source?.name ?? 'Choose account'}
                domain={accountDomain(source)}
                icon={source?.type === 'wallet' ? Wallet : Landmark}
                onPress={() => setPicker('from')}
                invalid={!!accountError}
                accessibilityLabel={`Account: ${source?.name ?? 'none'}`}
              />
            ) : null}
            <AccountPill label={dateLabel(date)} plainIcon={CalendarDays} onPress={() => setShowDate(true)} accessibilityLabel={`Date: ${dateLabel(date)}`} />
            {!noteOpen ? <Button label="Note" icon={Plus} variant="action" height={44} onPress={() => setNoteOpen(true)} /> : null}
          </View>
          {accountError ? <InlineError message={accountError} /> : null}
          {toError ? <InlineError message={toError} /> : null}
          {noteOpen ? (
            <TextInput value={note} onChangeText={setNote} placeholder="Add a note" accessibilityLabel="Note" autoFocus={!note} maxLength={200} returnKeyType="done" />
          ) : null}
        </ScrollView>
        <View style={{ flex: 1 }} />
        <Numpad onKey={onKey} />
        <Button
          label={saveLabel}
          onPress={save}
          disabled={!canSave && !saving}
          loading={saving}
          loadingLabel="Saving…"
          fullWidth
          testID="add-save"
        />
      </View>

      <AccountSelector
        visible={picker !== null}
        onClose={() => setPicker(null)}
        title={picker === 'to' ? 'Send to' : kind === 'income' ? 'Pay into' : 'Pay from'}
        accounts={picker === 'to' ? all : fromList}
        assets={picker === 'to' ? assets.map((a) => ({ id: a.id, name: a.name, value: Number(a.current_value) })) : []}
        excludeId={picker === 'to' ? accountId : kind === 'transfer' ? toId : null}
        selectedId={picker === 'to' ? toId : accountId}
        masked={locked}
        onSelect={(id) => (picker === 'to' ? setToId(id) : setAccountId(id))}
        onAddAccount={() => router.push('/home/accounts')}
      />

      <Sheet visible={moreOpen} onClose={() => setMoreOpen(false)} title="All categories" scroll>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {allOptions.map((o) => (
            <Chip key={o.value} label={o.label} icon={o.icon} selected={o.value === category} onPress={() => { setCategory(o.value); setMoreOpen(false); }} />
          ))}
        </View>
      </Sheet>

      {showDate ? (
        <ResponsiveContainer variant={TABLET_WIDTH.keypad}>
          <DateTimePicker
            value={date}
            mode="date"
            maximumDate={new Date()}
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={(e: DateTimePickerEvent, d?: Date) => { setShowDate(Platform.OS === 'ios' && e.type !== 'dismissed'); if (d && e.type === 'set') setDate(d); }}
          />
        </ResponsiveContainer>
      ) : null}
    </View>
  );
}
