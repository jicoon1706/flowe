# Frontend → API → DB Wiring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect every remaining screen in the Flowe app to existing Supabase repositories/hooks. No new runtime deps; existing `useState` hooks stay. Full user journey works end-to-end on real data.

**Architecture:** Single-phase rollout by user journey. Foundation first (shared infra), then screen-group phases in order a real user encounters them. Each phase builds in isolation and is verified end-to-end before the next.

**Tech Stack:** Expo Router, NativeWind, Supabase JS, react-native-reanimated. No new packages.

---

## File Structure

### New files

| File | Purpose |
|------|---------|
| `context/AuthContext.tsx` | Global auth state (`user`, `session`, `loading`, `signOut`). Replaces inline `supabase.auth.getUser()` calls. |
| `components/ui/LoadingView.tsx` | Centered spinner — brand accent `#C5FF00`. |
| `components/ui/ErrorView.tsx` | Error message + retry button (`bg-primary rounded-2xl`). |
| `components/ui/EmptyState.tsx` | `icon` + `title` + `description` + optional `action`. |

### Key files modified per phase

| Phase(s) | Modified screens | Notes |
|----------|-----------------|-------|
| Phase 0 | `app/_layout.tsx` | Wrap with `AuthProvider` |
| Phase 1 | `app/(main)/index.tsx` | Wire `useAccounts`, `useTransactions`, `useCashflow` |
| Phase 2 | `app/(main)/add-transaction.tsx` | Wire `useTransactions.create`, `useAccounts`, `useCustomCategories` |
| Phase 3 | 4 account screens | Wire `useAccounts`, `useTransactions` |
| Phase 4 | `cashflow/index.tsx`, `cashflow/info.tsx` | Wire `useCashflow`, `useAssets`, `useLiabilities` |
| Phase 5 | `home/analysis.tsx` | Wire `useAnalysis` |
| Phase 6 | `calendar.tsx` | Wire `useTransactions` (date-range) |
| Phase 7 | `tabung/new/index.tsx`, `tabung/new/form.tsx` | Wire `useAccounts.createTabungAccount` |
| Phase 8 | 9 settings screens | Wire `useAuth`, `useSettings`, `useCustomCategories`, etc. |
| Phase 9 | `home/notifications.tsx` | Wire `useNotifications` |
| Phase 10 | 4 Learn screens | Wire `useLearn` + storage |
| Phase 11 | throughout | Remove all mock constants |

### Refetch convention

Every wired screen uses `useFocusEffect` + `useCallback` so navigating back re-fetches:

```ts
import { useFocusEffect } from 'expo-router';
useFocusEffect(useCallback(() => { fetchAccounts(); }, [fetchAccounts]));
```

Replace existing `useEffect` calls in hooks with `useFocusEffect` at the screen level — hooks stay unchanged.

---

## Tasks

### Task 0.1: Create AuthContext

**Files:**
- Create: `context/AuthContext.tsx`

- [ ] **Step 1: Create AuthContext file**

```tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../src/lib/supabase';
import { authRepository } from '../src/repositories';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authRepository.getSession().then((res) => {
      if (res.ok) {
        setSession(res.data);
        setUser(res.data?.user ?? null);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    await authRepository.signOut();
    setUser(null);
    setSession(null);
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
```

- [ ] **Step 2: Update app/_layout.tsx to wrap with AuthProvider**

Update the return statement in `RootLayout`:

```tsx
import { AuthProvider } from '../context/AuthContext';

return (
  <AuthProvider>
    <OnboardingProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(main)" />
      </Stack>
    </OnboardingProvider>
  </AuthProvider>
);
```

- [ ] **Step 3: Commit**

