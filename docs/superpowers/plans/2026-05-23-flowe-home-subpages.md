# Flowe Home Subpages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 5 Home sub-pages — Notifications, Analysis, Accounts, AccountDetail, TabungDetail — with mock data and nested routing under `app/(main)/home/`, matching the dark theme and lime accent in the existing codebase.

**Architecture:** Expo Router file-based routing. `app/(main)/home/` nested group for notifications/analysis/accounts/account. `app/(main)/tabung/` for tabung screens. All state is local `useState` with mock data, no Supabase.

**Tech Stack:** React Native 0.81, Expo Router, NativeWind (Tailwind), @expo/vector-icons/MaterialIcons, lucide-react-native

**Theme values (from actual codebase — not Flowe_Theme.md):**
- Background: `#0D0D0D`, Card: `#1A1A1A`, Primary: `#C5FF00`
- Income green: `#22C55E`, Expense red: `#EF4444`, Transfer blue: `#3B82F6`

---

## File Structure (Created/Modified)

```
CREATED:
  app/(main)/home/notifications.tsx
  app/(main)/home/analysis.tsx
  app/(main)/home/accounts.tsx
  app/(main)/home/account/[id].tsx
  app/(main)/tabung/[id].tsx
  app/(main)/tabung/new.tsx        (stub — copy tabung/[id] with empty state, no-op buttons)

MODIFIED:
  app/(main)/index.tsx             — update Shortcuts + AccountCards navigation routes
  app/(main)/_layout.tsx           — (no change needed — routes work via expo-router conventions)
  app/(main)/home/                 — ensure directory exists (will create files directly)
  app/(main)/tabung/               — ensure directory exists
```

---

## Task 1: Update Home Navigation Routes

**Files:** `app/(main)/index.tsx:38-45`, `components/home/AccountCards.tsx:36-38`

The Shortcuts component routes `analysis` to `/analysis` but the new path is `/home/analysis`. AccountCards routes to `/account/${id}` but the new path is `/home/account/${id}`.

- [ ] **Step 1: Update Shortcuts navigation in index.tsx**

Open `app/(main)/index.tsx`. In the `onPress` handler inside `Shortcuts` (lines 38-45), update the routes:
```typescript
case 'analysis': router.push('/home/analysis'); break;
case 'learn': router.push('/learn'); break;         // learn stays at root
case 'newTabung': router.push('/tabung/new'); break;
case 'accounts': router.push('/home/accounts'); break;
```

- [ ] **Step 2: Update AccountCards navigation**

Open `components/home/AccountCards.tsx` line 38. Change:
```typescript
onPress={() => onAccountPress(account.id)}
```
The parent in `index.tsx` passes `(id) => router.push(`/account/${id}`)`. Update this to:
```typescript
onPress={() => router.push(`/home/account/${id}`)}
```

- [ ] **Step 3: Verify HomeTopBar bell routes to `/home/notifications`**

Open `app/(main)/index.tsx` line 22. The bell currently routes to `/notifications`. Update to:
```typescript
onBellPress={() => router.push('/home/notifications')}
```

---

## Task 2: Create Notifications Screen

**Files:** Create `app/(main)/home/notifications.tsx`

- [ ] **Step 1: Create notifications screen with mock data**

Create `app/(main)/home/notifications.tsx`:

```typescript
import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Bell } from '../../components/ui/icons';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  emoji: string;
  message: string;
  subText: string;
  time: Date;
  isRead: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  // Today
  { id: '1', emoji: '💰', message: 'You reached Rich pattern this month!', subText: 'Your passive income exceeded expenses', time: new Date(Date.now() - 1000 * 60 * 30), isRead: false },
  { id: '2', emoji: '⚠️', message: 'Unifi bill due tomorrow', subText: 'RM 89 — Auto-deducted from Maybank', time: new Date(Date.now() - 1000 * 60 * 60 * 2), isRead: false },
  { id: '3', emoji: '💸', message: 'RM 24.50 — Food & Drink', subText: 'Saved compared to last month', time: new Date(Date.now() - 1000 * 60 * 60 * 4), isRead: true },
  { id: '4', emoji: '🔄', message: 'RM 89 Unifi recorded', subText: 'Recurring payment auto-logged', time: new Date(Date.now() - 1000 * 60 * 60 * 6), isRead: true },
  { id: '5', emoji: '💵', message: 'RM 3,500 Salary → Maybank', subText: 'From: Employer HQ', time: new Date(Date.now() - 1000 * 60 * 60 * 8), isRead: false },
  // Yesterday
  { id: '6', emoji: '🎉', message: 'Tabung Raya complete!', subText: 'You reached your RM 5,000 goal', time: new Date(Date.now() - 1000 * 60 * 60 * 26), isRead: false },
  { id: '7', emoji: '↔️', message: 'RM 200 Maybank → Tabung Raya', subText: 'Transfer successful', time: new Date(Date.now() - 1000 * 60 * 60 * 28), isRead: true },
  { id: '8', emoji: '🐷', message: 'Tabung Raya — Goal RM 500', subText: 'Only RM 150 left to go!', time: new Date(Date.now() - 1000 * 60 * 60 * 30), isRead: true },
  { id: '9', emoji: '📈', message: 'ASB added', subText: 'RM 10,000 — New asset recorded', time: new Date(Date.now() - 1000 * 60 * 60 * 32), isRead: true },
  // Earlier
  { id: '10', emoji: '✨', message: '"Spend with intention."', subText: 'Daily affirmation saved', time: new Date(Date.now() - 1000 * 60 * 60 * 48), isRead: true },
  { id: '11', emoji: '📁', message: '"Investing Notes" project created', subText: 'Start adding your lessons', time: new Date(Date.now() - 1000 * 60 * 60 * 72), isRead: true },
  { id: '12', emoji: '📝', message: '"Bajet Raya" saved', subText: 'Notes updated successfully', time: new Date(Date.now() - 1000 * 60 * 60 * 96), isRead: true },
  { id: '13', emoji: '💰', message: 'You reached Middle pattern', subText: 'Net cash flow: RM 450', time: new Date(Date.now() - 1000 * 60 * 60 * 120), isRead: true },
  { id: '14', emoji: '⚠️', message: 'TNB bill due in 3 days', subText: 'RM 120 — Auto-deducted', time: new Date(Date.now() - 1000 * 60 * 60 * 144), isRead: true },
  { id: '15', emoji: '🎉', message: 'Emergency Fund 50% complete!', subText: 'Keep going, RM 2,500 more', time: new Date(Date.now() - 1000 * 60 * 60 * 168), isRead: true },
];

function groupByDate(items: Notification[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);

  const groups: { title: string; data: Notification[] }[] = [
    { title: 'Today', data: [] },
    { title: 'Yesterday', data: [] },
    { title: 'Earlier', data: [] },
  ];

  items.forEach(item => {
    const itemDate = new Date(item.time.getFullYear(), item.time.getMonth(), item.time.getDate());
    if (itemDate.getTime() === today.getTime()) {
      groups[0].data.push(item);
    } else if (itemDate.getTime() === yesterday.getTime()) {
      groups[1].data.push(item);
    } else {
      groups[2].data.push(item);
    }
  });

  return groups.filter(g => g.data.length > 0);
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  const visible = notifications.filter(n => !deletedIds.has(n.id));
  const groups = groupByDate(visible);
  const unreadCount = visible.filter(n => !n.isRead).length;

  function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }

  function markRead(id: string) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  }

  function deleteNotification(id: string) {
    setDeletedIds(prev => new Set([...prev, id]));
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
        <View className="flex-row items-center gap-3">
          <Pressable onPress={() => router.back()} className="p-2 -ml-2">
            <Bell size={24} color="#C5FF00" />
          </Pressable>
          <Text className="text-xl font-semibold text-foreground">Notifications</Text>
          {unreadCount > 0 && (
            <View className="bg-primary rounded-full px-2 py-0.5">
              <Text className="text-xs font-bold text-primary-foreground">{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <Pressable onPress={markAllRead}>
            <Text className="text-sm text-primary font-medium">Mark all read</Text>
          </Pressable>
        )}
      </View>

      {visible.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Bell size={48} color="#a0a0a0" />
          <Text className="text-base text-muted-foreground mt-3">All caught up!</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
          {groups.map(group => (
            <View key={group.title}>
              <Text className="text-xs text-muted-foreground uppercase tracking-wider font-semibold px-4 py-2">
                {group.title}
              </Text>
              {group.data.map((item, index) => (
                <Pressable
                  key={item.id}
                  onPress={() => markRead(item.id)}
                  className={`flex-row items-start px-4 py-3 border-b border-border ${!item.isRead ? 'bg-card/50' : ''}`}
                >
                  <Text className="text-2xl mr-3 mt-0.5">{item.emoji}</Text>
                  <View className="flex-1">
                    <Text className={`text-sm font-medium ${item.isRead ? 'text-muted-foreground' : 'text-foreground'}`}>
                      {item.message}
                    </Text>
                    <Text className="text-xs text-muted-foreground mt-0.5">{item.subText}</Text>
                  </View>
                  <View className="items-end ml-2">
                    <Text className="text-xs text-muted-foreground">
                      {formatDistanceToNow(item.time, { addSuffix: true })}
                    </Text>
                    {!item.isRead && <View className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 ml-auto" />}
                  </View>
                </Pressable>
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
```

