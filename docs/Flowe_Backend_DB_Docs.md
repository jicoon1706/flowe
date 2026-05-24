# Flowe – React Native + Supabase Backend & Database Documentation

**App:** Flowe – Personal Finance Tracker  
**Stack:** React Native (Expo) · Supabase (PostgreSQL + Auth + Storage + Edge Functions)  
**Last updated:** 2026-05-22

---

## 📁 Project Structure Tree

```
FloweApp/                                # Expo root
│
├── app/                                 # Expo Router screens
│   ├── _layout.tsx                      # Root layout – session gate
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── setup.tsx                    # Phase 1 – Auth Setup
│   │   └── pin-login.tsx
│   ├── (onboarding)/
│   │   ├── _layout.tsx
│   │   └── index.tsx                    # Phase 2 – Onboarding
│   └── (main)/
│       ├── _layout.tsx                  # Tab navigator
│       ├── index.tsx                    # Home
│       ├── calendar.tsx
│       ├── cashflow.tsx
│       └── settings.tsx
│
├── src/
│   ├── lib/
│   │   └── supabase.ts                  # Supabase singleton client
│   │
│   ├── constants/
│   │   ├── supabase.ts                  # table names, bucket names
│   │   └── app.ts                       # enums, category lists
│   │
│   ├── theme/
│   │   └── colors.ts                    # dark theme + #C5FF00
│   │
│   ├── utils/
│   │   ├── currencyFormatter.ts
│   │   └── dateHelpers.ts
│   │
│   ├── models/                          # TypeScript interfaces
│   │   ├── userProfile.ts
│   │   ├── account.ts
│   │   ├── bankAccount.ts
│   │   ├── tabungAccount.ts
│   │   ├── walletAccount.ts
│   │   ├── transaction.ts
│   │   ├── recurringRule.ts
│   │   ├── asset.ts
│   │   ├── liability.ts
│   │   ├── learnProject.ts
│   │   ├── learnEntry.ts
│   │   ├── notification.ts
│   │   ├── affirmation.ts
│   │   └── settings.ts
│   │
│   ├── repositories/                    # Supabase data access layer
│   │   ├── authRepository.ts
│   │   ├── accountsRepository.ts
│   │   ├── transactionsRepository.ts
│   │   ├── recurringRepository.ts
│   │   ├── tabungRepository.ts
│   │   ├── assetsRepository.ts
│   │   ├── liabilitiesRepository.ts
│   │   ├── learnRepository.ts
│   │   ├── notificationsRepository.ts
│   │   ├── affirmationsRepository.ts
│   │   └── settingsRepository.ts
│   │
│   ├── stores/                          # Zustand stores (global state)
│   │   ├── authStore.ts
│   │   ├── accountsStore.ts
│   │   ├── transactionsStore.ts
│   │   ├── cashflowStore.ts
│   │   ├── analysisStore.ts
│   │   └── settingsStore.ts
│   │
│   └── components/                      # Reusable UI components
│       ├── BottomNav.tsx
│       ├── AffirmationCard.tsx
│       ├── AccountCards.tsx
│       ├── RecentTransactions.tsx
│       ├── AddTransaction.tsx
│       └── ...
│
├── supabase/
│   ├── migrations/
│   │   ├── 001_init_schema.sql
│   │   ├── 002_rls_policies.sql
│   │   ├── 003_storage_buckets.sql
│   │   └── 004_seed_affirmations.sql
│   └── functions/
│       ├── cashflow-summary/
│       │   └── index.ts                 # Edge Function
│       └── analysis-monthly/
│           └── index.ts                 # Edge Function
│
├── package.json
├── app.json
└── .env                                 # EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY
```

---

## 🗄️ Supabase PostgreSQL Schema

### Auth Strategy

> Supabase Auth handles **identity** (email/password or anonymous).  
> PIN and biometric are a **local security layer** stored in `expo-secure-store` – they do not replace Supabase Auth.