```bash
git add context/AuthContext.tsx app/_layout.tsx
git commit -m "feat(foundation): add AuthContext with user/session/signOut

Replaces inline supabase.auth.getUser() calls. Used by every
wired screen in Phases 1+. Wraps app at RootLayout.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 0.2: Create UX primitive components

**Files:**
- Create: `components/ui/LoadingView.tsx`
- Create: `components/ui/ErrorView.tsx`
- Create: `components/ui/EmptyState.tsx`

- [ ] **Step 1: Create LoadingView.tsx**

```tsx
import { View, ActivityIndicator, Text } from 'react-native';

interface LoadingViewProps {
  label?: string;
}

export function LoadingView({ label }: LoadingViewProps) {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator color="#C5FF00" size="large" />
      {label && <Text className="text-muted-foreground text-sm mt-3">{label}</Text>}
    </View>
  );
}
```

- [ ] **Step 2: Create ErrorView.tsx**

```tsx
import { View, Text, Pressable } from 'react-native';

interface ErrorViewProps {
  error?: { message: string };
  onRetry: () => void;
}

export function ErrorView({ error, onRetry }: ErrorViewProps) {
  return (
    <View className="flex-1 items-center justify-center bg-background px-6">
      <Text className="text-destructive text-sm text-center mb-2">
        {error?.message ?? 'Something went wrong'}
      </Text>
      <Pressable
        onPress={onRetry}
        className="bg-primary rounded-2xl py-3 px-6"
      >
        <Text className="text-primary-foreground font-semibold">Retry</Text>
      </Pressable>
    </View>
  );
}
```

- [ ] **Step 3: Create EmptyState.tsx**

```tsx
import { View, Text, Pressable } from 'react-native';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: { label: string; onPress: () => void };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center py-16 px-6">
      {icon && <Text className="text-4xl mb-3">{icon}</Text>}
      <Text className="text-foreground font-medium text-base text-center">{title}</Text>
      {description && (
        <Text className="text-muted-foreground text-sm text-center mt-1">{description}</Text>
      )}
      {action && (
        <Pressable onPress={action.onPress} className="mt-4 bg-primary rounded-2xl py-3 px-6">
          <Text className="text-primary-foreground font-semibold">{action.label}</Text>
        </Pressable>
      )}
    </View>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add components/ui/LoadingView.tsx components/ui/ErrorView.tsx components/ui/EmptyState.tsx
git commit -m "feat(foundation): add LoadingView, ErrorView, EmptyState primitives

Used by every wired screen from Phase 1+ for consistent loading/error/
empty UX. Follows brand accent #C5FF00 design system tokens.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 0.3: Edge function smoke test

**Files:**
- Modify: `app/(main)/index.tsx` — add a DEV-only button that calls both edge fns and logs output.

- [ ] **Step 1: Add smoke test button to HomeScreen (temporary)**

In `app/(main)/index.tsx`, add these imports:

```tsx
import { edgeFunctionsService } from '../../src/services/edgeFunctions';
```

Add inside the dev-only block in the component (after the `resetOnboarding` block):

```tsx
async function smokeTestApi() {
  const month = '2026-05';
  const r1 = await edgeFunctionsService.getCashflowSummary(month);
  const r2 = await edgeFunctionsService.getAnalysis(month);
  console.log('[smoke] cashflow-summary:', JSON.stringify(r1));
  console.log('[smoke] analysis-monthly:', JSON.stringify(r2));
}
```

And add a DEV button:

```tsx
{__DEV__ && (
  <Pressable
    onPress={smokeTestApi}
    className="bg-primary/20 rounded-xl mx-4 mt-2 py-2 items-center active:opacity-80"
  >
    <Text className="text-primary font-semibold text-xs">DEV: Smoke test APIs</Text>
  </Pressable>
)}
```

- [ ] **Step 2: Run app, tap the smoke test button, check console**

Expected: `console.log` shows `{ ok: true, data: {...} }` for both calls. If either returns `{ ok: false }`, surface the error before proceeding to Phase 4. Remove this test code in Phase 11.

- [ ] **Step 3: Commit**

