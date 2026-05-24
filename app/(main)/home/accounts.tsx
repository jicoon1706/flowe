import { useState } from 'react';
import { View, Text, ScrollView, Pressable, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Plus, PiggyBank, Landmark, Wallet, X, Check } from '../../../components/ui/icons';

const ALL_ACCOUNTS = [
  { id: '1', type: 'bank' as const, name: 'Maybank', balance: '3,200.00', bankColor: '#ffd93d', last4: '4521' },
  { id: '2', type: 'tabung' as const, name: 'Tabung Raya', saved: '850.00', target: '5,000.00', color: '#6bcf7f' },
  { id: '3', type: 'wallet' as const, name: 'Cash', balance: '200.00', bankColor: '#00d4ff', last4: '0000' },
];

type FilterType = 'All' | 'Bank' | 'Tabung' | 'Investment';

export default function AccountsScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAccType, setNewAccType] = useState<'bank' | 'wallet'>('bank');
  const [newAccName, setNewAccName] = useState('');
  const [newAccBalance, setNewAccBalance] = useState('');

  const handleAddAccount = () => {
    // TODO: Add account logic
    setShowAddModal(false);
    setNewAccName('');
    setNewAccBalance('');
    setNewAccType('bank');
  };

  const visibleAccounts = ALL_ACCOUNTS.filter((a) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Bank') return a.type === 'bank' || a.type === 'wallet';
    if (activeFilter === 'Tabung') return a.type === 'tabung';
    if (activeFilter === 'Investment') return a.type === 'investment';
    return true;
  });

  const bankAccounts = visibleAccounts.filter((a) => a.type === 'bank' || a.type === 'wallet');
  const tabungAccounts = visibleAccounts.filter((a) => a.type === 'tabung');

  const totalNetWorth = ALL_ACCOUNTS.reduce((sum, a) => {
    if (a.type === 'tabung') return sum + parseFloat(a.saved || '0');
    return sum + parseFloat(a.balance?.replace(/,/g, '') || '0');
  }, 0);

  const bankTotal = ALL_ACCOUNTS
    .filter((a) => a.type === 'bank' || a.type === 'wallet')
    .reduce((sum, a) => sum + parseFloat(a.balance?.replace(/,/g, '') || '0'), 0);

  const tabungTotal = ALL_ACCOUNTS
    .filter((a) => a.type === 'tabung')
    .reduce((sum, a) => sum + parseFloat(a.saved || '0'), 0);

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
                onPress={() => router.push(`/home/account/${account.id}`)}
                className="flex-row items-center bg-card rounded-2xl p-4 mb-2 border border-border"
              >
                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: account.bankColor }}
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
                    {account.type === 'wallet' ? 'Cash Account' : `Account ending ${account.last4}`}
                  </Text>
                </View>
                <Text className="text-base font-semibold text-foreground">
                  RM {account.balance}
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
              const saved = parseFloat(tabung.saved?.replace(/,/g, '') || '0');
              const target = parseFloat(tabung.target?.replace(/,/g, '') || '0');
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
                      style={{ backgroundColor: tabung.color }}
                    >
                      <PiggyBank size={20} color="#000" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-foreground">{tabung.name}</Text>
                      <Text className="text-xs text-muted-foreground mt-0.5">
                        RM {tabung.saved} saved of RM {tabung.target}
                      </Text>
                    </View>
                  </View>
                  <View className="h-2 bg-background rounded-full overflow-hidden">
                    <View
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(progress, 100)}%`,
                        backgroundColor: tabung.color,
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