```
Supabase Auth (supabase.auth.signUp / signInWithPassword)
  └── issues JWT → used for all RLS policies (auth.uid())

PIN / Fingerprint (expo-secure-store + expo-local-authentication)
  └── stored locally on device
  └── gates app entry after Supabase session is restored
  └── server stores only a SHA-256 hash for PIN-change verification
```

**Key packages:**
```json
// package.json dependencies
{
  "@supabase/supabase-js": "^2.x",
  "expo": "~56.x",
  "expo-router": "~5.x",
  "react-native": "0.79.x",
  "zustand": "^5.x",
  "expo-secure-store": "~14.x",
  "expo-local-authentication": "~15.x",
  "expo-image-picker": "~16.x",
  "base64-arraybuffer": "^1.x",
  "nativewind": "^4.x",
  "react-native-reanimated": "~3.x",
  "intl": "^1.x"
}
```

---

### Table: `profiles`
> Created automatically when a user signs up via a Supabase trigger on `auth.users`.

```sql
create table public.profiles (
  id                uuid          primary key references auth.users(id) on delete cascade,
  display_name      varchar(30)   not null,
  financial_identity text         check (financial_identity in ('employee','entrepreneur','investor','business_owner')),
  -- Settings → Account exposes these as: Employee · Entrepreneur · Investor · Business Owner
  avatar_url        text,
  member_since      timestamptz   default now(),
  updated_at        timestamptz   default now()
);

-- auto-create profile on sign-up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'display_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

---

### Table: `auth_config`
> Stores server-side PIN hash only. The raw PIN never leaves the device.

```sql
create table public.auth_config (
  id                  uuid          primary key default gen_random_uuid(),
  user_id             uuid          not null references public.profiles(id) on delete cascade,
  pin_hash            text          not null,       -- SHA-256 of 6-digit PIN
  fingerprint_enabled boolean       default false,
  auto_lock_minutes   int           default 5,       -- null = "Never" (Settings → Security)
  updated_at          timestamptz   default now(),
  unique (user_id)
);
```

---

### Table: `accounts`
> Base table for bank, tabung, and wallet accounts.

```sql
create type account_type as enum ('bank', 'tabung', 'wallet');