```bash
git add app/(main)/index.tsx
git commit -m "chore(foundation): temp smoke test for edge fns

Calls cashflow-summary and analysis-monthly, logs result.
To be removed in Phase 11 cleanup.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 1.1: Wire Home dashboard

**Files:**
- Modify: `app/(main)/index.tsx`

- [ ] **Step 1: Add imports and state for data**

```tsx
import { useFocusEffect, useCallback } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useAccounts } from '../../src/hooks/useAccounts';
import { useTransactions } from '../../src/hooks/useTransactions';
import { useCashflow } from '../../src/hooks/useCashflow';
import { LoadingView } from '../../components/ui/LoadingView';
import { ErrorView } from '../../components/ui/ErrorView';
import { EmptyState } from '../../components/ui/EmptyState';
```

Add to component body:

```tsx
const { user } = useAuth();
const now = new Date();
const { accounts, loading: accountsLoading, error: accountsError, fetchAccounts } = useAccounts();
const { transactions, loading: txLoading, error: txError, refetch: refetchTransactions } = useTransactions(now.getFullYear(), now.getMonth() + 1);
const { summary: cashflow, loading: cfLoading, error: cfError } = useCashflow('2026-05');
```

- [ ] **Step 2: Add useFocusEffect for refetch on screen focus**

```tsx
useFocusEffect(useCallback(() => {
  fetchAccounts();
}, [fetchAccounts]));
```

- [ ] **Step 3: Show loading/error/empty states**

Add this at the top of the return, before the ScrollView:

```tsx
if (accountsLoading || cfLoading) return <LoadingView />;
if (accountsError) return <ErrorView error={accountsError} onRetry={fetchAccounts} />;
```

- [ ] **Step 4: Compute real values and remove mock hardcoded strings**

Replace `name="Ahmad"` in `HomeTopBar`:
```tsx
name={user?.user_metadata?.display_name ?? 'User'}
```

Replace `balance="4,250.00"` in `BalanceBanner`. The `BalanceBanner` receives a `balance` string or the home screen computes a total from `accounts`:

```tsx
// totalBalance is a computed value from account data
const totalBalance = accounts.reduce((sum, acc) => {
  const bal = (acc as any).current_balance ?? (acc as any).saved_amount ?? 0;
  return sum + Number(bal);
}, 0);

