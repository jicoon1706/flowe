import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, Modal, Platform , Alert, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Camera, RefreshCw, Calendar, ChevronDown, Bell, Check } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { expenseCategories, incomeCategories } from '../../constants/categories';
import { Button } from '../../components/ui/Button';
import { AmountInput } from '../../components/ui/AmountInput';
import { CategoryChips } from '../../components/ui/CategoryChips';
import { AccountSelector } from '../../components/ui/AccountSelector';
import { LoadingView } from '../../components/ui/LoadingView';
import { ErrorView } from '../../components/ui/ErrorView';
import { useAccounts } from '../../src/hooks/useAccounts';
import { useTransactions } from '../../src/hooks/useTransactions';
import { useCustomCategories } from '../../src/hooks/useCustomCategories';
import { useReceiptScan } from '../../src/hooks/useReceiptScan';
import { useAssets } from '../../src/hooks/useAssets';
import type { ReceiptData } from '../../src/types';
import { useAuth } from '../../context/AuthContext';
import { useLock } from '../../context/LockContext';
import { accountColor } from '../../src/utils/accountColor';
import { merchantCategory } from '../../src/utils/merchantLogo';
import { localYMD } from '../../src/utils/date';
import { KeyboardAvoider } from '../../components/ui/KeyboardAvoider';
import { storageService } from '../../src/services/storage';
import { transactionsRepository } from '../../src/repositories/transactions.repository';
import { assetsRepository } from '../../src/repositories/assets.repository';
import { notify, formatRM } from '../../src/services/notifications';

type TransactionType = 'expense' | 'income' | 'transfer';

const reminderOptions = [
  { id: 'none', label: 'No reminder' },
  { id: 'same_day', label: 'Same day' },
  { id: '1_day', label: '1 day before' },
  { id: '3_days', label: '3 days before' },
  { id: '1_week', label: '1 week before' },
];

const dateQuickOptions = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
];