- [ ] **Step 2: Test navigation to notifications**

Run: `npx expo start`
Navigate Home → tap bell icon → verify screen appears with all 15 grouped notifications.

---

## Task 3: Create Account Detail Screen

**Files:** Create `app/(main)/home/account/[id].tsx`

- [ ] **Step 1: Create account detail screen**

Create the directory and file `app/(main)/home/account/[id].tsx`:

```typescript
import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Eye, EyeOff, Copy, Pencil } from '../../components/ui/icons';

const MOCK_ACCOUNTS: Record<string, { name: string; balance: string; bankColor: string; last4: string; income: string; expense: string }> = {
  '1': { name: 'Maybank', balance: '3,200.00', bankColor: '#ffd93d', last4: '4521', income: '4,500.00', expense: '1,300.00' },
  '2': { name: 'Tabung Raya', balance: '850.00', bankColor: '#6bcf7f', last4: '0001', income: '500.00', expense: '0.00' },
  '3': { name: 'Cash', balance: '200.00', bankColor: '#00d4ff', last4: '0000', income: '0.00', expense: '150.00' },
};

const MOCK_TRANSACTIONS = [
  { id: 't1', name: 'Salary', amount: '+4,500.00', type: 'income', category: 'Income', date: 'May 1, 2026' },
  { id: 't2', name: 'Grab', amount: '-24.50', type: 'expense', category: 'Transport', date: 'May 5, 2026' },
  { id: 't3', name: 'Lunch', amount: '-12.00', type: 'expense', category: 'Food & Drink', date: 'May 6, 2026' },
  { id: 't4', name: 'Unifi', amount: '-89.00', type: 'expense', category: 'Bills', date: 'May 8, 2026' },
  { id: 't5', name: 'Transfer to Tabung', amount: '-200.00', type: 'transfer', category: 'Transfer', date: 'May 10, 2026' },
];

export default function AccountDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [copied, setCopied] = useState(false);

  const account = MOCK_ACCOUNTS[id ?? '1'] ?? MOCK_ACCOUNTS['1'];
  const bankColor = account.bankColor;

  function handleCopy() {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
        <View className="flex-row items-center gap-3">
          <Pressable onPress={() => router.back()} className="p-2 -ml-2">
            <ChevronLeft size={24} color="#ffffff" />
          </Pressable>
          <Text className="text-xl font-semibold text-foreground">{account.name}</Text>
        </View>
        <Pressable className="p-2">
          <Pencil size={20} color="#a0a0a0" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Balance Card */}
        <View className="mx-4 mt-4 bg-card rounded-2xl overflow-hidden">
          <View className="h-1" style={{ backgroundColor: bankColor }} />
          <View className="p-5">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-sm text-muted-foreground">Total Balance</Text>
              <Pressable onPress={() => setBalanceVisible(!balanceVisible)}>
                {balanceVisible ? <Eye size={20} color="#a0a0a0" /> : <EyeOff size={20} color="#a0a0a0" />}
              </Pressable>
            </View>
            <Text className="text-3xl font-bold text-foreground mb-3">
              {balanceVisible ? `RM ${account.balance}` : 'RM -----'}
            </Text>
            <View className="flex-row items-center gap-2">
              <Text className="text-xs text-muted-foreground">**** **** **** {account.last4}</Text>
              <Pressable onPress={handleCopy}>
                <Copy size={14} color={copied ? '#C5FF00' : '#a0a0a0'} />
              </Pressable>
              {copied && <Text className="text-xs text-primary">Copied!</Text>}
            </View>
          </View>
        </View>

        {/* Monthly Summary */}
        <View className="flex-row mx-4 mt-4 gap-3">
          <View className="flex-1 bg-card rounded-2xl p-4">
            <Text className="text-xs text-muted-foreground mb-1">Income</Text>
            <Text className="text-lg font-semibold text-income">+RM {account.income}</Text>
          </View>
          <View className="flex-1 bg-card rounded-2xl p-4">
            <Text className="text-xs text-muted-foreground mb-1">Expenses</Text>
            <Text className="text-lg font-semibold text-expense">-RM {account.expense}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="flex-row mx-4 mt-4 gap-3">
          <Pressable
            onPress={() => router.push('/add-transaction')}
            className="flex-1 bg-primary rounded-2xl py-4 items-center"
          >
            <Text className="text-base font-bold text-primary-foreground">Add Transaction</Text>
          </Pressable>
          <Pressable className="flex-1 bg-card border border-border rounded-2xl py-4 items-center">
            <Text className="text-base font-medium text-muted-foreground">Transfer</Text>
          </Pressable>
        </View>

        {/* Transaction History */}
        <View className="mx-4 mt-6">
          <Text className="text-sm font-semibold text-foreground mb-3">Recent Transactions</Text>
          {MOCK_TRANSACTIONS.map(tx => (
            <View key={tx.id} className="flex-row items-center py-3 border-b border-border">
              <View className="flex-1">
                <Text className="text-sm font-medium text-foreground">{tx.name}</Text>
                <Text className="text-xs text-muted-foreground">{tx.date} · {tx.category}</Text>
              </View>
              <Text className={`text-sm font-semibold ${tx.type === 'income' ? 'text-income' : tx.type === 'expense' ? 'text-expense' : 'text-transfer'}`}>
                {tx.amount}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
```

---

## Task 4: Create Accounts Screen

**Files:** Create `app/(main)/home/accounts.tsx`

- [ ] **Step 1: Create accounts screen with filter tabs and lists**

Create `app/(main)/home/accounts.tsx`:

