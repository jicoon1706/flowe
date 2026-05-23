# Flowe – API Documentation

**App:** Flowe – Personal Finance Tracker  
**Backend:** Supabase (PostgreSQL · Auth · Storage · Edge Functions)  
**Client:** React Native (Expo) + Supabase JS SDK  
**Base URL:** `https://<project-ref>.supabase.co`  
**Last updated:** 2026-05-22

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Profiles](#2-profiles)
3. [Auth Config](#3-auth-config)
4. [Accounts](#4-accounts)
   - [Bank Accounts](#41-bank-accounts)
   - [Tabung Accounts](#42-tabung-accounts)
   - [Wallet Accounts](#43-wallet-accounts)
5. [Transactions](#5-transactions)
6. [Recurring Rules](#6-recurring-rules)
7. [Assets](#7-assets)
8. [Liabilities](#8-liabilities)
9. [Learn – Projects & Entries](#9-learn--projects--entries)
10. [Notifications](#10-notifications)
11. [Affirmations](#11-affirmations)
12. [Settings](#12-settings)
13. [Custom Categories](#13-custom-categories)
14. [Edge Functions](#14-edge-functions)
15. [Storage Buckets](#15-storage-buckets)
16. [Enums Reference](#16-enums-reference)
17. [Computed Values](#17-computed-values)
18. [Error Handling](#18-error-handling)

---

## Global Headers

All requests except public affirmation reads require a valid JWT issued by Supabase Auth.

```
Authorization: Bearer <supabase_jwt>
Content-Type: application/json
apikey: <supabase_anon_key>
```

Row Level Security (RLS) is enabled on every table. All queries are automatically scoped to `auth.uid()` – no manual user ID filtering is needed in the client.

---

## 1. Authentication

Handled by **Supabase Auth**. PIN and biometric are a local security layer stored in `expo-secure-store` and do not interact with the API directly.

### 1.1 Sign Up (Email / Password)

```
POST /auth/v1/signup
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "••••••••",
  "data": {
    "display_name": "Ahmad"
  }
}
```

**Response `200`:**
```json
{
  "access_token": "<jwt>",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "<token>",
  "user": { "id": "<uuid>", ... }
}
```

> A `profiles` row is automatically created via the `on_auth_user_created` trigger using `raw_user_meta_data->>'display_name'`.

**React Native call:**
```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: '••••••••',
  options: {
    data: { display_name: 'Ahmad' },
  },
});
```

---

### 1.2 Sign In (Email / Password)

```
POST /auth/v1/token?grant_type=password
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "••••••••"
}
```

**Response `200`:** Same shape as Sign Up.

**React Native call:**
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: '••••••••',
});
```

---

### 1.3 Sign In Anonymously

```
POST /auth/v1/signup
```

**Body:** `{}` (empty – Supabase anonymous auth)

Used on first launch when no session exists. A profile row is created via trigger.

**React Native call:**
```typescript
const { data, error } = await supabase.auth.signInAnonymously();
```

---

### 1.4 Refresh Session

```
POST /auth/v1/token?grant_type=refresh_token
```

**Body:**
```json
{ "refresh_token": "<token>" }
```

> Session refresh is handled automatically by the Supabase JS SDK. Configure `autoRefreshToken: true` in the client options.

---

### 1.5 Sign Out

```
POST /auth/v1/logout
Authorization: Bearer <jwt>
```

**React Native call:**
```typescript
const { error } = await supabase.auth.signOut();
```

---

### 1.6 Get Current User

```
GET /auth/v1/user
Authorization: Bearer <jwt>
```

**React Native call:**
```typescript
// Verified server-side call:
const { data: { user }, error } = await supabase.auth.getUser();

// Local session (no network, use for userId in queries):
const { data: { session } } = await supabase.auth.getSession();
const userId = session?.user.id;
```

---

## 2. Profiles

> Auto-created on sign-up. One row per user.

**Table:** `public.profiles`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | references `auth.users(id)` |
| `display_name` | varchar(30) | required |
| `financial_identity` | text | `rich_dad` · `middle_class` · `building_wealth` |
| `avatar_url` | text | Supabase Storage URL |
| `member_since` | timestamptz | auto |
| `updated_at` | timestamptz | auto |

### GET – Fetch Own Profile

```typescript
const { data: { session } } = await supabase.auth.getSession();
const userId = session!.user.id;

const { data, error } = await supabase
  .from('profiles')
  .select()
  .eq('id', userId)
  .single();
```

**Response `200`:**
```json
{
  "id": "uuid",
  "display_name": "Ahmad",
  "financial_identity": "building_wealth",
  "avatar_url": "https://...",
  "member_since": "2026-01-01T00:00:00Z",
  "updated_at": "2026-05-22T10:00:00Z"
}
```

### PATCH – Update Profile

```typescript
const { error } = await supabase
  .from('profiles')
  .update({
    display_name: 'Ahmad Rizal',
    financial_identity: 'rich_dad',
    avatar_url: 'https://...',
    updated_at: new Date().toISOString(),
  })
  .eq('id', userId);
```

---

## 3. Auth Config

> Server-side PIN hash only. Raw PIN never leaves the device.

**Table:** `public.auth_config`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `user_id` | uuid | FK → `profiles(id)`, unique |
| `pin_hash` | text | SHA-256 of 6-digit PIN |
| `fingerprint_enabled` | boolean | default `false` |
| `auto_lock_minutes` | int | default `5` |
| `updated_at` | timestamptz | |

### GET – Fetch Auth Config

```typescript
const { data, error } = await supabase
  .from('auth_config')
  .select()
  .eq('user_id', userId)
  .single();
```

### POST – Create Auth Config (PIN Setup)

```typescript
const { error } = await supabase.from('auth_config').insert({
  user_id: userId,
  pin_hash: sha256Hash,
  fingerprint_enabled: false,
  auto_lock_minutes: 5,
});
```

### PATCH – Update Auth Config

```typescript
const { error } = await supabase
  .from('auth_config')
  .update({
    pin_hash: newHash,
    fingerprint_enabled: true,
    auto_lock_minutes: 10,
    updated_at: new Date().toISOString(),
  })
  .eq('user_id', userId);
```

---

## 4. Accounts

**Table:** `public.accounts`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `user_id` | uuid | FK → `profiles(id)` |
| `type` | account_type | `bank` · `tabung` · `wallet` |
| `name` | varchar(100) | |
| `icon` | varchar(10) | emoji |
| `color` | varchar(7) | hex e.g. `#C5FF00` |
| `is_active` | boolean | default `true` |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### GET – List All Accounts

```typescript
const { data, error } = await supabase
  .from('accounts')
  .select(`
    *,
    bank_accounts(*),
    tabung_accounts(*),
    wallet_accounts(*)
  `)
  .eq('is_active', true)
  .order('created_at');
```

### GET – Fetch Single Account

```typescript
const { data, error } = await supabase
  .from('accounts')
  .select('*, bank_accounts(*), tabung_accounts(*), wallet_accounts(*)')
  .eq('id', accountId)
  .single();
```

### POST – Create Account

```typescript
const { data: account, error } = await supabase
  .from('accounts')
  .insert({
    user_id: userId,
    type: 'bank',
    name: 'Maybank Savings',
    icon: '🏦',
    color: '#F8C000',
  })
  .select()
  .single();
// Then insert into the type-specific child table (see 4.1–4.3)
```

### PATCH – Update Account

```typescript
const { error } = await supabase
  .from('accounts')
  .update({
    name: 'New Name',
    icon: '💳',
    color: '#C5FF00',
    updated_at: new Date().toISOString(),
  })
  .eq('id', accountId);
```

### DELETE – Soft Delete Account

```typescript
const { error } = await supabase
  .from('accounts')
  .update({ is_active: false })
  .eq('id', accountId);
```

---

### 4.1 Bank Accounts

**Table:** `public.bank_accounts`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `account_id` | uuid | FK → `accounts(id)`, unique |
| `bank_name` | varchar(100) | |
| `account_number` | varchar(30) | last 4 digits only |
| `opening_balance` | numeric(12,2) | |
| `current_balance` | numeric(12,2) | |

### POST – Create Bank Account

```typescript
const { error } = await supabase.from('bank_accounts').insert({
  account_id: account.id,
  bank_name: 'Maybank',
  account_number: '1234',
  opening_balance: 1000.00,
  current_balance: 1000.00,
});
```

### PATCH – Update Balance

```typescript
const { error } = await supabase
  .from('bank_accounts')
  .update({ current_balance: newBalance })
  .eq('account_id', accountId);
```

---

### 4.2 Tabung Accounts

**Table:** `public.tabung_accounts`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `account_id` | uuid | FK → `accounts(id)`, unique |
| `target_amount` | numeric(12,2) | |
| `saved_amount` | numeric(12,2) | computed from transactions |
| `from_date` | date | |
| `to_date` | date | |
| `linked_bank_id` | uuid | FK → `bank_accounts(id)`, optional |
| `description` | text | |
| `template_type` | varchar(50) | `raya` · `emergency` · `holiday` · `gadget` · `down_payment` · `custom` |

### POST – Create Tabung Account

```typescript
const { error } = await supabase.from('tabung_accounts').insert({
  account_id: account.id,
  target_amount: 500.00,
  saved_amount: 0.00,
  from_date: '2026-01-01',
  to_date: '2026-06-01',
  linked_bank_id: bankAccountId,
  template_type: 'raya',
});
```

### PATCH – Update Tabung Goal

```typescript
const { error } = await supabase
  .from('tabung_accounts')
  .update({
    target_amount: 800.00,
    to_date: '2026-12-31',
  })
  .eq('account_id', accountId);
```

---

### 4.3 Wallet Accounts

**Table:** `public.wallet_accounts`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `account_id` | uuid | FK → `accounts(id)`, unique |
| `opening_balance` | numeric(12,2) | |
| `current_balance` | numeric(12,2) | |

### POST – Create Wallet Account

```typescript
const { error } = await supabase.from('wallet_accounts').insert({
  account_id: account.id,
  opening_balance: 200.00,
  current_balance: 200.00,
});
```

---

## 5. Transactions

**Table:** `public.transactions`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `user_id` | uuid | FK → `profiles(id)` |
| `type` | transaction_type | see enums |
| `name` | varchar(100) | |
| `amount` | numeric(12,2) | must be > 0 |
| `category` | varchar(50) | |
| `from_account_id` | uuid | FK → `accounts(id)` |
| `to_account_id` | uuid | FK → `accounts(id)` |
| `date` | date | |
| `note` | text | |
| `receipt_url` | text | Supabase Storage URL |
| `is_recurring` | boolean | default `false` |
| `recurring_id` | uuid | FK → `recurring_rules(id)` |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

**Expense categories:** `food_drink` · `transport` · `bills` · `shopping` · `health` · `entertainment` · `others`  
**Income categories:** `salary` · `freelance` · `gift` · `investment_returns` · `business` · `rental` · `others`

### GET – Fetch Transactions by Month

```typescript
const { data, error } = await supabase
  .from('transactions')
  .select()
  .gte('date', '2026-05-01')
  .lte('date', '2026-05-31')
  .order('date', { ascending: false });
```

**Response `200`:**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "type": "expense",
    "name": "Lunch at Mamak",
    "amount": 12.50,
    "category": "food_drink",
    "from_account_id": "uuid",
    "to_account_id": null,
    "date": "2026-05-22",
    "note": null,
    "receipt_url": null,
    "is_recurring": false,
    "recurring_id": null,
    "created_at": "2026-05-22T12:30:00Z",
    "updated_at": "2026-05-22T12:30:00Z"
  }
]
```

### GET – Fetch Transaction Detail (with joins)

Used by the Transaction Detail popup. Joins account names and recurring rule details.

```typescript
const { data, error } = await supabase
  .from('transactions')
  .select(`
    *,
    from_account:accounts!from_account_id(id, name, type),
    to_account:accounts!to_account_id(id, name, type),
    recurring:recurring_rules(frequency, start_date, end_date, reminder_enabled)
  `)
  .eq('id', transactionId)
  .single();
```

**Response `200`:**
```json
{
  "id": "uuid",
  "type": "expense",
  "name": "Unifi",
  "amount": 89.00,
  "category": "bills",
  "is_recurring": true,
  "from_account": { "id": "uuid", "name": "Maybank", "type": "bank" },
  "to_account": null,
  "recurring": {
    "frequency": "monthly",
    "start_date": "2026-06-01",
    "end_date": null,
    "reminder_enabled": true
  },
  "note": null,
  "receipt_url": null
}
```

### GET – Fetch Transactions by Account

```typescript
const { data, error } = await supabase
  .from('transactions')
  .select()
  .or(`from_account_id.eq.${accountId},to_account_id.eq.${accountId}`)
  .order('date', { ascending: false });
```

### POST – Add Transaction

```typescript
const { error } = await supabase.from('transactions').insert({
  user_id: userId,
  type: 'expense',
  name: 'Lunch at Mamak',
  amount: 12.50,
  category: 'food_drink',
  from_account_id: accountId,
  date: '2026-05-22',
  note: 'With colleagues',
  is_recurring: false,
});
```

### POST – Add Recurring Transaction

```typescript
const { error } = await supabase.from('transactions').insert({
  user_id: userId,
  type: 'expense',
  name: 'Unifi',
  amount: 89.00,
  category: 'bills',
  from_account_id: accountId,
  date: '2026-06-01',
  is_recurring: true,
  recurring_id: recurringRuleId,
});
```

### PATCH – Update Transaction

```typescript
const { error } = await supabase
  .from('transactions')
  .update({
    amount: 15.00,
    note: 'Updated note',
    updated_at: new Date().toISOString(),
  })
  .eq('id', transactionId);
```

### DELETE – Delete Transaction

```typescript
const { error } = await supabase
  .from('transactions')
  .delete()
  .eq('id', transactionId);
```

---

## 6. Recurring Rules

**Table:** `public.recurring_rules`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `user_id` | uuid | FK → `profiles(id)` |
| `type` | transaction_type | `expense` or `income` only |
| `name` | varchar(100) | |
| `amount` | numeric(12,2) | > 0 |
| `category` | varchar(50) | |
| `from_account_id` | uuid | FK → `accounts(id)` |
| `to_account_id` | uuid | FK → `accounts(id)` |
| `frequency` | recurring_frequency | `monthly` · `weekly` · `yearly` |
| `start_date` | date | |
| `end_date` | date | null = indefinite |
| `reminder_enabled` | boolean | default `false` |
| `status` | recurring_status | `active` · `paused` · `ended` |
| `last_applied_at` | timestamptz | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### GET – List Recurring Rules

```typescript
const { data, error } = await supabase
  .from('recurring_rules')
  .select()
  .eq('status', 'active')
  .order('created_at', { ascending: false });
```

### POST – Create Recurring Rule

```typescript
const { error } = await supabase.from('recurring_rules').insert({
  user_id: userId,
  type: 'expense',
  name: 'Unifi',
  amount: 89.00,
  category: 'bills',
  from_account_id: accountId,
  frequency: 'monthly',
  start_date: '2026-06-01',
  reminder_enabled: true,
  status: 'active',
});
```

### PATCH – Pause / Resume / End Rule

```typescript
const { error } = await supabase
  .from('recurring_rules')
  .update({ status: 'paused' })
  .eq('id', ruleId);
```

### DELETE – Delete Recurring Rule

```typescript
const { error } = await supabase
  .from('recurring_rules')
  .delete()
  .eq('id', ruleId);
```

---

## 7. Assets

**Table:** `public.assets`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `user_id` | uuid | FK → `profiles(id)` |
| `name` | varchar(100) | |
| `type` | asset_type | see enums |
| `icon` | varchar(10) | emoji |
| `current_value` | numeric(12,2) | ≥ 0 |
| `monthly_income` | numeric(12,2) | default `0.00` |
| `date_acquired` | date | optional |
| `note` | text | optional |
| `is_active` | boolean | default `true` |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### GET – List Assets

```typescript
const { data, error } = await supabase
  .from('assets')
  .select()
  .eq('is_active', true)
  .order('current_value', { ascending: false });
```

**Response `200`:**
```json
[
  {
    "id": "uuid",
    "name": "ASB",
    "type": "asb",
    "icon": "🏷",
    "current_value": 10000.00,
    "monthly_income": 50.00,
    "date_acquired": "2024-01-01",
    "note": null,
    "is_active": true
  }
]
```

### POST – Add Asset

```typescript
const { error } = await supabase.from('assets').insert({
  user_id: userId,
  name: 'ASB',
  type: 'asb',
  icon: '🏷',
  current_value: 10000.00,
  monthly_income: 50.00,
  date_acquired: '2024-01-01',
});
```

### PATCH – Update Asset

```typescript
const { error } = await supabase
  .from('assets')
  .update({
    current_value: 12000.00,
    monthly_income: 60.00,
    updated_at: new Date().toISOString(),
  })
  .eq('id', assetId);
```

### DELETE – Remove Asset

```typescript
const { error } = await supabase
  .from('assets')
  .update({ is_active: false })
  .eq('id', assetId);
```

---

## 8. Liabilities

**Table:** `public.liabilities`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `user_id` | uuid | FK → `profiles(id)` |
| `name` | varchar(100) | |
| `type` | liability_type | see enums |
| `icon` | varchar(10) | emoji |
| `amount_owed` | numeric(12,2) | ≥ 0 |
| `monthly_payment` | numeric(12,2) | ≥ 0 |
| `interest_rate` | numeric(5,2) | default `0.00` |
| `note` | text | optional |
| `is_active` | boolean | default `true` |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### GET – List Liabilities

```typescript
const { data, error } = await supabase
  .from('liabilities')
  .select()
  .eq('is_active', true)
  .order('amount_owed', { ascending: false });
```

### POST – Add Liability

```typescript
const { error } = await supabase.from('liabilities').insert({
  user_id: userId,
  name: 'Car Loan',
  type: 'car_loan',
  icon: '🚗',
  amount_owed: 45000.00,
  monthly_payment: 800.00,
  interest_rate: 3.50,
});
```

### PATCH – Update Liability

```typescript
const { error } = await supabase
  .from('liabilities')
  .update({
    amount_owed: 44200.00,
    updated_at: new Date().toISOString(),
  })
  .eq('id', liabilityId);
```

### DELETE – Remove Liability

```typescript
const { error } = await supabase
  .from('liabilities')
  .update({ is_active: false })
  .eq('id', liabilityId);
```

---

## 9. Learn – Projects & Entries

### 9.1 Learn Projects

**Table:** `public.learn_projects`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `user_id` | uuid | FK → `profiles(id)` |
| `name` | varchar(200) | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### GET – List Projects (with entry count)

```typescript
const { data, error } = await supabase
  .from('learn_projects')
  .select('*, learn_entries(count)')
  .order('updated_at', { ascending: false });
```

### POST – Create Project

```typescript
const { error } = await supabase.from('learn_projects').insert({
  user_id: userId,
  name: 'S&P 500 Notes',
});
```

### PATCH – Rename Project

```typescript
const { error } = await supabase
  .from('learn_projects')
  .update({
    name: 'New Name',
    updated_at: new Date().toISOString(),
  })
  .eq('id', projectId);
```

### DELETE – Delete Project

```typescript
const { error } = await supabase
  .from('learn_projects')
  .delete()
  .eq('id', projectId);
// Cascades to learn_entries and learn_entry_images
```

---

### 9.2 Learn Entries

**Table:** `public.learn_entries`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `project_id` | uuid | FK → `learn_projects(id)` |
| `user_id` | uuid | FK → `profiles(id)` |
| `body` | text | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### GET – List Entries for Project

```typescript
const { data, error } = await supabase
  .from('learn_entries')
  .select('*, learn_entry_images(*)')
  .eq('project_id', projectId)
  .order('created_at', { ascending: false });
```

### POST – Create Entry

```typescript
const { error } = await supabase.from('learn_entries').insert({
  project_id: projectId,
  user_id: userId,
  body: 'Index funds outperform most active managers...',
});
```

### PATCH – Edit Entry

```typescript
const { error } = await supabase
  .from('learn_entries')
  .update({
    body: 'Updated text',
    updated_at: new Date().toISOString(),
  })
  .eq('id', entryId);
```

### DELETE – Delete Entry

```typescript
const { error } = await supabase
  .from('learn_entries')
  .delete()
  .eq('id', entryId);
```

---

### 9.3 Learn Entry Images

**Table:** `public.learn_entry_images`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `entry_id` | uuid | FK → `learn_entries(id)` |
| `storage_path` | text | path in `learn-images` bucket |
| `sort_order` | int | default `0` |
| `created_at` | timestamptz | |

### POST – Attach Image to Entry

```typescript
// 1. Upload to Storage (see Section 15)
const path = `${userId}/${entryId}/${imageId}.jpg`;
const { error: uploadError } = await supabase.storage
  .from('learn-images')
  .upload(path, decode(base64Image), { contentType: 'image/jpeg' });

// 2. Save path reference
const { error } = await supabase.from('learn_entry_images').insert({
  entry_id: entryId,
  storage_path: path,
  sort_order: 0,
});
```

### DELETE – Remove Image

```typescript
const { error } = await supabase
  .from('learn_entry_images')
  .delete()
  .eq('id', imageId);
// Also remove from storage bucket
await supabase.storage.from('learn-images').remove([storagePath]);
```

---

## 10. Notifications

**Table:** `public.notifications`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `user_id` | uuid | FK → `profiles(id)` |
| `type` | notification_type | see enums |
| `emoji` | varchar(10) | |
| `message` | text | |
| `sub_text` | text | optional |
| `is_read` | boolean | default `false` |
| `related_entity_id` | uuid | optional – links to related record |
| `created_at` | timestamptz | |

### GET – List Notifications

```typescript
const { data, error } = await supabase
  .from('notifications')
  .select()
  .order('created_at', { ascending: false });
```

### GET – Unread Count

```typescript
const { count, error } = await supabase
  .from('notifications')
  .select('id', { count: 'exact', head: true })
  .eq('is_read', false);
// count gives the unread count
```

### POST – Create Notification

```typescript
const { error } = await supabase.from('notifications').insert({
  user_id: userId,
  type: 'expense',
  emoji: '✅',
  message: 'RM 24.50 – Food & Drink saved',
  sub_text: 'Lunch at Mamak',
  related_entity_id: transactionId,
});
```

### PATCH – Mark Single as Read

```typescript
const { error } = await supabase
  .from('notifications')
  .update({ is_read: true })
  .eq('id', notificationId);
```

### PATCH – Mark All as Read

```typescript
const { error } = await supabase
  .from('notifications')
  .update({ is_read: true })
  .eq('user_id', userId)
  .eq('is_read', false);
```

### DELETE – Delete Notification

```typescript
const { error } = await supabase
  .from('notifications')
  .delete()
  .eq('id', notificationId);
```

---

## 11. Affirmations

**Table:** `public.affirmations` – public read, no `user_id`.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `category` | affirmation_category | `saving` · `investing` · `mindset` · `awareness` |
| `quote` | text | |
| `is_active` | boolean | default `true` |
| `created_at` | timestamptz | |

### GET – List Active Affirmations

```typescript
const { data, error } = await supabase
  .from('affirmations')
  .select()
  .eq('is_active', true);
```

### GET – By Category

```typescript
const { data, error } = await supabase
  .from('affirmations')
  .select()
  .eq('is_active', true)
  .eq('category', 'saving');
```

---

### 11.1 Affirmation Favourites

**Table:** `public.affirmation_favourites`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `user_id` | uuid | FK → `profiles(id)` |
| `affirmation_id` | uuid | FK → `affirmations(id)` |
| `created_at` | timestamptz | |

### GET – List User Favourites

```typescript
const { data, error } = await supabase
  .from('affirmation_favourites')
  .select('*, affirmations(*)')
  .order('created_at', { ascending: false });
```

### POST – Add to Favourites

```typescript
const { error } = await supabase.from('affirmation_favourites').insert({
  user_id: userId,
  affirmation_id: affirmationId,
});
```

### DELETE – Remove from Favourites

```typescript
const { error } = await supabase
  .from('affirmation_favourites')
  .delete()
  .eq('user_id', userId)
  .eq('affirmation_id', affirmationId);
```

---

## 12. Settings

**Table:** `public.settings` – one row per user.

| Column | Type | Default | Notes |
|---|---|---|---|
| `currency` | varchar(5) | `RM` | |
| `balance_visible` | boolean | `true` | |
| `show_affirmations` | boolean | `true` | |
| `daily_reminder_time` | time | `08:00` | |
| `affirmation_category` | varchar(20) | `all` | |
| `notif_expense` | boolean | `true` | |
| `notif_income` | boolean | `true` | |
| `notif_transfer` | boolean | `true` | |
| `notif_recurring` | boolean | `true` | |
| `notif_alert` | boolean | `true` | |
| `notif_tabung` | boolean | `true` | |
| `notif_milestone` | boolean | `true` | |
| `notif_asset` | boolean | `true` | |
| `notif_cashflow` | boolean | `true` | |
| `notif_affirmation` | boolean | `true` | |

### GET – Fetch Settings

```typescript
const { data, error } = await supabase
  .from('settings')
  .select()
  .eq('user_id', userId)
  .single();
```

### POST – Initialize Settings (on first sign-up)

```typescript
const { error } = await supabase.from('settings').insert({
  user_id: userId,
});
// All columns use their defaults
```

### PATCH – Update Settings

```typescript
const { error } = await supabase
  .from('settings')
  .update({
    balance_visible: false,
    notif_expense: false,
    affirmation_category: 'investing',
    updated_at: new Date().toISOString(),
  })
  .eq('user_id', userId);
```

---

## 13. Custom Categories

**Table:** `public.custom_categories`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `user_id` | uuid | FK → `profiles(id)` |
| `transaction_type` | text | `expense` · `income` |
| `name` | varchar(50) | |
| `icon` | varchar(10) | emoji |
| `color` | varchar(7) | hex |
| `is_active` | boolean | default `true` |
| `created_at` | timestamptz | |

### GET – List Custom Categories

```typescript
const { data, error } = await supabase
  .from('custom_categories')
  .select()
  .eq('is_active', true)
  .eq('transaction_type', 'expense');
```

### POST – Create Category

```typescript
const { error } = await supabase.from('custom_categories').insert({
  user_id: userId,
  transaction_type: 'expense',
  name: 'Pet Care',
  icon: '🐾',
  color: '#FF6B6B',
});
```

### DELETE – Remove Category

```typescript
const { error } = await supabase
  .from('custom_categories')
  .update({ is_active: false })
  .eq('id', categoryId);
```

---

## 14. Edge Functions

Edge Functions run server-side TypeScript and perform heavy aggregations that must not be computed on-device.

### 14.1 `cashflow-summary`

Returns financial class, net worth, and income statement for a given month. Used by the Cash Flow screen.

```
POST /functions/v1/cashflow-summary
Authorization: Bearer <user_jwt>
Content-Type: application/json
```

**Request Body:**
```json
{ "month": "2026-05" }
```

**Response `200`:**
```json
{
  "financial_class": "rich" | "middle" | "poor",
  "net_worth": 45000.00,
  "passive_income": 500.00,
  "total_assets": 60000.00,
  "total_liabilities": 15000.00,
  "total_income": 5000.00,
  "total_expenses": 3200.00,
  "net_cash_flow": 1800.00
}
```

| Field | Description |
|---|---|
| `financial_class` | `rich` if `passive_income > total_expenses`; `middle` if any liabilities; otherwise `poor` |
| `net_worth` | `total_assets − total_liabilities` |
| `passive_income` | `SUM(assets.monthly_income)` |
| `net_cash_flow` | `total_income − total_expenses` |

**React Native call:**
```typescript
const { data, error } = await supabase.functions.invoke('cashflow-summary', {
  body: { month: '2026-05' },
});
```

---

### 14.2 `analysis-monthly`

Returns chart data and category breakdown for the Analysis screen.

```
POST /functions/v1/analysis-monthly
Authorization: Bearer <user_jwt>
Content-Type: application/json
```

**Request Body:**
```json
{ "month": "2026-05" }
```

**Response `200`:**
```json
{
  "income": 5000.00,
  "expenses": 3200.00,
  "net_savings": 1800.00,
  "savings_rate": 36.0,
  "expense_by_category": [
    { "category": "food_drink", "amount": 800.00, "percentage": 25.0 },
    { "category": "transport", "amount": 400.00, "percentage": 12.5 }
  ],
  "income_by_category": [
    { "category": "salary", "amount": 4000.00, "percentage": 80.0 },
    { "category": "freelance", "amount": 1000.00, "percentage": 20.0 }
  ],
  "monthly_trend": [
    { "month": "2026-01", "income": 4800.00, "expenses": 3100.00 },
    { "month": "2026-02", "income": 5000.00, "expenses": 3200.00 },
    { "month": "2026-03", "income": 4900.00, "expenses": 3000.00 },
    { "month": "2026-04", "income": 5100.00, "expenses": 3400.00 },
    { "month": "2026-05", "income": 5000.00, "expenses": 3200.00 }
  ]
}
```

| Field | Description |
|---|---|
| `savings_rate` | `(net_savings / income) × 100` |
| `expense_by_category` | Sorted descending by `amount` |
| `monthly_trend` | Last 6 months including current |

**React Native call:**
```typescript
const { data, error } = await supabase.functions.invoke('analysis-monthly', {
  body: { month: '2026-05' },
});
```

---

## 15. Storage Buckets

All buckets are **private** – access requires a signed URL. RLS policies ensure users can only access their own folder.

### Bucket Structure

```
avatars/
  {user_id}/avatar.jpg

receipts/
  {user_id}/{transaction_id}.jpg

learn-images/
  {user_id}/{entry_id}/{image_id}.jpg
```

### Upload Avatar

```typescript
import { decode } from 'base64-arraybuffer';

const path = `${userId}/avatar.jpg`;
const { error } = await supabase.storage
  .from('avatars')
  .upload(path, decode(base64Image), {
    contentType: 'image/jpeg',
    upsert: true,
  });

const { data } = supabase.storage.from('avatars').getPublicUrl(path);
const publicUrl = data.publicUrl;
// Save publicUrl to profiles.avatar_url
```

### Upload Receipt

```typescript
const path = `${userId}/${transactionId}.jpg`;
const { error } = await supabase.storage
  .from('receipts')
  .upload(path, decode(base64Image), { contentType: 'image/jpeg' });

const { data } = await supabase.storage
  .from('receipts')
  .createSignedUrl(path, 60 * 60); // 1 hour expiry
const signedUrl = data?.signedUrl;
// Save signedUrl to transactions.receipt_url
```

### Upload Learn Image

```typescript
const path = `${userId}/${entryId}/${imageId}.jpg`;
const { error } = await supabase.storage
  .from('learn-images')
  .upload(path, decode(base64Image), { contentType: 'image/jpeg' });

const { data } = await supabase.storage
  .from('learn-images')
  .createSignedUrl(path, 60 * 60);
```

### Delete File

```typescript
const { error } = await supabase.storage
  .from('learn-images')
  .remove([`${userId}/${entryId}/${imageId}.jpg`]);
```

---

## 16. Enums Reference

| Enum | Values |
|---|---|
| `account_type` | `bank` · `tabung` · `wallet` |
| `transaction_type` | `expense` · `income` · `transfer` · `tabung_topup` · `tabung_withdraw` |
| `recurring_frequency` | `monthly` · `weekly` · `yearly` |
| `recurring_status` | `active` · `paused` · `ended` |
| `asset_type` | `real_estate` · `stocks` · `unit_trust` · `fixed_deposit` · `asb` · `gold` · `vehicle` · `business` · `others` |
| `liability_type` | `mortgage` · `car_loan` · `credit_card` · `study_loan` · `medical_loan` · `business_loan` · `others` |
| `notification_type` | `expense` · `income` · `transfer` · `recurring` · `alert` · `tabung` · `milestone` · `asset` · `cashflow` · `note` · `affirmation` · `project` |
| `affirmation_category` | `saving` · `investing` · `mindset` · `awareness` |

---

## 17. Computed Values

These values are **never computed on-device**. They are returned by Edge Functions.

| Value | Formula |
|---|---|
| `total_balance` | `SUM(bank_accounts.current_balance)` + `SUM(wallet_accounts.current_balance)` |
| `tabung.saved_amount` | `SUM(transactions.amount WHERE type='tabung_topup')` − `SUM(... WHERE type='tabung_withdraw')` |
| `tabung.days_left` | `tabung_accounts.to_date` − `CURRENT_DATE` |
| `tabung.weekly_needed` | `(target_amount − saved_amount) / (days_left / 7.0)` |
| `net_cash_flow` | `SUM(income) − SUM(expense)` for a given month |
| `net_worth` | `SUM(assets.current_value)` − `SUM(liabilities.amount_owed)` |
| `passive_income` | `SUM(assets.monthly_income)` |
| `financial_class` | `passive_income > total_expenses` → `rich`; `SUM(monthly_payment) > 0` → `middle`; else → `poor` |
| `savings_rate` | `(net_cash_flow / total_income) × 100` |

---

## 18. Error Handling

Supabase JS SDK returns `{ data, error }` — it does not throw by default. Always check `error` after every call.

```typescript
const { data, error } = await supabase
  .from('transactions')
  .select()
  .single();

if (error) {
  // error.code    – Postgres error code (e.g. '23505' for unique violation)
  // error.message – human-readable message
  // error.details – additional detail
  // error.hint    – optional hint
  console.error(error.code, error.message);
}
```

### Common Error Codes

| HTTP | Postgres Code | Meaning |
|---|---|---|
| 400 | `23502` | Not-null constraint violation |
| 400 | `23514` | Check constraint violation (e.g. amount ≤ 0) |
| 409 | `23505` | Unique constraint violation (e.g. duplicate auth_config) |
| 401 | – | Missing or invalid JWT |
| 403 | – | RLS policy denied – user does not own the row |
| 404 | `PGRST116` | `.single()` returned no rows |
| 422 | – | Edge Function validation error |
| 500 | – | Internal server error |

---

*API docs for Flowe · React Native (Expo) + Supabase · Dark theme · Accent `#C5FF00`*
