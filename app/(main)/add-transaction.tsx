import { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, Modal, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Camera, RefreshCw, Calendar, ChevronDown, Bell, Check } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useCallback } from 'expo-router';
import { Alert } from 'react-native';
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
import { useAuth } from '../../context/AuthContext';

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
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('food');
  const [account, setAccount] = useState('');
  const [toAccount, setToAccount] = useState('');
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
  const [note, setNote] = useState('');

  const { user } = useAuth();
  const now = new Date();
  const { accounts, loading: acctsLoading, error: acctsError, fetchAccounts } = useAccounts();
  const { loading: txLoading, error: txError, create } = useTransactions(now.getFullYear(), now.getMonth() + 1);
  const { customCategories, loading: catLoading, error: catError, fetchCustomCategories } = useCustomCategories();

  const categories = type === 'expense' ? expenseCategories : incomeCategories;

  useFocusEffect(useCallback(() => {
    fetchAccounts();
    fetchCustomCategories();
  }, [fetchAccounts, fetchCustomCategories]));

  if (acctsLoading || catLoading) return <LoadingView />;
  if (acctsError || catError) return <ErrorView error={acctsError ?? catError!} onRetry={() => { fetchAccounts(); fetchCustomCategories(); }} />;

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

    const transactionDate = dateOption === 'today'
      ? new Date().toISOString()
      : dateOption === 'yesterday'
      ? new Date(Date.now() - 86400000).toISOString()
      : customDate.toISOString();

    const result = await create({
      user_id: user.id,
      type,
      name,
      amount: parseFloat(amount),
      account_id: account,
      to_account_id: type === 'transfer' ? toAccount : undefined,
      category,
      date: transactionDate,
      note: note || undefined,
    });

    if (result.ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      router.back();
    } else {
      Alert.alert('Failed to save', result.error.message);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
        <Pressable onPress={() => router.back()} className="p-2">
          <X size={24} color="#ffffff" />
        </Pressable>
        <Text className="text-lg font-semibold text-foreground">Add Transaction</Text>
        <View className="w-10" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Scan Receipt */}
        <View className="px-4 pt-4">
          <Pressable className="w-full bg-primary rounded-2xl py-4 flex-row items-center justify-center gap-2 active:scale-[0.98] transition-transform">
            <Camera size={20} color="#000000" />
            <Text className="text-base font-bold text-primary-foreground">Scan Receipt</Text>
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
                  className={`text-sm font-semibold text-center ${
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
              placeholder={type === 'expense' ? 'What was this expense?' : 'What was this income?'}
              placeholderTextColor="#a0a0a0"
              value={name}
              onChangeText={setName}
              className="bg-input-background border border-border rounded-xl px-4 py-3 text-base text-foreground"
            />
          </View>

          {/* Category */}
          <Text className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1.5">
            Category
          </Text>
          <CategoryChips
            categories={categories}
            selected={category}
            onSelect={setCategory}
          />

          {/* Account Selector */}
          <AccountSelector
            value={account}
            onChange={setAccount}
            label={type === 'transfer' ? 'From' : type === 'expense' ? 'From Account' : 'To Account'}
            accounts={accounts}
          />

          {type === 'transfer' && (
            <AccountSelector value={toAccount} onChange={setToAccount} label="To Account" accounts={accounts} />
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
          <Pressable className="flex-row items-center justify-center gap-2 py-3 mb-6 border border-dashed border-border rounded-xl">
            <Camera size={18} color="#a0a0a0" />
            <Text className="text-sm text-muted-foreground">Attach Image</Text>
          </Pressable>

          {/* Submit Button */}
          <Button
            title={type === 'transfer' ? 'Transfer' : 'Submit'}
            onPress={handleSubmit}
            variant="primary"
            size="lg"
            className="mb-6"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}