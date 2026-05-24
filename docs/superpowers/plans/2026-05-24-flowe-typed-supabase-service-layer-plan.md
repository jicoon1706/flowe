# Flowe — Typed Supabase Service Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a typed Supabase service layer (repositories + hooks) for the Flowe React Native app, providing consistent TypeScript types, Result-based error handling, and React hooks for all data domains.

**Architecture:** Layered approach — `repositories/` for DB CRUD only, `services/` for edge functions + storage, `hooks/` for UI state. All repository methods return `Result<T, SupabaseError>`. No throwing.

**Tech Stack:** TypeScript, @supabase/supabase-js, React hooks, base64-arraybuffer (for storage uploads).

---

## File Structure

```
src/
├── lib/
│   └── supabase.ts                    # Supabase client singleton (create if missing)
│
├── utils/
│   └── result.ts                     # Result<T, E> + SupabaseError + fromSupabaseError
│
├── types/
│   ├── database.types.ts              # All enums + table row types
│   ├── cashflow.types.ts             # Edge function response types
│   └── index.ts
│
├── repositories/
│   ├── auth.repository.ts
│   ├── accounts.repository.ts
│   ├── transactions.repository.ts
│   ├── recurring.repository.ts
│   ├── assets.repository.ts
│   ├── liabilities.repository.ts
│   ├── learn.repository.ts
│   ├── notifications.repository.ts
│   ├── affirmations.repository.ts
│   ├── settings.repository.ts
│   ├── customCategories.repository.ts
│   └── index.ts
│
├── services/
│   ├── edgeFunctions.ts
│   ├── storage.ts
│   └── index.ts
│
└── hooks/
    ├── useAuth.ts
    ├── useAccounts.ts
    ├── useTransactions.ts
    ├── useCashflow.ts
    ├── useAnalysis.ts
    ├── useAssets.ts
    ├── useLiabilities.ts
    ├── useLearn.ts
    ├── useNotifications.ts
    ├── useSettings.ts
    ├── useRecurring.ts
    ├── useAffirmations.ts
    ├── useCustomCategories.ts
    └── index.ts
```

---

## Task 1: Foundation — Result Utility & Type Definitions

### 1a: Create `src/utils/result.ts`

- [ ] **Step 1: Write the file**

Create `src/utils/result.ts`:

```typescript
export type SupabaseError = {
  code: string;
  message: string;
  details?: string;
  hint?: string;
};

export type Result<T, E = SupabaseError> =
  | { ok: true; data: T }
  | { ok: false; error: E };

export type EdgeFunctionError = {
  message: string;
  code?: string;
};

export function fromSupabaseError(err: any): SupabaseError {
  return {
    code: err?.code ?? 'UNKNOWN',
    message: err?.message ?? 'An unknown error occurred',
    details: err?.details,
    hint: err?.hint,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/utils/result.ts
git commit -m "feat(supabase): add Result<T,E> and SupabaseError types"
```

---

### 1b: Create `src/types/database.types.ts`

- [ ] **Step 1: Write the file**

Create `src/types/database.types.ts`. All enums + table row types matching `docs/sql/001_init_schema.sql`:

```typescript
// ─── Enums ───
export type AccountType = 'bank' | 'tabung' | 'wallet';
export type TransactionType = 'expense' | 'income' | 'transfer' | 'tabung_topup' | 'tabung_withdraw';
export type RecurringFrequency = 'monthly' | 'weekly' | 'yearly';
export type RecurringStatus = 'active' | 'paused' | 'ended';
export type ReminderOffset = 'none' | 'same_day' | '1_day' | '3_days' | '1_week';
export type AssetType = 'real_estate' | 'stocks' | 'unit_trust' | 'fixed_deposit' | 'asb' | 'gold' | 'vehicle' | 'business' | 'others';
export type LiabilityType = 'mortgage' | 'car_loan' | 'credit_card' | 'study_loan' | 'medical_loan' | 'business_loan' | 'others';
export type NotificationType = 'expense' | 'income' | 'transfer' | 'recurring' | 'alert' | 'tabung' | 'milestone' | 'asset' | 'cashflow' | 'note' | 'affirmation' | 'project';
export type AffirmationCategory = 'saving' | 'investing' | 'mindset' | 'awareness';
export type FinancialIdentity = 'employee' | 'entrepreneur' | 'investor' | 'business_owner';

// ─── Table Row Types ───
export interface Profile {
  id: string;
  display_name: string;
  financial_identity?: FinancialIdentity;
  avatar_url?: string;
  member_since: string;
  updated_at: string;
}

export interface AuthConfig {
  id: string;
  user_id: string;
  pin_hash: string;
  fingerprint_enabled: boolean;
  auto_lock_minutes: number | null;
  updated_at: string;
}

export interface Account {
  id: string;
  user_id: string;
  type: AccountType;
  name: string;
  icon?: string;
  color?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BankAccount {
  id: string;
  account_id: string;
  bank_name: string;
  account_number?: string;
  opening_balance: number;
  current_balance: number;
}

export interface TabungAccount {
  id: string;
  account_id: string;
  target_amount: number;
  saved_amount: number;
  from_date: string;
  to_date: string;
  linked_bank_id?: string;
  description?: string;
  icon?: string;
  color?: string;
  template_type?: string;
  auto_save: boolean;
}

export interface WalletAccount {
  id: string;
  account_id: string;
  opening_balance: number;
  current_balance: number;
}

// Composite account types (account row + type-specific row)
export interface BankAccountFull extends Account {
  bank_accounts: BankAccount;
}

export interface TabungAccountFull extends Account {
  tabung_accounts: TabungAccount;
}

export interface WalletAccountFull extends Account {
  wallet_accounts: WalletAccount;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  name: string;
  amount: number;
  category?: string;
  from_account_id?: string;
  to_account_id?: string;
  date: string;
  note?: string;
  receipt_url?: string;
  is_recurring: boolean;
  recurring_id?: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionDetail extends Transaction {
  from_account?: { id: string; name: string; type: AccountType };
  to_account?: { id: string; name: string; type: AccountType };
  recurring?: {
    frequency: RecurringFrequency;
    start_date: string;
    end_date?: string;
    reminder_enabled: boolean;
  };
}

export interface RecurringRule {
  id: string;
  user_id: string;
  type: 'expense' | 'income';
  name: string;
  amount: number;
  category?: string;
  from_account_id?: string;
  to_account_id?: string;
  frequency: RecurringFrequency;
  start_date: string;
  end_date?: string;
  next_date?: string;
  reminder_enabled: boolean;
  reminder_offset: ReminderOffset;
  status: RecurringStatus;
  last_applied_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: string;
  user_id: string;
  name: string;
  type: AssetType;
  icon?: string;
  current_value: number;
  monthly_income: number;
  date_acquired?: string;
  note?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Liability {
  id: string;
  user_id: string;
  name: string;
  type: LiabilityType;
  icon?: string;
  amount_owed: number;
  monthly_payment: number;
  interest_rate: number;
  note?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LearnProject {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface LearnEntry {
  id: string;
  project_id: string;
  user_id: string;
  body?: string;
  created_at: string;
  updated_at: string;
}

export interface LearnEntryImage {
  id: string;
  entry_id: string;
  storage_path: string;
  sort_order: number;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  emoji: string;
  message: string;
  sub_text?: string;
  is_read: boolean;
  related_entity_id?: string;
  created_at: string;
}

export interface Affirmation {
  id: string;
  category: AffirmationCategory;
  quote: string;
  is_active: boolean;
  created_at: string;
}

export interface AffirmationFavourite {
  id: string;
  user_id: string;
  affirmation_id: string;
  created_at: string;
}

export interface UserAffirmation {
  id: string;
  user_id: string;
  text: string;
  category: AffirmationCategory;
  is_active: boolean;
  created_at: string;
}

export interface Settings {
  id: string;
  user_id: string;
  currency: string;
  balance_visible: boolean;
  show_affirmations: boolean;
  daily_reminder_time: string;
  affirmation_category: string;
  notif_expense: boolean;
  notif_income: boolean;
  notif_transfer: boolean;
  notif_recurring: boolean;
  notif_alert: boolean;
  notif_tabung: boolean;
  notif_milestone: boolean;
  notif_asset: boolean;
  notif_cashflow: boolean;
  notif_affirmation: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomCategory {
  id: string;
  user_id: string;
  transaction_type: 'expense' | 'income';
  name: string;
  icon?: string;
  color?: string;
  is_active: boolean;
  created_at: string;
}
```

