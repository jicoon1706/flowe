-- Flowe Migration 001: Initial Schema
-- Run order: 001 → 002 → 003 → 004

BEGIN;

-- ============================================
-- DROP EXISTING TYPES (for re-runs)
-- ============================================
drop type if exists financial_identity;
drop type if exists affirmation_category;
drop type if exists notification_type;
drop type if exists liability_type;
drop type if exists asset_type;
drop type if exists reminder_offset;
drop type if exists recurring_status;
drop type if exists recurring_frequency;
drop type if exists transaction_type;
drop type if exists account_type;

-- ============================================
-- ENUMS
-- ============================================

-- ============================================
-- DROP EXISTING TABLES (for clean re-runs)
-- ============================================
drop table if exists public.bank_presets cascade;
drop table if exists public.custom_categories cascade;
drop table if exists public.settings cascade;
drop table if exists public.user_affirmations cascade;
drop table if exists public.affirmation_favourites cascade;
drop table if exists public.affirmations cascade;
drop table if exists public.notifications cascade;
drop table if exists public.learn_entry_images cascade;
drop table if exists public.learn_entries cascade;
drop table if exists public.learn_projects cascade;
drop table if exists public.liabilities cascade;
drop table if exists public.assets cascade;
drop table if exists public.recurring_rules cascade;
drop table if exists public.transactions cascade;
drop table if exists public.wallet_accounts cascade;
drop table if exists public.tabung_accounts cascade;
drop table if exists public.bank_accounts cascade;
drop table if exists public.accounts cascade;
drop table if exists public.auth_config cascade;
drop table if exists public.profiles cascade;

drop function if exists public.handle_new_user cascade;
drop trigger if exists on_auth_user_created on auth.users;
create type account_type as enum ('bank', 'tabung', 'wallet');
create type transaction_type as enum (
  'expense', 'income', 'transfer', 'tabung_topup', 'tabung_withdraw'
);
create type recurring_frequency as enum ('monthly', 'weekly', 'yearly');
create type recurring_status as enum ('active', 'paused', 'ended');
create type reminder_offset as enum ('none', 'same_day', '1_day', '3_days', '1_week');
create type asset_type as enum (
  'real_estate', 'stocks', 'unit_trust', 'fixed_deposit',
  'asb', 'gold', 'vehicle', 'business', 'others'
);
create type liability_type as enum (
  'mortgage', 'car_loan', 'credit_card', 'study_loan',
  'medical_loan', 'business_loan', 'others'
);
create type notification_type as enum (
  'expense', 'income', 'transfer', 'recurring', 'alert',
  'tabung', 'milestone', 'asset', 'cashflow', 'note', 'affirmation', 'project'
);
create type affirmation_category as enum ('saving', 'investing', 'mindset', 'awareness');
create type financial_identity as enum ('employee', 'entrepreneur', 'investor', 'business_owner');

-- ============================================
-- PROFILES (auto-created via trigger on auth.users)
-- ============================================
create table public.profiles (
  id                 uuid          primary key references auth.users(id) on delete cascade,
  display_name       varchar(30)   not null,
  financial_identity financial_identity,
  avatar_url         text,
  member_since       timestamptz   default now(),
  updated_at         timestamptz   default now()
);

-- Auto-create profile on sign-up
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

-- ============================================
-- AUTH_CONFIG (server-side PIN hash)
-- ============================================
create table public.auth_config (
  id                 uuid        primary key default gen_random_uuid(),
  user_id            uuid        not null references public.profiles(id) on delete cascade,
  pin_hash           text        not null,
  fingerprint_enabled boolean     default false,
  auto_lock_minutes  int         default 5,  -- null = "Never"
  updated_at         timestamptz default now(),
  unique (user_id)
);

-- ============================================
-- ACCOUNTS (base table for bank/tabung/wallet)
-- ============================================
create table public.accounts (
  id         uuid          primary key default gen_random_uuid(),
  user_id    uuid          not null references public.profiles(id) on delete cascade,
  type       account_type  not null,
  name       varchar(100)  not null,
  icon       varchar(10),
  color      varchar(7),                        -- hex e.g. #C5FF00
  is_active  boolean       default true,
  created_at timestamptz   default now(),
  updated_at timestamptz   default now()
);

