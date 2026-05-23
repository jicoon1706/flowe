# Flowe Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete React Native (Expo) frontend for the Flowe personal finance app based on the Figma prototype, starting from the Home Dashboard (image 10) through all screens to the last image (31).

**Architecture:** Expo Router with tab-based navigation (Home, Calendar, + [Add], Cash Flow, Settings). Bottom sheet modals for Add Transaction. Stack navigation within tabs for sub-screens. Dark theme with lime accent `#C5FF00`. No mock data -- all data will come from real Supabase integration later.

**Tech Stack:** React Native (Expo), Expo Router, react-native-reanimated, expo-secure-store, expo-local-authentication, lucide-react-native (icons), date-fns, recharts (for cash flow charts), sonner (toast notifications).

---

## Screen/File Map

```
app/_layout.tsx                     # Root stack + theme provider
app/(tabs)/_layout.tsx             # Tab navigator (5 tabs)
app/(tabs)/index.tsx               # Home dashboard (image 10)
app/(tabs)/calendar.tsx            # Calendar (image 19)
app/(tabs)/cashflow.tsx            # Cash Flow (image 20)
app/(tabs)/settings.tsx            # Settings main (image 22)
app/(tabs)/[id].tsx               # Account Detail (image 11)
app/(tabs)/tabung/
app/(tabs)/tabung/[id].tsx        # Tabung Detail (image 12)
app/(tabs)/tabung/new.tsx         # New Tabung (image 15)
app/(tabs)/learn/
app/(tabs)/learn/index.tsx        # Learn Projects (image 14)
app/(tabs)/learn/[id].tsx         # Project Detail (image 14)
app/(tabs)/notifications.tsx       # Notifications (image 17)
app/(tabs)/settings/
app/(tabs)/settings/account.tsx   # Account Settings (image 23)
app/(tabs)/settings/change-pin.tsx # Change PIN (image 24)
app/(tabs)/settings/security.tsx   # Security (image 25)
app/(tabs)/settings/notifications.tsx # Notifications Settings (image 26)
app/(tabs)/settings/categories.tsx # Categories (image 27)
app/(tabs)/settings/recurring.tsx  # Recurring (image 29)
app/(tabs)/settings/data.tsx       # Data (image 30)
app/(tabs)/settings/affirmations.tsx # Affirmations (image 31)
app/modal.tsx                      # Add Transaction modal (image 18)
app/cashflow/info.tsx              # Cash Flow Guide (image 21)
```

---

## Phase 0: Project Foundation (Do First)

### Task 0.1: Define Theme Constants

**Files:**
- Modify: `constants/theme.ts`

- [ ] **Step 1: Update theme colors with Flowe brand**

```typescript
// constants/theme.ts
export const Colors = {
  light: {
    tint: '#C5FF00',
    darkBg: '#0D0D0D',
    cardBg: '#1A1A1A',
    // ...
  },
  dark: {
    tint: '#C5FF00',
    darkBg: '#0D0D0D',
    cardBg: '#1A1A1A',
    text: '#FFFFFF',
    textSecondary: '#A0A0A0',
    border: 'rgba(255,255,255,0.1)',
    inputBg: '#2A2A2A',
    destructive: '#FF4444',
    success: '#C5FF00',
    warning: '#FFD93D',
  },
};
```

### Task 0.2: Install Required Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install additional dependencies**

```bash
npm install lucide-react-native react-native-reanimated expo-local-authentication expo-secure-store date-fns sonner
```

### Task 0.3: Update Root Layout

**Files:**
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Update root layout with proper navigation**

```typescript
// app/_layout.tsx
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

const FloweDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: Colors.dark.darkBg,
    card: Colors.dark.cardBg,
    text: Colors.dark.text,
    border: Colors.dark.border,
    primary: Colors.dark.tint,
  },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? FloweDarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Add Transaction' }} />
        <Stack.Screen name="cashflow/info" options={{ presentation: 'modal', title: 'Cash Flow Guide' }} />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
```

---

## Phase 1: Home Dashboard (Image 10)

### Task 1.1: HomeTopBar Component

**Files:**
- Create: `components/home/HomeTopBar.tsx`
- Modify: `app/(tabs)/index.tsx`