- [ ] **Step 2: Create `src/types/cashflow.types.ts`**

```typescript
import type { AssetType, LiabilityType, AffirmationCategory, FinancialIdentity } from './database.types';

export interface CashflowSummary {
  financial_class: 'rich' | 'middle' | 'poor';
  net_worth: number;
  passive_income: number;
  total_assets: number;
  total_liabilities: number;
  total_income: number;
  total_expenses: number;
  net_cash_flow: number;
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
}

export interface MonthlyTrend {
  month: string;
  income: number;
  expenses: number;
}

export interface AnalysisMonthly {
  income: number;
  expenses: number;
  net_savings: number;
  savings_rate: number;
  expense_by_category: CategoryBreakdown[];
  income_by_category: CategoryBreakdown[];
  monthly_trend: MonthlyTrend[];
}
```

- [ ] **Step 3: Create `src/types/index.ts`**

```typescript
export * from './database.types';
export * from './cashflow.types';
```

- [ ] **Step 4: Commit**

```bash
git add src/types/database.types.ts src/types/cashflow.types.ts src/types/index.ts
git commit -m "feat(types): add all database enums and table row types"
```

---

## Task 2: Supabase Client

### 2a: Create `src/lib/supabase.ts`

Check if `src/lib/supabase.ts` already exists. If not, create it:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

> **Note:** If an existing file already exports supabase client, reuse it. Do not duplicate.

- [ ] **Step 1: Check if file exists first**

Run: `ls src/lib/supabase.ts` (or equivalent) to check.

- [ ] **Step 2: Create or skip**

If file does not exist, create it. If it exists, note the path for use in repositories.

- [ ] **Step 3: Commit (only if created)**

```bash
git add src/lib/supabase.ts
git commit -m "feat(supabase): add Supabase client singleton"
```

---

## Task 3: Auth Repository

### 3a: Create `src/repositories/auth.repository.ts`

```typescript
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Result } from '../utils/result';
import type { SupabaseError } from '../utils/result';

export const authRepository = {
  async signUp(
    email: string,
    password: string,
    displayName: string
  ): Promise<Result<User, SupabaseError>> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    if (error) return { ok: false, error: { code: error.code, message: error.message } };
    if (!data.user) return { ok: false, error: { code: 'NO_USER', message: 'Sign up succeeded but no user returned' } };
    return { ok: true, data: data.user };
  },

  async signIn(email: string, password: string): Promise<Result<User, SupabaseError>> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: { code: error.code, message: error.message } };
    if (!data.user) return { ok: false, error: { code: 'NO_USER', message: 'Sign in succeeded but no user returned' } };
    return { ok: true, data: data.user };
  },

  async signInAnonymously(): Promise<Result<User, SupabaseError>> {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) return { ok: false, error: { code: error.code, message: error.message } };
    if (!data.user) return { ok: false, error: { code: 'NO_USER', message: 'Anonymous sign in succeeded but no user returned' } };
    return { ok: true, data: data.user };
  },

  async signOut(): Promise<Result<void, SupabaseError>> {
    const { error } = await supabase.auth.signOut();
    if (error) return { ok: false, error: { code: error.code, message: error.message } };
    return { ok: true, data: undefined };
  },

  async getSession(): Promise<Result<Session | null, SupabaseError>> {
    const { data, error } = await supabase.auth.getSession();
    if (error) return { ok: false, error: { code: error.code, message: error.message } };
    return { ok: true, data: data.session };
  },

  async getUser(): Promise<Result<User | null, SupabaseError>> {
    const { data, error } = await supabase.auth.getUser();
    if (error) return { ok: false, error: { code: error.code, message: error.message } };
    return { ok: true, data: data.user };
  },

  async refreshSession(): Promise<Result<Session, SupabaseError>> {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) return { ok: false, error: { code: error.code, message: error.message } };
    if (!data.session) return { ok: false, error: { code: 'NO_SESSION', message: 'Refresh returned no session' } };
    return { ok: true, data: data.session };
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add src/repositories/auth.repository.ts
git commit -m "feat(repositories): add auth repository"
```