<BalanceBanner
  balance={totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
  visible={balanceVisible}
  onToggle={() => setBalanceVisible(!balanceVisible)}
/>
```

- [ ] **Step 5: Wire Shortcuts and HomeTopBar bell press**

`HomeTopBar` onBellPress stays as-is (`router.push('/home/notifications')`).
`Shortcuts` onPress stays as-is (router navigation only, no data needed).

- [ ] **Step 6: Wire RecentTransactions with real data**

`RecentTransactions` receives `transactions` — map the real transactions from the hook to the card component's expected shape. Use same stub `onTransactionPress` that logs to console.

- [ ] **Step 7: Wire AccountCards with real accounts**

`AccountCards` receives accounts array — pass `accounts` directly, mapped to component's expected shape per account type (bank/wallet/tabung).

- [ ] **Step 8: Run app, verify Home shows real data**

Navigate home. Balance should reflect real account balances. Recent transactions should show real records. Empty states should show `<EmptyState>` if no data.

- [ ] **Step 9: Commit**

```bash
git add app/(main)/index.tsx
git commit -m "feat(home): wire home dashboard to Supabase

Replaces mock data in index.tsx with useAccounts, useTransactions,
useCashflow hooks. Computes real account balance totals. Shows
LoadingView/ErrorView/EmptyState per state. User journey Phase 1.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 1.2: Wire Add Transaction screen

**Files:**
- Modify: `app/(main)/add-transaction.tsx`

- [ ] **Step 1: Add imports**

```tsx
import { useFocusEffect, useCallback } from 'expo-router';
import { Alert } from 'react-native';
import { useAccounts } from '../../src/hooks/useAccounts';
import { useTransactions } from '../../src/hooks/useTransactions';
import { useCustomCategories } from '../../src/hooks/useCustomCategories';
import { LoadingView } from '../../components/ui/LoadingView';
import { ErrorView } from '../../components/ui/ErrorView';
import { useAuth } from '../../context/AuthContext';
```

Add to component body (after existing useState declarations):

```tsx
const router = useRouter(); // already declared — keep
const { user } = useAuth();
const now = new Date();
const { accounts, loading: acctsLoading, error: acctsError, fetchAccounts } = useAccounts();
const { loading: txLoading, error: txError, create } = useTransactions(now.getFullYear(), now.getMonth() + 1);
const { customCategories, loading: catLoading, error: catError, fetchCustomCategories } = useCustomCategories();
```

- [ ] **Step 2: Add useFocusEffect for prefetch**

```tsx
useFocusEffect(useCallback(() => {
  fetchAccounts();
  fetchCustomCategories();
}, [fetchAccounts, fetchCustomCategories]));
```

- [ ] **Step 3: Show loading/error state while data loads**

Add after the loading state check block from Step 1.2.3:

```tsx
if (acctsLoading || catLoading) return <LoadingView />;
if (acctsError || catError) return <ErrorView error={acctsError ?? catError!} onRetry={() => { fetchAccounts(); fetchCustomCategories(); }} />;
```

- [ ] **Step 4: Wire AccountSelector with real accounts**

The `AccountSelector` component receives `value`/`onChange`. Update the `account`/`toAccount` state initialization from hardcoded string IDs to the id of the first account from the hook. On the `AccountSelector`, also pass the accounts list:

```tsx
// If there are accounts, default to the first one
const [account, setAccount] = useState(accounts[0]?.id ?? '');
const [toAccount, setToAccount] = useState(accounts[1]?.id ?? accounts[0]?.id ?? '');
```

The `AccountSelector` component currently receives `value` + `onChange`. Update it to also receive `accounts` and render a real picker. If `AccountSelector` doesn't accept accounts prop, update it in `components/ui/AccountSelector.tsx` to accept an optional `accounts` prop and merge with built-in categories.

- [ ] **Step 5: Merge custom categories with built-in**

```tsx
// Combine expenseCategories + customCategories.filter(type === 'expense')
// and incomeCategories + customCategories.filter(type === 'income')
```

- [ ] **Step 6: Wire the Submit button to create transaction**

Replace `onPress={() => router.back()}` on the submit Button:

```tsx
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
```

Also add `import * as Haptics from 'expo-haptics';` if not present.

- [ ] **Step 7: Update the Button onPress**

```tsx
<Button title={type === 'transfer' ? 'Transfer' : 'Submit'} onPress={handleSubmit} ... />
```

- [ ] **Step 8: Handle recurring transaction creation**

If `recurring` is true, also call `useRecurring` hook (imported from `../../src/hooks/useRecurring`) after the transaction is created successfully:

```tsx
// After successful transaction create, if recurring:
if (recurring && result.ok) {
  const recResult = await createRecurring({
    user_id: user.id,
    transaction_name: name,
    amount: parseFloat(amount),
    frequency: recurringFreq as 'weekly' | 'monthly' | 'yearly',
    start_date: startDate.toISOString(),
    end_date: hasEndDate ? endDate?.toISOString() : undefined,
    account_id: account,
    category,
    reminder: reminder !== 'none' ? reminder : undefined,
  });
  if (!recResult.ok) console.warn('[add-tx] recurring rule failed:', recResult.error);
}
```

- [ ] **Step 9: Run app, add a transaction, verify it appears in Supabase**

Navigate to Add Transaction → fill in fields → tap Submit → confirm success. Check Supabase dashboard `transactions` table.

- [ ] **Step 10: Commit**

```bash
git add app/(main)/add-transaction.tsx components/ui/AccountSelector.tsx (if updated)
git commit -m "feat(transactions): wire add-transaction to Supabase

Wires useTransactions.create, useAccounts, useCustomCategories.
Writes to transactions + optional recurring_transactions.
Handles loading/error states with primitives.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 2.1: Wire Accounts list screen

**Files:**
- Modify: `app/(main)/home/accounts.tsx`

- [ ] **Step 1: Add imports**

```tsx
import { useFocusEffect, useCallback } from 'react';
import { useAccounts } from '../../../src/hooks/useAccounts';
import { useAuth } from '../../../context/AuthContext';
import { LoadingView } from '../../../components/ui/LoadingView';
import { ErrorView } from '../../../components/ui/ErrorView';
import { EmptyState } from '../../../components/ui/EmptyState';
```

- [ ] **Step 2: Replace ALL_ACCOUNTS mock with hook data**

Remove the mock array and state:

```tsx
// Remove:
const ALL_ACCOUNTS = [ ... ];
```

Replace with:

```tsx
const { user } = useAuth();
const { accounts, loading, error, fetchAccounts, createBankAccount, createWalletAccount } = useAccounts();

useFocusEffect(useCallback(() => { fetchAccounts(); }, [fetchAccounts]));
```

- [ ] **Step 3: Show LoadingView/ErrorView/EmptyState**

Add after `BalanceVisible` state:

```tsx
if (loading) return <LoadingView />;
if (error) return <ErrorView error={error} onRetry={fetchAccounts} />;
if (accounts.length === 0) {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* keep header */}
      <EmptyState
        icon="🏦"
        title="No accounts yet"
        description="Add your first account to get started"
        action={{ label: 'Add Account', onPress: () => setShowAddModal(true) }}
      />
    </SafeAreaView>
  );
}
```

- [ ] **Step 4: Wire compute values to real data**

Total net worth:
```tsx
const totalNetWorth = accounts.reduce((sum, acc) => {
  const bal = (acc as any).current_balance ?? (acc as any).saved_amount ?? 0;
  return sum + Number(bal);
}, 0);
```

Bank accounts:
```tsx
const bankAccounts = accounts.filter((a) => a.type === 'bank' || a.type === 'wallet');
const tabungAccounts = accounts.filter((a) => a.type === 'tabung');
```

- [ ] **Step 5: Wire Add Account modal**

Replace `handleAddAccount` body:

```tsx
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
```

- [ ] **Step 6: Wire tabung tap → real account id routing**

In the account press handler, check account type from the real data (not hardcoded strings). Already reads `(a) => { ... router.push(...) }` — update to use real `account.id` and `account.type`:

```tsx
<Pressable
  key={account.id}
  onPress={() => {
    if (account.type === 'tabung') router.push(`/home/tabung/${account.id}`);
    else if (account.type === 'wallet') router.push(`/home/wallet/${account.id}`);
    else router.push(`/home/account/${account.id}`);
  }}