- [ ] **Step 1: Create HomeTopBar with greeting, bell, lock icons**

```typescript
// components/home/HomeTopBar.tsx
import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Bell, Lock } from 'lucide-react-native';
import { Colors } from '@/constants/theme';

interface Props {
  name: string;
  onBellPress: () => void;
  onLockPress: () => void;
}

export function HomeTopBar({ name, onBellPress, onLockPress }: Props) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Text style={styles.greeting}>{getGreeting()}, {name}</Text>
        <Text style={styles.wave}>👋</Text>
      </View>
      <View style={styles.right}>
        <TouchableOpacity onPress={onBellPress} style={styles.iconBtn}>
          <Bell size={20} color={Colors.dark.text} />
          <View style={styles.unreadDot} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onLockPress} style={styles.iconBtn}>
          <Lock size={20} color={Colors.dark.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  left: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  greeting: { fontSize: 18, fontWeight: '600', color: Colors.dark.text },
  wave: { fontSize: 20 },
  right: { flexDirection: 'row', gap: 12 },
  iconBtn: { padding: 8, position: 'relative' },
  unreadDot: { position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: '#3B82F6', borderWidth: 2, borderColor: Colors.dark.darkBg },
});
```

### Task 1.2: AffirmationCard Component

**Files:**
- Create: `components/home/AffirmationCard.tsx`

- [ ] **Step 1: Create AffirmationCard with carousel**

```typescript
// components/home/AffirmationCard.tsx
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Heart, Share2, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { Colors } from '@/constants/theme';

const affirmations = [
  { text: "Small savings now, big rewards later.", category: "Saving", icon: "💰" },
  { text: "Your money should work as hard as you do.", category: "Investing", icon: "📈" },
  { text: "Financial freedom starts with one good decision today.", category: "Mindset", icon: "🧠" },
  { text: "Aware of your spending today, wealthy tomorrow.", category: "Awareness", icon: "⚠️" },
];

export function AffirmationCard() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  const current = affirmations[currentIndex];

  const handleNext = () => setCurrentIndex((prev) => (prev + 1) % affirmations.length);
  const handlePrev = () => setCurrentIndex((prev) => (prev - 1 + affirmations.length) % affirmations.length);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <Text style={styles.badgeIcon}>{current.icon}</Text>
          <Text style={styles.badgeText}>{current.category}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => setIsFavorite(!isFavorite)}>
            <Heart size={18} color={isFavorite ? '#EF4444' : Colors.dark.text} fill={isFavorite ? '#EF4444' : 'transparent'} />
          </TouchableOpacity>
          <Share2 size={18} color={Colors.dark.text} />
        </View>
      </View>
      <Text style={styles.quote}>"{current.text}"</Text>
      <View style={styles.footer}>
        <TouchableOpacity onPress={handlePrev}><ChevronLeft size={20} color={Colors.dark.text} /></TouchableOpacity>
        <View style={styles.dots}>
          {affirmations.map((_, i) => (
            <View key={i} style={[styles.dot, i === currentIndex ? styles.dotActive : styles.dotInactive]} />
          ))}
        </View>
        <TouchableOpacity onPress={handleNext}><ChevronRight size={20} color={Colors.dark.text} /></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.dark.cardBg, borderRadius: 16, padding: 16, marginHorizontal: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.dark.tint + '30' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.dark.tint, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  badgeIcon: { fontSize: 12 },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#000' },
  actions: { flexDirection: 'row', gap: 8 },
  quote: { fontSize: 15, fontStyle: 'italic', color: Colors.dark.text, marginBottom: 16, lineHeight: 22 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dots: { flexDirection: 'row', gap: 4 },
  dot: { height: 6, borderRadius: 3 },
  dotActive: { width: 24, backgroundColor: Colors.dark.tint },
  dotInactive: { width: 6, backgroundColor: Colors.dark.textSecondary },
});
```

### Task 1.3: BalanceBanner Component

**Files:**
- Create: `components/home/BalanceBanner.tsx`

- [ ] **Step 1: Create BalanceBanner with eye toggle**