---

## Task 4: Accounts Repository

### 4a: Create `src/repositories/accounts.repository.ts`

```typescript
import { supabase } from '../lib/supabase';
import type { Result } from '../utils/result';
import type { SupabaseError, fromSupabaseError } from '../utils/result';
import type {
  Account,
  BankAccount,
  TabungAccount,
  WalletAccount,
  AccountType,
} from '../types';

// Request types
export interface CreateBankAccountRequest {
  user_id: string;
  name: string;
  icon?: string;
  color?: string;
  bank_name: string;
  account_number?: string;
  opening_balance: number;
}

export interface CreateWalletAccountRequest {
  user_id: string;
  name: string;
  icon?: string;
  color?: string;
  opening_balance: number;
}

export interface CreateTabungAccountRequest {
  user_id: string;
  name: string;
  icon?: string;
  color?: string;
  target_amount: number;
  from_date: string;
  to_date: string;
  linked_bank_id?: string;
  description?: string;
  template_type?: string;
  auto_save?: boolean;
  monthly_amount?: number;
}

export const accountsRepository = {
  async fetchAllActive(): Promise<Result<Account[], SupabaseError>> {
    const { data, error } = await supabase
      .from('accounts')
      .select('*, bank_accounts(*), tabung_accounts(*), wallet_accounts(*)')
      .eq('is_active', true)
      .order('created_at');
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as Account[] };
  },

  async fetchById(id: string): Promise<Result<Account, SupabaseError>> {
    const { data, error } = await supabase
      .from('accounts')
      .select('*, bank_accounts(*), tabung_accounts(*), wallet_accounts(*)')
      .eq('id', id)
      .single();
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as Account };
  },

  async createBankAccount(req: CreateBankAccountRequest): Promise<Result<BankAccount, SupabaseError>> {
    // 1. Insert into accounts
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .insert({ user_id: req.user_id, type: 'bank', name: req.name, icon: req.icon, color: req.color })
      .select()
      .single();
    if (accountError) return { ok: false, error: fromSupabaseError(accountError) };

    // 2. Insert into bank_accounts
    const { data: bankAccount, error: bankError } = await supabase
      .from('bank_accounts')
      .insert({
        account_id: account.id,
        bank_name: req.bank_name,
        account_number: req.account_number,
        opening_balance: req.opening_balance,
        current_balance: req.opening_balance,
      })
      .select()
      .single();
    if (bankError) {
      // Rollback: delete the account row
      await supabase.from('accounts').delete().eq('id', account.id);
      return { ok: false, error: fromSupabaseError(bankError) };
    }

    return { ok: true, data: bankAccount };
  },

  async createWalletAccount(req: CreateWalletAccountRequest): Promise<Result<WalletAccount, SupabaseError>> {
    // 1. Insert into accounts
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .insert({ user_id: req.user_id, type: 'wallet', name: req.name, icon: req.icon, color: req.color })
      .select()
      .single();
    if (accountError) return { ok: false, error: fromSupabaseError(accountError) };

    // 2. Insert into wallet_accounts
    const { data: wallet, error: walletError } = await supabase
      .from('wallet_accounts')
      .insert({
        account_id: account.id,
        opening_balance: req.opening_balance,
        current_balance: req.opening_balance,
      })
      .select()
      .single();
    if (walletError) {
      await supabase.from('accounts').delete().eq('id', account.id);
      return { ok: false, error: fromSupabaseError(walletError) };
    }

    return { ok: true, data: wallet };
  },

  async createTabungAccount(req: CreateTabungAccountRequest): Promise<Result<TabungAccount, SupabaseError>> {
    // 1. Insert into accounts
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .insert({ user_id: req.user_id, type: 'tabung', name: req.name, icon: req.icon, color: req.color })
      .select()
      .single();
    if (accountError) return { ok: false, error: fromSupabaseError(accountError) };

    // 2. Insert into tabung_accounts
    const { data: tabung, error: tabungError } = await supabase
      .from('tabung_accounts')
      .insert({
        account_id: account.id,
        target_amount: req.target_amount,
        saved_amount: 0,
        from_date: req.from_date,
        to_date: req.to_date,
        linked_bank_id: req.linked_bank_id,
        description: req.description,
        icon: req.icon,
        color: req.color,
        template_type: req.template_type,
        auto_save: req.auto_save ?? false,
      })
      .select()
      .single();
    if (tabungError) {
      await supabase.from('accounts').delete().eq('id', account.id);
      return { ok: false, error: fromSupabaseError(tabungError) };
    }

    return { ok: true, data: tabung };
  },

  async updateAccount(id: string, patch: Partial<Account>): Promise<Result<Account, SupabaseError>> {
    const { data, error } = await supabase
      .from('accounts')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as Account };
  },

  async softDeleteAccount(id: string): Promise<Result<void, SupabaseError>> {
    const { error } = await supabase
      .from('accounts')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: undefined };
  },

  async updateBankBalance(accountId: string, newBalance: number): Promise<Result<void, SupabaseError>> {
    const { error } = await supabase
      .from('bank_accounts')
      .update({ current_balance: newBalance })
      .eq('account_id', accountId);
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: undefined };
  },

  async updateWalletBalance(accountId: string, newBalance: number): Promise<Result<void, SupabaseError>> {
    const { error } = await supabase
      .from('wallet_accounts')
      .update({ current_balance: newBalance })
      .eq('account_id', accountId);
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: undefined };
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add src/repositories/accounts.repository.ts
git commit -m "feat(repositories): add accounts repository with composite operations"
```

---

## Task 5: Transactions Repository

### 5a: Create `src/repositories/transactions.repository.ts`

