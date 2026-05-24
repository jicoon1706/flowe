import { useState } from 'react';
import { View, Text, Pressable, ScrollView, Modal, TextInput, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Plus, Repeat, Pause, Play, X, ChevronDown, Calendar } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';

interface RecurringItem {
  id: string;
  name: string;
  amount: number;
  frequency: 'Weekly' | 'Monthly' | 'Yearly';
  paused: boolean;
  account: string;
  nextDate: Date;
}

const today = new Date();
const getNextDate = (base: Date, freq: 'Weekly' | 'Monthly' | 'Yearly'): Date => {
  const d = new Date(base);
  if (freq === 'Weekly') d.setDate(d.getDate() + 7);
  else if (freq === 'Monthly') d.setMonth(d.getMonth() + 1);
  else d.setFullYear(d.getFullYear() + 1);
  return d;
};

const MOCK_RECURRING: RecurringItem[] = [
  { id: '1', name: 'Unifi', amount: 89, frequency: 'Monthly', paused: false, account: 'Maybank', nextDate: getNextDate(today, 'Monthly') },
  { id: '2', name: 'Netflix', amount: 53, frequency: 'Monthly', paused: false, account: 'Maybank', nextDate: getNextDate(today, 'Monthly') },
  { id: '3', name: 'Axiata', amount: 30, frequency: 'Monthly', paused: true, account: 'Maybank', nextDate: getNextDate(today, 'Monthly') },
];

const ACCOUNTS = [
  { id: '1', name: 'Maybank', color: '#ffd93d' },
  { id: '2', name: 'Tabung Raya', color: '#6bcf7f' },
  { id: '3', name: 'Cash', color: '#00d4ff' },
];

const FREQUENCIES = ['Weekly', 'Monthly', 'Yearly'];

export default function RecurringScreen() {
  const router = useRouter();
  const [recurringList, setRecurringList] = useState<RecurringItem[]>(MOCK_RECURRING);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [showFreqPicker, setShowFreqPicker] = useState(false);
  const [showNextDatePicker, setShowNextDatePicker] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newFrequency, setNewFrequency] = useState<'Weekly' | 'Monthly' | 'Yearly'>('Monthly');
  const [newAccount, setNewAccount] = useState('Maybank');
  const [newNextDate, setNewNextDate] = useState<Date>(getNextDate(today, 'Monthly'));

  const activePayments = recurringList.filter(p => !p.paused);
  const totalActive = activePayments.reduce((sum, p) => sum + p.amount, 0);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const togglePause = (id: string) => {
    setRecurringList(prev =>
      prev.map(item =>
        item.id === id ? { ...item, paused: !item.paused } : item
      )
    );
  };

  const handleAddPayment = () => {
    if (!newName.trim() || !newAmount.trim()) return;

    const newItem: RecurringItem = {
      id: Date.now().toString(),
      name: newName.trim(),
      amount: parseFloat(newAmount),
      frequency: newFrequency,
      paused: false,
      account: newAccount,
      nextDate: newNextDate,
    };

    setRecurringList(prev => [...prev, newItem]);
    setShowAddModal(false);
    setNewName('');
    setNewAmount('');
    setNewFrequency('Monthly');
    setNewAccount('Maybank');
    setNewNextDate(getNextDate(today, 'Monthly'));
  };

  const AddButton = (
    <Pressable
      onPress={() => setShowAddModal(true)}
      className="bg-primary w-10 h-10 rounded-full items-center justify-center"
    >
      <Plus size={20} color="#000000" />
    </Pressable>
  );

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
          {recurringList.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => togglePause(item.id)}
              className="flex-row items-center justify-between bg-card border border-border rounded-xl px-4 py-3 active:scale-[0.98] transition-transform"
            >
              <View className="flex-row items-center gap-3">
                <View className={`w-9 h-9 rounded-xl ${item.paused ? 'bg-muted' : 'bg-primary/10'} items-center justify-center`}>
                  <Repeat size={18} color={item.paused ? '#a0a0a0' : '#C5FF00'} />
                </View>
                <View>
                  <View className="flex-row items-center gap-2">
                    <Text className="text-sm font-medium text-foreground">{item.name}</Text>
                    {item.paused && (
                      <View className="bg-muted rounded-full px-2 py-0.5">
                        <Text className="text-muted-foreground text-xs">Paused</Text>
                      </View>
                    )}
                  </View>
                  <View className="flex-row items-center gap-2 mt-0.5">
                    <Text className="text-xs text-muted-foreground">RM {item.amount.toFixed(2)}</Text>
                    <Text className="text-xs text-muted-foreground">·</Text>
                    <Text className="text-xs text-muted-foreground">{item.frequency}</Text>
                    <Text className="text-xs text-muted-foreground">·</Text>
                    <View className="flex-row items-center gap-1">
                      <Calendar size={10} color="#a0a0a0" />
                      <Text className="text-xs text-muted-foreground">{formatDate(item.nextDate)}</Text>
                    </View>
                  </View>
                </View>
              </View>
              <View className="flex-row items-center gap-2">
                <View className={`p-2 rounded-full ${item.paused ? 'bg-muted' : 'bg-primary/10'}`}>
                  {item.paused ? (
                    <Play size={14} color="#a0a0a0" />
                  ) : (
                    <Pause size={14} color="#C5FF00" />
                  )}
                </View>
              </View>
            </Pressable>
          ))}
        </View>

        {recurringList.length === 0 && (
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
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
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
                        setNewFrequency(freq as 'Weekly' | 'Monthly' | 'Yearly');
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
                  <Text className="text-foreground">{formatDate(newNextDate)}</Text>
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
                  <View className="w-3 h-3 rounded-full" style={{ backgroundColor: ACCOUNTS.find(a => a.name === newAccount)?.color }} />
                  <Text className="text-foreground">{newAccount}</Text>
                </View>
                <ChevronDown size={18} color="#a0a0a0" />
              </Pressable>
              {showAccountPicker && (
                <View className="mt-2 bg-background border border-border rounded-xl overflow-hidden">
                  {ACCOUNTS.map((account, i) => (
                    <Pressable
                      key={account.id}
                      onPress={() => {
                        setNewAccount(account.name);
                        setShowAccountPicker(false);
                      }}
                      className={`px-4 py-3 flex-row items-center gap-2 ${i !== 0 ? 'border-t border-border' : ''}`}
                    >
                      <View className="w-3 h-3 rounded-full" style={{ backgroundColor: account.color }} />
                      <Text className="text-foreground">{account.name}</Text>
                    </Pressable>
                  ))}
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
      </Modal>
    </SafeAreaView>
  );
}