```typescript
// components/home/BalanceBanner.tsx
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { Colors } from '@/constants/theme';

interface Props {
  balance: number;
  visible: boolean;
  onToggle: () => void;
}

export function BalanceBanner({ balance, visible, onToggle }: Props) {
  return (
    <View style={styles.banner}>
      <View style={styles.row}>
        <Text style={styles.label}>Total Balance</Text>
        <TouchableOpacity onPress={onToggle}>
          {visible ? <Eye size={18} color={Colors.dark.text} /> : <EyeOff size={18} color={Colors.dark.text} />}
        </TouchableOpacity>
      </View>
      <Text style={styles.amount}>
        RM {visible ? balance.toFixed(2) : '••••••'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { backgroundColor: Colors.dark.cardBg, borderRadius: 16, padding: 20, marginHorizontal: 16, marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  label: { fontSize: 13, color: Colors.dark.textSecondary },
  amount: { fontSize: 32, fontWeight: '700', color: Colors.dark.text },
});
```

### Task 1.4: AccountCards Component

**Files:**
- Create: `components/home/AccountCards.tsx`

- [ ] **Step 1: Create AccountCards horizontal scroll**

```typescript
// components/home/AccountCards.tsx
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';

interface BankAccount { id: string; type: 'bank'; name: string; balance: number; icon: string; accountNumber: string; color: string; }
interface TabungAccount { id: string; type: 'tabung'; name: string; saved: number; target: number; daysLeft: number; icon: string; }
interface WalletAccount { id: string; type: 'wallet'; name: string; balance: number; icon: string; color: string; }
type Account = BankAccount | TabungAccount | WalletAccount;

interface Props {
  accounts: Account[];
  onSelectAccount: (account: BankAccount | WalletAccount) => void;
  onSelectTabung: (account: TabungAccount) => void;
}

export function AccountCards({ accounts, onSelectAccount, onSelectTabung }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Accounts</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {accounts.map((account) => (
          <TouchableOpacity
            key={account.id}
            style={[styles.card, { borderColor: account.type === 'tabung' ? Colors.dark.tint + '50' : Colors.dark.border }]}
            onPress={() => account.type === 'tabung' ? onSelectTabung(account as TabungAccount) : onSelectAccount(account as BankAccount | WalletAccount)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>{account.icon}</Text>
              <Text style={styles.cardName}>{account.name}</Text>
            </View>
            {account.type === 'tabung' ? (
              <TabungProgress account={account as TabungAccount} />
            ) : (
              <View>
                <Text style={styles.balanceLabel}>Balance</Text>
                <Text style={styles.balance}>RM {(account as BankAccount | WalletAccount).balance.toFixed(2)}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

function TabungProgress({ account }: { account: TabungAccount }) {
  const pct = Math.round((account.saved / account.target) * 100);
  return (
    <View>
      <View style={styles.progressRow}>
        <Text style={styles.progressLabel}>Progress</Text>
        <Text style={styles.progressPct}>{pct}%</Text>
      </View>
      <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${pct}%` }]} /></View>
      <View style={styles.tabungBottom}>
        <View><Text style={styles.savedLabel}>Saved</Text><Text style={styles.saved}>RM {account.saved}</Text></View>
        <View style={{ alignItems: 'flex-end' }}><Text style={styles.targetLabel}>Target</Text><Text style={styles.target}>RM {account.target}</Text></View>
      </View>
      <Text style={styles.daysLeft}>{account.daysLeft} days left</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  heading: { fontSize: 13, fontWeight: '500', color: Colors.dark.textSecondary, marginHorizontal: 16, marginBottom: 10 },
  scroll: { paddingHorizontal: 16, gap: 12 },
  card: { minWidth: 200, backgroundColor: Colors.dark.cardBg, borderRadius: 16, padding: 16, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardIcon: { fontSize: 20 },
  cardName: { fontSize: 14, fontWeight: '600', color: Colors.dark.text },
  balanceLabel: { fontSize: 11, color: Colors.dark.textSecondary, marginBottom: 2 },
  balance: { fontSize: 22, fontWeight: '700', color: Colors.dark.text },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  progressLabel: { fontSize: 11, color: Colors.dark.textSecondary },
  progressPct: { fontSize: 11, fontWeight: '600', color: Colors.dark.tint },
  progressBar: { height: 8, backgroundColor: Colors.dark.border, borderRadius: 4, marginBottom: 8 },
  progressFill: { height: 8, backgroundColor: Colors.dark.tint, borderRadius: 4 },
  tabungBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  savedLabel: { fontSize: 11, color: Colors.dark.textSecondary },
  saved: { fontSize: 16, fontWeight: '700', color: Colors.dark.text },
  targetLabel: { fontSize: 11, color: Colors.dark.textSecondary },
  target: { fontSize: 13, color: Colors.dark.text },
  daysLeft: { fontSize: 11, color: Colors.dark.tint, marginTop: 8 },
});
```

### Task 1.5: Shortcuts Component

**Files:**
- Create: `components/home/Shortcuts.tsx`

- [ ] **Step 1: Create 4-button shortcuts grid**

```typescript
// components/home/Shortcuts.tsx
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';