export default function AddTransactionScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams();

  // Edit mode: when an `editId` is passed, the form is prefilled with the
  // transaction's existing values and submitting updates that row instead of
  // creating a new one.
  const editId = (searchParams.editId as string | undefined) || undefined;
  const isEdit = !!editId;
  const initialType: TransactionType = (() => {
    const t = searchParams.type as string | undefined;
    return t === 'expense' || t === 'income' || t === 'transfer' ? t : 'expense';
  })();
  const origAmount = Number(searchParams.amount ?? 0);
  const origFromId = (searchParams.fromAccountId as string | undefined) || '';

  // Set when the form was opened from an account's own page: that account is
  // the one the user means, so it's preselected whichever type they pick.
  const presetAccountId = (searchParams.presetAccountId as string | undefined) || '';
  // Where to go after saving. Opened from an account page, the user expects to
  // land back on that account, not wherever the navigator's history points.
  const returnTo = (searchParams.returnTo as string | undefined) || '';

  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState((searchParams.amount as string) ?? '');
  const [name, setName] = useState((searchParams.name as string) ?? '');
  const [category, setCategory] = useState((searchParams.category as string) || 'food');
  const [account, setAccount] = useState(
    presetAccountId ||
      (initialType === 'income'
        ? (searchParams.toAccountId as string) ?? ''
        : (searchParams.fromAccountId as string) ?? '')
  );
  // A transfer's destination: either an account id or an asset id. Sending money
  // to an asset is an investment — it's stored as a transfer with no destination
  // account and the asset's name in the category column (see handleSubmit),
  // which is what keeps it out of the expense totals while the asset absorbs it.
  const [toAccount, setToAccount] = useState((searchParams.toAccountId as string) ?? '');
  const [dateOption, setDateOption] = useState<'today' | 'yesterday' | 'custom'>(() => {
    const dateParam = searchParams.date as string | undefined;
    if (dateParam) {
      // Parse ISO string as local time to preserve the intended date
      const [year, month, day, hour = 12, minute = 0] = dateParam.split(/[-T:Z]/).map(Number);
      const d = new Date(year, month - 1, day, hour, minute);
      if (!isNaN(d.getTime())) return 'custom';
    }
    return 'today';
  });
  const [customDate, setCustomDate] = useState<Date>(() => {
    const dateParam = searchParams.date as string | undefined;
    if (dateParam) {
      // Parse ISO string as local time to preserve the intended date
      const [year, month, day, hour = 12, minute = 0] = dateParam.split(/[-T:Z]/).map(Number);
      const d = new Date(year, month - 1, day, hour, minute);
      if (!isNaN(d.getTime())) {
        return d;
      }
    }
    return new Date();
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'date' | 'custom' | 'start' | 'end'>('date');
  const [recurring, setRecurring] = useState(false);
  const [recurringFreq, setRecurringFreq] = useState('monthly');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [hasEndDate, setHasEndDate] = useState(false);
  const [reminder, setReminder] = useState('none');
  const [showReminderPicker, setShowReminderPicker] = useState(false);
  const [note, setNote] = useState((searchParams.note as string) ?? '');
  const [receiptImage, setReceiptImage] = useState<{ uri: string; base64: string } | null>(null);

  const { user } = useAuth();
  const { suspend: suspendLock } = useLock();
  const now = new Date();
  const { accounts, loading: acctsLoading, error: acctsError, fetchAccounts } = useAccounts();
  const { loading: txLoading, error: txError, create, update } = useTransactions(now.getFullYear(), now.getMonth() + 1);
  const { categories: customCategories, loading: catLoading, error: catError, fetchCategories: fetchCustomCategories } = useCustomCategories();
  const { scan, loading: scanning } = useReceiptScan();
  const { assets, fetchAssets } = useAssets();

  // Merge built-in categories with the user's custom ones for the active type.
  // Custom categories only exist for expense/income; transfer falls back to the
  // built-in income list with no custom entries.
  const baseCategories = type === 'expense' ? expenseCategories : incomeCategories;
  const customForType = customCategories
    .filter((c) => c.transaction_type === type)
    .map((c) => ({ id: c.id, emoji: c.icon ?? '🏷️', name: c.name, color: c.color }));
  const categories = [...baseCategories, ...customForType];

  // Assets a transfer can go into, shaped like accounts so the same selector
  // renders them — current value stands in for the balance.
  const assetOptions = assets.map((a) => ({
    id: a.id,
    name: a.name,
    balance: Number(a.current_value).toLocaleString('en-US', { minimumFractionDigits: 2 }),
    color: '#6366F1',
    hint: 'Asset',
  }));

  // Source/destination for every transaction type: all accounts (banks,
  // wallets, and tabung savings goals).
  const allAccountOptions = accounts.map((a: any) => {
    const bal = Number(
      a.type === 'bank'
        ? a.bank_accounts?.current_balance ?? 0
        : a.type === 'wallet'
        ? a.wallet_accounts?.current_balance ?? 0
        : a.type === 'tabung'
        ? a.tabung_accounts?.saved_amount ?? 0
        : 0
    );
    return {
      id: a.id,
      name: a.name,
      balance: bal.toLocaleString('en-US', { minimumFractionDigits: 2 }),
      color: accountColor(a),
    };
  });

  // Where a transfer can land: another account, or one of the user's assets.
  const transferDestinations = [...allAccountOptions, ...assetOptions];
  // The destination is an asset → this transfer is an investment.
  const investAsset = assets.find((a) => a.id === toAccount);

  useFocusEffect(useCallback(() => {
    fetchAccounts();
    fetchAssets();
    if (user) fetchCustomCategories(user.id);
  }, [fetchAccounts, fetchAssets, fetchCustomCategories, user]));

  // Reopening an investment: it's a transfer with no destination account and
  // the asset's name in the category column, so match that asset back once
  // assets have loaded and select it as the destination.
  useEffect(() => {
    if (!isEdit || type !== 'transfer' || toAccount || assets.length === 0) return;
    if (searchParams.toAccountId) return;
    const match = assets.find((a) => a.name === category);
    if (match) setToAccount(match.id);
  }, [isEdit, type, toAccount, assets, category, searchParams.toAccountId]);

  // In edit mode the category column stores a custom category's *name* (built-in
  // categories store their slug id). Once custom categories load, map that name
  // back to its chip id so the right chip is selected. Runs once per edit.
  // Guess the category from the merchant as the user types the name — "McD
  // Bangi" is Food & Drink, "Setel" is Transport. Only ever a head start: once
  // the user picks a chip themselves, their choice is left alone for the rest
  // of the form, and editing an existing transaction never re-guesses.
  const categoryTouched = useRef(false);
  useEffect(() => {
    if (isEdit || categoryTouched.current || type !== 'expense') return;
    const guess = merchantCategory(name);
    if (guess) setCategory(guess);
  }, [name, type, isEdit]);

  const mappedCategory = useRef(false);
  useEffect(() => {
    if (!isEdit || mappedCategory.current || customCategories.length === 0) return;
    const match = customCategories.find(
      (c) => c.transaction_type === type && c.name === category
    );
    if (match) setCategory(match.id);
    mappedCategory.current = true;
  }, [isEdit, customCategories, type, category]);

  // Re-populate the form whenever we navigate in for an edit. A fresh `nonce` is
  // sent on every edit tap, so this re-runs even when the screen instance is
  // reused (re-editing the same transaction) — something the useState
  // initializers, which only read params at mount, can't do.
  const nonce = searchParams.nonce as string | undefined;
  useEffect(() => {
    if (!editId) return;
    const tp = searchParams.type as string | undefined;
    const t: TransactionType =
      tp === 'income' || tp === 'transfer' || tp === 'expense' ? tp : 'expense';
    setType(t);
    setAmount((searchParams.amount as string) ?? '');
    setName((searchParams.name as string) ?? '');
    setCategory((searchParams.category as string) || 'food');
    categoryTouched.current = true;
    setAccount(
      t === 'income'
        ? (searchParams.toAccountId as string) ?? ''
        : (searchParams.fromAccountId as string) ?? ''
    );
    setToAccount((searchParams.toAccountId as string) ?? '');
    setNote((searchParams.note as string) ?? '');
    const dateParam = searchParams.date as string | undefined;
    if (dateParam) {
      const [year, month, day, hour = 12, minute = 0] = dateParam.split(/[-T:Z]/).map(Number);
      const d = new Date(year, month - 1, day, hour, minute);
      if (!isNaN(d.getTime())) {
        setCustomDate(d);
        setDateOption('custom');
      }
    }
    mappedCategory.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce]);

  // Same problem for a fresh transaction opened from an account page: this
  // screen is a tab, so its instance is reused and the useState initializers
  // above don't re-run. The nonce sent with every tap is what re-applies the
  // account (and type) the user opened the form with.
  useEffect(() => {
    if (editId || !presetAccountId) return;
    const tp = searchParams.type as string | undefined;
    if (tp === 'expense' || tp === 'income' || tp === 'transfer') setType(tp);
    setAccount(presetAccountId);
    setToAccount('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce]);

  if (acctsLoading || catLoading) return <LoadingView />;
  if (acctsError || catError) return <ErrorView error={acctsError ?? catError!} onRetry={() => { fetchAccounts(); if (user) fetchCustomCategories(user.id); }} />;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getDisplayDate = () => {
    if (dateOption === 'today') return 'Today';
    if (dateOption === 'yesterday') return 'Yesterday';
    if (dateOption === 'custom' && customDate) return formatDate(customDate);
    return 'Today';
  };

  const getReminderLabel = () => {
    const opt = reminderOptions.find((o) => o.id === reminder);
    return opt?.label || 'No reminder';
  };

  // Prefill the form from an OCR'd receipt. Receipts are always expenses, and
  // only amount / name / date are filled — category & account stay for the user
  // to choose (any empty/zero field the model couldn't read is left untouched).
  function applyReceipt(data: ReceiptData) {
    setType('expense');
    if (data.total_amount && data.total_amount > 0) setAmount(String(data.total_amount));
    if (data.merchant_name) setName(data.merchant_name);
    // The Edge Function already rejects unreadable, future, and implausibly old
    // dates, so an empty string here means "couldn't read it" — leave the form
    // on Today rather than filing the transaction under a guessed date.
    if (data.transaction_date) {
      const [y, m, d] = data.transaction_date.split('-').map(Number);
      // Keep the receipt's own clock time when it printed one; it makes the
      // transaction sort correctly against others on the same day.
      const [hh, mm] = (data.transaction_time ?? '').split(':').map(Number);
      const dt = new Date(y, (m ?? 1) - 1, d ?? 1, hh || 0, mm || 0);
      if (y && m && d && !isNaN(dt.getTime()) && dt.getTime() <= Date.now()) {
        setCustomDate(dt);
        setDateOption('custom');
      }
    }
  }

  async function handlePickReceipt(source: 'camera' | 'library', ocr = false) {
    const permission = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', `Please allow ${source === 'camera' ? 'camera' : 'photo'} access to add a receipt.`);
      return;
    }

    // Opening the picker/camera backgrounds the app; tell the lock to skip the
    // re-lock so the user isn't asked for PIN/biometric on return.
    suspendLock();

    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync({ quality: 0.7, base64: true })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, base64: true });

    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset?.base64) return;
    setReceiptImage({ uri: asset.uri, base64: asset.base64 });

    // Only the "Scan Receipt" action runs OCR; a plain "Attach Image" just keeps
    // the photo. The image stays attached either way, so a failed scan still
    // leaves the user with the receipt to fill in by hand.
    if (ocr) {
      const data = await scan(asset.base64);
      if (data) {
        applyReceipt(data);
      } else {
        Alert.alert(
          "Couldn't read receipt",
          "We couldn't extract the details automatically. The photo is attached — please fill in the amount, name, and date."
        );
      }
    }
  }

  function resetForm() {
    setType('expense');
    setAmount('');
    setName('');
    setCategory('food');
    categoryTouched.current = false;
    setAccount('');
    setToAccount('');
    setDateOption('today');
    setCustomDate(new Date());
    setShowDatePicker(false);
    setDatePickerMode('date');
    setRecurring(false);
    setRecurringFreq('monthly');
    setStartDate(new Date());
    setEndDate(null);
    setHasEndDate(false);
    setReminder('none');
    setShowReminderPicker(false);
    setNote('');
    setReceiptImage(null);
  }

  async function handleSubmit() {
    if (!amount || !name) {
      Alert.alert('Missing fields', 'Please enter an amount and name.');
      return;
    }
    if (!account) {
      Alert.alert('Missing account', 'Please select an account.');
      return;
    }
    if (!user) {
      Alert.alert('Not signed in', 'Please restart the app.');
      return;
    }

    const transactionDate = localYMD(
      dateOption === 'today'
        ? new Date()
        : dateOption === 'yesterday'
        ? new Date(Date.now() - 86400000)
        : customDate
    );

    if (type === 'transfer' && !toAccount) {
      Alert.alert('Missing destination', 'Please select an account or asset to transfer into.');
      return;
    }
    if (type === 'transfer' && toAccount === account) {
      Alert.alert('Same account', 'Pick a different destination from the source account.');
      return;
    }

    // Balance check for every type where money leaves the source account.
    if (type === 'expense' || type === 'transfer') {
      const src = accounts.find((a: any) => a.id === account);
      const srcBalance = Number(
        src?.type === 'bank'
          ? src?.bank_accounts?.current_balance ?? 0
          : src?.type === 'wallet'
          ? src?.wallet_accounts?.current_balance ?? 0
          : src?.type === 'tabung'
          ? src?.tabung_accounts?.saved_amount ?? 0
          : 0
      );
      // When editing, the source account's stored balance already excludes the
      // original outflow. If the source account is unchanged, add that amount
      // back so the user isn't blocked from keeping/raising the same expense.
      let available = srcBalance;
      if (isEdit && origFromId === account) {
        available += origAmount;
      }
      if (parseFloat(amount) > available) {
        Alert.alert(
          'Not enough balance',
          `${src?.name ?? 'This account'} has only RM ${available.toLocaleString('en-US', { minimumFractionDigits: 2 })} available.`
        );
        return;
      }
    }

    const fromId = type === 'expense' || type === 'transfer' ? account : undefined;
    // A transfer into an asset has no destination *account* — that's what marks
    // it as an investment. The asset it fed is recorded in the category below.
    const toId =
      type === 'income' ? account
      : type === 'transfer' && !investAsset ? toAccount
      : undefined;

    // Built-in chips use a slug id (e.g. "food"); custom chips use the category's
    // UUID. Persist the readable name for custom categories so the column doesn't
    // store a raw UUID. An investment files itself under the asset it feeds.
    const customCat = customCategories.find((c) => c.id === category);
    const categoryValue = investAsset ? investAsset.name : customCat ? customCat.name : category;

    const payload = {
      user_id: user.id,
      type,
      name,
      amount: parseFloat(amount),
      from_account_id: fromId,
      to_account_id: toId,
      category: categoryValue,
      date: transactionDate,
      note: note || undefined,
    };

    const result = editId ? await update(editId, payload) : await create(payload);

    if (result.ok) {
      // Move the money into the asset. On an edit the previous contribution is
      // taken back out first — including when the user switched assets — so the
      // asset's value always reflects the transaction as it now stands.
      // The asset this transaction fed before the edit, if it fed one: an
      // investment stores its asset's name in the category column.
      const origAssetName = (searchParams.category as string | undefined) ?? '';
      const origAsset =
        isEdit && !searchParams.toAccountId && searchParams.type === 'transfer'
          ? assets.find((a) => a.name === origAssetName)
          : undefined;
      // Take the old contribution back out whenever it no longer belongs there
      // — the user switched assets, or turned the investment into an ordinary
      // transfer/expense — so the asset isn't left permanently inflated.
      if (origAsset && origAsset.id !== investAsset?.id) {
        await assetsRepository.update(origAsset.id, {
          current_value: Math.max(0, Number(origAsset.current_value) - origAmount),
        });
      }
      if (investAsset) {
        const alreadyIn = origAsset && origAsset.id === investAsset.id ? origAmount : 0;
        await assetsRepository.update(investAsset.id, {
          current_value: Math.max(
            0,
            Number(investAsset.current_value) - alreadyIn + parseFloat(amount)
          ),
        });
      }

      if (receiptImage) {
        const upload = await storageService.uploadReceipt(user.id, result.data.id, receiptImage.base64);
        if (upload.ok) {
          await transactionsRepository.update(result.data.id, { receipt_url: `${user.id}/${result.data.id}.jpg` });
        }
      }

      // Record a notification (in-app entry + OS banner) for every type of
      // transaction, on both create and edit.
      const accountName = (id?: string) =>
        accounts.find((a: any) => a.id === id)?.name ?? 'account';
      const amt = formatRM(parseFloat(amount));
      const verb = isEdit ? 'updated' : 'added';
      const notif =
        investAsset
          ? { emoji: '📈', message: `Investment ${verb}`, sub_text: `${name} • ${amt} from ${accountName(fromId)} into ${investAsset.name}` }
          : type === 'income'
          ? { emoji: '💰', message: `Income ${verb}`, sub_text: `${name} • +${amt} to ${accountName(toId)}` }
          : type === 'transfer'
          ? { emoji: '🔄', message: isEdit ? 'Transfer updated' : 'Transfer completed', sub_text: `${amt} from ${accountName(fromId)} to ${accountName(toId)}` }
          : { emoji: '💸', message: `Expense ${verb}`, sub_text: `${name} • -${amt} from ${accountName(fromId)}` };
      await notify({
        type,
        ...notif,
        related_entity_id: result.data.id,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      resetForm();
      // Opened from an account (or any screen that asked for it): go back to
      // exactly that screen rather than wherever the history happens to lead.
      if (returnTo) router.replace(returnTo as any);
      else router.back();
    } else {
      Alert.alert('Failed to save', result.error.message);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
        <Pressable
          onPress={() => (returnTo ? router.replace(returnTo as any) : router.back())}
          className="p-2"
        >
          <X size={24} color="#ffffff" />
        </Pressable>
        <Text className="text-lg font-semibold text-foreground">{isEdit ? 'Edit Transaction' : 'Add Transaction'}</Text>
        <View className="w-10" />
      </View>

      <KeyboardAvoider>
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Scan Receipt */}
        <View className="px-4 pt-4">
          <Pressable
            onPress={() => handlePickReceipt('camera', true)}
            disabled={scanning}
            className="w-full bg-primary rounded-2xl py-4 flex-row items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            style={{ opacity: scanning ? 0.7 : 1 }}
          >
            {scanning ? (
              <>
                <ActivityIndicator color="#000000" />
                <Text className="text-base font-bold text-primary-foreground">Reading receipt…</Text>
              </>
            ) : (
              <>
                <Camera size={20} color="#000000" />
                <Text className="text-base font-bold text-primary-foreground">Scan Receipt</Text>
              </>
            )}
          </Pressable>
        </View>

        {/* Type Tabs */}
        <View className="px-4 pt-4">
          <View className="flex-row bg-card rounded-2xl p-1">
            {(['expense', 'income', 'transfer'] as TransactionType[]).map((t) => (
              <Pressable
                key={t}
                onPress={() => setType(t)}
                className={`flex-1 py-2.5 rounded-xl ${type === t ? 'bg-primary' : ''}`}
              >
                <Text
                  className={`text-xs font-semibold text-center ${
                    type === t ? 'text-primary-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Amount Input */}
        <View className="px-4 pt-6">
          <AmountInput value={amount} onChange={setAmount} />
        </View>

        {/* Form Fields */}
        <View className="px-4 pt-6">
          {/* Name */}
          <View className="mb-4">
            <Text className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1.5">
              Name
            </Text>
            <TextInput
              placeholder={
                type === 'expense' ? 'What was this expense?'
                : investAsset ? 'What was this contribution?'
                : type === 'transfer' ? 'What was this transfer for?'
                : 'What was this income?'
              }
              placeholderTextColor="#a0a0a0"
              value={name}
              onChangeText={setName}
              className="bg-input-background border border-border rounded-xl px-4 py-3 text-base text-foreground"
            />
          </View>

          {/* Category — a transfer into an asset is filed against that asset
              instead, so the chips would only get in the way. */}
          {!investAsset && (
            <>
              <Text className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1.5">
                Category
              </Text>
              <CategoryChips
                categories={categories}
                selected={category}
                onSelect={(id) => {
                  // An explicit pick stops the merchant guess overriding it.
                  categoryTouched.current = true;
                  setCategory(id);
                }}
              />
            </>
          )}

          {/* Account Selector */}
          <AccountSelector
            value={account}
            onChange={setAccount}
            label={
              type === 'transfer' ? 'From'
              : type === 'expense' ? 'From Account'
              : 'To Account'
            }
            accounts={allAccountOptions}
          />

          {/* A transfer can land in another account or in an asset — picking an
              asset is how the user invests. */}
          {type === 'transfer' && (
            <>
              <AccountSelector
                value={toAccount}
                onChange={setToAccount}
                label="To Account or Asset"
                title="Transfer Into"
                accounts={transferDestinations}
              />
              {investAsset && (
                <Text className="text-xs text-muted-foreground -mt-2 mb-4">
                  Money leaves the account but isn&apos;t spent — {investAsset.name}&apos;s value goes
                  up by the same amount, so it never counts as an expense.
                </Text>
              )}
            </>
          )}

          {/* Date */}
          <View className="mb-4">
            <Text className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1.5">
              Date
            </Text>
            <Pressable
              onPress={() => setShowDatePicker(true)}
              className="flex-row items-center gap-3 bg-input-background border border-border rounded-xl px-4 py-3"
            >
              <Calendar size={18} color="#a0a0a0" />
              <Text className="text-base text-foreground flex-1">{getDisplayDate()}</Text>
              <ChevronDown size={18} color="#a0a0a0" />
            </Pressable>
          </View>

          {/* Date Picker Modal with Quick Options + Native Picker */}
          <Modal visible={showDatePicker && datePickerMode === 'date'} transparent animationType="fade" onRequestClose={() => setShowDatePicker(false)}>
            <Pressable className="flex-1 bg-black/50 justify-end" onPress={() => setShowDatePicker(false)}>
              <Pressable className="bg-card rounded-t-3xl p-6 pb-4" onPress={(e) => e.stopPropagation()}>
                <View className="w-12 h-1 bg-border rounded-full mx-auto mb-6" />
                <Text className="text-lg font-semibold text-foreground mb-4">Select Date</Text>
                <View className="gap-2 mb-4">
                  {dateQuickOptions.map((opt) => (
                    <Pressable
                      key={opt.id}
                      onPress={() => {
                        const today = new Date();
                        if (opt.id === 'yesterday') {
                          today.setDate(today.getDate() - 1);
                        }
                        setCustomDate(today);
                        setDateOption(opt.id as 'today' | 'yesterday');
                        setShowDatePicker(false);
                      }}
                      className={`flex-row items-center justify-between p-4 rounded-xl ${
                        dateOption === opt.id ? 'bg-primary/10 border border-primary' : 'bg-input-background border border-border'
                      }`}
                    >
                      <Text className="text-sm font-medium text-foreground">{opt.label}</Text>
                      {dateOption === opt.id && <Check size={20} color="#C5FF00" />}
                    </Pressable>
                  ))}
                  <Pressable
                    onPress={() => setDatePickerMode('custom')}
                    className="flex-row items-center justify-between p-4 rounded-xl bg-input-background border border-border"
                  >
                    <Text className="text-sm font-medium text-foreground">Pick date</Text>
                    <Calendar size={18} color="#a0a0a0" />
                  </Pressable>
                </View>
                <Button title="Cancel" onPress={() => setShowDatePicker(false)} variant="secondary" size="md" />
              </Pressable>
            </Pressable>
          </Modal>

          {/* Native DateTimePicker for start date */}
          {showDatePicker && datePickerMode === 'start' && (
            <View className="px-4 mb-4">
              <DateTimePicker
                value={startDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_, date) => {
                  if (Platform.OS === 'android') {
                    setShowDatePicker(false);
                    setDatePickerMode('date');
                  }
                  if (date) setStartDate(date);
                }}
                style={{ height: 216 }}
              />
              {Platform.OS === 'ios' && (
                <Button
                  title="Done"
                  onPress={() => {
                    setShowDatePicker(false);
                    setDatePickerMode('date');
                  }}
                  variant="primary"
                  size="md"
                  className="mt-2"
                />
              )}
            </View>
          )}

          {/* Native DateTimePicker for custom date */}
          {showDatePicker && datePickerMode === 'custom' && (
            <View className="px-4 mb-4">
              <DateTimePicker
                value={customDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_, date) => {
                  if (date) setCustomDate(date);
                  setDateOption('custom');
                  if (Platform.OS === 'android') {
                    setShowDatePicker(false);
                    setDatePickerMode('date');
                  }
                }}
                style={{ height: 216 }}
              />
              {Platform.OS === 'ios' && (
                <View className="flex-row gap-2 mt-2">
                  <Button
                    title="Cancel"
                    onPress={() => {
                      setShowDatePicker(false);
                      setDatePickerMode('date');
                    }}
                    variant="secondary"
                    size="md"
                    className="flex-1"
                  />
                  <Button
                    title="Done"
                    onPress={() => {
                      setShowDatePicker(false);
                      setDatePickerMode('date');
                    }}
                    variant="primary"
                    size="md"
                    className="flex-1"
                  />
                </View>
              )}
            </View>
          )}

          {/* Native DateTimePicker for end date */}
          {showDatePicker && datePickerMode === 'end' && (
            <View className="px-4 mb-4">
              <DateTimePicker
                value={endDate || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_, date) => {
                  if (Platform.OS === 'android') {
                    setShowDatePicker(false);
                    setDatePickerMode('date');
                  }
                  if (date) setEndDate(date);
                }}
                style={{ height: 216 }}
              />
              {Platform.OS === 'ios' && (
                <Button
                  title="Done"
                  onPress={() => {
                    setShowDatePicker(false);
                    setDatePickerMode('date');
                  }}
                  variant="primary"
                  size="md"
                  className="mt-2"
                />
              )}
            </View>
          )}

          {/* Recurring Toggle */}
          <Pressable
            onPress={() => setRecurring(!recurring)}
            className="flex-row items-center justify-between bg-card border border-border rounded-xl px-4 py-3 mb-4"
          >
            <View className="flex-row items-center gap-3">
              <RefreshCw size={18} color="#a0a0a0" />
              <View>
                <Text className="text-sm font-medium text-foreground">Recurring</Text>
                <Text className="text-xs text-muted-foreground">Repeat automatically</Text>
              </View>
            </View>
            <View
              className={`w-11 h-6 rounded-full p-0.5 transition-colors ${
                recurring ? 'bg-primary' : 'bg-switch-background'
              }`}
            >
              <View
                className="w-5 h-5 rounded-full bg-white"
                style={{ transform: [{ translateX: recurring ? 20 : 0 }] }}
              />
            </View>
          </Pressable>

          {recurring && (
            <View className="mb-4 gap-4">
              <Text className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">
                Frequency
              </Text>
              <View className="flex-row gap-2">
                {['weekly', 'monthly', 'yearly'].map((freq) => (
                  <Pressable
                    key={freq}
                    onPress={() => setRecurringFreq(freq)}
                    className={`flex-1 py-2 rounded-xl border ${
                      recurringFreq === freq
                        ? 'bg-primary/10 border-primary'
                        : 'bg-card border-border'
                    }`}
                  >
                    <Text
                      className={`text-xs font-medium text-center ${
                        recurringFreq === freq ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    >
                      {freq.charAt(0).toUpperCase() + freq.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Start Date */}
              <View>
                <Text className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1.5">
                  Start Date
                </Text>
                <Pressable
                  onPress={() => {
                    setDatePickerMode('start');
                    setShowDatePicker(true);
                  }}
                  className="flex-row items-center gap-3 bg-input-background border border-border rounded-xl px-4 py-3"
                >
                  <Calendar size={18} color="#a0a0a0" />
                  <Text className="text-base text-foreground flex-1">{formatDate(startDate)}</Text>
                  <ChevronDown size={18} color="#a0a0a0" />
                </Pressable>
              </View>

              {/* End Date Toggle */}
              <Pressable
                onPress={() => setHasEndDate(!hasEndDate)}
                className="flex-row items-center justify-between bg-input-background border border-border rounded-xl px-4 py-3"
              >
                <Text className="text-sm font-medium text-foreground">Has end date</Text>
                <View
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors ${
                    hasEndDate ? 'bg-primary' : 'bg-switch-background'
                  }`}
                >
                  <View
                    className="w-5 h-5 rounded-full bg-white"
                    style={{ transform: [{ translateX: hasEndDate ? 20 : 0 }] }}
                  />
                </View>
              </Pressable>

              {/* End Date */}
              {hasEndDate && (
                <View>
                  <Text className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1.5">
                    End Date
                  </Text>
                  <Pressable
                    onPress={() => {
                      setDatePickerMode('end');
                      setShowDatePicker(true);
                    }}
                    className="flex-row items-center gap-3 bg-input-background border border-border rounded-xl px-4 py-3"
                  >
                    <Calendar size={18} color="#a0a0a0" />
                    <Text className="text-base text-foreground flex-1">{endDate ? formatDate(endDate) : 'Select end date'}</Text>
                    <ChevronDown size={18} color="#a0a0a0" />
                  </Pressable>
                </View>
              )}

              {/* Reminder */}
              <View>
                <Text className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1.5">
                  Reminder
                </Text>
                <Pressable
                  onPress={() => setShowReminderPicker(true)}
                  className="flex-row items-center gap-3 bg-input-background border border-border rounded-xl px-4 py-3"
                >
                  <Bell size={18} color="#a0a0a0" />
                  <Text className="text-base text-foreground flex-1">{getReminderLabel()}</Text>
                  <ChevronDown size={18} color="#a0a0a0" />
                </Pressable>
              </View>

              {/* Reminder Picker Modal */}
              <Modal visible={showReminderPicker} transparent animationType="fade" onRequestClose={() => setShowReminderPicker(false)}>
                <Pressable className="flex-1 bg-black/50 justify-end" onPress={() => setShowReminderPicker(false)}>
                  <Pressable className="bg-card rounded-t-3xl p-6 pb-8" onPress={(e) => e.stopPropagation()}>
                    <View className="w-12 h-1 bg-border rounded-full mx-auto mb-6" />
                    <Text className="text-lg font-semibold text-foreground mb-4">Reminder</Text>
                    <View className="gap-2">
                      {reminderOptions.map((opt) => (
                        <Pressable
                          key={opt.id}
                          onPress={() => {
                            setReminder(opt.id);
                            setShowReminderPicker(false);
                          }}
                          className={`flex-row items-center justify-between p-4 rounded-xl ${
                            reminder === opt.id ? 'bg-primary/10 border border-primary' : 'bg-input-background border border-border'
                          }`}
                        >
                          <Text className="text-sm font-medium text-foreground">{opt.label}</Text>
                          {reminder === opt.id && <Check size={20} color="#C5FF00" />}
                        </Pressable>
                      ))}
                    </View>
                  </Pressable>
                </Pressable>
              </Modal>
            </View>
          )}

          {/* Note */}
          <View className="mb-4">
            <Text className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1.5">
              Note (optional)
            </Text>
            <TextInput
              placeholder="Add a note..."
              placeholderTextColor="#a0a0a0"
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
              className="bg-input-background border border-border rounded-xl px-4 py-3 text-base text-foreground h-20 text-start"
            />
          </View>

          {/* Attach Image */}
          {receiptImage ? (
            <View className="mb-6">
              <View className="relative rounded-xl overflow-hidden border border-border">
                <Image source={{ uri: receiptImage.uri }} className="w-full h-48" resizeMode="cover" />
                <Pressable
                  onPress={() => setReceiptImage(null)}
                  className="absolute top-2 right-2 bg-black/60 rounded-full p-1.5"
                >
                  <X size={16} color="#ffffff" />
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              onPress={() => handlePickReceipt('library')}
              className="flex-row items-center justify-center gap-2 py-3 mb-6 border border-dashed border-border rounded-xl"
            >
              <Camera size={18} color="#a0a0a0" />
              <Text className="text-sm text-muted-foreground">Attach Image</Text>
            </Pressable>
          )}

          {/* Submit Button */}
          <Button
            title={isEdit ? 'Save Changes' : type === 'transfer' ? 'Transfer' : 'Submit'}
            onPress={handleSubmit}
            variant="primary"
            size="lg"
            className="mb-6"
          />
        </View>
      </ScrollView>
      </KeyboardAvoider>
    </SafeAreaView>
  );
}