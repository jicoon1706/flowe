import { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Plus, Repeat, Pause, Play, X, ChevronDown, Calendar } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { useRecurring } from '../../../src/hooks/useRecurring';
import { useAccounts } from '../../../src/hooks/useAccounts';
import { useAuth } from '../../../context/AuthContext';
import { MALAYSIAN_BANKS } from '../../../constants/banks';

function bankColor(account: any): string {
  const bankName = account?.bank_accounts?.bank_name?.toLowerCase();
  if (bankName) {
    const preset = MALAYSIAN_BANKS.find((b) => b.id === bankName || b.name.toLowerCase() === bankName);
    if (preset) return preset.color;
  }
  return account?.color ?? '#94a3b8';
}
import { LoadingView } from '../../../components/ui/LoadingView';
import { ErrorView } from '../../../components/ui/ErrorView';
import * as Haptics from 'expo-haptics';

const FREQUENCIES = ['Weekly', 'Monthly', 'Yearly'] as const;

export default function RecurringScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { accounts, fetchAccounts } = useAccounts();
  const { recurringRules, loading, error, fetchRecurring, createRecurring, updateStatus } = useRecurring();
  const bankAccounts = accounts.filter((a) => a.type === 'bank');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [showFreqPicker, setShowFreqPicker] = useState(false);
  const [showNextDatePicker, setShowNextDatePicker] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newFrequency, setNewFrequency] = useState<typeof FREQUENCIES[number]>('Monthly');
  const [newAccountId, setNewAccountId] = useState('');
  const [newNextDate, setNewNextDate] = useState(new Date());

  useEffect(() => {
    fetchRecurring();
    fetchAccounts();
  }, [fetchRecurring, fetchAccounts]);

  if (loading) return <LoadingView />;
  if (error) return <ErrorView error={error} onRetry={fetchRecurring} />;

  const activePayments = recurringRules.filter(p => p.status !== 'paused');
  const totalActive = activePayments.reduce((sum, p) => sum + Number(p.amount), 0);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const togglePause = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'paused' ? 'active' : 'paused';
    await updateStatus(id, newStatus as 'active' | 'paused' | 'ended');
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const handleAddPayment = async () => {
    if (!newName.trim() || !newAmount.trim() || !user) {
      Alert.alert('Missing fields', 'Please enter a name and amount.');
      return;
    }
    const result = await createRecurring({
      user_id: user.id,
      type: 'expense',
      name: newName.trim(),
      amount: parseFloat(newAmount),
      frequency: newFrequency.toLowerCase() as 'weekly' | 'monthly' | 'yearly',
      start_date: newNextDate.toISOString().slice(0, 10),
      from_account_id: newAccountId || bankAccounts[0]?.id,
    });
    if (result.ok) {
      setShowAddModal(false);
      setNewName('');
      setNewAmount('');
      setNewFrequency('Monthly');
      setNewAccountId('');
      setNewNextDate(new Date());
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } else {
      Alert.alert('Failed', result.error.message);
    }
  };

  const AddButton = (
    <Pressable
      onPress={() => setShowAddModal(true)}
      className="bg-primary w-10 h-10 rounded-full items-center justify-center"
    >
      <Plus size={20} color="#000000" />
    </Pressable>
  );

  const selectedAccount = bankAccounts.find(a => a.id === newAccountId) ?? bankAccounts[0];
  const accountColor = selectedAccount ? bankColor(selectedAccount) : '#94a3b8';
  const accountName = (selectedAccount as any)?.name ?? 'Select Account';

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScreenHeader title="Recurring Payments" onBack={() => router.back()} rightAction={AddButton} />

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-4 pt-4">
        {/* Summary Card */}
        <View className="bg-card border border-border rounded-2xl p-5 mb-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Monthly Total</Text>
              <Text className="text-2xl font-bold text-foreground mt-1">RM {totalActive.toFixed(2)}</Text>
            </View>
            <View className="bg-primary/10 rounded-full px-3 py-1.5">
              <Text className="text-primary text-sm font-medium">{activePayments.length} active</Text>
            </View>
          </View>
        </View>

        {/* Recurring List */}
        <View className="gap-2">
          {recurringRules.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => togglePause(item.id, item.status)}
              className="flex-row items-center justify-between bg-card border border-border rounded-xl px-4 py-3 active:scale-[0.98] transition-transform"
            >
              <View className="flex-row items-center gap-3">
                <View className={`w-9 h-9 rounded-xl ${item.status === 'paused' ? 'bg-muted' : 'bg-primary/10'} items-center justify-center`}>
                  <Repeat size={18} color={item.status === 'paused' ? '#a0a0a0' : '#C5FF00'} />
                </View>
                <View>
                  <View className="flex-row items-center gap-2">
                    <Text className="text-sm font-medium text-foreground">{(item as any).name}</Text>
                    {item.status === 'paused' && (
                      <View className="bg-muted rounded-full px-2 py-0.5">
                        <Text className="text-muted-foreground text-xs">Paused</Text>
                      </View>
                    )}
                  </View>
                  <View className="flex-row items-center gap-2 mt-0.5">
                    <Text className="text-xs text-muted-foreground">RM {Number(item.amount).toFixed(2)}</Text>
                    <Text className="text-xs text-muted-foreground">·</Text>
                    <Text className="text-xs text-muted-foreground capitalize">{item.frequency}</Text>
                    <Text className="text-xs text-muted-foreground">·</Text>
                    <View className="flex-row items-center gap-1">
                      <Calendar size={10} color="#a0a0a0" />
                      <Text className="text-xs text-muted-foreground">{formatDate(item.start_date)}</Text>
                    </View>
                  </View>
                </View>
              </View>
              <View className="flex-row items-center gap-2">
                <View className={`p-2 rounded-full ${item.status === 'paused' ? 'bg-muted' : 'bg-primary/10'}`}>
                  {item.status === 'paused' ? (
                    <Play size={14} color="#a0a0a0" />
                  ) : (
                    <Pause size={14} color="#C5FF00" />
                  )}
                </View>
              </View>
            </Pressable>
          ))}
        </View>

        {recurringRules.length === 0 && (
          <View className="items-center justify-center py-12">
            <Repeat size={48} color="#404040" />
            <Text className="text-muted-foreground text-sm mt-4">No recurring payments yet</Text>
          </View>
        )}

        <Text className="text-center text-xs text-muted-foreground mt-4 pb-8">
          Tap pause to temporarily stop a payment
        </Text>
      </ScrollView>

      {/* Add Recurring Modal */}
      {showAddModal && (
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50 }}>
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setShowAddModal(false)}
        >
          <Pressable
            className="bg-card rounded-t-3xl p-6 pb-8"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="w-12 h-1 bg-border rounded-full mx-auto mb-6" />

            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-lg font-semibold text-foreground">Add Recurring Payment</Text>
              <Pressable onPress={() => setShowAddModal(false)} className="p-2">
                <X size={20} color="#a0a0a0" />
              </Pressable>
            </View>

            {/* Name Input */}
            <View className="mb-4">
              <Text className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">Name</Text>
              <TextInput
                value={newName}
                onChangeText={setNewName}
                placeholder="e.g., Netflix, Unifi"
                placeholderTextColor="#a0a0a0"
                className="bg-background border border-border rounded-xl px-4 py-3 text-foreground"
              />
            </View>

            {/* Amount Input */}
            <View className="mb-4">
              <Text className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">Amount (RM)</Text>
              <TextInput
                value={newAmount}
                onChangeText={setNewAmount}
                placeholder="0.00"
                placeholderTextColor="#a0a0a0"
                keyboardType="decimal-pad"
                className="bg-background border border-border rounded-xl px-4 py-3 text-foreground"
              />
            </View>

            {/* Frequency Picker */}
            <View className="mb-4">
              <Text className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">Frequency</Text>
              <Pressable
                onPress={() => setShowFreqPicker(!showFreqPicker)}
                className="bg-background border border-border rounded-xl px-4 py-3 flex-row items-center justify-between"
              >
                <Text className="text-foreground">{newFrequency}</Text>
                <ChevronDown size={18} color="#a0a0a0" />
              </Pressable>
              {showFreqPicker && (
                <View className="mt-2 bg-background border border-border rounded-xl overflow-hidden">
                  {FREQUENCIES.map((freq, idx) => (
                    <Pressable
                      key={freq}
                      onPress={() => {
                        setNewFrequency(freq);
                        setShowFreqPicker(false);
                      }}
                      className={`px-4 py-3 ${idx !== 0 ? 'border-t border-border' : ''}`}
                    >
                      <Text className="text-foreground">{freq}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {/* Next Payment Date Picker */}
            <View className="mb-4">
              <Text className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">Next Payment</Text>
              <Pressable
                onPress={() => setShowNextDatePicker(true)}
                className="bg-background border border-border rounded-xl px-4 py-3 flex-row items-center justify-between"
              >
                <View className="flex-row items-center gap-2">
                  <Calendar size={16} color="#a0a0a0" />
                  <Text className="text-foreground">{formatDate(newNextDate.toISOString())}</Text>
                </View>
                <ChevronDown size={18} color="#a0a0a0" />
              </Pressable>
            </View>

            {/* Native DateTimePicker for next payment date */}
            {showNextDatePicker && (
              <View className="mb-4">
                <DateTimePicker
                  value={newNextDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(_, date) => {
                    if (date) setNewNextDate(date);
                    if (Platform.OS === 'android') {
                      setShowNextDatePicker(false);
                    }
                  }}
                />
                {Platform.OS === 'ios' && (
                  <Pressable
                    onPress={() => setShowNextDatePicker(false)}
                    className="bg-primary rounded-xl py-3 items-center mt-2"
                  >
                    <Text className="text-black font-semibold">Done</Text>
                  </Pressable>
                )}
              </View>
            )}

            {/* Account Picker */}
            <View className="mb-6">
              <Text className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">From Account</Text>
              <Pressable
                onPress={() => setShowAccountPicker(!showAccountPicker)}
                className="bg-background border border-border rounded-xl px-4 py-3 flex-row items-center justify-between"
              >
                <View className="flex-row items-center gap-2">
                  <View className="w-3 h-3 rounded-full" style={{ backgroundColor: accountColor }} />
                  <Text className="text-foreground">{accountName}</Text>
                </View>
                <ChevronDown size={18} color="#a0a0a0" />
              </Pressable>
              {showAccountPicker && (
                <View className="mt-2 bg-background border border-border rounded-xl overflow-hidden">
                  {bankAccounts.map((account, i) => {
                    const accColor = bankColor(account);
                    const accName = account.name;
                    return (
                      <Pressable
                        key={account.id}
                        onPress={() => {
                          setNewAccountId(account.id);
                          setShowAccountPicker(false);
                        }}
                        className={`px-4 py-3 flex-row items-center gap-2 ${i !== 0 ? 'border-t border-border' : ''}`}
                      >
                        <View className="w-3 h-3 rounded-full" style={{ backgroundColor: accColor }} />
                        <Text className="text-foreground">{accName}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Add Button */}
            <Pressable
              onPress={handleAddPayment}
              disabled={!newName.trim() || !newAmount.trim()}
              className={`py-4 rounded-2xl items-center justify-center ${!newName.trim() || !newAmount.trim() ? 'bg-muted' : 'bg-primary'}`}
            >
              <Text className={`font-bold text-base ${!newName.trim() || !newAmount.trim() ? 'text-muted-foreground' : 'text-black'}`}>
                Add Payment
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </View>
      )}
    </SafeAreaView>
  );
}