```typescript
import { supabase } from '../lib/supabase';
import type { Result } from '../utils/result';
import type { SupabaseError, fromSupabaseError } from '../utils/result';
import type { Transaction, TransactionDetail, TransactionType } from '../types';

export interface CreateTransactionRequest {
  user_id: string;
  type: TransactionType;
  name: string;
  amount: number;
  category?: string;
  from_account_id?: string;
  to_account_id?: string;
  date: string;
  note?: string;
  receipt_url?: string;
  is_recurring?: boolean;
  recurring_id?: string;
}

export const transactionsRepository = {
  async fetchByMonth(year: number, month: number): Promise<Result<Transaction[], SupabaseError>> {
    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const end = new Date(year, month, 0).toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('transactions')
      .select()
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: false });
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as Transaction[] };
  },

  async fetchByAccount(accountId: string): Promise<Result<Transaction[], SupabaseError>> {
    const { data, error } = await supabase
      .from('transactions')
      .select()
      .or(`from_account_id.eq.${accountId},to_account_id.eq.${accountId}`)
      .order('date', { ascending: false });
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as Transaction[] };
  },

  async fetchDetail(id: string): Promise<Result<TransactionDetail, SupabaseError>> {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        from_account:accounts!from_account_id(id, name, type),
        to_account:accounts!to_account_id(id, name, type),
        recurring:recurring_rules(frequency, start_date, end_date, reminder_enabled)
      `)
      .eq('id', id)
      .single();
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as TransactionDetail };
  },

  async create(req: CreateTransactionRequest): Promise<Result<Transaction, SupabaseError>> {
    // 1. Insert transaction
    const { data: tx, error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id: req.user_id,
        type: req.type,
        name: req.name,
        amount: req.amount,
        category: req.category,
        from_account_id: req.from_account_id,
        to_account_id: req.to_account_id,
        date: req.date,
        note: req.note,
        receipt_url: req.receipt_url,
        is_recurring: req.is_recurring ?? false,
        recurring_id: req.recurring_id,
      })
      .select()
      .single();
    if (txError) return { ok: false, error: fromSupabaseError(txError) };

    // 2. If tabung_topup or tabung_withdraw, update saved_amount on the target tabung account
    if (req.type === 'tabung_topup' && req.to_account_id) {
      const { data: tabung } = await supabase
        .from('tabung_accounts')
        .select('saved_amount')
        .eq('account_id', req.to_account_id)
        .single();
      if (tabung) {
        await supabase
          .from('tabung_accounts')
          .update({ saved_amount: tabung.saved_amount + req.amount })
          .eq('account_id', req.to_account_id);
      }
    } else if (req.type === 'tabung_withdraw' && req.to_account_id) {
      const { data: tabung } = await supabase
        .from('tabung_accounts')
        .select('saved_amount')
        .eq('account_id', req.to_account_id)
        .single();
      if (tabung) {
        await supabase
          .from('tabung_accounts')
          .update({ saved_amount: tabung.saved_amount - req.amount })
          .eq('account_id', req.to_account_id);
      }
    }

    return { ok: true, data: tx as Transaction };
  },

  async update(id: string, patch: Partial<Transaction>): Promise<Result<Transaction, SupabaseError>> {
    const { data, error } = await supabase
      .from('transactions')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as Transaction };
  },

  async delete(id: string): Promise<Result<void, SupabaseError>> {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: undefined };
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add src/repositories/transactions.repository.ts
git commit -m "feat(repositories): add transactions repository with tabung saved_amount update"
```

---

## Task 6: Recurring Repository

### 6a: Create `src/repositories/recurring.repository.ts`

```typescript
import { supabase } from '../lib/supabase';
import type { Result } from '../utils/result';
import type { SupabaseError, fromSupabaseError } from '../utils/result';
import type { RecurringRule, RecurringStatus, RecurringFrequency } from '../types';

export interface CreateRecurringRuleRequest {
  user_id: string;
  type: 'expense' | 'income';
  name: string;
  amount: number;
  category?: string;
  from_account_id?: string;
  to_account_id?: string;
  frequency: RecurringFrequency;
  start_date: string;
  end_date?: string;
  next_date?: string;
  reminder_enabled?: boolean;
  reminder_offset?: 'none' | 'same_day' | '1_day' | '3_days' | '1_week';
  status?: RecurringStatus;
}

export const recurringRepository = {
  async fetchAllActive(): Promise<Result<RecurringRule[], SupabaseError>> {
    const { data, error } = await supabase
      .from('recurring_rules')
      .select()
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as RecurringRule[] };
  },

  async create(req: CreateRecurringRuleRequest): Promise<Result<RecurringRule, SupabaseError>> {
    const { data, error } = await supabase
      .from('recurring_rules')
      .insert({
        user_id: req.user_id,
        type: req.type,
        name: req.name,
        amount: req.amount,
        category: req.category,
        from_account_id: req.from_account_id,
        to_account_id: req.to_account_id,
        frequency: req.frequency,
        start_date: req.start_date,
        end_date: req.end_date,
        next_date: req.next_date ?? req.start_date,
        reminder_enabled: req.reminder_enabled ?? false,
        reminder_offset: req.reminder_offset ?? 'none',
        status: req.status ?? 'active',
      })
      .select()
      .single();
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as RecurringRule };
  },

  async updateStatus(id: string, status: RecurringStatus): Promise<Result<void, SupabaseError>> {
    const { error } = await supabase
      .from('recurring_rules')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: undefined };
  },

  async delete(id: string): Promise<Result<void, SupabaseError>> {
    const { error } = await supabase.from('recurring_rules').delete().eq('id', id);
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: undefined };
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add src/repositories/recurring.repository.ts
git commit -m "feat(repositories): add recurring repository"
```

---

## Task 7: Assets & Liabilities Repositories

### 7a: Create `src/repositories/assets.repository.ts`

```typescript
import { supabase } from '../lib/supabase';
import type { Result } from '../utils/result';
import type { SupabaseError, fromSupabaseError } from '../utils/result';
import type { Asset, AssetType } from '../types';

