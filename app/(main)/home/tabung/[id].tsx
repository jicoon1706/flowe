import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { AlertCircle, Calendar, Check, ChevronLeft, Minus, Pencil, Plus, Target, TrendingUp, X } from '../../../../components/ui/icons';

const MOCK_TABUNG: Record<string, {
  name: string;
  emoji: string;
  current: string;
  target: string;
  color: string;
  daysLeft: number;
  history: { id: string; type: 'topup' | 'withdraw'; amount: string; note: string; date: string }[];
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
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');
  const [editName, setEditName] = useState(tabung.name);
  const [editTarget, setEditTarget] = useState(tabung.target);

  const currentNum = parseFloat(tabung.current.replace(/,/g, ''));
  const targetNum = parseFloat(tabung.target.replace(/,/g, ''));
  const percentage = Math.min(100, Math.round((currentNum / targetNum) * 100));
  const remaining = targetNum - currentNum;
  const weeksLeft = Math.ceil(tabung.daysLeft / 7);
  const weeklyNeeded = weeksLeft > 0 ? remaining / weeksLeft : remaining;

  // SVG circle progress props
  const size = 144;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

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
    setWithdrawSuccess(true);
    setTimeout(() => {
      setShowWithdraw(false);
      setWithdrawSuccess(false);
      setWithdrawError('');
      setWithdrawAmount('');
      setWithdrawNote('');
    }, 1500);
  };

  const handleSaveEdit = () => {
    setShowEdit(false);
  };

  const quickAmounts = [10, 20, 50, 100];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-border">
        <Pressable onPress={() => router.back()} className="p-2 mr-2">
          <ChevronLeft size={24} color="#fff" />
        </Pressable>
        <Text className="flex-1 text-lg font-semibold text-foreground">{tabung.name}</Text>
        <Pressable onPress={() => setShowEdit(true)} className="p-2">
          <Pencil size={22} color="#fff" />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Progress Circle with SVG */}
        <View className="items-center py-6 mx-4 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-3xl mb-4">
          <View className="relative w-36 h-36 mb-6 items-center justify-center">
            <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
              {/* Background circle */}
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="rgba(255,255,255,0.1)"
                strokeWidth={strokeWidth}
                fill="none"
              />
              {/* Progress circle - starts from top (12 o'clock) */}
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="#C5FF00"
                strokeWidth={strokeWidth}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${(percentage / 100) * circumference} ${circumference}`}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            </Svg>
            <View className="absolute inset-0 flex flex-col items-center justify-center">
              <Text className="text-4xl mb-1">{tabung.emoji}</Text>
              <Text className="text-xl font-bold text-primary">{percentage}%</Text>
            </View>
          </View>

          <View className="text-center mt-2">
            <Text className="text-3xl font-bold text-foreground">RM {currentNum.toFixed(2)}</Text>
            <Text className="text-sm text-muted-foreground">of RM {targetNum.toFixed(2)} goal</Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View className="flex-row mx-4 px-1 mb-4">
          <View className="flex-1 bg-card rounded-2xl p-3 items-center border border-border">
            <View className="mb-1"><Target size={16} color="#C5FF00" /></View>
            <Text className="text-lg font-bold text-foreground">RM {remaining.toFixed(2)}</Text>
            <Text className="text-xs text-muted-foreground">Remaining</Text>
          </View>
          <View className="flex-1 bg-card rounded-2xl p-3 items-center mx-2 border border-border">
            <View className="mb-1"><Calendar size={16} color="#C5FF00" /></View>
            <Text className="text-lg font-bold text-foreground">{tabung.daysLeft}</Text>
            <Text className="text-xs text-muted-foreground">Days left</Text>
          </View>
          <View className="flex-1 bg-card rounded-2xl p-3 items-center border border-border">
            <View className="mb-1"><TrendingUp size={16} color="#C5FF00" /></View>
            <Text className="text-lg font-bold text-foreground">RM {weeklyNeeded.toFixed(2)}</Text>
            <Text className="text-xs text-muted-foreground">Per week</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="flex-row mx-4 mb-5">
          <Pressable
            onPress={() => setShowTopUp(true)}
            className="flex-1 bg-primary rounded-2xl py-4 mr-1.5 justify-center items-center flex-row shadow-lg shadow-primary/20"
          >
            <Plus size={20} color="#000" />
            <Text className="text-sm font-bold text-black ml-2">Top Up</Text>
          </Pressable>
          <Pressable
            onPress={() => { setWithdrawError(''); setShowWithdraw(true); }}
            className="flex-1 bg-card rounded-2xl py-4 ml-1.5 justify-center items-center flex-row border border-border"
          >
            <Minus size={20} color="#fff" />
            <Text className="text-sm font-bold text-foreground ml-2">Withdraw</Text>
          </Pressable>
        </View>

        {/* Transaction History */}
        <View className="px-4 mb-4">
          <Text className="text-sm font-medium text-muted-foreground mb-4">Transaction History</Text>
          <View className="gap-2">
            {tabung.history.map((item) => (
              <View
                key={item.id}
                className="bg-card border border-border rounded-xl p-4 flex-row items-center justify-between"
              >
                <View className="flex-row items-center">
                  <View
                    className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${
                      item.type === 'withdraw' ? 'bg-red-500/15' : 'bg-primary/15'
                    }`}
                  >
                    {item.type === 'withdraw' ? (
                      <Minus size={16} color="#EF4444" />
                    ) : (
                      <Plus size={16} color="#C5FF00" />
                    )}
                  </View>
                  <View>
                    <Text className="text-sm font-medium text-foreground">{item.note}</Text>
                    <Text className="text-xs text-muted-foreground">{item.date}</Text>
                  </View>
                </View>
                <Text
                  className={`text-sm font-bold ${
                    item.type === 'withdraw' ? 'text-red-400' : 'text-primary'
                  }`}
                >
                  {item.type === 'withdraw' ? '-' : '+'}RM {item.amount.replace(/[^0-9.]/g, '')}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* TopUp Modal */}
      <Modal visible={showTopUp} transparent>
        <View className="flex-1 justify-end bg-black/70">
          <View className="bg-card rounded-t-3xl p-6 pb-10" onStartShouldSetResponder={() => true}>
            {topUpSuccess ? (
              <View className="flex flex-col items-center py-6 gap-3">
                <View className="w-16 h-16 bg-primary rounded-full items-center justify-center">
                  <Check size={32} color="#000" />
                </View>
                <Text className="text-lg font-bold text-foreground">Top Up Successful!</Text>
                <Text className="text-sm text-muted-foreground">Your tabung is growing 🌱</Text>
              </View>
            ) : (
              <>
                <View className="flex-row items-center justify-between mb-5">
                  <Text className="text-lg font-bold text-foreground">Top Up {tabung.name}</Text>
                  <Pressable onPress={() => setShowTopUp(false)}>
                    <X size={24} color="#888" />
                  </Pressable>
                </View>

                <View className="mb-4">
                  <Text className="text-xs text-muted-foreground mb-1">Amount (RM)</Text>
                  <TextInput
                    className="bg-background border border-border rounded-xl px-4 py-3 text-foreground text-xl font-bold"
                    placeholder="0.00"
                    placeholderTextColor="#888"
                    keyboardType="numeric"
                    value={topUpAmount}
                    onChangeText={setTopUpAmount}
                  />
                </View>

                <View className="flex-row flex-wrap mb-4 gap-2">
                  {quickAmounts.map((amount) => (
                    <Pressable
                      key={amount}
                      onPress={() => setTopUpAmount(amount.toString())}
                      className={`px-4 py-2 rounded-xl ${
                        topUpAmount === amount.toString()
                          ? 'bg-primary'
                          : 'bg-background border border-border'
                      }`}
                    >
                      <Text
                        className={`text-sm font-semibold ${
                          topUpAmount === amount.toString() ? 'text-black' : 'text-muted-foreground'
                        }`}
                      >
                        RM {amount}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <View className="mb-5">
                  <Text className="text-xs text-muted-foreground mb-1">Note (optional)</Text>
                  <TextInput
                    className="bg-background border border-border rounded-xl px-4 py-3 text-foreground"
                    placeholder="e.g. Weekly savings"
                    placeholderTextColor="#888"
                    value={topUpNote}
                    onChangeText={setTopUpNote}
                  />
                </View>

                <Pressable
                  onPress={handleConfirmTopUp}
                  className="bg-primary rounded-2xl py-4 items-center"
                >
                  <Text className="text-sm font-bold text-black">Confirm Top Up</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Withdraw Modal */}
      <Modal visible={showWithdraw} transparent>
        <View className="flex-1 justify-end bg-black/70">
          <View className="bg-card rounded-t-3xl p-6 pb-10" onStartShouldSetResponder={() => true}>
            {withdrawSuccess ? (
              <View className="flex flex-col items-center py-6 gap-3">
                <View className="w-16 h-16 bg-red-500/20 border border-red-500/30 rounded-full items-center justify-center">
                  <Check size={32} color="#EF4444" />
                </View>
                <Text className="text-lg font-bold text-foreground">Withdrawal Successful</Text>
                <Text className="text-sm text-muted-foreground">Amount removed from your tabung</Text>
              </View>
            ) : (
              <>
                <View className="flex-row items-center justify-between mb-5">
                  <Text className="text-lg font-bold text-foreground">Withdraw from {tabung.name}</Text>
                  <Pressable onPress={() => setShowWithdraw(false)}>
                    <X size={24} color="#888" />
                  </Pressable>
                </View>

                <View className="bg-muted/40 border border-border rounded-xl p-3 mb-4 flex-row items-center">
                  <Text className="text-sm text-muted-foreground">Available balance:</Text>
                  <Text className="text-sm font-bold text-primary ml-2">RM {currentNum.toFixed(2)}</Text>
                </View>

                <View className="mb-4">
                  <Text className="text-xs text-muted-foreground mb-1">Amount (RM)</Text>
                  <TextInput
                    className="bg-background border border-border rounded-xl px-4 py-3 text-foreground text-xl font-bold"
                    placeholder="0.00"
                    placeholderTextColor="#888"
                    keyboardType="numeric"
                    value={withdrawAmount}
                    onChangeText={(text) => {
                      setWithdrawAmount(text);
                      setWithdrawError('');
                    }}
                  />
                  {withdrawError ? (
                    <View className="flex-row items-center gap-1.5 mt-2">
                      <AlertCircle size={14} color="#EF4444" />
                      <Text className="text-xs text-red-400">{withdrawError}</Text>
                    </View>
                  ) : null}
                </View>

                <View className="flex-row flex-wrap mb-4 gap-2">
                  {quickAmounts.filter((a) => parseFloat(a.toString()) <= currentNum).map((amount) => (
                    <Pressable
                      key={amount}
                      onPress={() => {
                        setWithdrawAmount(amount.toString());
                        setWithdrawError('');
                      }}
                      className={`px-4 py-2 rounded-xl ${
                        withdrawAmount === amount.toString()
                          ? 'bg-red-500/20 border border-red-500/40'
                          : 'bg-background border border-border'
                      }`}
                    >
                      <Text
                        className={`text-sm font-semibold ${
                          withdrawAmount === amount.toString() ? 'text-red-400' : 'text-muted-foreground'
                        }`}
                      >
                        RM {amount}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <View className="mb-5">
                  <Text className="text-xs text-muted-foreground mb-1">Note (optional)</Text>
                  <TextInput
                    className="bg-background border border-border rounded-xl px-4 py-3 text-foreground"
                    placeholder="e.g. Emergency use"
                    placeholderTextColor="#888"
                    value={withdrawNote}
                    onChangeText={setWithdrawNote}
                  />
                </View>

                <Pressable
                  onPress={handleConfirmWithdraw}
                  className="bg-red-500/20 border border-red-500/30 rounded-2xl py-4 items-center"
                >
                  <Text className="text-sm font-bold text-red-400">Confirm Withdrawal</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Edit Goal Modal */}
      <Modal visible={showEdit} transparent>
        <View className="flex-1 justify-end bg-black/70">
          <View className="bg-card rounded-t-3xl p-6 pb-10" onStartShouldSetResponder={() => true}>
            <View className="flex-row items-center justify-between mb-5">
              <Text className="text-lg font-bold text-foreground">Edit Goal</Text>
              <Pressable onPress={() => setShowEdit(false)}>
                <X size={24} color="#888" />
              </Pressable>
            </View>

            <View className="mb-4">
              <Text className="text-xs text-muted-foreground mb-1">Tabung Name</Text>
              <TextInput
                className="bg-background border border-border rounded-xl px-4 py-3 text-foreground"
                placeholder="Tabung name"
                placeholderTextColor="#888"
                value={editName}
                onChangeText={setEditName}
              />
            </View>

            <View className="mb-5">
              <Text className="text-xs text-muted-foreground mb-1">Target Amount (RM)</Text>
              <TextInput
                className="bg-background border border-border rounded-xl px-4 py-3 text-foreground"
                placeholder="Target"
                placeholderTextColor="#888"
                keyboardType="numeric"
                value={editTarget}
                onChangeText={(text) => setEditTarget(text.replace(/[^0-9.]/g, ''))}
              />
            </View>

            <Pressable
              onPress={handleSaveEdit}
              className="bg-primary rounded-2xl py-4 items-center"
            >
              <Text className="text-sm font-bold text-black">Save Changes</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}