>
```

- [ ] **Step 7: Run app, verify accounts screen shows real data**

- [ ] **Step 8: Commit**

```bash
git add app/(main)/home/accounts.tsx
git commit -m "feat(accounts): wire accounts list to Supabase

Replaces mock ALL_ACCOUNTS with useAccounts hook. Real balances,
add account modal writes via createBankAccount/createWalletAccount.
Phase 3.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 2.2: Wire Account detail screens

**Files:**
- Modify: `app/(main)/home/account/[id].tsx`
- Modify: `app/(main)/home/wallet/[id].tsx`
- Modify: `app/(main)/home/tabung/[id].tsx`

For each screen:
1. Import `useAccounts`, `useTransactions`, `LoadingView`, `ErrorView`, `EmptyState`.
2. `useFocusEffect` calling `fetchAccounts()` and `fetchTransactions()` filtered by account id.
3. Replace mock data with real values from `accounts.find(a => a.id === route.params.id)` and filtered transactions.
4. Build and verify each screen independently.
5. Commit per screen.

---

### Task 3.1: Wire Cashflow screen

**Files:**
- Modify: `app/(main)/cashflow/index.tsx`
- Modify: `app/(main)/cashflow/info.tsx`
- Modify: `components/cashflow/AddAssetModal.tsx`
- Modify: `components/cashflow/AddLiabilityModal.tsx`

