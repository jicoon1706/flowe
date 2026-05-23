import { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Pencil, Plus, Minus } from '../../../components/ui/icons';

const MOCK_TABUNG: Record<string, {
  name: string;
  emoji: string;
  current: string;
  target: string;
  color: string;
  daysLeft: number;
  history: Array<{ id: string; type: 'topup' | 'withdraw'; amount: string; note: string; date: string }>;
}> = {
  '2': {
    name: 'Tabung Raya',
    emoji: '🎉',
    current: '850.00',
    target: '5,000.00',
    color: '#6bcf7f',
    daysLeft: 45,
    history: [
      { id: 'h1', type: 'topup', amount: '+500.00', note: 'Monthly savings', date: 'May 1, 2026' },
      { id: 'h2', type: 'topup', amount: '+200.00', note: 'Extra savings', date: 'Apr 15, 2026' },
      { id: 'h3', type: 'withdraw', amount: '-100.00', note: 'Emergency', date: 'Apr 10, 2026' },
    ],
  },
};

export default function TabungDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const tabungId = typeof id === 'string' ? id : '2';
  const tabung = MOCK_TABUNG[tabungId] ?? MOCK_TABUNG['2'];

  const [showTopUp, setShowTopUp] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [topUpNote, setTopUpNote] = useState('');
  const [withdrawNote, setWithdrawNote] = useState('');
  const [topUpSuccess, setTopUpSuccess] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');
  const [editName, setEditName] = useState(tabung.name);
  const [editTarget, setEditTarget] = useState(tabung.target);

  const currentNum = parseFloat(tabung.current.replace(/,/g, ''));
  const targetNum = parseFloat(tabung.target.replace(/,/g, ''));
  const percentage = Math.min(100, Math.round((currentNum / targetNum) * 100));
  const remaining = targetNum - currentNum;
  const weeksLeft = Math.ceil(tabung.daysLeft / 7);
  const weeklyNeeded = weeksLeft > 0 ? remaining / weeksLeft : remaining;

  const handleConfirmTopUp = () => {
    setTopUpSuccess(true);
    setTimeout(() => {
      setShowTopUp(false);
      setTopUpSuccess(false);
      setTopUpAmount('');
      setTopUpNote('');
    }, 1500);
  };

  const handleConfirmWithdraw = () => {
    const withdrawNum = parseFloat(withdrawAmount.replace(/,/g, ''));
    if (withdrawNum > currentNum) {
      setWithdrawError('Cannot exceed current saved amount');
      return;
    }
    setShowWithdraw(false);
    setWithdrawError('');
    setWithdrawAmount('');
    setWithdrawNote('');
  };

  const handleSaveEdit = () => {
    setShowEdit(false);
    setEditName('');
    setEditTarget('');
  };

  const quickAmounts = [10, 20, 50, 100];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-border">
        <Pressable onPress={() => router.back()} className="mr-3">
          <ChevronLeft size={24} color="#fff" />
        </Pressable>
        <Text className="flex-1 text-lg font-semibold text-foreground">{tabung.name}</Text>
        <Pressable onPress={() => setShowEdit(true)}>
          <Pencil size={22} color="#fff" />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Progress Circle */}
        <View className="items-center py-8">
          <View className="w-48 h-48 rounded-full border-8 border-border items-center justify-center">
            <View
              className="w-40 h-40 rounded-full border-4 items-center justify-center"
              style={{ borderColor: tabung.color }}
            >
              <Text className="text-5xl">{tabung.emoji}</Text>
              <Text className="text-2xl font-bold text-foreground">{percentage}%</Text>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View className="flex-row mx-4 px-1">
          <View className="flex-1 bg-card rounded-2xl p-4 items-center border border-border">
            <Text className="text-xs text-muted-foreground mb-1">Remaining</Text>
            <Text className="text-lg font-bold text-foreground">RM {remaining.toFixed(2)}</Text>
          </View>
          <View className="flex-1 bg-card rounded-2xl p-4 items-center mx-2 border border-border">
            <Text className="text-xs text-muted-foreground mb-1">Days Left</Text>
            <Text className="text-lg font-bold text-foreground">{tabung.daysLeft}</Text>
          </View>
          <View className="flex-1 bg-card rounded-2xl p-4 items-center border border-border">
            <Text className="text-xs text-muted-foreground mb-1">Weekly Needed</Text>
            <Text className="text-lg font-bold text-foreground">RM {weeklyNeeded.toFixed(2)}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="flex-row mx-4 mt-4">
          <Pressable
            onPress={() => setShowTopUp(true)}
            className="flex-1 bg-primary rounded-2xl py-3 mr-1.5 items-center"
          >
            <Text className="text-sm font-semibold text-primary-foreground">Top Up</Text>
          </Pressable>
          <Pressable
            onPress={() => setShowWithdraw(true)}
            className="flex-1 bg-card rounded-2xl py-3 ml-1.5 items-center border border-border"
          >
            <Text className="text-sm font-semibold text-foreground">Withdraw</Text>
          </Pressable>
        </View>

        {/* History */}
        <View className="mt-5 mb-4">
          <Text className="text-sm font-semibold text-foreground px-4 mb-3">History</Text>
          {tabung.history.map((item) => (
            <View
              key={item.id}
              className="flex-row items-center px-4 py-3 border-b border-border"
            >
              <View
                className="w-8 h-8 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: item.type === 'topup' ? '#22C55E20' : '#EF444420' }}
              >
                {item.type === 'topup' ? (
                  <Plus size={16} color="#22C55E" />
                ) : (
                  <Minus size={16} color="#EF4444" />
                )}
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-foreground">{item.note}</Text>
                <Text className="text-xs text-muted-foreground mt-0.5">{item.date}</Text>
              </View>
              <Text
                className={`text-sm font-semibold ${
                  item.type === 'topup' ? 'text-income' : 'text-expense'
                }`}
              >
                {item.amount}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* TopUp Modal */}
      <Modal visible={showTopUp} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-card rounded-t-3xl p-6 pb-10">
            <Text className="text-lg font-semibold text-foreground mb-4">Top Up</Text>
            <TextInput
              className="bg-background border border-border rounded-xl px-4 py-3 text-foreground mb-4"
              placeholder="Enter amount"
              placeholderTextColor="#888"
              keyboardType="numeric"
              value={topUpAmount}
              onChangeText={setTopUpAmount}
            />
            <View className="flex-row flex-wrap mb-4">
              {quickAmounts.map((amount) => (
                <Pressable
                  key={amount}
                  onPress={() => setTopUpAmount(amount.toString())}
                  className="bg-secondary rounded-xl px-4 py-2 mr-2 mb-2"
                >
                  <Text className="text-sm text-foreground">RM {amount}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              className="bg-background border border-border rounded-xl px-4 py-3 text-foreground mb-4"
              placeholder="Note (optional)"
              placeholderTextColor="#888"
              value={topUpNote}
              onChangeText={setTopUpNote}
            />
            {topUpSuccess ? (
              <View className="bg-primary/20 rounded-xl p-4 items-center mb-4">
                <Text className="text-primary font-semibold">Top up successful!</Text>
              </View>
            ) : null}
            <View className="flex-row">
              <Pressable
                onPress={() => {
                  setShowTopUp(false);
                  setTopUpAmount('');
                  setTopUpNote('');
                  setTopUpSuccess(false);
                }}
                className="flex-1 py-3 items-center"
              >
                <Text className="text-muted-foreground">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleConfirmTopUp}
                className="flex-1 bg-primary rounded-2xl py-3 items-center"
              >
                <Text className="text-sm font-semibold text-primary-foreground">Confirm Top Up</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Withdraw Modal */}
      <Modal visible={showWithdraw} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-card rounded-t-3xl p-6 pb-10">
            <Text className="text-lg font-semibold text-foreground mb-4">Withdraw</Text>
            <TextInput
              className="bg-background border border-border rounded-xl px-4 py-3 text-foreground mb-2"
              placeholder="Enter amount"
              placeholderTextColor="#888"
              keyboardType="numeric"
              value={withdrawAmount}
              onChangeText={(text) => {
                setWithdrawAmount(text);
                setWithdrawError('');
              }}
            />
            {withdrawError ? (
              <Text className="text-expense text-sm mb-2">{withdrawError}</Text>
            ) : null}
            <View className="flex-row gap-2 mb-2">
              {quickAmounts.map(a => (
                <Pressable key={a} onPress={() => setWithdrawAmount(a)} className="bg-secondary px-4 py-2 rounded-xl">
                  <Text className="text-sm text-muted-foreground">RM {a}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              className="bg-background border border-border rounded-xl px-4 py-3 text-foreground mb-4 mt-2"
              placeholder="Note (optional)"
              placeholderTextColor="#888"
              value={withdrawNote}
              onChangeText={setWithdrawNote}
            />
            <View className="flex-row">
              <Pressable
                onPress={() => {
                  setShowWithdraw(false);
                  setWithdrawAmount('');
                  setWithdrawNote('');
                  setWithdrawError('');
                }}
                className="flex-1 py-3 items-center"
              >
                <Text className="text-muted-foreground">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleConfirmWithdraw}
                className="flex-1 bg-primary rounded-2xl py-3 items-center"
              >
                <Text className="text-sm font-semibold text-primary-foreground">Confirm Withdraw</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Goal Modal */}
      <Modal visible={showEdit} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-card rounded-t-3xl p-6 pb-10">
            <Text className="text-lg font-semibold text-foreground mb-4">Edit Goal</Text>
            <Text className="text-xs text-muted-foreground mb-1">Name</Text>
            <TextInput
              className="bg-background border border-border rounded-xl px-4 py-3 text-foreground mb-4"
              placeholder="Tabung name"
              placeholderTextColor="#888"
              value={editName}
              onChangeText={setEditName}
            />
            <Text className="text-xs text-muted-foreground mb-1">Target Amount</Text>
            <TextInput
              className="bg-background border border-border rounded-xl px-4 py-3 text-foreground mb-4"
              placeholder="Target"
              placeholderTextColor="#888"
              keyboardType="numeric"
              value={editTarget}
              onChangeText={setEditTarget}
            />
            <View className="flex-row">
              <Pressable
                onPress={() => {
                  setShowEdit(false);
                  setEditName(tabung.name);
                  setEditTarget(tabung.target);
                }}
                className="flex-1 py-3 items-center"
              >
                <Text className="text-muted-foreground">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSaveEdit}
                className="flex-1 bg-primary rounded-2xl py-3 items-center"
              >
                <Text className="text-sm font-semibold text-primary-foreground">Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}