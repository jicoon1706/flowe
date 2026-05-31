import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Modal, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { AlertCircle, Check, ChevronLeft, Minus, Pencil, Plus, X } from 'lucide-react-native';
import { useAccounts } from '../../../../src/hooks/useAccounts';
import { transactionsRepository } from '../../../../src/repositories/transactions.repository';
import { accountsRepository } from '../../../../src/repositories/accounts.repository';
import type { Transaction } from '../../../../src/types';
import { LoadingView } from '../../../../components/ui/LoadingView';
import { ErrorView } from '../../../../components/ui/ErrorView';
import { useAuth } from '../../../../context/AuthContext';

const EDIT_ICONS = ['🐷', '💰', '🏠', '🎁', '🚗', '🚀', '🌴', '🏢', '🚂', '🎯', '💎', '⭐'];
const EDIT_COLORS = ['#6bcf7f', '#ffd93d', '#00d4ff', '#C5FF00', '#f472b6', '#a78bfa', '#34d399', '#fb923c'];

export default function TabungDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { accounts, loading, error, fetchAccounts } = useAccounts();

  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const tabungId = typeof id === 'string' ? id : '';

  const fetchTransactions = useCallback(async () => {
    if (!tabungId) return;
    const result = await transactionsRepository.fetchByAccount(tabungId);
    if (result.ok) setTransactions(result.data);
  }, [tabungId]);

  useFocusEffect(useCallback(() => {
    fetchAccounts();
    fetchTransactions();
  }, [fetchAccounts, fetchTransactions]));

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchAccounts(), fetchTransactions()]);
    setRefreshing(false);
  }, [fetchAccounts, fetchTransactions]);

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
  const [editName, setEditName] = useState('');
  const [editTarget, setEditTarget] = useState('');
  const [editIcon, setEditIcon] = useState('🎉');
  const [editColor, setEditColor] = useState('#6bcf7f');
  const [actionLoading, setActionLoading] = useState(false);

  const account = accounts.find((a) => a.id === tabungId) ?? accounts[0];
  const rawTabung = (account as any)?.tabung_accounts;
  const tabungData = Array.isArray(rawTabung) ? rawTabung[0] : rawTabung;

  const savedAmount = Number(tabungData?.saved_amount ?? 0);
  const targetAmount = Number(tabungData?.target_amount ?? 0);
  const tabungColor = account?.color ?? '#6bcf7f';
  const tabungEmoji = account?.icon ?? '🎉';

  const currentNum = savedAmount;
  const targetNum = targetAmount;
  const percentExact = targetNum > 0 ? Math.min(100, (currentNum / targetNum) * 100) : 0;
  const percentage = percentExact > 0 && percentExact < 1 ? Number(percentExact.toFixed(1)) : Math.round(percentExact);
  const remaining = Math.max(0, targetNum - currentNum);

  const fromDate = tabungData?.from_date ? new Date(tabungData.from_date) : new Date();
  const toDate = tabungData?.to_date ? new Date(tabungData.to_date) : new Date();
  const daysLeft = Math.max(0, Math.ceil((toDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  const weeksLeft = Math.ceil(daysLeft / 7);
  const weeklyNeeded = weeksLeft > 0 ? remaining / weeksLeft : remaining;

  const size = 144;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - percentExact / 100);

  const handleConfirmTopUp = async () => {
    const amountNum = parseFloat(topUpAmount.replace(/,/g, ''));
    if (!amountNum || !user || !account) return;
    setActionLoading(true);
    const result = await transactionsRepository.create({
      user_id: user.id,
      type: 'tabung_topup',
      name: 'Tabung Top Up',
      amount: amountNum,
      to_account_id: account.id,
      date: new Date().toISOString().split('T')[0],
      note: topUpNote || undefined,
    });
    setActionLoading(false);
    if (result.ok) {
      setTopUpSuccess(true);
      await fetchAccounts();
      await fetchTransactions();
      setTimeout(() => {
        setShowTopUp(false);
        setTopUpSuccess(false);
        setTopUpAmount('');
        setTopUpNote('');
      }, 1500);
    }
  };

  const handleConfirmWithdraw = async () => {
    const withdrawNum = parseFloat(withdrawAmount.replace(/,/g, ''));
    if (withdrawNum > currentNum) {
      setWithdrawError('Cannot exceed current saved amount');
      return;
    }
    if (!user || !account) return;
    setActionLoading(true);
    const result = await transactionsRepository.create({
      user_id: user.id,
      type: 'tabung_withdraw',
      name: 'Tabung Withdrawal',
      amount: withdrawNum,
      to_account_id: account.id,
      date: new Date().toISOString().split('T')[0],
      note: withdrawNote || undefined,
    });
    setActionLoading(false);
    if (result.ok) {
      setWithdrawSuccess(true);
      await fetchAccounts();
      await fetchTransactions();
      setTimeout(() => {
        setShowWithdraw(false);
        setWithdrawSuccess(false);
        setWithdrawError('');
        setWithdrawAmount('');
        setWithdrawNote('');
      }, 1500);
    }
  };

  const [editError, setEditError] = useState('');

  const handleSaveEdit = async () => {
    if (!account) return;
    const trimmedName = editName.trim();
    const targetNum = parseFloat(editTarget.replace(/,/g, ''));
    if (!trimmedName) {
      setEditError('Name is required');
      return;
    }
    if (!targetNum || targetNum <= 0) {
      setEditError('Target must be greater than 0');
      return;
    }
    setActionLoading(true);
    const result = await accountsRepository.updateTabungGoal(account.id, {
      name: trimmedName,
      target_amount: targetNum,
      icon: editIcon,
      color: editColor,
    });
    setActionLoading(false);
    if (result.ok) {
      await fetchAccounts();
      setEditError('');
      setShowEdit(false);
    } else {
      setEditError(result.error.message ?? 'Failed to update goal');
    }
  };

  const handleOpenEdit = () => {
    setEditName(account?.name ?? '');
    setEditTarget(targetNum.toString());
    setEditIcon(account?.icon ?? '🎉');
    setEditColor(account?.color ?? '#6bcf7f');
    setEditError('');
    setShowEdit(true);
  };

  const quickAmounts = [10, 20, 50, 100];

  if (loading) return <LoadingView />;
  if (error) return <ErrorView error={error} onRetry={fetchAccounts} />;
  if (!account) return null;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-border">
        <Pressable onPress={() => router.back()} className="p-2 mr-2">
          <ChevronLeft size={24} color="#fff" />
        </Pressable>
        <Text className="flex-1 text-lg font-semibold text-foreground">{account.name}</Text>
        <Pressable onPress={handleOpenEdit} className="p-2">
          <Pencil size={22} color="#fff" />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C5FF00" colors={['#C5FF00']} />
        }
      >
        {/* Circular Progress (View-based) */}
        <View className="items-center py-6 mx-4 bg-card border border-border rounded-3xl mb-4">
          <View
            style={{ width: size, height: size }}
            className="items-center justify-center mb-4"
          >
            <Svg width={size} height={size} style={{ position: 'absolute' }}>
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="rgba(255,255,255,0.1)"
                strokeWidth={strokeWidth}
                fill="none"
              />
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={tabungColor}
                strokeWidth={strokeWidth}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            </Svg>
            <Text className="text-4xl mb-1">{tabungEmoji}</Text>
            <Text className="text-xl font-bold text-primary">{percentage}%</Text>
          </View>

          <View className="items-center mt-2">
            <Text className="text-3xl font-bold text-foreground">RM {currentNum.toFixed(2)}</Text>
            <Text className="text-sm text-muted-foreground">of RM {targetNum.toFixed(2)} goal</Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View className="flex-row mx-4 px-1 mb-4">
          <View className="flex-1 bg-card rounded-2xl p-3 items-center border border-border">
            <Text style={{ fontSize: 24, lineHeight: 30, marginBottom: 4 }}>🎯</Text>
            <Text className="text-lg font-bold text-foreground">RM {remaining.toFixed(2)}</Text>
            <Text className="text-xs text-muted-foreground">Remaining</Text>
          </View>
          <View className="flex-1 bg-card rounded-2xl p-3 items-center mx-2 border border-border">
            <Text style={{ fontSize: 24, lineHeight: 30, marginBottom: 4 }}>📅</Text>
            <Text className="text-lg font-bold text-foreground">{daysLeft}</Text>
            <Text className="text-xs text-muted-foreground">Days left</Text>
          </View>
          <View className="flex-1 bg-card rounded-2xl p-3 items-center border border-border">
            <Text style={{ fontSize: 24, lineHeight: 30, marginBottom: 4 }}>🚀</Text>
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
          {transactions.length === 0 ? (
            <Text className="text-sm text-muted-foreground text-center py-4">Top-up history will appear here</Text>
          ) : (
            <View className="gap-2">
              {transactions.map((tx) => {
                const isTopUp = tx.type === 'tabung_topup';
                return (
                  <View
                    key={tx.id}
                    className="flex-row items-center bg-card border border-border rounded-2xl p-3"
                  >
                    <View
                      className={`w-10 h-10 rounded-full items-center justify-center ${
                        isTopUp ? 'bg-primary/20' : 'bg-red-500/20'
                      }`}
                    >
                      {isTopUp ? (
                        <Plus size={18} color="#C5FF00" />
                      ) : (
                        <Minus size={18} color="#EF4444" />
                      )}
                    </View>
                    <View className="flex-1 ml-3">
                      <Text className="text-sm font-semibold text-foreground">{tx.name}</Text>
                      <Text className="text-xs text-muted-foreground">
                        {tx.note ? `${tx.note} · ` : ''}{tx.date}
                      </Text>
                    </View>
                    <Text
                      className={`text-sm font-bold ${isTopUp ? 'text-primary' : 'text-red-400'}`}
                    >
                      {isTopUp ? '+' : '-'}RM {Number(tx.amount).toFixed(2)}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
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
                <Text className="text-sm text-muted-foreground">Your tabung is growing</Text>
              </View>
            ) : (
              <>
                <View className="flex-row items-center justify-between mb-5">
                  <Text className="text-lg font-bold text-foreground">Top Up {account.name}</Text>
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
                  disabled={actionLoading}
                  className="bg-primary rounded-2xl py-4 items-center"
                >
                  <Text className="text-sm font-bold text-black">{actionLoading ? 'Processing...' : 'Confirm Top Up'}</Text>
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
                  <Text className="text-lg font-bold text-foreground">Withdraw from {account.name}</Text>
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
                  disabled={actionLoading}
                  className="bg-red-500/20 border border-red-500/30 rounded-2xl py-4 items-center"
                >
                  <Text className="text-sm font-bold text-red-400">{actionLoading ? 'Processing...' : 'Confirm Withdrawal'}</Text>
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

            <View className="mb-4">
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

            {/* Icon Picker */}
            <View className="mb-4">
              <Text className="text-xs text-muted-foreground mb-2">Icon</Text>
              <View className="flex-row flex-wrap">
                {EDIT_ICONS.map((ic) => (
                  <Pressable
                    key={ic}
                    onPress={() => setEditIcon(ic)}
                    className={`w-11 h-11 rounded-xl items-center justify-center m-1 ${
                      editIcon === ic ? 'bg-primary/20 border-2 border-primary' : 'bg-background border border-border'
                    }`}
                  >
                    <Text className="text-xl">{ic}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Color Picker */}
            <View className="mb-5">
              <Text className="text-xs text-muted-foreground mb-2">Color</Text>
              <View className="flex-row flex-wrap">
                {EDIT_COLORS.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => setEditColor(c)}
                    className="w-9 h-9 rounded-full m-1"
                    style={{
                      backgroundColor: c,
                      borderWidth: editColor === c ? 3 : 0,
                      borderColor: '#fff',
                    }}
                  />
                ))}
              </View>
            </View>

            {editError ? (
              <View className="flex-row items-center gap-1.5 mb-3">
                <AlertCircle size={14} color="#EF4444" />
                <Text className="text-xs text-red-400">{editError}</Text>
              </View>
            ) : null}

            <Pressable
              onPress={handleSaveEdit}
              disabled={actionLoading}
              className="bg-primary rounded-2xl py-4 items-center"
            >
              <Text className="text-sm font-bold text-black">{actionLoading ? 'Saving...' : 'Save Changes'}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}