```typescript
import { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Plus, PiggyBank } from '../../components/ui/icons';
import { Landmark, Wallet } from 'lucide-react-native';

const ALL_ACCOUNTS = [
  { id: '1', type: 'bank' as const, name: 'Maybank', balance: '3,200.00', bankColor: '#ffd93d', last4: '4521' },
  { id: '2', type: 'tabung' as const, name: 'Tabung Raya', saved: '850.00', target: '5,000.00', color: '#6bcf7f' },
  { id: '3', type: 'wallet' as const, name: 'Cash', balance: '200.00', bankColor: '#00d4ff', last4: '0000' },
];

const FILTERS = ['All', 'Bank', 'Tabung', 'Investment'] as const;
type Filter = typeof FILTERS[number];

export default function AccountsScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<Filter>('All');

  const bankAccounts = ALL_ACCOUNTS.filter(a => a.type === 'bank');
  const tabungAccounts = ALL_ACCOUNTS.filter(a => a.type === 'tabung');
  const walletAccounts = ALL_ACCOUNTS.filter(a => a.type === 'wallet');

  const totalBank = bankAccounts.reduce((sum, a) => sum + parseFloat(a.balance.replace(/,/g, '')), 0);
  const totalTabung = tabungAccounts.reduce((sum, a) => sum + parseFloat((a as any).saved?.replace(/,/g, '') ?? '0'), 0);

  const visibleAccounts = ALL_ACCOUNTS.filter(a => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Bank') return a.type === 'bank' || a.type === 'wallet';
    if (activeFilter === 'Tabung') return a.type === 'tabung';
    if (activeFilter === 'Investment') return a.type === 'investment';
    return true;
  });

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
        <View className="flex-row items-center gap-3">
          <Pressable onPress={() => router.back()} className="p-2 -ml-2">
            <ChevronLeft size={24} color="#ffffff" />
          </Pressable>
          <Text className="text-xl font-semibold text-foreground">Accounts</Text>
        </View>
        <Pressable className="flex-row items-center gap-1">
          <Plus size={18} color="#C5FF00" />
          <Text className="text-sm text-primary font-medium">Add</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Net Worth Hero */}
        <View className="mx-4 mt-4 bg-card rounded-2xl p-5 border border-primary/30">
          <Text className="text-sm text-muted-foreground mb-1">Net Worth</Text>
          <Text className="text-3xl font-bold text-foreground mb-4">
            RM {(totalBank + totalTabung + 200).toLocaleString('en-MY', { minimumFractionDigits: 2 })}
          </Text>
          <View className="flex-row gap-4">
            <View>
              <Text className="text-xs text-muted-foreground">Bank & Wallet</Text>
              <Text className="text-sm font-semibold text-foreground">RM {totalBank.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</Text>
            </View>
            <View>
              <Text className="text-xs text-muted-foreground">Tabung</Text>
              <Text className="text-sm font-semibold text-foreground">RM {totalTabung.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</Text>
            </View>
          </View>
        </View>

        {/* Filter Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }} className="flex-row">
          {FILTERS.map(f => (
            <Pressable
              key={f}
              onPress={() => setActiveFilter(f)}
              className={`px-4 py-2 rounded-full mr-2 ${activeFilter === f ? 'bg-primary' : 'bg-card'}`}
            >
              <Text className={`text-sm font-medium ${activeFilter === f ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                {f}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Bank & Wallets */}
        {(activeFilter === 'All' || activeFilter === 'Bank') && bankAccounts.length > 0 && (
          <View className="px-4 mb-4">
            <Text className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">Bank & Wallets</Text>
            {bankAccounts.map(account => (
              <Pressable
                key={account.id}
                onPress={() => router.push(`/home/account/${account.id}`)}
                className="flex-row items-center bg-card rounded-2xl p-4 mb-2 border border-border"
              >
                <View className="w-10 h-10 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: account.bankColor + '20' }}>
                  <Landmark size={18} color={account.bankColor} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-foreground">{account.name}</Text>
                  <Text className="text-xs text-muted-foreground">**** {account.last4}</Text>
                </View>
                <Text className="text-base font-semibold text-foreground">RM {account.balance}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Tabungs */}
        {(activeFilter === 'All' || activeFilter === 'Tabung') && tabungAccounts.length > 0 && (
          <View className="px-4 mb-4">
            <Text className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">Tabungs</Text>
            {tabungAccounts.map(account => (
              <Pressable
                key={account.id}
                onPress={() => router.push(`/tabung/${account.id}`)}
                className="flex-row items-center bg-card rounded-2xl p-4 mb-2 border border-border"
              >
                <View className="w-10 h-10 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: account.color + '20' }}>
                  <PiggyBank size={18} color={account.color} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-foreground">{account.name}</Text>
                  <View className="mt-1.5 h-1.5 bg-muted rounded-full overflow-hidden w-full">
                    <View
                      className="h-full rounded-full"
                      style={{ width: `${(parseFloat(account.saved.replace(/,/g, '')) / parseFloat(account.target.replace(/,/g, ''))) * 100}%`, backgroundColor: account.color }}
                    />
                  </View>
                </View>
                <View className="ml-3 items-end">
                  <Text className="text-sm font-semibold text-foreground">RM {account.saved}</Text>
                  <Text className="text-xs text-muted-foreground">of RM {account.target}</Text>
                </View>
              </Pressable>
            ))}
            {/* New Tabung button */}
            <Pressable
              onPress={() => router.push('/tabung/new')}
              className="flex-row items-center justify-center bg-card rounded-2xl p-4 border-2 border-dashed border-primary/40"
            >
              <Plus size={18} color="#C5FF00" />
              <Text className="text-sm text-primary font-semibold ml-2">New Tabung</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
```

---

## Task 5: Create Tabung Detail Screen

**Files:** Create `app/(main)/tabung/[id].tsx`

- [ ] **Step 1: Create tabung detail with progress circle and modals**

Create `app/(main)/tabung/[id].tsx`:

```typescript
import { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Pencil, Plus, Minus } from '../../components/ui/icons';

const MOCK_TABUNG: Record<string, { name: string; emoji: string; current: string; target: string; color: string; daysLeft: number; history: { id: string; type: 'topup' | 'withdraw'; amount: string; note: string; date: string }[] }> = {
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
      { id: 'h3', type: 'topup', amount: '+150.00', note: 'Weekly', date: 'Apr 1, 2026' },
    ],
  },
};

export default function TabungDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const tabung = MOCK_TABUNG[id ?? '2'] ?? MOCK_TABUNG['2'];

  const [showTopUp, setShowTopUp] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [topUpNote, setTopUpNote] = useState('');
  const [withdrawNote, setWithdrawNote] = useState('');
  const [topUpSuccess, setTopUpSuccess] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');

  const currentNum = parseFloat(tabung.current.replace(/,/g, ''));
  const targetNum = parseFloat(tabung.target.replace(/,/g, ''));
  const percentage = Math.min(100, Math.round((currentNum / targetNum) * 100));
  const remaining = targetNum - currentNum;
  const weeksLeft = Math.ceil(tabung.daysLeft / 7);
  const weeklyNeeded = weeksLeft > 0 ? remaining / weeksLeft : remaining;

  const quickAmounts = ['10', '20', '50', '100'];

  function handleTopUp() {
    const amount = parseFloat(topUpAmount);
    if (isNaN(amount) || amount <= 0) return;
    setTopUpSuccess(true);
    setTimeout(() => {
      setTopUpSuccess(false);
      setShowTopUp(false);
      setTopUpAmount('');
      setTopUpNote('');
    }, 1500);
  }

  function handleWithdraw() {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) return;
    if (amount > currentNum) {
      setWithdrawError('Cannot exceed current saved amount');
      return;
    }
    setShowWithdraw(false);
    setWithdrawAmount('');
    setWithdrawNote('');
    setWithdrawError('');
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
        <View className="flex-row items-center gap-3">
          <Pressable onPress={() => router.back()} className="p-2 -ml-2">
            <ChevronLeft size={24} color="#ffffff" />
          </Pressable>
          <Text className="text-xl font-semibold text-foreground">{tabung.name}</Text>
        </View>
        <Pressable onPress={() => setShowEdit(true)} className="p-2">
          <Pencil size={20} color="#a0a0a0" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Progress Circle */}
        <View className="items-center py-8">
          <View className="w-48 h-48 rounded-full border-8 border-border items-center justify-center" style={{ borderColor: tabung.color + '40' }}>
            <View className="w-40 h-40 rounded-full border-4 items-center justify-center" style={{ borderColor: tabung.color }}>
              <Text className="text-5xl">{tabung.emoji}</Text>
              <Text className="text-2xl font-bold text-foreground mt-2">{percentage}%</Text>
            </View>
          </View>
          <Text className="text-3xl font-bold text-foreground mt-4">RM {tabung.current}</Text>
          <Text className="text-sm text-muted-foreground">of RM {tabung.target}</Text>
        </View>

        {/* Stats Grid */}
        <View className="flex-row mx-4 gap-3">
          <View className="flex-1 bg-card rounded-2xl p-4 items-center">
            <Text className="text-xs text-muted-foreground mb-1">Remaining</Text>
            <Text className="text-lg font-bold text-foreground">RM {remaining.toFixed(2)}</Text>
          </View>
          <View className="flex-1 bg-card rounded-2xl p-4 items-center">
            <Text className="text-xs text-muted-foreground mb-1">Days Left</Text>
            <Text className="text-lg font-bold text-foreground">{tabung.daysLeft} days</Text>
          </View>
          <View className="flex-1 bg-card rounded-2xl p-4 items-center">
            <Text className="text-xs text-muted-foreground mb-1">Weekly</Text>
            <Text className="text-lg font-bold text-foreground">RM {weeklyNeeded.toFixed(0)}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="flex-row mx-4 mt-4 gap-3">
          <Pressable onPress={() => setShowTopUp(true)} className="flex-1 bg-primary rounded-2xl py-4 items-center flex-row justify-center gap-2">
            <Plus size={18} color="#000000" />
            <Text className="text-base font-bold text-primary-foreground">Top Up</Text>
          </Pressable>
          <Pressable onPress={() => setShowWithdraw(true)} className="flex-1 bg-card border border-border rounded-2xl py-4 items-center flex-row justify-center gap-2">
            <Minus size={18} color="#a0a0a0" />
            <Text className="text-base font-medium text-muted-foreground">Withdraw</Text>
          </Pressable>
        </View>

        {/* History */}
        <View className="mx-4 mt-6">
          <Text className="text-sm font-semibold text-foreground mb-3">History</Text>
          {tabung.history.map(item => (
            <View key={item.id} className="flex-row items-center py-3 border-b border-border">
              <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${item.type === 'topup' ? 'bg-income/20' : 'bg-expense/20'}`}>
                {item.type === 'topup' ? <Plus size={14} color="#22C55E" /> : <Minus size={14} color="#EF4444" />}
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-foreground">{item.note}</Text>
                <Text className="text-xs text-muted-foreground">{item.date}</Text>
              </View>
              <Text className={`text-sm font-semibold ${item.type === 'topup' ? 'text-income' : 'text-expense'}`}>
                {item.amount}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Top Up Modal */}
      <Modal visible={showTopUp} transparent animationType="slide">
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-card rounded-t-3xl p-6">
            <Text className="text-lg font-bold text-foreground mb-4">Top Up Tabung</Text>
            <TextInput
              className="bg-background border border-border rounded-xl px-4 py-3 text-lg text-foreground mb-3"
              placeholder="Amount (RM)"
              placeholderTextColor="#a0a0a0"
              keyboardType="numeric"
              value={topUpAmount}
              onChangeText={setTopUpAmount}
            />
            <View className="flex-row gap-2 mb-3">
              {quickAmounts.map(a => (
                <Pressable key={a} onPress={() => setTopUpAmount(a)} className="bg-secondary px-4 py-2 rounded-xl">
                  <Text className="text-sm text-muted-foreground">RM {a}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              className="bg-background border border-border rounded-xl px-4 py-3 text-foreground mb-4"
              placeholder="Note (optional)"
              placeholderTextColor="#a0a0a0"
              value={topUpNote}
              onChangeText={setTopUpNote}
            />
            {topUpSuccess ? (
              <View className="bg-income/20 rounded-2xl p-4 items-center">
                <Text className="text-income font-bold">Success!</Text>
              </View>
            ) : (
              <Pressable onPress={handleTopUp} className="bg-primary rounded-2xl py-4 items-center">
                <Text className="text-base font-bold text-primary-foreground">Confirm Top Up</Text>
              </Pressable>
            )}
            <Pressable onPress={() => { setShowTopUp(false); setTopUpAmount(''); setTopUpNote(''); }} className="py-3 items-center mt-2">
              <Text className="text-sm text-muted-foreground">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Withdraw Modal */}
      <Modal visible={showWithdraw} transparent animationType="slide">
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-card rounded-t-3xl p-6">
            <Text className="text-lg font-bold text-foreground mb-4">Withdraw</Text>
            {withdrawError ? (
              <View className="bg-expense/20 rounded-xl p-3 mb-3">
                <Text className="text-expense text-sm">{withdrawError}</Text>
              </View>
            ) : null}
            <TextInput
              className="bg-background border border-border rounded-xl px-4 py-3 text-lg text-foreground mb-3"
              placeholder="Amount (RM)"
              placeholderTextColor="#a0a0a0"
              keyboardType="numeric"
              value={withdrawAmount}
              onChangeText={(t) => { setWithdrawAmount(t); setWithdrawError(''); }}
            />
            <View className="flex-row gap-2 mb-3">
              {quickAmounts.map(a => (
                <Pressable key={a} onPress={() => setWithdrawAmount(a)} className="bg-secondary px-4 py-2 rounded-xl">
                  <Text className="text-sm text-muted-foreground">RM {a}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              className="bg-background border border-border rounded-xl px-4 py-3 text-foreground mb-4"
              placeholder="Note (optional)"
              placeholderTextColor="#a0a0a0"
              value={withdrawNote}
              onChangeText={setWithdrawNote}
            />
            <Pressable onPress={handleWithdraw} className="bg-primary rounded-2xl py-4 items-center">
              <Text className="text-base font-bold text-primary-foreground">Confirm Withdraw</Text>
            </Pressable>
            <Pressable onPress={() => { setShowWithdraw(false); setWithdrawAmount(''); setWithdrawNote(''); setWithdrawError(''); }} className="py-3 items-center mt-2">
              <Text className="text-sm text-muted-foreground">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Edit Goal Modal */}
      <Modal visible={showEdit} transparent animationType="slide">
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-card rounded-t-3xl p-6">
            <Text className="text-lg font-bold text-foreground mb-4">Edit Goal</Text>
            <TextInput
              className="bg-background border border-border rounded-xl px-4 py-3 text-foreground mb-3"
              defaultValue={tabung.name}
              placeholderTextColor="#a0a0a0"
            />
            <TextInput
              className="bg-background border border-border rounded-xl px-4 py-3 text-foreground mb-4"
              defaultValue={tabung.target}
              keyboardType="numeric"
              placeholderTextColor="#a0a0a0"
            />
            <Pressable onPress={() => setShowEdit(false)} className="bg-primary rounded-2xl py-4 items-center">
              <Text className="text-base font-bold text-primary-foreground">Save</Text>
            </Pressable>
            <Pressable onPress={() => setShowEdit(false)} className="py-3 items-center mt-2">
              <Text className="text-sm text-muted-foreground">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
```

---

## Task 6: Create Tabung New Screen (Stub)

**Files:** Create `app/(main)/tabung/new.tsx`

- [ ] **Step 1: Create stub screen for new tabung**

Create `app/(main)/tabung/new.tsx` — a minimal placeholder pointing back to home:

```typescript
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Plus } from '../../components/ui/icons';

export default function NewTabungScreen() {
  const router = useRouter();
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center px-4 py-3 border-b border-border">
        <Pressable onPress={() => router.back()} className="p-2 -ml-2">
          <ChevronLeft size={24} color="#ffffff" />
        </Pressable>
        <Text className="text-xl font-semibold text-foreground ml-2">New Tabung</Text>
      </View>
      <View className="flex-1 items-center justify-center">
        <Text className="text-muted-foreground">New Tabung creation coming soon</Text>
        <Pressable onPress={() => router.back()} className="mt-4 bg-primary px-6 py-3 rounded-2xl">
          <Text className="text-primary-foreground font-bold">Back to Home</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
```

---

## Task 7: Create Analysis Screen

**Files:** Create `app/(main)/home/analysis.tsx`

- [ ] **Step 1: Create analysis screen with mock charts and month selector**

Create `app/(main)/home/analysis.tsx`:

```typescript
import { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Sparkle, TrendingUp, TrendingDown } from '../../components/ui/icons';

const MONTHS = ['Jan 2026', 'Feb 2026', 'Mar 2026', 'Apr 2026', 'May 2026'];

const MONTHLY_DATA = [
  { income: 4200, expenses: 3100, net: 1100, categories: { 'Food & Drink': 800, Transport: 400, Bills: 900, Shopping: 600, Entertainment: 200, Health: 100, Others: 100 } },
  { income: 4200, expenses: 3400, net: 800, categories: { 'Food & Drink': 900, Transport: 450, Bills: 900, Shopping: 700, Entertainment: 250, Health: 100, Others: 100 } },
  { income: 4500, expenses: 3200, net: 1300, categories: { 'Food & Drink': 750, Transport: 380, Bills: 950, Shopping: 620, Entertainment: 300, Health: 100, Others: 100 } },
  { income: 4500, expenses: 3700, net: 800, categories: { 'Food & Drink': 950, Transport: 500, Bills: 950, Shopping: 800, Entertainment: 300, Health: 100, Others: 100 } },
  { income: 4800, expenses: 2800, net: 2000, categories: { 'Food & Drink': 700, Transport: 350, Bills: 900, Shopping: 500, Entertainment: 200, Health: 80, Others: 70 } },
];

const CATEGORY_COLORS: Record<string, string> = {
  'Food & Drink': '#C5FF00', Transport: '#00d4ff', Bills: '#ff6b6b', Shopping: '#ffd93d', Entertainment: '#a78bfa', Health: '#6bcf7f', Others: '#94a3b8',
};

export default function AnalysisScreen() {
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState(4);
  const [toggleMode, setToggleMode] = useState<'expense' | 'income'>('expense');

  const data = MONTHLY_DATA[selectedMonth];
  const savingsRate = data.income > 0 ? Math.round((data.net / data.income) * 100) : 0;

  const insightText = savingsRate < 10
    ? 'Challenge: Your expenses are eating into your income. The rich focus on buying assets.'
    : savingsRate < 30
    ? 'Good progress! You\'re building healthy financial habits.'
    : 'Excellent! Your savings rate is impressive. Keep reinvesting in assets.';

  const maxCategoryValue = Math.max(...Object.values(data.categories));

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
        <Pressable onPress={() => router.back()} className="p-2 -ml-2">
          <ChevronLeft size={24} color="#ffffff" />
        </Pressable>
        <Text className="text-xl font-semibold text-foreground flex-1">Analysis</Text>
        <Sparkle size={22} color="#C5FF00" />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Month Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }} className="flex-row">
          {MONTHS.map((month, i) => (
            <Pressable
              key={month}
              onPress={() => setSelectedMonth(i)}
              className={`px-4 py-2 rounded-full mr-2 ${selectedMonth === i ? 'bg-primary' : 'bg-card'}`}
            >
              <Text className={`text-sm font-medium ${selectedMonth === i ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                {month}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Net Savings Hero */}
        <View className="mx-4 bg-card rounded-2xl p-5 border border-border">
          <View className="flex-row items-center gap-4">
            {/* Donut chart — decorative */}
            <View className="w-20 h-20 rounded-full border-8 border-income items-center justify-center" style={{ borderColor: data.expenses > data.income ? '#EF4444' : '#22C55E', borderTopColor: 'transparent', borderRightColor: 'transparent', transform: [{ rotate: '-45deg' }] }}>
              <View className="w-12 h-12 rounded-full bg-card items-center justify-center" style={{ transform: [{ rotate: '45deg' }] }}>
                <Text className="text-xs font-bold text-foreground">{savingsRate}%</Text>
              </View>
            </View>
            <View className="flex-1">
              <Text className="text-sm text-muted-foreground">Net Savings</Text>
              <Text className="text-2xl font-bold text-foreground">RM {data.net.toLocaleString()}</Text>
              <View className="flex-row items-center gap-1 mt-1">
                {data.net > MONTHLY_DATA[selectedMonth - 1]?.net
                  ? <TrendingUp size={14} color="#22C55E" />
                  : <TrendingDown size={14} color="#EF4444" />
                }
                <Text className="text-xs text-muted-foreground">
                  vs {MONTHS[selectedMonth - 1] ?? 'prev month'}
                </Text>
              </View>
            </View>
          </View>
          <View className="mt-3 pt-3 border-t border-border">
            <Text className="text-xs text-muted-foreground italic">{insightText}</Text>
          </View>
        </View>

        {/* Income / Expenses Summary */}
        <View className="flex-row mx-4 mt-4 gap-3">
          <View className="flex-1 bg-card rounded-2xl p-4">
            <Text className="text-xs text-muted-foreground mb-1">Income</Text>
            <Text className="text-xl font-bold text-income">+RM {data.income.toLocaleString()}</Text>
          </View>
          <View className="flex-1 bg-card rounded-2xl p-4">
            <Text className="text-xs text-muted-foreground mb-1">Expenses</Text>
            <Text className="text-xl font-bold text-expense">-RM {data.expenses.toLocaleString()}</Text>
          </View>
        </View>

        {/* 5-Month Bar Chart */}
        <View className="mx-4 mt-4 bg-card rounded-2xl p-4 border border-border">
          <Text className="text-sm font-semibold text-foreground mb-3">5-Month Overview</Text>
          <View className="flex-row items-end justify-between h-32 px-2">
            {MONTHLY_DATA.map((m, i) => {
              const maxVal = 6000;
              const incomeH = (m.income / maxVal) * 96;
              const expenseH = (m.expenses / maxVal) * 96;
              const isSelected = i === selectedMonth;
              return (
                <Pressable key={MONTHS[i]} onPress={() => setSelectedMonth(i)} className="items-center flex-1">
                  <View className="flex-row items-end gap-1 h-24">
                    <View className="w-4 rounded-t-full bg-income" style={{ height: incomeH }} />
                    <View className="w-4 rounded-t-full bg-expense" style={{ height: expenseH }} />
                  </View>
                  {isSelected && <View className="w-2 h-2 rounded-full bg-primary mt-1" />}
                  <Text className="text-xs text-muted-foreground mt-1">{MONTHS[i].split(' ')[0].slice(0, 3)}</Text>
                </Pressable>
              );
            })}
          </View>
          <View className="flex-row justify-center gap-6 mt-3">
            <View className="flex-row items-center gap-1"><View className="w-3 h-3 rounded-full bg-income" /><Text className="text-xs text-muted-foreground">Income</Text></View>
            <View className="flex-row items-center gap-1"><View className="w-3 h-3 rounded-full bg-expense" /><Text className="text-xs text-muted-foreground">Expense</Text></View>
          </View>
        </View>

        {/* Category Breakdown */}
        <View className="mx-4 mt-4 bg-card rounded-2xl p-4 border border-border">
          <Text className="text-sm font-semibold text-foreground mb-3">Category Breakdown</Text>
          {/* Toggle */}
          <View className="flex-row bg-secondary rounded-full p-1 mb-4">
            <Pressable onPress={() => setToggleMode('expense')} className={`flex-1 py-2 rounded-full ${toggleMode === 'expense' ? 'bg-primary' : ''}`}>
              <Text className={`text-center text-sm font-medium ${toggleMode === 'expense' ? 'text-primary-foreground' : 'text-muted-foreground'}`}>Expense</Text>
            </Pressable>
            <Pressable onPress={() => setToggleMode('income')} className={`flex-1 py-2 rounded-full ${toggleMode === 'income' ? 'bg-primary' : ''}`}>
              <Text className={`text-center text-sm font-medium ${toggleMode === 'income' ? 'text-primary-foreground' : 'text-muted-foreground'}`}>Income</Text>
            </Pressable>
          </View>
          {/* Category list */}
          {toggleMode === 'expense' && Object.entries(data.categories).map(([cat, amount]) => {
            const pct = Math.round((amount / maxCategoryValue) * 100);
            return (
              <View key={cat} className="flex-row items-center mb-3">
                <View className="w-24">
                  <Text className="text-xs text-muted-foreground">{cat}</Text>
                </View>
                <View className="flex-1 mx-2">
                  <View className="h-2 bg-secondary rounded-full overflow-hidden">
                    <View className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: CATEGORY_COLORS[cat] ?? '#C5FF00' }} />
                  </View>
                </View>
                <Text className="text-xs text-foreground w-16 text-right">RM {amount}</Text>
              </View>
            );
          })}
          {toggleMode === 'income' && (
            <View className="items-center py-4">
              <Text className="text-sm text-muted-foreground">No income categories tracked</Text>
            </View>
          )}
        </View>

        {/* Rich Dad Insight Card */}
        <View className="mx-4 mt-4 bg-primary/10 rounded-2xl p-4 border border-primary/20">
          <Text className="text-sm font-semibold text-primary mb-1">Rich Dad Insight</Text>
          <Text className="text-xs text-muted-foreground italic">{insightText}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
```

---

## Task 8: Integration Verification

**Files:** All created files

- [ ] **Step 1: Verify navigation routes**

Run: `npx expo start`
1. Home → bell → `/home/notifications` — grouped notifications visible
2. Home → Analysis shortcut → `/home/analysis` — month selector + charts visible
3. Home → Accounts shortcut → `/home/accounts` — filter tabs + lists visible
4. Tap Maybank card → `/home/account/1` — balance card + transactions visible
5. Back → Accounts → tap Tabung Raya → `/tabung/2` — progress circle + history visible

- [ ] **Step 2: Verify tabung new stub**

Home → Shortcuts → "New Tabung" → `/tabung/new` — stub screen visible, back returns home

- [ ] **Step 3: Run lint**

```bash
npm run lint
```

Expected: no new errors from new files.

---

## Self-Review Checklist

- [ ] Spec coverage: every screen in `2026-05-23-flowe-home-subpages-design.md` has a corresponding task
- [ ] All file paths are exact
- [ ] Notifications: 15 mock items, grouped Today/Yesterday/Earlier, mark-all-read, unread dots
- [ ] Analysis: month selector (5 months), net savings hero, bar chart, category breakdown with toggle, rich dad insight
- [ ] Accounts: net worth hero, filter tabs (All/Bank/Tabung/Investment), account list items with progress for tabung
- [ ] Account Detail: balance card with eye toggle + copy, monthly summary, action buttons, transaction history
- [ ] Tabung Detail: progress circle, stats grid, top-up modal with quick chips, withdraw modal with validation, edit goal modal, transaction history
- [ ] All screens use `SafeAreaView`, correct theme tokens, `rounded-2xl` for cards
- [ ] No Supabase calls — all mock data
- [ ] Navigation routes in index.tsx and AccountCards updated to new paths
- [ ] Stub `/tabung/new.tsx` created

---

## File Structure (Created/Modified)

```
CREATED:
  app/(tabs)/notifications.tsx       — Notifications standalone screen
  app/(tabs)/analysis.tsx            — Analysis standalone screen
  app/(tabs)/learn/                  — Learn tab with nested stack
    _layout.tsx
    index.tsx
    [projectId].tsx
    [entryId].tsx
  context/
    LearnContext.tsx

MODIFIED:
  app/(tabs)/_layout.tsx             — Add 'learn' tab + update tabBarStyle
  app/(tabs)/index.tsx               — onBellPress already wired, no change needed
```

---

## Task 1: Verify Existing Navigation Wiring

**Files:** `app/(tabs)/index.tsx:28`

- [ ] **Step 1: Check HomeTopBar bell handler**

Look at `components/home/HomeTopBar.tsx` line 27-30. The `onBellPress` prop is already passed from `app/(tabs)/index.tsx` line 28 which calls `router.push('/notifications')`. Confirm this is correct — the bell icon is already wired to navigate to `/notifications`. If there are any issues with the bell press handler, fix them.

Run: Read `components/home/HomeTopBar.tsx` and `app/(tabs)/index.tsx` back-to-back and verify the bell navigation path.

---

## Task 2: Set Up Learn Context

**Files:**
- Create: `context/LearnContext.tsx`
- Modify: none yet

- [ ] **Step 1: Create LearnContext with mock data**

```typescript
// context/LearnContext.tsx
import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Colors } from '@/constants/theme';

// --- Types ---
export interface LearnEntry {
  id: string;
  projectId: string;
  text: string;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface LearnProject {
  id: string;
  name: string;
  entries: LearnEntry[];
  createdAt: Date;
  updatedAt: Date;
}

interface LearnState {
  projects: LearnProject[];
}

// --- Mock Data ---
const MOCK_PROJECTS: LearnProject[] = [
  {
    id: 'p1',
    name: 'Investing Notes',
    createdAt: new Date('2026-05-01'),
    updatedAt: new Date('2026-05-20T14:30:00'),
    entries: [
      {
        id: 'e1',
        projectId: 'p1',
        text: 'S&P 500 index funds are a great way to start investing. Low fees, broad diversification.',
        images: [],
        createdAt: new Date('2026-05-20T14:30:00'),
        updatedAt: new Date('2026-05-20T14:30:00'),
      },
    ],
  },
  {
    id: 'p2',
    name: 'Budget Tips',
    createdAt: new Date('2026-05-05'),
    updatedAt: new Date('2026-05-18T09:00:00'),
    entries: [
      {
        id: 'e2',
        projectId: 'p2',
        text: '50/30/20 rule: 50% needs, 30% wants, 20% savings and investments.',
        images: [],
        createdAt: new Date('2026-05-18T09:00:00'),
        updatedAt: new Date('2026-05-18T09:00:00'),
      },
    ],
  },
];

// --- Reducer ---
type LearnAction =
  | { type: 'ADD_PROJECT'; name: string }
  | { type: 'DELETE_PROJECT'; id: string }
  | { type: 'RENAME_PROJECT'; id: string; name: string }
  | { type: 'ADD_ENTRY'; projectId: string; text: string; images: string[] }
  | { type: 'UPDATE_ENTRY'; entryId: string; text: string; images: string[] }
  | { type: 'DELETE_ENTRY'; projectId: string; entryId: string };

function learnReducer(state: LearnState, action: LearnAction): LearnState {
  switch (action.type) {
    case 'ADD_PROJECT': {
      const newProject: LearnProject = {
        id: `p${Date.now()}`,
        name: action.name,
        entries: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return { ...state, projects: [...state.projects, newProject] };
    }
    case 'DELETE_PROJECT':
      return { ...state, projects: state.projects.filter(p => p.id !== action.id) };
    case 'RENAME_PROJECT':
      return {
        ...state,
        projects: state.projects.map(p =>
          p.id === action.id ? { ...p, name: action.name, updatedAt: new Date() } : p
        ),
      };
    case 'ADD_ENTRY': {
      const newEntry: LearnEntry = {
        id: `e${Date.now()}`,
        projectId: action.projectId,
        text: action.text,
        images: action.images,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return {
        ...state,
        projects: state.projects.map(p =>
          p.id === action.projectId
            ? { ...p, entries: [newEntry, ...p.entries], updatedAt: new Date() }
            : p
        ),
      };
    }
    case 'UPDATE_ENTRY':
      return {
        ...state,
        projects: state.projects.map(p => ({
          ...p,
          entries: p.entries.map(e =>
            e.id === action.entryId
              ? { ...e, text: action.text, images: action.images, updatedAt: new Date() }
              : e
          ),
        })),
      };
    case 'DELETE_ENTRY':
      return {
        ...state,
        projects: state.projects.map(p =>
          p.id === action.projectId
            ? { ...p, entries: p.entries.filter(e => e.id !== action.entryId) }
            : p
        ),
      };
    default:
      return state;
  }
}

// --- Context ---
interface LearnContextValue {
  state: LearnState;
  dispatch: React.Dispatch<LearnAction>;
}

const LearnContext = createContext<LearnContextValue | null>(null);

export function LearnProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(learnReducer, { projects: MOCK_PROJECTS });
  return <LearnContext.Provider value={{ state, dispatch }}>{children}</LearnContext.Provider>;
}

export function useLearn() {
  const ctx = useContext(LearnContext);
  if (!ctx) throw new Error('useLearn must be used within LearnProvider');
  return ctx;
}
```

- [ ] **Step 2: Wrap root layout with LearnProvider**

Modify `app/_layout.tsx` to import LearnProvider and wrap the Stack with it. Add the import at the top:
```typescript
import { LearnProvider } from '@/context/LearnContext';
```
Then wrap the Stack children inside the ThemeProvider with `<LearnProvider>`.

Run: Read `app/_layout.tsx` to confirm the structure before editing.

---

## Task 3: Implement Notifications Screen

**Files:**
- Create: `app/(tabs)/notifications.tsx`

- [ ] **Step 1: Create notifications screen with mock data and grouped list**

Create `app/(tabs)/notifications.tsx` with:
- SafeAreaView with dark background (`#0D0D0D`)
- Header: "Notifications" (18px, bold, white) + unread count badge (lime pill) + "Mark all read" text button
- SectionList with sections: `[{title: 'Today', data: [...]}, {title: 'Yesterday', data: [...]}, {title: 'Earlier', data: [...]}]`
- Each section header: 12px, gray, uppercase, paddingHorizontal 16
- NotificationItem row: emoji (24px) + vertical stack (message + sub-text) + time-ago (top-right) + blue dot if unread (top-right corner, offset)
- Swipeable row using `react-native-gesture-handler` Swipeable or built-in FlatList swipe (use `react-native-gesture-handler`'s Swipeable)
- Empty state: bell icon (gray, 48px) + "All caught up!" (16px, gray) centered

Mock data — 15 notifications across Today/Yesterday/Earlier:
```typescript
interface Notification {
  id: string;
  type: 'cashflow' | 'alert' | 'expense' | 'income' | 'recurring' | 'milestone' | 'transfer' | 'tabung' | 'asset' | 'affirmation' | 'project' | 'note';
  message: string;
  subText: string;
  time: Date;
  isRead: boolean;
}
```

Each notification type has a specific emoji (from spec). Use `date-fns/formatDistanceToNow` for time-ago display.

- [ ] **Step 2: Test navigation to notifications**

Start the app: `npx expo start`. Navigate Home → tap bell icon. Verify notifications screen appears with dark background, grouped list, and all 15 mock notifications visible.

---

## Task 4: Implement Analysis Screen

**Files:**
- Create: `app/(tabs)/analysis.tsx`

- [ ] **Step 1: Create analysis screen with all components**

Create `app/(tabs)/analysis.tsx` with:

**Imports:**
```typescript
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Sparkles } from '@expo/vector-icons/MaterialIcons';
import { Colors } from '@/constants/theme';
import { format } from 'date-fns';
```

**State:** `selectedMonth` (index 0-4, default 4 = May 2026)

**Month Selector:** Horizontal ScrollView of month pills. Data array: `['Jan 2026', 'Feb 2026', 'Mar 2026', 'Apr 2026', 'May 2026']`. Selected = lime bg, dark text. Unselected = transparent, white text.

**Mock data (5 months):**
```typescript
const MONTHLY_DATA = [
  { income: 4200, expenses: 3100, categories: { food: 800, transport: 400, bills: 900, shopping: 600, entertainment: 200, health: 100, others: 100 } },
  { income: 4200, expenses: 3400, categories: { food: 900, transport: 450, bills: 900, shopping: 700, entertainment: 250, health: 100, others: 100 } },
  { income: 4500, expenses: 3200, categories: { food: 750, transport: 380, bills: 950, shopping: 620, entertainment: 300, health: 100, others: 100 } },
  { income: 4500, expenses: 3700, categories: { food: 950, transport: 500, bills: 950, shopping: 800, entertainment: 300, health: 100, others: 100 } },
  { income: 4800, expenses: 2800, categories: { food: 700, transport: 350, bills: 900, shopping: 500, entertainment: 200, health: 80, others: 70 } },
];
```

**Net Savings Hero:** Row with donut (View circles) on left and "Net Savings" label + "RM X,XXX" amount on right. Calculate: `income - expenses`. Commentary below based on savings rate: `<10%` → "Challenge text", `10-30%` → "Good progress", `>30%` → "Excellent!"

**Income/Expenses Summary:** 2-col row. Income amount in green `#4ADE80`, expenses in red `#EF4444`. Show trend arrow (up/down emoji) based on comparing to previous month.

**Bar Chart:** For each of 5 months, render 2 vertical bars (income green, expense red) side by side. Height proportional to max value (8000). Selected month gets lime border. Wrap in TouchableOpacity — tap selects that month.

**Category Breakdown:**
- Toggle pill: "Expense" | "Income" — active = lime bg
- Simple donut using 2-3 overlapping Views with borderRadius
- Category list: each row has category name + lime progress bar (width % of max) + amount
- Show 7 expense categories

**Rich Dad Insight:** Gradient lime card at bottom. Text varies by savings rate (same logic as Net Savings hero).

All wrapped in ScrollView with `contentContainerStyle={{ paddingBottom: 120 }}`.

- [ ] **Step 2: Test navigation to analysis**

Start the app. Navigate Home → tap Analysis shortcut (sparkle icon on home). Verify analysis screen appears with month selector, all charts, and correct data.

---

## Task 5: Set Up Learn Stack Layout

**Files:**
- Create: `app/(tabs)/learn/_layout.tsx`
- Modify: `app/(tabs)/_layout.tsx`

- [ ] **Step 1: Create learn stack layout**

Create `app/(tabs)/learn/_layout.tsx`:
```typescript
import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function LearnStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: Colors.dark.cardBg },
        headerTintColor: Colors.dark.text,
        headerTitleStyle: { fontWeight: '600', fontSize: 16 },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: Colors.dark.darkBg },
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: 'Nota Kewangan Peribadi', headerShown: false }}
      />
      <Stack.Screen
        name="[projectId]"
        options={{ title: '', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="[entryId]"
        options={{ title: 'Entry', headerBackTitle: 'Back', presentation: 'modal' }}
      />
    </Stack>
  );
}
```

- [ ] **Step 2: Add Learn tab to tabs layout**

Modify `app/(tabs)/_layout.tsx`. Add a new tab after Settings (or anywhere):

In the Tabs.Screen list, add:
```typescript
<Tabs.Screen
  name="learn"
  options={{
    title: 'Learn',
    tabBarIcon: ({ color }) => <Icon name="school" size={24} color={color} />,
    headerShown: false,
  }}
/>
```

Also update the `unstable_settings.anchor` if needed to make sure the tabs group is the navigation root. Check if `unstable_settings = { anchor: '(tabs)' }` is still needed — it should stay as-is.

Run: Read `app/(tabs)/_layout.tsx` to confirm structure before editing.

---

## Task 6: Implement Learn Projects List

**Files:**
- Create: `app/(tabs)/learn/index.tsx`

- [ ] **Step 1: Create learn projects list screen**

Create `app/(tabs)/learn/index.tsx`:

```typescript
import { View, Text, FlatList, TouchableOpacity, TextInput, Modal, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useLearn } from '@/context/LearnContext';
import { formatDistanceToNow } from 'date-fns';

function AddProjectModal({ visible, onClose, onAdd }: { visible: boolean; onClose: () => void; onAdd: (name: string) => void }) {
  const [name, setName] = useState('');
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>New Project</Text>
          <TextInput
            style={styles.input}
            placeholder="Project name"
            placeholderTextColor={Colors.dark.textSecondary}
            value={name}
            onChangeText={setName}
            maxLength={50}
          />
          <View style={styles.modalButtons}>
            <TouchableOpacity onPress={onClose}><Text style={styles.cancelBtn}>Batal</Text></TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitBtn, !name.trim() && styles.submitBtnDisabled]}
              disabled={!name.trim()}
              onPress={() => { onAdd(name.trim()); setName(''); onClose(); }}
            >
              <Text style={styles.submitBtnText}>Buat Projek</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
```

**Hero section:**
- Background: gradient or solid card bg with lime accent line at top
- Title: "Nota Kewangan Peribadi" (16px, bold, white)
- Stats row: calculate total projects, entries, images from state and display "N projects | N entries | N images"
- "+ Project" button: lime outline button, top-right of hero

**Project card:**
- Folder emoji icon (24px)
- Project name (16px, bold, white)
- "{N} entries" badge (12px, gray)
- "Updated {time-ago}" sub-text (12px, gray)
- Latest entry preview: first entry text, 2-line clamp (12px, gray)
- Card background: `Colors.dark.cardBg`, borderRadius 16, padding 16
- Tap → `router.push('/learn/${project.id}')`

**Empty state:**
- Large 📁 emoji (64px)
- "Belum ada projek" (16px, white, bold)
- Subtitle: "Create your first project to start tracking financial lessons" (14px, gray)
- "+ Buat Projek" lime button

Use `formatDistanceToNow(date, { addSuffix: true })` from `date-fns` for time-ago.

- [ ] **Step 2: Test learn navigation**

Start the app. Navigate Home → tap Learn shortcut. Verify learn projects list appears. Test creating a project with the + button.

---

## Task 7: Implement Learn Project Detail

**Files:**
- Create: `app/(tabs)/learn/[projectId].tsx`

- [ ] **Step 1: Create project detail screen**

Create `app/(tabs)/learn/[projectId].tsx`:

```typescript
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, FlatList, TouchableOpacity, Alert, TextInput, Modal, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { useLearn } from '@/context/LearnContext';
import { formatDistanceToNow } from 'date-fns';

export default function ProjectDetail() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const { state, dispatch } = useLearn();
  const router = useRouter();

  const project = state.projects.find(p => p.id === projectId);

  // Rename modal state
  const [renameVisible, setRenameVisible] = useState(false);
  const [renameText, setRenameText] = useState('');

  // Delete confirm
  const [deleteVisible, setDeleteVisible] = useState(false);

  if (!project) return <SafeAreaView style={styles.container}><Text style={styles.error}>Project not found</Text></SafeAreaView>;

  function handleRename() {
    dispatch({ type: 'RENAME_PROJECT', id: projectId, name: renameText.trim() });
    setRenameVisible(false);
  }

  function handleDelete() {
    dispatch({ type: 'DELETE_PROJECT', id: projectId });
    setDeleteVisible(false);
    router.back();
  }
```

**Header (custom):**
- Back button: `<TouchableOpacity onPress={() => router.back()}><Icon name="arrow-back" /></TouchableOpacity>`
- Project name centered (16px, bold)
- More menu (3-dot icon) → `Alert.actionSheet` or simple button that shows a Modal with: "Rename" | "Hapus Projek" | "Batal"

**"+ Tambah Entri" button:**
- Lime background, full-width, text "Tambah Entri"
- Tap → navigate to entry add mode using `router.push({ pathname: '/learn/[entryId]', params: { entryId: 'new', projectId } })`
- The `[entryId].tsx` screen detects `entryId === 'new'` and shows the add/edit form instead of view mode

**Entry row (FlatList):**
- Time-ago string (12px, gray, top)
- Entry text preview: 2-line clamp (14px, white)
- Image thumbnails: up to 3 small squares (48x48, borderRadius 8), "+N more" if >3
- Separator: thin border line
- Tap → navigate to entry detail

**Empty state for entries:**
- 📝 emoji large
- "Belum ada entri" (No entries yet)
- "Tap '+ Tambah Entri' to add your first financial note"

**Rename Modal:** TextInput pre-filled with project.name, "Simpan" button.

**Delete Confirm Modal:** "Hapus projek ini? Semua entri akan dipadam." + "Batal" (gray) | "Hapus" (red).

- [ ] **Step 2: Test project detail navigation**

Start the app → Learn → tap a project. Verify project detail shows with entries list. Test more menu → rename and delete (delete should navigate back to list).

---

## Task 8: Implement Learn Entry Detail / Add / Edit

**Files:**
- Create: `app/(tabs)/learn/[entryId].tsx`

- [ ] **Step 1: Create entry detail/edit screen**

Create `app/(tabs)/learn/[entryId].tsx`:

```typescript
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, TextInput, TouchableOpacity, Image, Modal, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { useLearn } from '@/context/LearnContext';
import { useEffect, useState } from 'react';

export default function EntryDetail() {
  const { entryId, projectId } = useLocalSearchParams<{ entryId: string; projectId: string }>();
  const { state, dispatch } = useLearn();
  const router = useRouter();

  const isNew = entryId === 'new';
  const project = state.projects.find(p => p.id === projectId);
  const entry = project?.entries.find(e => e.id === entryId);

  const [text, setText] = useState(entry?.text ?? '');
  const [images, setImages] = useState<string[]>(entry?.images ?? []);
  const [isEditing, setIsEditing] = useState(isNew);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // For new entries, add on save
  function handleSave() {
    if (!text.trim() && images.length === 0) return;
    if (isNew) {
      dispatch({ type: 'ADD_ENTRY', projectId: projectId!, text: text.trim(), images });
    } else {
      dispatch({ type: 'UPDATE_ENTRY', entryId: entryId!, text: text.trim(), images });
    }
    router.back();
  }

  function handleDelete() {
    dispatch({ type: 'DELETE_ENTRY', projectId: projectId!, entryId: entryId! });
    router.back();
  }

  // Lightbox: modal overlay with single image, tap to dismiss
  // Add image placeholder: "+" button that adds a placeholder URL
```

**View mode (isEditing = false, not new):**
- Scrollable text (full entry text, 14px, white, multi-line)
- Image grid: 2 columns, square images (borderRadius 12), tap image → setLightboxImage
- Bottom buttons: "Edit" | "Delete" (gray outline buttons)

**Edit mode (isEditing = true or isNew):**
- KeyboardAvoidingView with ScrollView
- TextInput multiline ("Nota" label above, placeholder "What did you learn?", min 4 rows)
- Image section:
  - Existing images: small thumbnails (64x64) with X remove button
  - "+ Tambah Gambar" dashed border button (adds a placeholder image URL like `https://picsum.photos/200`)
- "Simpan" button: lime, disabled if text + images both empty
- "Batal" link: cancels editing

**Lightbox Modal:**
```typescript
<Modal visible={!!lightboxImage} transparent animationType="fade">
  <TouchableOpacity style={styles.lightboxOverlay} onPress={() => setLightboxImage(null)} activeOpacity={1}>
    {lightboxImage && <Image source={{ uri: lightboxImage }} style={styles.lightboxImage} resizeMode="contain" />}
  </TouchableOpacity>
</Modal>
```

**Delete Confirm Modal:** "Hapus entri ini?" + "Batal" | "Hapus" (red).

- [ ] **Step 2: Test entry detail, edit, and delete**

Start the app → Learn → tap project → tap entry → verify view mode. Tap Edit → modify text → Save → verify changes. Tap Delete → confirm → verify back navigation.

Start the app → Learn → tap project → tap "+ Tambah Entri" → add text → Save → verify new entry appears in list.

---

## Task 9: Final Integration and Navigation Verification

**Files:** All created/modified files

- [ ] **Step 1: Verify all three navigation flows**

1. Home → bell icon → Notifications → verify grouped list, mark-all-read works, swipe-to-delete works
2. Home → Analysis shortcut → Analysis → verify month selector changes data, charts render correctly
3. Home → Learn shortcut → project → entry → edit flow → all navigation works

- [ ] **Step 2: Check theme consistency**

Verify all screens use:
- Background: `#0D0D0D`
- Card bg: `#1A1A1A`
- Text: `#FFFFFF`
- Text secondary: `#A0A0A0`
- Lime accent: `#C5FF00`
- Border: `rgba(255,255,255,0.1)`

- [ ] **Step 3: Verify back navigation**

- From Notifications: back swipe/button → returns to Home
- From Analysis: back → returns to Home
- From Learn entry detail: back → returns to project detail
- From Learn project detail: back → returns to projects list

- [ ] **Step 4: Run lint check**

```bash
npx expo lint
```

Expected: no new errors introduced by the new files.

---

## Self-Review Checklist

- [ ] Spec coverage: every section in `2026-05-23-flowe-home-subpages-design.md` has a corresponding task
- [ ] All file paths are exact (no placeholders like "components/...")
- [ ] All mock data includes realistic values matching the design doc
- [ ] LearnContext uses `useReducer` with all 6 action types implemented
- [ ] Learn stack uses expo-router Stack.Navigator with `headerShown: false` on index
- [ ] Month selector on Analysis updates all data (hero, summary, chart, categories)
- [ ] Notifications grouped into Today/Yesterday/Earlier sections
- [ ] All time-ago strings use `date-fns/formatDistanceToNow`
- [ ] Empty states implemented for Notifications (no mock data empty), Learn projects list, and Learn entries list
- [ ] Delete confirm modals exist for: project deletion, entry deletion
- [ ] No Supabase/network calls — all mock data local