const shortcuts = [
  { icon: '📊', label: 'Analysis', key: 'analysis' },
  { icon: '📚', label: 'Learn', key: 'learn' },
  { icon: '🐷', label: 'New Tabung', key: 'new-tabung' },
  { icon: '🏦', label: 'Accounts', key: 'accounts' },
];

interface Props {
  onPress: (key: string) => void;
}

export function Shortcuts({ onPress }: Props) {
  return (
    <View style={styles.grid}>
      {shortcuts.map((s) => (
        <TouchableOpacity key={s.key} style={styles.btn} onPress={() => onPress(s.key)}>
          <Text style={styles.icon}>{s.icon}</Text>
          <Text style={styles.label}>{s.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: 16, marginBottom: 16, gap: 10 },
  btn: { width: '47%', backgroundColor: Colors.dark.cardBg, borderRadius: 14, padding: 16, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: Colors.dark.border },
  icon: { fontSize: 24 },
  label: { fontSize: 12, color: Colors.dark.text },
});
```

### Task 1.6: RecentTransactions Component

**Files:**
- Create: `components/home/RecentTransactions.tsx`

- [ ] **Step 1: Create recent transactions list**

```typescript
// components/home/RecentTransactions.tsx
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { Colors } from '@/constants/theme';

interface Transaction {
  id: string;
  name: string;
  category: string;
  icon: string;
  date: string;
  amount: number;
  type: 'income' | 'expense';
  isRecurring?: boolean;
}

interface Props {
  transactions: Transaction[];
  onSeeAll: () => void;
  onTransactionPress: (t: Transaction) => void;
}

export function RecentTransactions({ transactions, onSeeAll, onTransactionPress }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Recent Transactions</Text>
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>
      {transactions.slice(0, 5).map((t) => (
        <TouchableOpacity key={t.id} style={styles.row} onPress={() => onTransactionPress(t)}>
          <Text style={styles.txIcon}>{t.icon}</Text>
          <View style={styles.txInfo}>
            <Text style={styles.txName}>{t.name}</Text>
            <Text style={styles.txCategory}>{t.category} • {t.date}</Text>
          </View>
          <Text style={[styles.txAmount, t.type === 'income' ? styles.income : styles.expense]}>
            {t.type === 'income' ? '+' : '-'}RM {t.amount.toFixed(2)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginHorizontal: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  heading: { fontSize: 15, fontWeight: '600', color: Colors.dark.text },
  seeAll: { fontSize: 13, color: Colors.dark.tint },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.dark.border },
  txIcon: { fontSize: 20 },
  txInfo: { flex: 1 },
  txName: { fontSize: 14, fontWeight: '500', color: Colors.dark.text },
  txCategory: { fontSize: 12, color: Colors.dark.textSecondary, marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: '600' },
  income: { color: Colors.dark.tint },
  expense: { color: Colors.dark.text },
});
```

### Task 1.7: Update Home Screen (Image 10)

**Files:**
- Modify: `app/(tabs)/index.tsx`

- [ ] **Step 1: Wire up all Home components**

```typescript
// app/(tabs)/index.tsx - full update
import { ScrollView, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { HomeTopBar } from '@/components/home/HomeTopBar';
import { AffirmationCard } from '@/components/home/AffirmationCard';
import { BalanceBanner } from '@/components/home/BalanceBanner';
import { AccountCards } from '@/components/home/AccountCards';
import { Shortcuts } from '@/components/home/Shortcuts';
import { RecentTransactions } from '@/components/home/RecentTransactions';

export default function HomeScreen() {
  const router = useRouter();
  const [balanceVisible, setBalanceVisible] = useState(true);

  const accounts = [/* real data from context/store */];

  return (
    <>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <HomeTopBar name="Akmal" onBellPress={() => router.push('/notifications')} onLockPress={() => {}} />
          <AffirmationCard />
          <BalanceBanner balance={4250.00} visible={balanceVisible} onToggle={() => setBalanceVisible(!balanceVisible)} />
          <AccountCards accounts={[]} onSelectAccount={() => {}} onSelectTabung={() => {}} />
          <Shortcuts onPress={(key) => {
            if (key === 'analysis') router.push('/analysis');
            if (key === 'learn') router.push('/learn');
            if (key === 'new-tabung') router.push('/tabung/new');
            if (key === 'accounts') router.push('/accounts');
          }} />
          <RecentTransactions transactions={[]} onSeeAll={() => router.push('/calendar')} onTransactionPress={() => {}} />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0D0D0D' },
  scroll: { flex: 1 },
  content: { paddingBottom: 100 },
});
```

---

## Phase 2: Account Detail (Image 11)

### Task 2.1: AccountDetail Screen

**Files:**
- Create: `app/(tabs)/account/[id].tsx`

- [ ] **Step 1: Create AccountDetail screen with balance, copy, transaction list**

```typescript
// app/(tabs)/account/[id].tsx
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Copy, Plus, ArrowRightLeft } from 'lucide-react-native';
import { Colors } from '@/constants/theme';

export default function AccountDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><ArrowLeft size={24} color={Colors.dark.text} /></TouchableOpacity>
        <Text style={styles.title}>Account Name</Text>
        <TouchableOpacity><DotsThree size={20} color={Colors.dark.text} /></TouchableOpacity>
      </View>
      <ScrollView>
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Balance</Text>
            <TouchableOpacity><Eye size={18} color={Colors.dark.text} /></TouchableOpacity>
          </View>
          <Text style={styles.balanceAmount}>RM 2,850.00</Text>
          <View style={styles.accountNumberRow}>
            <Text style={styles.accountNumber}>1122 3344 5566</Text>
            <TouchableOpacity onPress={() => Alert.alert('Copied!')}><Copy size={16} color={Colors.dark.text} /></TouchableOpacity>
          </View>
        </View>
        {/* Monthly Summary */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}><Text style={styles.summaryLabel}>Income</Text><Text style={[styles.summaryAmount, {color: Colors.dark.tint}]}>+RM 3,500</Text></View>
          <View style={styles.summaryCard}><Text style={styles.summaryLabel}>Expenses</Text><Text style={[styles.summaryAmount, {color: '#EF4444'}]}>-RM 1,200</Text></View>
        </View>
        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/modal')}>
            <Plus size={18} color={Colors.dark.darkBg} /><Text style={styles.actionBtnText}>Add Transaction</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnOutline]}>
            <ArrowRightLeft size={18} color={Colors.dark.tint} /><Text style={[styles.actionBtnText, {color: Colors.dark.tint}]}>Transfer</Text>
          </TouchableOpacity>
        </View>
        {/* Transaction History */}
        <View style={styles.txList}></View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  title: { fontSize: 16, fontWeight: '600', color: Colors.dark.text },
  balanceCard: { backgroundColor: Colors.dark.cardBg, marginHorizontal: 16, borderRadius: 16, padding: 20, marginBottom: 16 },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  balanceLabel: { fontSize: 13, color: Colors.dark.textSecondary },
  balanceAmount: { fontSize: 32, fontWeight: '700', color: Colors.dark.text, marginBottom: 8 },
  accountNumberRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  accountNumber: { fontSize: 13, color: Colors.dark.textSecondary },
  summaryRow: { flexDirection: 'row', gap: 12, marginHorizontal: 16, marginBottom: 16 },
  summaryCard: { flex: 1, backgroundColor: Colors.dark.cardBg, borderRadius: 12, padding: 14 },
  summaryLabel: { fontSize: 12, color: Colors.dark.textSecondary, marginBottom: 4 },
  summaryAmount: { fontSize: 18, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginBottom: 20 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.dark.tint, borderRadius: 10, paddingVertical: 12 },
  actionBtnOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.dark.tint },
  actionBtnText: { fontSize: 13, fontWeight: '600', color: Colors.dark.darkBg },
  txList: { marginHorizontal: 16 },
});
```

---

## Phase 3: Tabung Detail (Image 12, 12a)

### Task 3.1: TabungDetail Screen

**Files:**
- Create: `app/(tabs)/tabung/[id].tsx`

- [ ] **Step 1: Create TabungDetail with progress circle, top-up, withdraw**

```typescript
// app/(tabs)/tabung/[id].tsx
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, PencilSimple, Minus, Plus } from 'lucide-react-native';
import { Colors } from '@/constants/theme';

