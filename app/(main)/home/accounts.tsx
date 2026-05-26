import { useState, useCallback , useFocusEffect } from 'react';
import { View, Text, ScrollView, Pressable, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Plus, PiggyBank, Landmark, Wallet, X, Check } from '../../../components/ui/icons';
import { useAccounts } from '../../../src/hooks/useAccounts';
import { useAuth } from '../../../context/AuthContext';
import { LoadingView } from '../../../components/ui/LoadingView';
import { ErrorView } from '../../../components/ui/ErrorView';
import { EmptyState } from '../../../components/ui/EmptyState';

type FilterType = 'All' | 'Bank' | 'Tabung' | 'Investment';

export default function AccountsScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAccType, setNewAccType] = useState<'bank' | 'wallet'>('bank');
  const [newAccName, setNewAccName] = useState('');
  const [newAccBalance, setNewAccBalance] = useState('');

  async function handleAddAccount() {
    if (!user) return;
    if (!newAccName || !newAccBalance) return;
    const result = newAccType === 'bank'
      ? await createBankAccount({ user_id: user.id, name: newAccName, bank_name: newAccName, opening_balance: parseFloat(newAccBalance) })
      : await createWalletAccount({ user_id: user.id, name: newAccName, opening_balance: parseFloat(newAccBalance) });
    if (result.ok) {
      setShowAddModal(false);
      setNewAccName('');
      setNewAccBalance('');
      setNewAccType('bank');
    }
  }

  const { user } = useAuth();
  const { accounts, loading, error, fetchAccounts, createBankAccount, createWalletAccount } = useAccounts();

  useFocusEffect(useCallback(() => {
    fetchAccounts();
  }, [fetchAccounts]));

  const visibleAccounts = accounts.filter((a) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Bank') return a.type === 'bank' || a.type === 'wallet';
    if (activeFilter === 'Tabung') return a.type === 'tabung';
    if (activeFilter === 'Investment') return a.type === 'investment';
    return true;
  });

  const bankAccounts = visibleAccounts.filter((a) => a.type === 'bank' || a.type === 'wallet');
  const tabungAccounts = visibleAccounts.filter((a) => a.type === 'tabung');

  const totalNetWorth = accounts.reduce((sum, acc) => {
    const bal = (acc as any).current_balance ?? (acc as any).saved_amount ?? 0;
    return sum + Number(bal);
  }, 0);

  const bankTotal = bankAccounts.reduce((sum, acc) => {
    const bal = (acc as any).current_balance ?? 0;
    return sum + Number(bal);
  }, 0);

  const tabungTotal = tabungAccounts.reduce((sum, acc) => {
    const bal = (acc as any).saved_amount ?? 0;
    return sum + Number(bal);
  }, 0);

  if (loading) return <LoadingView />;
  if (error) return <ErrorView error={error} onRetry={fetchAccounts} />;

  const filters: FilterType[] = ['All', 'Bank', 'Tabung', 'Investment'];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-border">
        <Pressable onPress={() => router.back()} className="mr-3">
          <ChevronLeft size={24} color="#fff" />
        </Pressable>
        <Text className="flex-1 text-lg font-semibold text-foreground">Accounts</Text>
        <Pressable onPress={() => setShowAddModal(true)} className="w-10 h-10 rounded-full items-center justify-center bg-primary">
          <Plus size={20} color="#000" />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Net Worth Hero Card */}
        <View className="mx-4 mt-4 bg-card rounded-2xl p-5 border border-primary/30">
          <Text className="text-sm text-muted-foreground mb-1">Net Worth</Text>
          <Text className="text-3xl font-bold text-foreground mb-4">
            RM {totalNetWorth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          <View className="flex-row">
            <View className="flex-1">
              <Text className="text-xs text-muted-foreground mb-0.5">Bank & Wallet</Text>
              <Text className="text-sm font-semibold text-foreground">
                RM {bankTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-xs text-muted-foreground mb-0.5">Tabung</Text>
              <Text className="text-sm font-semibold text-foreground">
                RM {tabungTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-xs text-muted-foreground mb-0.5">Investments</Text>
              <Text className="text-sm font-semibold text-foreground">RM 0.00</Text>
            </View>
          </View>
        </View>

        {/* Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-4 mx-4"
          contentContainerClassName="flex-row gap-2"
        >
          {filters.map((filter) => (
            <Pressable
              key={filter}
              onPress={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-full ${
                activeFilter === filter
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground'
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  activeFilter === filter ? 'text-primary-foreground' : 'text-muted-foreground'
                }`}
              >
                {filter}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Bank & Wallets Section */}
        {bankAccounts.length > 0 && (
          <View className="mt-5 px-4">
            <Text className="text-xs text-muted-foreground uppercase mb-2">Bank & Wallets</Text>
            {bankAccounts.map((account) => (
              <Pressable
                key={account.id}
                onPress={() => {
                  if (account.type === 'tabung') router.push(`/home/tabung/${account.id}`);
                  else if (account.type === 'wallet') router.push(`/home/wallet/${account.id}`);
                  else router.push(`/home/account/${account.id}`);
                }}
                className="flex-row items-center bg-card rounded-2xl p-4 mb-2 border border-border"
              >
                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: account.color ?? '#C5FF00' }}
                >
                  {account.type === 'wallet' ? (
                    <Wallet size={20} color="#000" />
                  ) : (
                    <Landmark size={20} color="#000" />
                  )}
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-sm font-medium text-foreground">{account.name}</Text>
                  <Text className="text-xs text-muted-foreground mt-0.5">
                    {account.type === 'wallet' ? 'Cash Account' : 'Bank Account'}
                  </Text>
                </View>
                <Text className="text-base font-semibold text-foreground">
                  RM {Number((account as any).current_balance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Tabungs Section */}
        {tabungAccounts.length > 0 && (
          <View className="mt-5 px-4 mb-6">
            <Text className="text-xs text-muted-foreground uppercase mb-2">Tabungs</Text>
            {tabungAccounts.map((tabung) => {
              const saved = parseFloat(String((tabung as any).saved_amount ?? 0));
              const target = parseFloat(String((tabung as any).target_amount ?? 0));
              const progress = target > 0 ? (saved / target) * 100 : 0;
              return (
                <Pressable
                  key={tabung.id}
                  onPress={() => router.push(`/home/tabung/${tabung.id}`)}
                  className="bg-card rounded-2xl p-4 mb-2 border border-border"
                >
                  <View className="flex-row items-center mb-2">
                    <View
                      className="w-10 h-10 rounded-full items-center justify-center mr-3"
                      style={{ backgroundColor: tabung.color ?? '#6bcf7f' }}
                    >
                      <PiggyBank size={20} color="#000" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-foreground">{tabung.name}</Text>
                      <Text className="text-xs text-muted-foreground mt-0.5">
                        RM {saved.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} saved of RM {target.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Text>
                    </View>
                  </View>
                  <View className="h-2 bg-background rounded-full overflow-hidden">
                    <View
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(progress, 100)}%`,
                        backgroundColor: tabung.color ?? '#6bcf7f',
                      }}
                    />
                  </View>
                </Pressable>
              );
            })}
            {/* New Tabung Button */}
            <Pressable
              onPress={() => router.push('/tabung/new')}
              className="flex-row items-center justify-center bg-card rounded-2xl p-4 mb-2 border border-dashed border-border"
              style={{ borderStyle: 'dashed' }}
            >
              <Plus size={20} color="#C5FF00" />
              <Text className="text-sm font-medium text-primary ml-2">New Tabung</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Add Account Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <Pressable className="flex-1 bg-black/50 justify-end" onPress={() => setShowAddModal(false)}>
          <Pressable className="bg-card rounded-t-3xl p-6 pb-8" onPress={(e) => e.stopPropagation()}>
            <View className="w-12 h-1 bg-border rounded-full mx-auto mb-6" />

            {/* Header with Close */}
            <View className="flex-row items-center justify-between mb-5">
              <Text className="text-lg font-semibold text-foreground">Add Account</Text>
              <Pressable onPress={() => setShowAddModal(false)}>
                <X size={24} color="#666" />
              </Pressable>
            </View>

            {/* Bank / Wallet Toggle */}
            <View className="flex-row gap-2 mb-4">
              <Pressable
                onPress={() => setNewAccType('bank')}
                className={`flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl border font-semibold text-sm ${
                  newAccType === 'bank'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-input-background border-border text-muted-foreground'
                }`}
              >
                <Landmark size={18} color={newAccType === 'bank' ? '#000' : '#666'} />
                <Text className={newAccType === 'bank' ? 'text-black' : 'text-muted-foreground'}>Bank</Text>
              </Pressable>
              <Pressable
                onPress={() => setNewAccType('wallet')}
                className={`flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl border font-semibold text-sm ${
                  newAccType === 'wallet'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-input-background border-border text-muted-foreground'
                }`}
              >
                <Wallet size={18} color={newAccType === 'wallet' ? '#000' : '#666'} />
                <Text className={newAccType === 'wallet' ? 'text-black' : 'text-muted-foreground'}>Wallet</Text>
              </Pressable>
            </View>

            {/* Form Fields */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-muted-foreground mb-2">Account Name</Text>
              <View className="bg-input-background border border-border rounded-xl px-4 py-3">
                <TextInput
                  className="text-foreground"
                  placeholder="e.g. Maybank"
                  placeholderTextColor="#666"
                  value={newAccName}
                  onChangeText={setNewAccName}
                />
              </View>
            </View>

            <View className="mb-6">
              <Text className="text-sm font-medium text-muted-foreground mb-2">Current Balance (RM)</Text>
              <View className="bg-input-background border border-border rounded-xl px-4 py-3">
                <TextInput
                  className="text-foreground"
                  placeholder="0.00"
                  placeholderTextColor="#666"
                  keyboardType="decimal-pad"
                  value={newAccBalance}
                  onChangeText={setNewAccBalance}
                />
              </View>
            </View>

            {/* Add Account Button */}
            <Pressable
              onPress={handleAddAccount}
              className="flex-row items-center justify-center py-4 bg-primary rounded-2xl"
            >
              <Check size={20} color="#000" />
              <Text className="text-base font-bold text-black ml-2">Add Account</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