export interface CreateAssetRequest {
  user_id: string;
  name: string;
  type: AssetType;
  icon?: string;
  current_value: number;
  monthly_income?: number;
  date_acquired?: string;
  note?: string;
}

export const assetsRepository = {
  async fetchAll(): Promise<Result<Asset[], SupabaseError>> {
    const { data, error } = await supabase
      .from('assets')
      .select()
      .eq('is_active', true)
      .order('current_value', { ascending: false });
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as Asset[] };
  },

  async create(req: CreateAssetRequest): Promise<Result<Asset, SupabaseError>> {
    const { data, error } = await supabase
      .from('assets')
      .insert({
        user_id: req.user_id,
        name: req.name,
        type: req.type,
        icon: req.icon,
        current_value: req.current_value,
        monthly_income: req.monthly_income ?? 0,
        date_acquired: req.date_acquired,
        note: req.note,
      })
      .select()
      .single();
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as Asset };
  },

  async update(id: string, patch: Partial<Asset>): Promise<Result<Asset, SupabaseError>> {
    const { data, error } = await supabase
      .from('assets')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as Asset };
  },

  async softDelete(id: string): Promise<Result<void, SupabaseError>> {
    const { error } = await supabase
      .from('assets')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: undefined };
  },
};
```

### 7b: Create `src/repositories/liabilities.repository.ts`

```typescript
import { supabase } from '../lib/supabase';
import type { Result } from '../utils/result';
import type { SupabaseError, fromSupabaseError } from '../utils/result';
import type { Liability, LiabilityType } from '../types';

export interface CreateLiabilityRequest {
  user_id: string;
  name: string;
  type: LiabilityType;
  icon?: string;
  amount_owed: number;
  monthly_payment: number;
  interest_rate?: number;
  note?: string;
}

export const liabilitiesRepository = {
  async fetchAll(): Promise<Result<Liability[], SupabaseError>> {
    const { data, error } = await supabase
      .from('liabilities')
      .select()
      .eq('is_active', true)
      .order('amount_owed', { ascending: false });
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as Liability[] };
  },

  async create(req: CreateLiabilityRequest): Promise<Result<Liability, SupabaseError>> {
    const { data, error } = await supabase
      .from('liabilities')
      .insert({
        user_id: req.user_id,
        name: req.name,
        type: req.type,
        icon: req.icon,
        amount_owed: req.amount_owed,
        monthly_payment: req.monthly_payment,
        interest_rate: req.interest_rate ?? 0,
        note: req.note,
      })
      .select()
      .single();
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as Liability };
  },

  async update(id: string, patch: Partial<Liability>): Promise<Result<Liability, SupabaseError>> {
    const { data, error } = await supabase
      .from('liabilities')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as Liability };
  },

  async softDelete(id: string): Promise<Result<void, SupabaseError>> {
    const { error } = await supabase
      .from('liabilities')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: undefined };
  },
};
```

- [ ] **Step 3: Commit**

```bash
git add src/repositories/assets.repository.ts src/repositories/liabilities.repository.ts
git commit -m "feat(repositories): add assets and liabilities repositories"
```

---

## Task 8: Learn Repository

### 8a: Create `src/repositories/learn.repository.ts`

```typescript
import { supabase } from '../lib/supabase';
import type { Result } from '../utils/result';
import type { SupabaseError, fromSupabaseError } from '../utils/result';
import type { LearnProject, LearnEntry, LearnEntryImage } from '../types';

export const learnRepository = {
  async createProject(userId: string, name: string): Promise<Result<LearnProject, SupabaseError>> {
    const { data, error } = await supabase
      .from('learn_projects')
      .insert({ user_id: userId, name })
      .select()
      .single();
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as LearnProject };
  },

  async renameProject(id: string, name: string): Promise<Result<void, SupabaseError>> {
    const { error } = await supabase
      .from('learn_projects')
      .update({ name, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: undefined };
  },

  async deleteProject(id: string): Promise<Result<void, SupabaseError>> {
    // Cascade is handled by DB foreign key (ON DELETE CASCADE)
    const { error } = await supabase.from('learn_projects').delete().eq('id', id);
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: undefined };
  },

  async fetchEntries(projectId: string): Promise<Result<LearnEntry[], SupabaseError>> {
    const { data, error } = await supabase
      .from('learn_entries')
      .select('*, learn_entry_images(*)')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as LearnEntry[] };
  },

  async createEntry(projectId: string, userId: string, body: string): Promise<Result<LearnEntry, SupabaseError>> {
    const { data, error } = await supabase
      .from('learn_entries')
      .insert({ project_id: projectId, user_id: userId, body })
      .select()
      .single();
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as LearnEntry };
  },

  async updateEntry(id: string, body: string): Promise<Result<LearnEntry, SupabaseError>> {
    const { data, error } = await supabase
      .from('learn_entries')
      .update({ body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as LearnEntry };
  },

  async deleteEntry(id: string): Promise<Result<void, SupabaseError>> {
    const { error } = await supabase.from('learn_entries').delete().eq('id', id);
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: undefined };
  },

  async attachImage(entryId: string, storagePath: string): Promise<Result<LearnEntryImage, SupabaseError>> {
    const { data, error } = await supabase
      .from('learn_entry_images')
      .insert({ entry_id: entryId, storage_path: storagePath })
      .select()
      .single();
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as LearnEntryImage };
  },

  async removeImage(imageId: string): Promise<Result<void, SupabaseError>> {
    const { error } = await supabase.from('learn_entry_images').delete().eq('id', imageId);
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: undefined };
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add src/repositories/learn.repository.ts
git commit -m "feat(repositories): add learn repository for projects, entries, images"
```

---

## Task 9: Notifications, Affirmations, Settings, CustomCategories Repositories

### 9a: Create `src/repositories/notifications.repository.ts`

```typescript
import { supabase } from '../lib/supabase';
import type { Result } from '../utils/result';
import type { SupabaseError, fromSupabaseError } from '../utils/result';
import type { Notification } from '../types';