export default function TabungDetail() {
  const router = useRouter();
  const [showTopUp, setShowTopUp] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);

  const tabung = { name: 'Tabung Raya', saved: 300, target: 500, daysLeft: 12, icon: '🌙' };
  const pct = Math.round((tabung.saved / tabung.target) * 100);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><ArrowLeft size={24} color={Colors.dark.text} /></TouchableOpacity>
        <View style={styles.headerCenter}><Text style={styles.icon}>{tabung.icon}</Text><Text style={styles.title}>{tabung.name}</Text></View>
        <TouchableOpacity><PencilSimple size={20} color={Colors.dark.text} /></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Progress Circle */}
        <View style={styles.progressCircle}>
          <Text style={styles.progressPct}>{pct}%</Text>
          <Text style={styles.progressEmoji}>{tabung.icon}</Text>
        </View>
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}><Text style={styles.statValue}>RM {tabung.saved}</Text><Text style={styles.statLabel}>Saved</Text></View>
          <View style={styles.stat}><Text style={styles.statValue}>RM {tabung.target - tabung.saved}</Text><Text style={styles.statLabel}>Remaining</Text></View>
          <View style={styles.stat}><Text style={styles.statValue}>{tabung.daysLeft}</Text><Text style={styles.statLabel}>Days Left</Text></View>
        </View>
        {/* Actions */}
        <View style={styles.tabungActions}>
          <TouchableOpacity style={styles.tabungActionBtn} onPress={() => setShowTopUp(true)}>
            <Plus size={18} color={Colors.dark.darkBg} /><Text style={styles.tabungActionText}>Top Up Tabung</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabungActionBtnOutline} onPress={() => setShowWithdraw(true)}>
            <Minus size={18} color={Colors.dark.tint} /><Text style={[styles.tabungActionText, {color: Colors.dark.tint}]}>Withdraw</Text>
          </TouchableOpacity>
        </View>
        {/* Transaction History */}
        <Text style={styles.sectionTitle}>History</Text>
        <View style={styles.historyList}></View>
      </ScrollView>
      {/* Top Up Modal */}
      <Modal visible={showTopUp} transparent animationType="slide"><View style={styles.modal}><TopUpSheet onClose={() => setShowTopUp(false)} /></View></Modal>
      <Modal visible={showWithdraw} transparent animationType="slide"><View style={styles.modal}><WithdrawSheet onClose={() => setShowWithdraw(false)} /></View></Modal>
    </SafeAreaView>
  );
}