create table public.accounts (
  id          uuid          primary key default gen_random_uuid(),
  user_id     uuid          not null references public.profiles(id) on delete cascade,
  type        account_type  not null,
  name        varchar(100)  not null,
  icon        varchar(10),                          -- emoji
  color       varchar(7),                           -- hex e.g. #C5FF00
  is_active   boolean       default true,
  created_at  timestamptz   default now(),
  updated_at  timestamptz   default now()
);
```

### Table: `bank_accounts`

```sql
create table public.bank_accounts (
  id              uuid            primary key default gen_random_uuid(),
  account_id      uuid            not null references public.accounts(id) on delete cascade,
  bank_name       varchar(100)    not null,
  account_number  varchar(30),                      -- store last 4 digits only
  opening_balance numeric(12,2)   default 0.00,
  current_balance numeric(12,2)   default 0.00,
  unique (account_id)
);
```

### Table: `tabung_accounts`

```sql
create table public.tabung_accounts (
  id              uuid          primary key default gen_random_uuid(),
  account_id      uuid          not null references public.accounts(id) on delete cascade,
  target_amount   numeric(12,2) not null,
  saved_amount    numeric(12,2) default 0.00,
  from_date       date          not null,
  to_date         date          not null,
  linked_bank_id  uuid          references public.bank_accounts(id) on delete set null,
  description     text,
  icon            varchar(10),                      -- emoji shown on tabung card (e.g. 🎉 🛡️ ✈️)
  color           varchar(7),                       -- hex from tabung form palette (e.g. #6bcf7f)
  template_type   varchar(50),                      -- 'tabung_raya','emergency','holiday','gadget','down_payment','custom'
  auto_save       boolean       default false,      -- "Monthly automatic savings" toggle on /tabung/new/form
  unique (account_id)
);
```

### Table: `wallet_accounts`

```sql
create table public.wallet_accounts (
  id              uuid          primary key default gen_random_uuid(),
  account_id      uuid          not null references public.accounts(id) on delete cascade,
  opening_balance numeric(12,2) default 0.00,
  current_balance numeric(12,2) default 0.00,
  unique (account_id)
);
```

---

### Table: `transactions`

```sql
create type transaction_type as enum (
  'expense', 'income', 'transfer', 'tabung_topup', 'tabung_withdraw'
);

create table public.transactions (
  id              uuid              primary key default gen_random_uuid(),
  user_id         uuid              not null references public.profiles(id) on delete cascade,
  type            transaction_type  not null,
  name            varchar(100)      not null,
  amount          numeric(12,2)     not null check (amount > 0),
  category        varchar(50),
  from_account_id uuid              references public.accounts(id) on delete set null,
  to_account_id   uuid              references public.accounts(id) on delete set null,
  date            date              not null,
  note            text,
  receipt_url     text,                             -- Supabase Storage URL
  is_recurring    boolean           default false,
  recurring_id    uuid              references public.recurring_rules(id) on delete set null,
  created_at      timestamptz       default now(),
  updated_at      timestamptz       default now()
);
```

**Expense categories:** `food_drink` · `transport` · `bills` · `shopping` · `health` · `entertainment` · `others`
**Income categories:** `salary` · `freelance` · `gift` · `allowance` · `investment` · `rental` · `others`

> Category IDs above are the canonical values shown in `constants/categories.ts` and in the Analysis / Add-Transaction screens. Users may extend either list through the Settings → Manage Categories screen; those custom entries live in `custom_categories` and use the same `transaction_type` discriminator.

> **Transaction Detail popup** (Home → Recent Transactions → tap row) requires a join:  
> `transactions` + `accounts` (from & to) + `recurring_rules` (when `is_recurring = true`).  
> The `receipt_url` column drives the attached photo preview. Fetch via `fetchDetail()` in the repository.

---

### Table: `recurring_rules`

```sql
create type recurring_frequency as enum ('monthly', 'weekly', 'yearly');
create type recurring_status    as enum ('active', 'paused', 'ended');
create type reminder_offset     as enum ('none', 'same_day', '1_day', '3_days', '1_week');

create table public.recurring_rules (
  id              uuid                primary key default gen_random_uuid(),
  user_id         uuid                not null references public.profiles(id) on delete cascade,
  type            transaction_type    not null check (type in ('expense','income')),
  name            varchar(100)        not null,
  amount          numeric(12,2)       not null check (amount > 0),
  category        varchar(50),
  from_account_id uuid                references public.accounts(id) on delete set null,
  to_account_id   uuid                references public.accounts(id) on delete set null,
  frequency       recurring_frequency not null,
  start_date      date                not null,
  end_date        date,                             -- null = indefinite
  next_date       date,                             -- next scheduled occurrence, shown in Settings → Recurring list
  reminder_enabled boolean            default false,
  reminder_offset  reminder_offset    default 'none', -- chosen on Add-Transaction recurring section
  status          recurring_status    default 'active',
  last_applied_at timestamptz,
  created_at      timestamptz         default now(),
  updated_at      timestamptz         default now()
);
```

---

### Table: `assets`

```sql
create type asset_type as enum (
  'real_estate','stocks','unit_trust','fixed_deposit',
  'asb','gold','vehicle','business','others'
);

create table public.assets (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references public.profiles(id) on delete cascade,
  name            varchar(100) not null,
  type            asset_type  not null,
  icon            varchar(10),
  current_value   numeric(12,2) not null check (current_value >= 0),
  monthly_income  numeric(12,2) default 0.00,
  date_acquired   date,
  note            text,
  is_active       boolean     default true,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
```

---

### Table: `liabilities`

```sql
create type liability_type as enum (
  'mortgage','car_loan','credit_card','study_loan',
  'medical_loan','business_loan','others'
);

create table public.liabilities (
  id              uuid            primary key default gen_random_uuid(),
  user_id         uuid            not null references public.profiles(id) on delete cascade,
  name            varchar(100)    not null,
  type            liability_type  not null,
  icon            varchar(10),
  amount_owed     numeric(12,2)   not null check (amount_owed >= 0),
  monthly_payment numeric(12,2)   not null check (monthly_payment >= 0),
  interest_rate   numeric(5,2)    default 0.00,
  note            text,
  is_active       boolean         default true,
  created_at      timestamptz     default now(),
  updated_at      timestamptz     default now()
);
```

---

### Tables: `learn_projects` · `learn_entries` · `learn_entry_images`

```sql
create table public.learn_projects (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references public.profiles(id) on delete cascade,
  name        varchar(200) not null,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create table public.learn_entries (
  id          uuid        primary key default gen_random_uuid(),
  project_id  uuid        not null references public.learn_projects(id) on delete cascade,
  user_id     uuid        not null references public.profiles(id) on delete cascade,
  body        text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create table public.learn_entry_images (
  id          uuid        primary key default gen_random_uuid(),
  entry_id    uuid        not null references public.learn_entries(id) on delete cascade,
  storage_path text       not null,                 -- path in Supabase Storage bucket
  sort_order  int         default 0,
  created_at  timestamptz default now()
);
```

---

### Table: `notifications`

```sql
create type notification_type as enum (
  'expense','income','transfer','recurring','alert',
  'tabung','milestone','asset','cashflow','note','affirmation','project'
);

create table public.notifications (
  id                uuid              primary key default gen_random_uuid(),
  user_id           uuid              not null references public.profiles(id) on delete cascade,
  type              notification_type not null,
  emoji             varchar(10)       not null,
  message           text              not null,
  sub_text          text,
  is_read           boolean           default false,
  related_entity_id uuid,
  created_at        timestamptz       default now()
);
```

---

### Table: `affirmations`

```sql
create type affirmation_category as enum ('saving','investing','mindset','awareness');

create table public.affirmations (
  id        uuid                  primary key default gen_random_uuid(),
  category  affirmation_category  not null,
  quote     text                  not null,
  is_active boolean               default true,
  created_at timestamptz          default now()
);

create table public.affirmation_favourites (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references public.profiles(id) on delete cascade,
  affirmation_id  uuid        not null references public.affirmations(id) on delete cascade,
  created_at      timestamptz default now(),
  unique (user_id, affirmation_id)
);

-- User-authored affirmations from Settings → Affirmations → "Affirmation Words"
create table public.user_affirmations (
  id          uuid                  primary key default gen_random_uuid(),
  user_id     uuid                  not null references public.profiles(id) on delete cascade,
  text        varchar(280)          not null,
  category    affirmation_category  not null,    -- defaults to 'mindset' when "All" is selected
  is_active   boolean               default true,
  created_at  timestamptz           default now()
);
```

---

### Table: `settings`

```sql
create table public.settings (
  id                    uuid        primary key default gen_random_uuid(),
  user_id               uuid        not null references public.profiles(id) on delete cascade,
  -- App
  currency              varchar(5)  default 'RM',
  balance_visible       boolean     default true,
  -- Affirmations
  show_affirmations     boolean     default true,
  daily_reminder_time   time        default '08:00',
  affirmation_category  varchar(20) default 'all',
  -- Notification toggles
  notif_expense         boolean     default true,
  notif_income          boolean     default true,
  notif_transfer        boolean     default true,
  notif_recurring       boolean     default true,
  notif_alert           boolean     default true,
  notif_tabung          boolean     default true,
  notif_milestone       boolean     default true,
  notif_asset           boolean     default true,
  notif_cashflow        boolean     default true,
  notif_affirmation     boolean     default true,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now(),
  unique (user_id)
);
```

---

### Table: `custom_categories`

```sql
create table public.custom_categories (
  id              uuid            primary key default gen_random_uuid(),
  user_id         uuid            not null references public.profiles(id) on delete cascade,
  transaction_type text           not null check (transaction_type in ('expense','income')),
  name            varchar(50)     not null,
  icon            varchar(10),
  color           varchar(7),
  is_active       boolean         default true,
  created_at      timestamptz     default now()
);
```

---

## 🔒 Row Level Security (RLS)

Apply the same pattern to every user-owned table:

```sql
-- Enable RLS on every table
alter table public.profiles              enable row level security;
alter table public.auth_config           enable row level security;
alter table public.accounts              enable row level security;
alter table public.bank_accounts         enable row level security;
alter table public.tabung_accounts       enable row level security;
alter table public.wallet_accounts       enable row level security;
alter table public.transactions          enable row level security;
alter table public.recurring_rules       enable row level security;
alter table public.assets                enable row level security;
alter table public.liabilities           enable row level security;
alter table public.learn_projects        enable row level security;
alter table public.learn_entries         enable row level security;
alter table public.learn_entry_images    enable row level security;
alter table public.notifications         enable row level security;
alter table public.affirmation_favourites enable row level security;
alter table public.settings              enable row level security;
alter table public.custom_categories     enable row level security;

-- Pattern: user owns their own rows
-- Example for `accounts` – repeat for all user-owned tables:
create policy "users can read own accounts"
  on public.accounts for select
  using (auth.uid() = user_id);

create policy "users can insert own accounts"
  on public.accounts for insert
  with check (auth.uid() = user_id);

create policy "users can update own accounts"
  on public.accounts for update
  using (auth.uid() = user_id);

create policy "users can delete own accounts"
  on public.accounts for delete
  using (auth.uid() = user_id);

-- Public read for affirmations (shared content, no user_id)
alter table public.affirmations enable row level security;

create policy "affirmations are public"
  on public.affirmations for select
  using (is_active = true);

-- bank_accounts / tabung_accounts / wallet_accounts: join via accounts
create policy "users can read own bank_accounts"
  on public.bank_accounts for select
  using (
    exists (
      select 1 from public.accounts
      where accounts.id = bank_accounts.account_id
        and accounts.user_id = auth.uid()
    )
  );
-- (repeat insert/update/delete policies with the same exists() check)
```

---

## 🪣 Supabase Storage Buckets

```
Storage Buckets
│
├── avatars/                            # user profile pictures
│   └── {user_id}/avatar.jpg
│
├── receipts/                           # transaction receipt scans
│   └── {user_id}/{transaction_id}.jpg
│
└── learn-images/                       # learn entry images
    └── {user_id}/{entry_id}/{image_id}.jpg
```

```sql
-- Create buckets (run in Supabase dashboard or via API)
insert into storage.buckets (id, name, public)
values
  ('avatars',      'avatars',      false),
  ('receipts',     'receipts',     false),
  ('learn-images', 'learn-images', false);

-- RLS for avatars bucket: user can only access their own folder
create policy "user owns avatar"
  on storage.objects for all
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Same pattern for receipts and learn-images
```

**React Native Storage usage:**
```typescript
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';

// Pick and upload a learn entry image
const result = await ImagePicker.launchImageLibraryAsync({
  base64: true,
  quality: 0.8,
});

if (!result.canceled && result.assets[0].base64) {
  const path = `${userId}/${entryId}/${imageId}.jpg`;
  const { error } = await supabase.storage
    .from('learn-images')
    .upload(path, decode(result.assets[0].base64), {
      contentType: 'image/jpeg',
    });

  // Get signed URL (private bucket)
  const { data } = await supabase.storage
    .from('learn-images')
    .createSignedUrl(path, 60 * 60); // 1 hour
}
```

---

## ⚡ Supabase Edge Functions

### `cashflow-summary`
> Called by `/cashflow` screen to compute financial class, net worth, income statement.

```
POST /functions/v1/cashflow-summary
Authorization: Bearer <user_jwt>
Body: { "month": "2026-05" }

Response: {
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

### `analysis-monthly`
> Called by `/analysis` screen for charts and category breakdown.

```
POST /functions/v1/analysis-monthly
Authorization: Bearer <user_jwt>
Body: { "month": "2026-05" }

Response: {
  "income": 5000.00,
  "expenses": 3200.00,
  "net_savings": 1800.00,
  "savings_rate": 36.0,
  "expense_by_category": [
    { "category": "food_drink", "amount": 800.00, "percentage": 25.0 },
    ...
  ],
  "income_by_category": [ ... ],
  "monthly_trend": [
    { "month": "2026-01", "income": 4800.00, "expenses": 3100.00 },
    ...
  ]
}
```

---

## 🔗 Entity Relationship Overview

```
auth.users (Supabase Auth)
  └──1 profiles
        ├──1 auth_config
        ├──1 settings
        ├──< accounts
        │     ├──1 bank_accounts
        │     ├──1 tabung_accounts     ──> linked_bank_id → bank_accounts
        │     └──1 wallet_accounts
        ├──< transactions              ──> from/to account_id → accounts
        │     └──> recurring_id        ──> recurring_rules
        ├──< recurring_rules
        ├──< assets
        ├──< liabilities
        ├──< learn_projects
        │     └──< learn_entries
        │           └──< learn_entry_images  (paths in Storage: learn-images/)
        ├──< notifications
        ├──< affirmation_favourites    ──> affirmation_id → affirmations
        └──< custom_categories

affirmations  (shared, no user_id – public read)
```

---

## 📱 React Native Supabase Client Setup

### `src/lib/supabase.ts`
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

### `app/_layout.tsx`
```typescript
import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { supabase } from '@/src/lib/supabase';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    supabase.auth.onAuthStateChange((_event, session) => {
      const inAuthGroup = segments[0] === '(auth)';
      if (!session && !inAuthGroup) {
        router.replace('/(auth)/setup');
      } else if (session && inAuthGroup) {
        router.replace('/(main)');
      }
    });
  }, []);

  return <Stack />;
}
```

---

## 🔑 Auth Flow (React Native)

```
App Launch
  │
  ├── supabase.auth.getSession() → session exists?
  │     ├── YES → check expo-secure-store for PIN
  │     │           ├── PIN exists → show PIN / biometric screen
  │     │           └── No PIN    → show AuthSetup (Phase 1)
  │     └── NO  → supabase.auth.signInAnonymously()
  │                  └── create profile row via trigger
  │                        └── show AuthSetup (Phase 1)
  │
  ├── Phase 1 – PIN Setup
  │     └── Save PIN hash to auth_config (server)
  │           └── Save raw PIN to expo-secure-store (device)
  │                 └── Save fingerprint flag to auth_config + secure-store
  │
  ├── Phase 2 – Onboarding
  │     └── Save display_name → profiles.display_name
  │           └── Save accounts → accounts + bank/tabung/wallet tables
  │                 └── Set onboarding_done flag (AsyncStorage)
  │
  └── Main App
        └── All queries use session.user.id
              └── RLS automatically scopes to that user_id
```

---

## 📊 Computed / Derived Values

| Value | Formula |
|---|---|
| `total_balance` | `SUM(bank_accounts.current_balance)` + `SUM(wallet_accounts.current_balance)` |
| `tabung.saved_amount` | `SUM(transactions.amount WHERE type='tabung_topup')` − `SUM(... WHERE type='tabung_withdraw')` |
| `tabung.days_left` | `tabung_accounts.to_date` − `CURRENT_DATE` |
| `tabung.weekly_needed` | `(target_amount − saved_amount) / (days_left / 7.0)` |
| `net_cash_flow` | `SUM(income) − SUM(expense)` for a given month |
| `net_worth` | `SUM(assets.current_value)` − `SUM(liabilities.amount_owed)` |
| `passive_income` | `SUM(assets.monthly_income)` |
| `financial_class` | `passive_income > total_expenses` → rich; `SUM(monthly_payment) > 0` → middle; else → poor |
| `savings_rate` | `(net_cash_flow / total_income) × 100` |

> All heavy aggregations are computed inside **Edge Functions** and returned as a single payload – never computed on-device.

---

## 📦 TypeScript Model Example

```typescript
// src/models/transaction.ts

export type TransactionType =
  | 'expense'
  | 'income'
  | 'transfer'
  | 'tabung_topup'
  | 'tabung_withdraw';

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
```

---

## 🔄 Repository Pattern Example

```typescript
// src/repositories/transactionsRepository.ts
import { supabase } from '../lib/supabase';
import type { Transaction } from '../models/transaction';

export const transactionsRepository = {
  async fetchByMonth(year: number, month: number): Promise<Transaction[]> {
    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const end = new Date(year, month, 0).toISOString().split('T')[0]; // last day

    const { data, error } = await supabase
      .from('transactions')
      .select()
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: false });

    if (error) throw error;
    return data as Transaction[];
  },

  // Used by the Transaction Detail popup (tap row in Home Recent Transactions)
  // Joins recurring_rules so the popup can show frequency, start/end dates, reminder state
  async fetchDetail(id: string) {
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

    if (error) throw error;
    return data;
  },

  async addTransaction(tx: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>) {
    const { error } = await supabase.from('transactions').insert(tx);
    if (error) throw error;
  },

  async deleteTransaction(id: string) {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) throw error;
  },
};
```

---

## 🏷️ Enum Reference

| Enum | Values |
|---|---|
| `account_type` | `bank` · `tabung` · `wallet` |
| `transaction_type` | `expense` · `income` · `transfer` · `tabung_topup` · `tabung_withdraw` |
| `recurring_frequency` | `monthly` · `weekly` · `yearly` |
| `recurring_status` | `active` · `paused` · `ended` |
| `reminder_offset` | `none` · `same_day` · `1_day` · `3_days` · `1_week` |
| `financial_identity` (check) | `employee` · `entrepreneur` · `investor` · `business_owner` |
| `asset_type` | `real_estate` · `stocks` · `unit_trust` · `fixed_deposit` · `asb` · `gold` · `vehicle` · `business` · `others` |
| `liability_type` | `mortgage` · `car_loan` · `credit_card` · `study_loan` · `medical_loan` · `business_loan` · `others` |
| `notification_type` | `expense` · `income` · `transfer` · `recurring` · `alert` · `tabung` · `milestone` · `asset` · `cashflow` · `note` · `affirmation` · `project` |
| `affirmation_category` | `saving` · `investing` · `mindset` · `awareness` |

---

## 🏦 Malaysian Bank Presets (Seed Data)

```sql
-- Reference data, not user-specific
create table public.bank_presets (
  id    serial primary key,
  name  varchar(100) not null,
  color varchar(7)
);

insert into public.bank_presets (name, color) values
  ('Maybank',      '#F8C000'),
  ('CIMB',         '#C8102E'),
  ('Public Bank',  '#003087'),
  ('RHB',          '#005DAA'),
  ('Hong Leong',   '#E31837'),
  ('AmBank',       '#E4002B'),
  ('Bank Islam',   '#00704A'),
  ('BSN',          '#0033A0'),
  ('Bank Rakyat',  '#006633'),
  ('HSBC',         '#DB0011'),
  ('Affin',        '#003087'),
  ('Alliance',     '#0068B3'),
  ('Other Bank',   '#888888');
```

---

## ✅ Migration Run Order

```
supabase/migrations/
├── 001_init_schema.sql         -- all create table statements + triggers
├── 002_rls_policies.sql        -- all RLS enable + policy statements
├── 003_storage_buckets.sql     -- bucket creation + storage RLS
└── 004_seed_affirmations.sql   -- seed bank_presets + affirmations content
```

---

*Backend docs for Flowe · React Native (Expo) + Supabase · Dark theme · Accent `#C5FF00`*