export const notificationsRepository = {
  async fetchAll(): Promise<Result<Notification[], SupabaseError>> {
    const { data, error } = await supabase
      .from('notifications')
      .select()
      .order('created_at', { ascending: false });
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as Notification[] };
  },

  async getUnreadCount(): Promise<Result<number, SupabaseError>> {
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('is_read', false);
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: count ?? 0 };
  },

  async create(notif: Omit<Notification, 'id' | 'created_at'>): Promise<Result<Notification, SupabaseError>> {
    const { data, error } = await supabase.from('notifications').insert(notif).select().single();
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as Notification };
  },

  async markAsRead(id: string): Promise<Result<void, SupabaseError>> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: undefined };
  },

  async markAllRead(userId: string): Promise<Result<void, SupabaseError>> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: undefined };
  },

  async delete(id: string): Promise<Result<void, SupabaseError>> {
    const { error } = await supabase.from('notifications').delete().eq('id', id);
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: undefined };
  },
};
```

### 9b: Create `src/repositories/affirmations.repository.ts`

```typescript
import { supabase } from '../lib/supabase';
import type { Result } from '../utils/result';
import type { SupabaseError, fromSupabaseError } from '../utils/result';
import type { Affirmation, AffirmationFavourite, UserAffirmation, AffirmationCategory } from '../types';

export const affirmationsRepository = {
  async fetchActive(): Promise<Result<Affirmation[], SupabaseError>> {
    const { data, error } = await supabase
      .from('affirmations')
      .select()
      .eq('is_active', true);
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as Affirmation[] };
  },

  async fetchByCategory(category: AffirmationCategory): Promise<Result<Affirmation[], SupabaseError>> {
    const { data, error } = await supabase
      .from('affirmations')
      .select()
      .eq('is_active', true)
      .eq('category', category);
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as Affirmation[] };
  },

  async fetchFavourites(userId: string): Promise<Result<AffirmationFavourite[], SupabaseError>> {
    const { data, error } = await supabase
      .from('affirmation_favourites')
      .select('*, affirmations(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as AffirmationFavourite[] };
  },

  async addFavourite(userId: string, affirmationId: string): Promise<Result<AffirmationFavourite, SupabaseError>> {
    const { data, error } = await supabase
      .from('affirmation_favourites')
      .insert({ user_id: userId, affirmation_id: affirmationId })
      .select()
      .single();
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as AffirmationFavourite };
  },

  async removeFavourite(userId: string, affirmationId: string): Promise<Result<void, SupabaseError>> {
    const { error } = await supabase
      .from('affirmation_favourites')
      .delete()
      .eq('user_id', userId)
      .eq('affirmation_id', affirmationId);
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: undefined };
  },

  async fetchUserAffirmations(userId: string): Promise<Result<UserAffirmation[], SupabaseError>> {
    const { data, error } = await supabase
      .from('user_affirmations')
      .select()
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as UserAffirmation[] };
  },

  async addUserAffirmation(userId: string, text: string, category: AffirmationCategory): Promise<Result<UserAffirmation, SupabaseError>> {
    const { data, error } = await supabase
      .from('user_affirmations')
      .insert({ user_id: userId, text, category })
      .select()
      .single();
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as UserAffirmation };
  },

  async removeUserAffirmation(id: string): Promise<Result<void, SupabaseError>> {
    const { error } = await supabase
      .from('user_affirmations')
      .update({ is_active: false })
      .eq('id', id);
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: undefined };
  },
};
```

### 9c: Create `src/repositories/settings.repository.ts`

```typescript
import { supabase } from '../lib/supabase';
import type { Result } from '../utils/result';
import type { SupabaseError, fromSupabaseError } from '../utils/result';
import type { Settings } from '../types';

export const settingsRepository = {
  async fetch(userId: string): Promise<Result<Settings, SupabaseError>> {
    const { data, error } = await supabase
      .from('settings')
      .select()
      .eq('user_id', userId)
      .single();
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as Settings };
  },

  async create(userId: string): Promise<Result<Settings, SupabaseError>> {
    const { data, error } = await supabase
      .from('settings')
      .insert({ user_id: userId })
      .select()
      .single();
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as Settings };
  },

  async update(userId: string, patch: Partial<Settings>): Promise<Result<Settings, SupabaseError>> {
    const { data, error } = await supabase
      .from('settings')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select()
      .single();
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as Settings };
  },
};
```

### 9d: Create `src/repositories/customCategories.repository.ts`

```typescript
import { supabase } from '../lib/supabase';
import type { Result } from '../utils/result';
import type { SupabaseError, fromSupabaseError } from '../utils/result';
import type { CustomCategory } from '../types';

export const customCategoriesRepository = {
  async fetchAll(userId: string): Promise<Result<CustomCategory[], SupabaseError>> {
    const { data, error } = await supabase
      .from('custom_categories')
      .select()
      .eq('user_id', userId)
      .eq('is_active', true);
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as CustomCategory[] };
  },

  async create(req: Omit<CustomCategory, 'id' | 'created_at' | 'is_active'>): Promise<Result<CustomCategory, SupabaseError>> {
    const { data, error } = await supabase.from('custom_categories').insert(req).select().single();
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as CustomCategory };
  },

  async softDelete(id: string): Promise<Result<void, SupabaseError>> {
    const { error } = await supabase
      .from('custom_categories')
      .update({ is_active: false })
      .eq('id', id);
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: undefined };
  },
};
```

- [ ] **Step 5: Create `src/repositories/index.ts`**

```typescript
export { authRepository } from './auth.repository';
export { accountsRepository } from './accounts.repository';
export { transactionsRepository } from './transactions.repository';
export { recurringRepository } from './recurring.repository';
export { assetsRepository } from './assets.repository';
export { liabilitiesRepository } from './liabilities.repository';
export { learnRepository } from './learn.repository';
export { notificationsRepository } from './notifications.repository';
export { affirmationsRepository } from './affirmations.repository';
export { settingsRepository } from './settings.repository';
export { customCategoriesRepository } from './customCategories.repository';
```

- [ ] **Step 6: Commit**

```bash
git add src/repositories/notifications.repository.ts src/repositories/affirmations.repository.ts src/repositories/settings.repository.ts src/repositories/customCategories.repository.ts src/repositories/index.ts
git commit -m "feat(repositories): add notifications, affirmations, settings, customCategories repos + index"
```

---

## Task 10: Services — Edge Functions & Storage

### 10a: Create `src/services/edgeFunctions.ts`

```typescript
import { supabase } from '../lib/supabase';
import type { Result } from '../utils/result';
import type { EdgeFunctionError } from '../utils/result';
import type { CashflowSummary, AnalysisMonthly } from '../types';

