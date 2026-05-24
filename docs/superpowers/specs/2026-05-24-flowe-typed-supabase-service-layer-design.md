# Flowe — Typed Supabase Service Layer Design

**Author:** Claude Code
**Date:** 2026-05-24
**Status:** Approved

---

## 1. Overview

Build a typed Supabase client service layer for the Flowe React Native app (Expo). The layer sits between the existing screen components and the raw Supabase SDK, providing consistent TypeScript types, error handling, and React hooks for every data domain.

---

## 2. Directory Structure

```
src/
├── lib/
│   └── supabase.ts                    # Supabase client singleton
│
├── types/
│   ├── database.types.ts              # All enums + table row types
│   ├── cashflow.types.ts             # Edge function request/response types
│   └── index.ts
│
├── utils/
│   └── result.ts                     # Result<T, E> type for error handling
│
├── repositories/                      # DB CRUD only — no React, no hooks
│   ├── auth.repository.ts
│   ├── accounts.repository.ts         # Bank + Wallet + Tabung composite ops
│   ├── transactions.repository.ts
│   ├── recurring.repository.ts
│   ├── assets.repository.ts
│   ├── liabilities.repository.ts
│   ├── learn.repository.ts            # projects + entries + images
│   ├── notifications.repository.ts
│   ├── affirmations.repository.ts
│   ├── settings.repository.ts
│   ├── customCategories.repository.ts
│   └── index.ts
│
├── services/                          # Edge functions + storage
│   ├── edgeFunctions.ts               # cashflow-summary + analysis-monthly
│   ├── storage.ts                     # avatars / receipts / learn-images
│   └── index.ts
│
└── hooks/                             # Thin wrappers — loading/error state
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
    └── index.ts
```

---

## 3. Error Handling

Every repository and service method returns `Result<T, E>`. Errors are values, never thrown.

```typescript
// src/utils/result.ts
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

function fromSupabaseError(err: any): SupabaseError {
  return {
    code: err?.code ?? 'UNKNOWN',
    message: err?.message ?? 'An unknown error occurred',
    details: err?.details,
    hint: err?.hint,
  };
}
```

**Pattern in repositories:**
- Never `throw` — return `{ ok: false, error }` on failure
- On composite operations (e.g. `createBankAccount` → insert to `accounts` then `bank_accounts`), rollback the previous insert if the second fails

**Pattern in hooks:**
- `loading: boolean` — true while async operation in flight
- `error: SupabaseError | null` — set when operation fails
- `refetch()` — manual refresh function on each hook
- Screens check `result.ok` before accessing `result.data`

---

## 4. Type Definitions

### Enums (`src/types/database.types.ts`)

```typescript
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
```

### Table Row Types

Full TypeScript interfaces for: `Profile`, `AuthConfig`, `Account`, `BankAccount`, `TabungAccount`, `WalletAccountFull`, `Transaction`, `TransactionDetail`, `RecurringRule`, `Asset`, `Liability`, `LearnProject`, `LearnEntry`, `LearnEntryImage`, `Notification`, `Affirmation`, `AffirmationFavourite`, `UserAffirmation`, `Settings`, `CustomCategory`.

Plus composite types: `BankAccountFull extends Account`, `TabungAccountFull extends Account`, `WalletAccountFull extends Account`.

### Edge Function Types (`src/types/cashflow.types.ts`)

```typescript
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

export interface AnalysisMonthly {
  income: number;
  expenses: number;
  net_savings: number;
  savings_rate: number;
  expense_by_category: Array<{ category: string; amount: number; percentage: number }>;
  income_by_category: Array<{ category: string; amount: number; percentage: number }>;
  monthly_trend: Array<{ month: string; income: number; expenses: number }>;
}
```

---

## 5. Repository Layer

All methods return `Promise<Result<T, SupabaseError>>`. No throwing. Composite operations handle their own rollback.

### auth.repository.ts
```
signUp(email, password, displayName) → Result<User>
signIn(email, password) → Result<User>
signInAnonymously() → Result<User>
signOut() → Result<void>
getSession() → Result<Session | null>
getUser() → Result<User | null>
refreshSession() → Result<Session>
```

### accounts.repository.ts
```
fetchAllActive() → Result<Account[]>
fetchById(id) → Result<Account>
createBankAccount(req) → Result<BankAccount>   // insert accounts + bank_accounts
createWalletAccount(req) → Result<WalletAccount>
createTabungAccount(req) → Result<TabungAccount>  // + optionally create recurring_rule if auto_save
updateAccount(id, patch) → Result<Account>
softDeleteAccount(id) → Result<void>
updateBankBalance(accountId, newBalance) → Result<void>
```

### transactions.repository.ts
```
fetchByMonth(year, month) → Result<Transaction[]>
fetchByAccount(accountId) → Result<Transaction[]>
fetchDetail(id) → Result<TransactionDetail>   // joins accounts + recurring_rules
create(req) → Result<Transaction>              // handles tabung_topup/withdraw saved_amount update
update(id, patch) → Result<Transaction>
delete(id) → Result<void>
```