-- ============================================
-- BANK_ACCOUNTS
-- ============================================
create table public.bank_accounts (
  id              uuid          primary key default gen_random_uuid(),
  account_id      uuid          not null references public.accounts(id) on delete cascade,
  bank_name       varchar(100)  not null,
  account_number  varchar(30),                    -- store last 4 digits only
  opening_balance numeric(12,2) default 0.00,
  current_balance numeric(12,2) default 0.00,
  unique (account_id)
);

-- ============================================
-- TABUNG_ACCOUNTS
-- ============================================
create table public.tabung_accounts (
  id             uuid          primary key default gen_random_uuid(),
  account_id     uuid          not null references public.accounts(id) on delete cascade,
  target_amount  numeric(12,2) not null,
  saved_amount   numeric(12,2) default 0.00,
  from_date      date          not null,
  to_date        date          not null,
  linked_bank_id uuid          references public.bank_accounts(id) on delete set null,
  description    text,
  icon           varchar(10),                    -- emoji e.g. 🎉 🛡️ ✈️
  color          varchar(7),                     -- hex from tabung palette
  template_type  varchar(50),                     -- 'tabung_raya','emergency','holiday','gadget','down_payment','custom'
  auto_save      boolean       default false,      -- "Monthly automatic savings"
  unique (account_id)
);

-- ============================================
-- WALLET_ACCOUNTS
-- ============================================
create table public.wallet_accounts (
  id              uuid          primary key default gen_random_uuid(),
  account_id      uuid          not null references public.accounts(id) on delete cascade,
  opening_balance numeric(12,2) default 0.00,
  current_balance numeric(12,2) default 0.00,
  unique (account_id)
);

-- ============================================
-- RECURRING_RULES
-- ============================================
create table public.recurring_rules (
  id               uuid                primary key default gen_random_uuid(),
  user_id          uuid                not null references public.profiles(id) on delete cascade,
  type             transaction_type    not null check (type in ('expense', 'income')),
  name             varchar(100)        not null,
  amount           numeric(12,2)       not null check (amount > 0),
  category         varchar(50),
  from_account_id  uuid                references public.accounts(id) on delete set null,
  to_account_id    uuid                references public.accounts(id) on delete set null,
  frequency        recurring_frequency not null,
  start_date       date                not null,
  end_date         date,                            -- null = indefinite
  next_date        date,                            -- next scheduled occurrence
  reminder_enabled boolean            default false,
  reminder_offset  reminder_offset    default 'none',
  status           recurring_status    default 'active',
  last_applied_at  timestamptz,
  created_at       timestamptz         default now(),
  updated_at       timestamptz         default now()
);

-- ============================================
-- TRANSACTIONS
-- ============================================
create table public.transactions (
  id              uuid              primary key default gen_random_uuid(),
  user_id         uuid              not null references public.profiles(id) on delete cascade,
  type            transaction_type  not null,
  name            varchar(100)      not null,
  amount          numeric(12,2)    not null check (amount > 0),
  category        varchar(50),
  from_account_id uuid              references public.accounts(id) on delete set null,
  to_account_id   uuid              references public.accounts(id) on delete set null,
  date            date              not null,
  note            text,
  receipt_url     text,
  is_recurring    boolean           default false,
  recurring_id    uuid              references public.recurring_rules(id) on delete set null,
  created_at      timestamptz       default now(),
  updated_at      timestamptz       default now()
);