export const edgeFunctionsService = {
  async getCashflowSummary(month: string): Promise<Result<CashflowSummary, EdgeFunctionError>> {
    const { data, error } = await supabase.functions.invoke('cashflow-summary', {
      body: { month },
    });
    if (error) return { ok: false, error: { message: error.message, code: error.code } };
    return { ok: true, data: data as CashflowSummary };
  },

  async getAnalysis(month: string): Promise<Result<AnalysisMonthly, EdgeFunctionError>> {
    const { data, error } = await supabase.functions.invoke('analysis-monthly', {
      body: { month },
    });
    if (error) return { ok: false, error: { message: error.message, code: error.code } };
    return { ok: true, data: data as AnalysisMonthly };
  },
};
```

### 10b: Create `src/services/storage.ts`

```typescript
import { decode } from 'base64-arraybuffer';
import { supabase } from '../lib/supabase';
import type { Result } from '../utils/result';
import type { SupabaseError } from '../utils/result';

export const storageService = {
  // Avatars
  async uploadAvatar(userId: string, base64Image: string): Promise<Result<string, SupabaseError>> {
    const path = `${userId}/avatar.jpg`;
    const { error } = await supabase.storage
      .from('avatars')
      .upload(path, decode(base64Image), { contentType: 'image/jpeg', upsert: true });
    if (error) return { ok: false, error: { code: error.code, message: error.message } };
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    return { ok: true, data: data.publicUrl };
  },

  async deleteAvatar(userId: string): Promise<Result<void, SupabaseError>> {
    const { error } = await supabase.storage.from('avatars').remove([`${userId}/avatar.jpg`]);
    if (error) return { ok: false, error: { code: error.code, message: error.message } };
    return { ok: true, data: undefined };
  },

  // Receipts (private bucket — use signed URL)
  async uploadReceipt(userId: string, transactionId: string, base64Image: string): Promise<Result<string, SupabaseError>> {
    const path = `${userId}/${transactionId}.jpg`;
    const { error } = await supabase.storage
      .from('receipts')
      .upload(path, decode(base64Image), { contentType: 'image/jpeg' });
    if (error) return { ok: false, error: { code: error.code, message: error.message } };
    const { data, error: urlError } = await supabase.storage.from('receipts').createSignedUrl(path, 60 * 60);
    if (urlError) return { ok: false, error: { code: urlError.code, message: urlError.message } };
    return { ok: true, data: data.signedUrl };
  },

  async deleteReceipt(path: string): Promise<Result<void, SupabaseError>> {
    const { error } = await supabase.storage.from('receipts').remove([path]);
    if (error) return { ok: false, error: { code: error.code, message: error.message } };
    return { ok: true, data: undefined };
  },

  // Learn Images (private bucket — use signed URL)
  async uploadLearnImage(userId: string, entryId: string, imageId: string, base64Image: string): Promise<Result<string, SupabaseError>> {
    const path = `${userId}/${entryId}/${imageId}.jpg`;
    const { error } = await supabase.storage
      .from('learn-images')
      .upload(path, decode(base64Image), { contentType: 'image/jpeg' });
    if (error) return { ok: false, error: { code: error.code, message: error.message } };
    const { data, error: urlError } = await supabase.storage.from('learn-images').createSignedUrl(path, 60 * 60);
    if (urlError) return { ok: false, error: { code: urlError.code, message: urlError.message } };
    return { ok: true, data: data.signedUrl };
  },

  async deleteLearnImage(path: string): Promise<Result<void, SupabaseError>> {
    const { error } = await supabase.storage.from('learn-images').remove([path]);
    if (error) return { ok: false, error: { code: error.code, message: error.message } };
    return { ok: true, data: undefined };
  },
};
```

### 10c: Create `src/services/index.ts`

```typescript
export { edgeFunctionsService } from './edgeFunctions';
export { storageService } from './storage';
```

- [ ] **Step 4: Commit**

```bash
git add src/services/edgeFunctions.ts src/services/storage.ts src/services/index.ts
git commit -m "feat(services): add edge functions and storage service wrappers"
```

---

## Task 11: Hooks

### 11a: Create `src/hooks/useAuth.ts`

```typescript
import { useState, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { authRepository } from '../repositories/auth.repository';
import type { SupabaseError } from '../utils/result';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<SupabaseError | null>(null);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await authRepository.getUser();
    if (result.ok) setUser(result.data);
    else setError(result.error);
    setLoading(false);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    const result = await authRepository.signIn(email, password);
    if (result.ok) setUser(result.data);
    else setError(result.error);
    setLoading(false);
    return result;
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    const result = await authRepository.signOut();
    if (result.ok) setUser(null);
    setLoading(false);
    return result;
  }, []);

  return { user, loading, error, fetchUser, signIn, signOut };
}
```

### 11b: Create `src/hooks/useAccounts.ts`

```typescript
import { useState, useCallback } from 'react';
import { accountsRepository, CreateBankAccountRequest, CreateWalletAccountRequest, CreateTabungAccountRequest } from '../repositories/accounts.repository';
import type { Account, BankAccount, WalletAccount, TabungAccount } from '../types';
import type { SupabaseError } from '../utils/result';

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<SupabaseError | null>(null);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await accountsRepository.fetchAllActive();
    if (result.ok) setAccounts(result.data);
    else setError(result.error);
    setLoading(false);
  }, []);

  const createBankAccount = useCallback(async (req: CreateBankAccountRequest) => {
    setLoading(true);
    setError(null);
    const result = await accountsRepository.createBankAccount(req);
    if (result.ok) await fetchAccounts();
    else setError(result.error);
    setLoading(false);
    return result;
  }, [fetchAccounts]);

  const createWalletAccount = useCallback(async (req: CreateWalletAccountRequest) => {
    setLoading(true);
    setError(null);
    const result = await accountsRepository.createWalletAccount(req);
    if (result.ok) await fetchAccounts();
    else setError(result.error);
    setLoading(false);
    return result;
  }, [fetchAccounts]);

  const createTabungAccount = useCallback(async (req: CreateTabungAccountRequest) => {
    setLoading(true);
    setError(null);
    const result = await accountsRepository.createTabungAccount(req);
    if (result.ok) await fetchAccounts();
    else setError(result.error);
    setLoading(false);
    return result;
  }, [fetchAccounts]);

  return { accounts, loading, error, fetchAccounts, createBankAccount, createWalletAccount, createTabungAccount };
}
```

### 11c: Create `src/hooks/useTransactions.ts`

```typescript
import { useState, useEffect, useCallback } from 'react';
import { transactionsRepository, CreateTransactionRequest } from '../repositories/transactions.repository';
import type { Transaction, TransactionDetail } from '../types';
import type { SupabaseError } from '../utils/result';