function TopUpSheet({ onClose }: { onClose: () => void }) {
  return (
    <View style={styles.sheet}>
      <Text style={styles.sheetTitle}>Top Up Tabung</Text>
      <View style={styles.amountInput}><Text style={styles.currency}>RM</Text><Text style={styles.amount}>50</Text></View>
      <View style={styles.quickChips}><TouchableOpacity style={styles.chip}><Text style={styles.chipText}>10</Text></TouchableOpacity><TouchableOpacity style={styles.chip}><Text style={styles.chipText}>20</Text></TouchableOpacity><TouchableOpacity style={styles.chip}><Text style={styles.chipText}>50</Text></TouchableOpacity><TouchableOpacity style={styles.chip}><Text style={styles.chipText}>100</Text></TouchableOpacity></View>
      <TouchableOpacity style={styles.confirmBtn} onPress={onClose}><Text style={styles.confirmBtnText}>Confirm Top Up</Text></TouchableOpacity>
    </View>
  );
}
```

---

## Phase 4: New Tabung (Image 15 series)

### Task 4.1: NewTabung Screen

**Files:**
- Create: `app/(tabs)/tabung/new.tsx`

- [ ] **Step 1: Create 3-step NewTabung flow with template selection, form, and success**

```typescript
// app/(tabs)/tabung/new.tsx
// Step 1: Template Selection
// Step 2: Form (Name, Target, Date, Icon, Color, Auto-save toggle)
// Step 3: Success celebration
```

---

## Phase 5: Analysis (Image 13, 13a)

### Task 5.1: Analysis Screen

**Files:**
- Create: `app/(tabs)/analysis.tsx`

- [ ] **Step 1: Create Analysis with month selector, donut chart, income/expense breakdown, category chart**

```typescript
// app/(tabs)/analysis.tsx
// - Month selector (horizontal scroll Jan-May 2026)
// - Net Savings hero with donut chart + Rich Dad commentary
// - Income / Expenses 2-col summary
// - 5-month bar chart (income vs expense)
// - Category breakdown donut + list with progress bars
// - Rich Dad insight card
```

---

## Phase 6: Learn (Image 14 series)

### Task 6.1: Learn Screen

**Files:**
- Create: `app/(tabs)/learn/index.tsx`
- Create: `app/(tabs)/learn/[id].tsx`

- [ ] **Step 1: Create Learn Projects list with bilingual header**
- [ ] **Step 2: Create Project Detail with entries reverse-chronological**
- [ ] **Step 3: Create Add/Edit Entry with text + multi-image**
- [ ] **Step 4: Create Entry Detail with lightbox**

---

## Phase 7: Accounts Page (Image 16 series)

### Task 7.1: AccountsPage Screen

**Files:**
- Create: `app/(tabs)/accounts.tsx`

- [ ] **Step 1: Create AccountsPage with Net Worth hero, filter tabs, account lists, Add Account modal**

---

## Phase 8: Notifications (Image 17)

### Task 8.1: Notifications Screen

**Files:**
- Create: `app/(tabs)/notifications.tsx`

- [ ] **Step 1: Create Notifications with grouped sections, color-coded types, swipe-to-delete**

---

## Phase 9: Add Transaction Modal (Image 18 series)

### Task 9.1: AddTransaction Modal

**Files:**
- Modify: `app/modal.tsx`

- [ ] **Step 1: Create full AddTransaction modal with Expense/Income/Transfer tabs, recurring toggle, note, image attach**

```typescript
// app/modal.tsx
// - Tabs: [Expense] [Income] [Transfer]
// - Expense: Name + Amount + Category chips + From Account + Date
// - Income: Name + Amount + Category chips + To Account + Date
// - Transfer: From Account + To Account + Amount + Date
// - Recurring toggle card (Monthly/Weekly/Yearly, start/end dates, reminder)
// - Note textarea
// - Attach Image placeholder
// - Submit / Transfer button
```

---

## Phase 10: Calendar (Image 19)

### Task 10.1: Calendar Screen

**Files:**
- Create: `app/(tabs)/calendar.tsx`

- [ ] **Step 1: Create Calendar with month navigator, 3-card summary, day grid with dots, day list**

---

## Phase 11: Cash Flow (Image 20, 21 series)

### Task 11.1: CashFlow Screen

**Files:**
- Create: `app/(tabs)/cashflow.tsx`

- [ ] **Step 1: Create CashFlow with Financial Class Badge, Income Statement, Balance Sheet (Assets/Liabilities), Animated CashFlowDiagram, Monthly Trend**

### Task 11.2: CashFlowInfo Screen

**Files:**
- Create: `app/cashflow/info.tsx`

- [ ] **Step 1: Create CashFlowGuide with Poor/Middle/Rich pattern tabs, animated diagrams, comparison table**

---

## Phase 12: Settings Main (Image 22)

### Task 12.1: Settings Screen

**Files:**
- Modify: `app/(tabs)/settings.tsx`

- [ ] **Step 1: Create Settings main screen with Profile Card, Account/Security/App Settings/Affirmations/Data groups**

---

## Phase 13: Settings Subscreens

### Task 13.1: AccountSettings

**Files:**
- Create: `app/(tabs)/settings/account.tsx`

- [ ] **Step 1: Create AccountSettings with Avatar + Display Name + Financial Identity + Save**

### Task 13.2: ChangePIN

**Files:**
- Create: `app/(tabs)/settings/change-pin.tsx`

- [ ] **Step 1: Create ChangePIN with numpad (3x4 grid), current PIN → new PIN → confirm flow**

### Task 13.3: SecuritySettings

**Files:**
- Create: `app/(tabs)/settings/security.tsx`

- [ ] **Step 1: Create SecuritySettings with Fingerprint toggle + Auto-lock timer + Change PIN link**

### Task 13.4: NotificationsSettings

**Files:**
- Create: `app/(tabs)/settings/notifications.tsx`

- [ ] **Step 1: Create per-type notification toggles**

### Task 13.5: CategoriesSettings

**Files:**
- Create: `app/(tabs)/settings/categories.tsx`

- [ ] **Step 1: Create expense/income category management with add/edit/delete**

### Task 13.6: RecurringPaymentsSettings

**Files:**
- Create: `app/(tabs)/settings/recurring.tsx`

- [ ] **Step 1: Create recurring payments list with edit/pause/delete**

### Task 13.7: AffirmationsSettings

**Files:**
- Create: `app/(tabs)/settings/affirmations.tsx`

- [ ] **Step 1: Create Show on home + daily reminder time + category preference**

### Task 13.8: DataSettings

**Files:**
- Create: `app/(tabs)/settings/data.tsx`

- [ ] **Step 1: Create Export Data + Reset App with confirmation**

---

## Phase 14: Transaction Detail Popup (Image 28 series)

### Task 14.1: TransactionDetail Modal

**Files:**
- Create: `app/(tabs)/transaction/[id].tsx` (or use modal)

- [ ] **Step 1: Create TransactionDetail with type badge, category chip, account, amount, recurring details, note, receipt preview**

---

## Phase 15: Auth Setup & Onboarding (Images 00-09 -- Already Implemented)

> These phases are already documented in the user journey but images 00-09 are to be ignored per the user's instructions. The auth setup (Welcome → PIN → Confirm → Fingerprint → Success) and Onboarding (Name → Accounts → Done) screens are covered by the existing `app/(auth)/` structure. No action needed unless the user requests specific changes.

---

## Phase 16: Tab Bar Navigation Update

### Task 16.1: Update Tab Layout

**Files:**
- Modify: `app/(tabs)/_layout.tsx`

- [ ] **Step 1: Update tab layout with 5 tabs: Home, Calendar, + (elevated lime), Cash Flow, Settings**

```typescript
// app/(tabs)/_layout.tsx
// Home | Calendar | + (center, elevated, lime) | Cash Flow | Settings
// Use floating center button with shadow-lg shadow-primary/30
```

---

## Implementation Order

1. Phase 0: Project Foundation (theme, deps, layout)
2. Phase 1: Home Dashboard (image 10)
3. Phase 16: Tab Bar (navigation shell)
4. Phase 9: Add Transaction Modal (image 18) -- needed by Home
5. Phase 2: Account Detail (image 11)
6. Phase 3: Tabung Detail (image 12)
7. Phase 4: New Tabung (image 15)
8. Phase 5: Analysis (image 13)
9. Phase 6: Learn (image 14)
10. Phase 7: Accounts Page (image 16)
11. Phase 8: Notifications (image 17)
12. Phase 10: Calendar (image 19)
13. Phase 11: Cash Flow (image 20, 21)
14. Phase 12: Settings Main (image 22)
15. Phase 13: All Settings Subscreens (images 23-31)
16. Phase 14: Transaction Detail (image 28)

---

## Design Tokens Reference

```css
/* Dark Theme */
--darkBg: #0D0D0D
--cardBg: #1A1A1A
--text: #FFFFFF
--textSecondary: #A0A0A0
--border: rgba(255,255,255,0.1)
--tint: #C5FF00  /* lime accent */
--destructive: #FF4444
--success: #C5FF00
--warning: #FFD93D
```

**Plan complete and saved to `docs/superpowers/plans/2026-05-23-flowe-frontend.md`**

Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?