-- ============================================
-- ASSETS
-- ============================================
create table public.assets (
  id             uuid        primary key default gen_random_uuid(),
  user_id        uuid        not null references public.profiles(id) on delete cascade,
  name           varchar(100) not null,
  type           asset_type  not null,
  icon           varchar(10),
  current_value  numeric(12,2) not null check (current_value >= 0),
  monthly_income numeric(12,2) default 0.00,
  date_acquired  date,
  note           text,
  is_active      boolean     default true,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

-- ============================================
-- LIABILITIES
-- ============================================
create table public.liabilities (
  id              uuid            primary key default gen_random_uuid(),
  user_id         uuid            not null references public.profiles(id) on delete cascade,
  name            varchar(100)    not null,
  type            liability_type  not null,
  icon            varchar(10),
  amount_owed     numeric(12,2)   not null check (amount_owed >= 0),
  monthly_payment numeric(12,2)  not null check (monthly_payment >= 0),
  interest_rate   numeric(5,2)    default 0.00,
  note            text,
  is_active       boolean         default true,
  created_at      timestamptz     default now(),
  updated_at      timestamptz     default now()
);

-- ============================================
-- LEARN PROJECTS / ENTRIES / IMAGES
-- ============================================
create table public.learn_projects (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references public.profiles(id) on delete cascade,
  name       varchar(200) not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.learn_entries (
  id         uuid        primary key default gen_random_uuid(),
  project_id uuid        not null references public.learn_projects(id) on delete cascade,
  user_id    uuid        not null references public.profiles(id) on delete cascade,
  body       text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.learn_entry_images (
  id          uuid        primary key default gen_random_uuid(),
  entry_id    uuid        not null references public.learn_entries(id) on delete cascade,
  storage_path text       not null,   -- path in Supabase Storage bucket
  sort_order  int         default 0,
  created_at  timestamptz default now()
);

-- ============================================
-- NOTIFICATIONS
-- ============================================
create table public.notifications (
  id               uuid              primary key default gen_random_uuid(),
  user_id          uuid              not null references public.profiles(id) on delete cascade,
  type             notification_type not null,
  emoji            varchar(10)       not null,
  message          text              not null,
  sub_text         text,
  is_read          boolean           default false,
  related_entity_id uuid,
  created_at       timestamptz       default now()
);

-- ============================================
-- AFFIRMATIONS (public read, no user_id)
-- ============================================
create table public.affirmations (
  id         uuid                  primary key default gen_random_uuid(),
  category   affirmation_category  not null,
  quote      text                  not null,
  is_active  boolean               default true,
  created_at timestamptz           default now()
);

create table public.affirmation_favourites (
  id             uuid        primary key default gen_random_uuid(),
  user_id        uuid        not null references public.profiles(id) on delete cascade,
  affirmation_id uuid        not null references public.affirmations(id) on delete cascade,
  created_at     timestamptz default now(),
  unique (user_id, affirmation_id)
);

-- User-authored affirmations (Settings → Affirmations → "Affirmation Words")
create table public.user_affirmations (
  id         uuid                  primary key default gen_random_uuid(),
  user_id    uuid                  not null references public.profiles(id) on delete cascade,
  text       varchar(280)          not null,
  category   affirmation_category  not null default 'mindset',
  is_active  boolean               default true,
  created_at timestamptz           default now()
);

-- ============================================
-- SETTINGS
-- ============================================
create table public.settings (
  id                    uuid        primary key default gen_random_uuid(),
  user_id               uuid        not null references public.profiles(id) on delete cascade,
  currency              varchar(5)  default 'RM',
  balance_visible       boolean     default true,
  show_affirmations     boolean     default true,
  daily_reminder_time   time       default '08:00',
  affirmation_category  varchar(20) default 'all',
  notif_expense         boolean     default true,
  notif_income          boolean     default true,
  notif_transfer       boolean     default true,
  notif_recurring       boolean     default true,
  notif_alert           boolean     default true,
  notif_tabung          boolean     default true,
  notif_milestone       boolean     default true,
  notif_asset           boolean     default true,
  notif_cashflow        boolean     default true,
  notif_affirmation     boolean     default true,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now(),
  unique (user_id)
);

-- ============================================
-- CUSTOM_CATEGORIES
-- ============================================
create table public.custom_categories (
  id              uuid            primary key default gen_random_uuid(),
  user_id         uuid            not null references public.profiles(id) on delete cascade,
  transaction_type text           not null check (transaction_type in ('expense', 'income')),
  name            varchar(50)     not null,
  icon            varchar(10),
  color           varchar(7),
  is_active       boolean         default true,
  created_at      timestamptz     default now()
);

-- ============================================
-- BANK_PRESETS (reference table, not user-specific)
-- ============================================
create table public.bank_presets (
  id    serial primary key,
  name  varchar(100) not null,
  color varchar(7)
);

COMMIT;