- [ ] **Step 1: Wire CashFlow index to uses**

In `app/(main)/cashflow/index.tsx`:

```tsx
import { useFocusEffect, useCallback } from 'react';
import { useCashflow } from '../../../src/hooks/useCashflow';
import { useAssets } from '../../../src/hooks/useAssets';
import { useLiabilities } from '../../../src/hooks/useLiabilities';
import { LoadingView } from '../../../components/ui/LoadingView';
import { ErrorView } from '../../../components/ui/ErrorView';
```

Remove the mock `INITIAL_ASSETS` and `INITIAL_LIABILITIES` arrays. Replace with hook calls:

```tsx
const { summary: cashflow, loading: cfLoading, error: cfError } = useCashflow('2026-05');
const { assets, loading: astLoading, error: astError, fetchAssets, createAsset } = useAssets();
const { liabilities, loading: liabLoading, error: liabError, fetchLiabilities, createLiability } = useLiabilities();

const loading = cfLoading || astLoading || liabLoading;
const anyError = cfError || astError || liabError;

useFocusEffect(useCallback(() => {
  fetchAssets();
  fetchLiabilities();
}, [fetchAssets, fetchLiabilities]));
```

- [ ] **Step 2: Replace mock computed values with real cashflow data**

Replace all hardcoded `INCOME_ITEMS`, `EXPENSE_ITEMS` with `cashflow.income` and `cashflow.expenses` from the `CashflowSummary` type. The `cashflow-summary` edge fn returns `{ income: AccountLine[], expenses: AccountLine[], net_worth, ... }` — extract from `summary`.

For example:
```tsx
const incomeItems = cashflow?.income ?? [];
const expenseItems = cashflow?.expenses ?? [];
```

- [ ] **Step 3: Wire AddAssetModal and AddLiabilityModal**

`AddAssetModal` receives `onSubmit: (asset: NewAsset) => void`. Wire it to call `createAsset` from `useAssets`. Same for `AddLiabilityModal` → `createLiability`.

In the handle functions:
```tsx
const handleAddAsset = async (a: NewAsset) => {
  const result = await createAsset({ user_id: userId, name: a.name, type: a.type, value: a.value, monthly_income: a.monthlyIncome });
  if (result.ok) {
    setEditingAsset(null);
    setShowAddAsset(false);
  }
};
```

Note: you may need to pass `user` from a hook into the component handlers. Extract `user` from `useAuth()` in the screen and pass `user.id` down.

- [ ] **Step 4: Run app, verify Cashflow screen shows real data**

- [ ] **Step 5: Commit**

```bash
git add app/(main)/cashflow/index.tsx app/(main)/cashflow/info.tsx components/cashflow/AddAssetModal.tsx components/cashflow/AddLiabilityModal.tsx
git commit -m "feat(cashflow): wire cashflow screen to Supabase edge fns

Wires useCashflow (cashflow-summary), useAssets, useLiabilities.
Replaces all mock arrays and computed values with real data.
Phase 4.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 4.1: Wire Analysis screen

**Files:**
- Modify: `app/(main)/home/analysis.tsx`

```tsx
import { useFocusEffect, useCallback } from 'react';
import { useAnalysis } from '../../../src/hooks/useAnalysis';
import { LoadingView } from '../../../components/ui/LoadingView';
import { ErrorView } from '../../../components/ui/ErrorView';
```

Remove any mock chart data arrays (e.g., monthly spending by category). Wire real data from `useAnalysis`:

```tsx
const { analysis, loading, error } = useAnalysis('2026-05');

useFocusEffect(useCallback(() => { /* analysis refetch handled by hook */ }, []));