export function useTransactions(year: number, month: number) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<SupabaseError | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await transactionsRepository.fetchByMonth(year, month);
    if (result.ok) setTransactions(result.data);
    else setError(result.error);
    setLoading(false);
  }, [year, month]);

  useEffect(() => { fetch(); }, [fetch]);

  const expenses = transactions.filter(t => t.type === 'expense');
  const income = transactions.filter(t => t.type === 'income');

  const create = useCallback(async (req: CreateTransactionRequest) => {
    setLoading(true);
    setError(null);
    const result = await transactionsRepository.create(req);
    if (result.ok) await fetch();
    else setError(result.error);
    setLoading(false);
    return result;
  }, [fetch]);

  return { transactions, expenses, income, loading, error, refetch: fetch, create };
}
```

### 11d: Create `src/hooks/useCashflow.ts`

```typescript
import { useState, useEffect } from 'react';
import { edgeFunctionsService } from '../services/edgeFunctions';
import type { CashflowSummary } from '../types';
import type { EdgeFunctionError } from '../utils/result';

export function useCashflow(month: string) {
  const [summary, setSummary] = useState<CashflowSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<EdgeFunctionError | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    edgeFunctionsService.getCashflowSummary(month).then(result => {
      if (result.ok) setSummary(result.data);
      else setError(result.error);
      setLoading(false);
    });
  }, [month]);

  return { summary, loading, error };
}
```

### 11e: Create `src/hooks/useAnalysis.ts`

```typescript
import { useState, useEffect } from 'react';
import { edgeFunctionsService } from '../services/edgeFunctions';
import type { AnalysisMonthly } from '../types';
import type { EdgeFunctionError } from '../utils/result';

export function useAnalysis(month: string) {
  const [analysis, setAnalysis] = useState<AnalysisMonthly | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<EdgeFunctionError | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    edgeFunctionsService.getAnalysis(month).then(result => {
      if (result.ok) setAnalysis(result.data);
      else setError(result.error);
      setLoading(false);
    });
  }, [month]);

  return { analysis, loading, error };
}
```

### 11f: Create remaining hooks

`src/hooks/useAssets.ts`, `src/hooks/useLiabilities.ts`, `src/hooks/useLearn.ts`, `src/hooks/useNotifications.ts`, `src/hooks/useSettings.ts`, `src/hooks/useRecurring.ts`, `src/hooks/useAffirmations.ts`, `src/hooks/useCustomCategories.ts`

Each follows the same pattern as `useAccounts` — wraps the corresponding repository, exposes loading/error state + async methods.

```typescript
// Example skeleton for useAssets.ts
import { useState, useCallback } from 'react';
import { assetsRepository, CreateAssetRequest } from '../repositories/assets.repository';
import type { Asset } from '../types';
import type { SupabaseError } from '../utils/result';

export function useAssets() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<SupabaseError | null>(null);

  const fetchAssets = useCallback(async () => {
    setLoading(true); setError(null);
    const result = await assetsRepository.fetchAll();
    if (result.ok) setAssets(result.data);
    else setError(result.error);
    setLoading(false);
  }, []);

  const createAsset = useCallback(async (req: CreateAssetRequest) => {
    setLoading(true); setError(null);
    const result = await assetsRepository.create(req);
    if (result.ok) await fetchAssets();
    else setError(result.error);
    setLoading(false);
    return result;
  }, [fetchAssets]);

  return { assets, loading, error, fetchAssets, createAsset };
}
```

### 11g: Create `src/hooks/index.ts`

```typescript
export { useAuth } from './useAuth';
export { useAccounts } from './useAccounts';
export { useTransactions } from './useTransactions';
export { useCashflow } from './useCashflow';
export { useAnalysis } from './useAnalysis';
export { useAssets } from './useAssets';
export { useLiabilities } from './useLiabilities';
export { useLearn } from './useLearn';
export { useNotifications } from './useNotifications';
export { useSettings } from './useSettings';
export { useRecurring } from './useRecurring';
export { useAffirmations } from './useAffirmations';
export { useCustomCategories } from './useCustomCategories';
```

- [ ] **Step 8: Commit**

```bash
git add src/hooks/*.ts src/hooks/index.ts
git commit -m "feat(hooks): add all React hooks for data access"
```

---

## Spec Coverage Check

| Spec Section | Task |
|---|---|
| Directory structure | Tasks 1–11 |
| Error handling (Result<T,E>) | Task 1a |
| All enum + row types | Task 1b |
| CashflowSummary + AnalysisMonthly types | Task 1b |
| All 11 repositories | Tasks 3–9 |
| Edge functions service | Task 10a |
| Storage service | Task 10b |
| All hooks | Task 11 |
| Index re-exports | Tasks 1b, 9e, 10c, 11g |

No gaps found. All spec requirements are covered by a task.

---

*Plan for Flowe typed Supabase service layer · React Native (Expo) + Supabase*