### recurring.repository.ts
```
fetchAllActive() → Result<RecurringRule[]>
create(rule) → Result<RecurringRule>
updateStatus(id, status) → Result<void>
delete(id) → Result<void>
```

### assets.repository.ts / liabilities.repository.ts
```
fetchAll() → Result<Asset[] | Liability[]>
create(req) → Result<Asset | Liability>
update(id, patch) → Result<Asset | Liability>
softDelete(id) → Result<void>
```

### learn.repository.ts
```
createProject(name) → Result<LearnProject>
renameProject(id, name) → Result<void>
deleteProject(id) → Result<void>           // cascades to entries + images

fetchEntries(projectId) → Result<LearnEntry[]>
createEntry(projectId, body) → Result<LearnEntry>
updateEntry(id, body) → Result<LearnEntry>
deleteEntry(id) → Result<void>

attachImage(entryId, storagePath) → Result<LearnEntryImage>
removeImage(imageId) → Result<void>
```

### notifications.repository.ts / affirmations.repository.ts / settings.repository.ts / customCategories.repository.ts
Standard CRUD: `fetchAll`, `create`, `update`, `softDelete`, `delete`.

---

## 6. Services Layer

### edgeFunctions.ts

```typescript
export const edgeFunctionsService = {
  async getCashflowSummary(month: string): Promise<Result<CashflowSummary, EdgeFunctionError>>
  async getAnalysis(month: string): Promise<Result<AnalysisMonthly, EdgeFunctionError>>
}
```

### storage.ts

All three buckets handled here. Returns signed URLs for private buckets.

```typescript
export const storageService = {
  // Avatars
  async uploadAvatar(userId, base64Image): Promise<Result<string, SupabaseError>>
  async deleteAvatar(userId): Promise<Result<void, SupabaseError>>

  // Receipts
  async uploadReceipt(userId, transactionId, base64Image): Promise<Result<string, SupabaseError>>
  async deleteReceipt(path): Promise<Result<void, SupabaseError>>

  // Learn Images
  async uploadLearnImage(userId, entryId, imageId, base64Image): Promise<Result<string, SupabaseError>>
  async deleteLearnImage(path): Promise<Result<void, SupabaseError>>
}
```

---

## 7. Hooks Layer

Each hook wraps one repository or service. Exposes loading/error state. Screens import from `hooks/` only.

### Hooks map

| Hook | Source |
|---|---|
| `useAuth` | `auth.repository` |
| `useAccounts` | `accounts.repository` |
| `useTransactions` | `transactions.repository` |
| `useCashflow` | `edgeFunctionsService` |
| `useAnalysis` | `edgeFunctionsService` |
| `useAssets` | `assets.repository` |
| `useLiabilities` | `liabilities.repository` |
| `useLearn` | `learn.repository` |
| `useNotifications` | `notifications.repository` |
| `useSettings` | `settings.repository` |

### useTransactions special case
`useTransactions(year, month)` exposes `transactions`, `expenses`, and `income` filtered views.

### useNotifications special case
Exposes `unreadCount` in addition to the standard interface.

### Hook interface standard
```typescript
function useX() {
  const [data, setData] = useState<T>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<SupabaseError | null>(null);

  // async methods...

  return { data, loading, error, refetch, ...mutations };
}
```

---

## 8. Implementation Order

Build in this order to keep screens working as you go:

1. `src/utils/result.ts`
2. `src/types/database.types.ts` + `src/types/cashflow.types.ts`
3. `src/lib/supabase.ts` (if not already present)
4. `src/repositories/auth.repository.ts`
5. `src/repositories/accounts.repository.ts`
6. `src/repositories/transactions.repository.ts`
7. `src/hooks/useAuth.ts` + `src/hooks/useAccounts.ts` + `src/hooks/useTransactions.ts`
8. `src/repositories/recurring.repository.ts` + `src/hooks/useRecurring.ts`
9. `src/repositories/assets.repository.ts` + `src/hooks/useAssets.ts`
10. `src/repositories/liabilities.repository.ts` + `src/hooks/useLiabilities.ts`
11. `src/repositories/learn.repository.ts` + `src/hooks/useLearn.ts`
12. `src/repositories/notifications.repository.ts` + `src/hooks/useNotifications.ts`
13. `src/repositories/affirmations.repository.ts` + `src/hooks/useAffirmations.ts`
14. `src/repositories/settings.repository.ts` + `src/hooks/useSettings.ts`
15. `src/repositories/customCategories.repository.ts` + `src/hooks/useCustomCategories.ts`
16. `src/services/edgeFunctions.ts` + `src/hooks/useCashflow.ts` + `src/hooks/useAnalysis.ts`
17. `src/services/storage.ts`
18. Add `index.ts` re-exports in each folder

---

*Design for Flowe typed Supabase service layer · React Native (Expo) + Supabase · Dark theme · Accent `#C5FF00`*