if (loading) return <LoadingView />;
if (error) return <ErrorView error={error} onRetry={() => {}} />;
```

Replace mock chart values with `analysis.category_breakdown` and `analysis.monthly_trend` from the `AnalysisMonthly` type.

---

### Task 4.2: Wire Calendar screen

**Files:**
- Modify: `app/(main)/calendar.tsx`

```tsx
import { useFocusEffect, useCallback } from 'react';
import { useTransactions } from '../src/hooks/useTransactions';
```

`useTransactions` takes `(year, month)`. For calendar, add state for selected month and wire to real data. If transactions need date-range filtering that the current hook doesn't support, add a `fetchByDateRange(start: Date, end: Date)` function to `useTransactions` hook first (in `src/hooks/useTransactions.ts`).

---

### Task 4.3: Wire Tabung new screens

**Files:**
- Modify: `app/(main)/tabung/new/index.tsx`
- Modify: `app/(main)/tabung/new/form.tsx`

```tsx
import { useAccounts } from '../../../src/hooks/useAccounts';
import { useAuth } from '../../../context/AuthContext';
```

Wire `useAccounts.createTabungAccount` on form submit. This hook was already exercised in onboarding, so straight reuse.

---

### Task 5.1: Wire Settings screens

**Files:**
- Modify: `app/(main)/settings/index.tsx` and sub-screens

**Important note:** `SettingsContext.tsx` already exists and manages settings state locally (no Supabase). Wire the context to read/write from `useSettings` hook (`src/hooks/useSettings.ts`) and `useAuth.signOut`. The context reducer dispatches local state — update it to call the Supabase hooks on each action (or refactor to use hooks directly in each screen).

**Best approach for settings sub-screens:** Use `useSettings` hook directly in each screen rather than `SettingsContext`. Keep `SettingsContext` for the profile display name in the main settings index only.

For `settings/index.tsx`:
```tsx
import { useAuth } from '../../../context/AuthContext'; // signOut
// Remove useSettings from context — use useSettings hook instead:
import { useSettings } from '../../../src/hooks/useSettings';
```

For `settings/security.tsx`, `settings/change-pin.tsx`:
```tsx
import { authConfigRepository } from '../../../src/repositories/authConfig.repository';
import { useAuth } from '../../../context/AuthContext';
import { hashPin } from '../../../src/lib/pinCrypto';
import { flags } from '../../../src/lib/secureStore';
```

For `settings/categories.tsx`:
```tsx
import { useCustomCategories } from '../../../src/hooks/useCustomCategories';
```

For `settings/recurring.tsx`:
```tsx
import { useRecurring } from '../../../src/hooks/useRecurring';
```

For `settings/affirmations.tsx`:
```tsx
import { useAffirmations } from '../../../src/hooks/useAffirmations';
```

For `settings/notifications.tsx`:
```tsx
import { useNotifications } from '../../../src/hooks/useNotifications';
```

For `settings/data.tsx`:
```tsx
import { useAssets } from '../../../src/hooks/useAssets';
import { useLiabilities } from '../../../src/hooks/useLiabilities';
```

Commit per screen or per logical group.

---

### Task 6.1: Wire Notifications inbox

**Files:**
- Modify: `app/(main)/home/notifications.tsx`

```tsx
import { useFocusEffect, useCallback } from 'react';
import { useNotifications } from '../../../src/hooks/useNotifications';
import { LoadingView } from '../../../components/ui/LoadingView';
import { ErrorView } from '../../../components/ui/ErrorView';
import { EmptyState } from '../../../components/ui/EmptyState';
```

Wire `useNotifications` — `fetchNotifications` and `markAsRead`/`markAllRead`. Use `useFocusEffect` + `useCallback`.

---

### Task 6.2: Wire Learn screens

**Files:**
- Modify: 4 Learn screens under `app/(main)/home/learn/`
- Modify: `components/` if Learn-specific components exist

```tsx
import { useFocusEffect, useCallback } from 'react';
import { useLearn } from '../../../src/hooks/useLearn';
import { useAuth } from '../../../context/AuthContext';
import { storageService } from '../../../src/services/storage';
```

Key wiring for Learn project creation, entry creation, and image upload to `learn-images/` bucket via `storageService` (from `src/services/storage.ts`).

Note: `useLearn.ts` needs `fetchProjects` — add it to the hook if missing. Check the current hook has a `fetchProjects` function and wire it to the index screen.

---

### Task 7.1: Cleanup

- [ ] **Remove mock data constants** — scan for `const MOCK_`, `const INITIAL_`, hardcoded string balances in all wired screens. Delete unused mock arrays.
- [ ] **Remove Phase 0 smoke test** — delete the API smoke test button from `app/(main)/index.tsx`.
- [ ] **Remove OnboardingContext usage if re-wired** — `accounts.tsx` and `success.tsx` already use `useAuth()` context instead of inline `getUser()`. Update those screens to use `useAuth()` consistently.
- [ ] **Run lint** — `npm run lint`, fix any errors.
- [ ] **Final commit:**

```bash
git add -A
git commit -m "chore: cleanup mock data after full DB wiring

Removes mock constants from all wired screens. Removes Phase 0
smoke-test button. All screens now consume live Supabase data.
Flowe full-stack wiring complete.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Coverage verification checklist

Run after every phase commit:

- [ ] Phase 0: `AuthContext` renders, primitives exist and import cleanly
- [ ] Phase 1: Home shows real balances + transactions from Supabase
- [ ] Phase 2: Added transaction appears in Supabase `transactions` table
- [ ] Phase 3: Accounts screen lists real accounts; detail screens load data
- [ ] Phase 4: Cashflow shows real financial class and income statement from edge fn
- [ ] Phase 5: Analysis screen shows real chart data from edge fn
- [ ] Phase 6: Calendar shows transactions filtered by month
- [ ] Phase 7: New Tabung form creates account via `createTabungAccount`
- [ ] Phase 8: Settings sub-screens read/write from correct tables
- [ ] Phase 9: Notifications inbox shows real notifications
- [ ] Phase 10: Learn projects and entries CRUD end-to-end; images upload to Supabase Storage
- [ ] Phase 11: `npm run lint` passes; run full user journey on device

## Spec coverage check

| Spec requirement | Task |
|-----------------|------|
| AuthContext replaces inline getUser calls | Task 0.1 |
| LoadingView / ErrorView / EmptyState for all screens | Task 0.2 |
| Edge function smoke test before Phase 4 | Task 0.3 |
| Home dashboard wired | Task 1.1 |
| Add transaction wired | Task 1.2 |
| Account list + detail wired | Task 2.1 + 2.2 |
| Cashflow screen wired | Task 3.1 |
| Analysis screen wired | Task 4.1 |
| Calendar wired | Task 4.2 |
| Tabung create wired | Task 4.3 |
| All 9 settings screens wired | Task 5.1 |
| Notifications inbox wired | Task 6.1 |
| Learn screens wired | Task 6.2 |
| Mock data removed; final lint | Task 7.1 |

## Type consistency check

- `accountsRepository.fetchAllActive()` — returns `Account[]`;
  `BankAccount`, `WalletAccount`, `TabungAccount` are on junction tables; access via `(account as any).current_balance` or `(account as any).saved_amount` where needed.
- `useTransactions(year, month)` — returns `transactions`, `expenses`, `income`, `loading`, `error`, `refetch`, `create`.
- `useCashflow(month: string)` — `month` param is `'YYYY-MM'` string; invoked as `'2026-05'`.
- `useAnalysis(month: string)` — same pattern as `useCashflow`.
- `useAssets`, `useLiabilities`, `useRecurring`, `useAffirmations`, `useNotifications`, `useSettings` — all follow `fetchX` + mutation pattern.
- Edge fn calls in `edgeFunctionsService` — both functions return `Result<T, EdgeFunctionError>`; `data` is typed as `CashflowSummary` and `AnalysisMonthly`.

All return shapes match across tasks.

## Sub-agent handoff

For each Phase 0 task, commit immediately. For Phase 1+, commit per task. Each task is independently verifiable — you can run the app after each commit.
