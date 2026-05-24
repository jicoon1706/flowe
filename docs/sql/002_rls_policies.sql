-- Flowe Migration 002: Row Level Security Policies
-- Requires 001_init_schema.sql to have run first

BEGIN;

-- ============================================
-- ENABLE RLS ON ALL USER-OWNED TABLES
-- ============================================
alter table public.profiles              enable row level security;
alter table public.auth_config           enable row level security;
alter table public.accounts              enable row level security;
alter table public.bank_accounts         enable row level security;
alter table public.tabung_accounts        enable row level security;
alter table public.wallet_accounts        enable row level security;
alter table public.transactions           enable row level security;
alter table public.recurring_rules        enable row level security;
alter table public.assets                 enable row level security;
alter table public.liabilities            enable row level security;
alter table public.learn_projects         enable row level security;
alter table public.learn_entries          enable row level security;
alter table public.learn_entry_images     enable row level security;
alter table public.notifications           enable row level security;
alter table public.affirmation_favourites enable row level security;
alter table public.user_affirmations     enable row level security;
alter table public.settings              enable row level security;
alter table public.custom_categories      enable row level security;

-- ============================================
-- PROFILES RLS
-- ============================================
create policy "profiles select own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles update own" on public.profiles
  for update using (auth.uid() = id);

-- ============================================
-- AUTH_CONFIG RLS
-- ============================================
create policy "auth_config select own" on public.auth_config
  for select using (auth.uid() = user_id);

create policy "auth_config insert own" on public.auth_config
  for insert with check (auth.uid() = user_id);

create policy "auth_config update own" on public.auth_config
  for update using (auth.uid() = user_id);

create policy "auth_config delete own" on public.auth_config
  for delete using (auth.uid() = user_id);

-- ============================================
-- ACCOUNTS RLS
-- ============================================
create policy "accounts select own" on public.accounts
  for select using (auth.uid() = user_id);

create policy "accounts insert own" on public.accounts
  for insert with check (auth.uid() = user_id);

create policy "accounts update own" on public.accounts
  for update using (auth.uid() = user_id);

create policy "accounts delete own" on public.accounts
  for delete using (auth.uid() = user_id);

-- ============================================
-- BANK_ACCOUNTS RLS (join via accounts)
-- ============================================
create policy "bank_accounts select own" on public.bank_accounts
  for select using (
    exists (
      select 1 from public.accounts
      where accounts.id = bank_accounts.account_id
        and accounts.user_id = auth.uid()
    )
  );

create policy "bank_accounts insert own" on public.bank_accounts
  for insert with check (
    exists (
      select 1 from public.accounts
      where accounts.id = bank_accounts.account_id
        and accounts.user_id = auth.uid()
    )
  );

create policy "bank_accounts update own" on public.bank_accounts
  for update using (
    exists (
      select 1 from public.accounts
      where accounts.id = bank_accounts.account_id
        and accounts.user_id = auth.uid()
    )
  );

create policy "bank_accounts delete own" on public.bank_accounts
  for delete using (
    exists (
      select 1 from public.accounts
      where accounts.id = bank_accounts.account_id
        and accounts.user_id = auth.uid()
    )
  );

-- ============================================
-- TABUNG_ACCOUNTS RLS
-- ============================================
create policy "tabung_accounts select own" on public.tabung_accounts
  for select using (
    exists (
      select 1 from public.accounts
      where accounts.id = tabung_accounts.account_id
        and accounts.user_id = auth.uid()
    )
  );

create policy "tabung_accounts insert own" on public.tabung_accounts
  for insert with check (
    exists (
      select 1 from public.accounts
      where accounts.id = tabung_accounts.account_id
        and accounts.user_id = auth.uid()
    )
  );

create policy "tabung_accounts update own" on public.tabung_accounts
  for update using (
    exists (
      select 1 from public.accounts
      where accounts.id = tabung_accounts.account_id
        and accounts.user_id = auth.uid()
    )
  );

create policy "tabung_accounts delete own" on public.tabung_accounts
  for delete using (
    exists (
      select 1 from public.accounts
      where accounts.id = tabung_accounts.account_id
        and accounts.user_id = auth.uid()
    )
  );

-- ============================================
-- WALLET_ACCOUNTS RLS
-- ============================================
create policy "wallet_accounts select own" on public.wallet_accounts
  for select using (
    exists (
      select 1 from public.accounts
      where accounts.id = wallet_accounts.account_id
        and accounts.user_id = auth.uid()
    )
  );

create policy "wallet_accounts insert own" on public.wallet_accounts
  for insert with check (
    exists (
      select 1 from public.accounts
      where accounts.id = wallet_accounts.account_id
        and accounts.user_id = auth.uid()
    )
  );

create policy "wallet_accounts update own" on public.wallet_accounts
  for update using (
    exists (
      select 1 from public.accounts
      where accounts.id = wallet_accounts.account_id
        and accounts.user_id = auth.uid()
    )
  );

create policy "wallet_accounts delete own" on public.wallet_accounts
  for delete using (
    exists (
      select 1 from public.accounts
      where accounts.id = wallet_accounts.account_id
        and accounts.user_id = auth.uid()
    )
  );

-- ============================================
-- TRANSACTIONS RLS
-- ============================================
create policy "transactions select own" on public.transactions
  for select using (auth.uid() = user_id);

create policy "transactions insert own" on public.transactions
  for insert with check (auth.uid() = user_id);

create policy "transactions update own" on public.transactions
  for update using (auth.uid() = user_id);

create policy "transactions delete own" on public.transactions
  for delete using (auth.uid() = user_id);

-- ============================================
-- RECURRING_RULES RLS
-- ============================================
create policy "recurring_rules select own" on public.recurring_rules
  for select using (auth.uid() = user_id);

create policy "recurring_rules insert own" on public.recurring_rules
  for insert with check (auth.uid() = user_id);

create policy "recurring_rules update own" on public.recurring_rules
  for update using (auth.uid() = user_id);

create policy "recurring_rules delete own" on public.recurring_rules
  for delete using (auth.uid() = user_id);

-- ============================================
-- ASSETS RLS
-- ============================================
create policy "assets select own" on public.assets
  for select using (auth.uid() = user_id);

create policy "assets insert own" on public.assets
  for insert with check (auth.uid() = user_id);

create policy "assets update own" on public.assets
  for update using (auth.uid() = user_id);

create policy "assets delete own" on public.assets
  for delete using (auth.uid() = user_id);

-- ============================================
-- LIABILITIES RLS
-- ============================================
create policy "liabilities select own" on public.liabilities
  for select using (auth.uid() = user_id);

create policy "liabilities insert own" on public.liabilities
  for insert with check (auth.uid() = user_id);

create policy "liabilities update own" on public.liabilities
  for update using (auth.uid() = user_id);

create policy "liabilities delete own" on public.liabilities
  for delete using (auth.uid() = user_id);

-- ============================================
-- LEARN_PROJECTS RLS
-- ============================================
create policy "learn_projects select own" on public.learn_projects
  for select using (auth.uid() = user_id);

create policy "learn_projects insert own" on public.learn_projects
  for insert with check (auth.uid() = user_id);

create policy "learn_projects update own" on public.learn_projects
  for update using (auth.uid() = user_id);

create policy "learn_projects delete own" on public.learn_projects
  for delete using (auth.uid() = user_id);

-- ============================================
-- LEARN_ENTRIES RLS
-- ============================================
create policy "learn_entries select own" on public.learn_entries
  for select using (auth.uid() = user_id);

create policy "learn_entries insert own" on public.learn_entries
  for insert with check (auth.uid() = user_id);

create policy "learn_entries update own" on public.learn_entries
  for update using (auth.uid() = user_id);

create policy "learn_entries delete own" on public.learn_entries
  for delete using (auth.uid() = user_id);

-- ============================================
-- LEARN_ENTRY_IMAGES RLS
-- ============================================
create policy "learn_entry_images select own" on public.learn_entry_images
  for select using (
    exists (
      select 1 from public.learn_entries le
      join public.learn_projects lp on lp.id = le.project_id
      where le.id = learn_entry_images.entry_id
        and lp.user_id = auth.uid()
    )
  );

create policy "learn_entry_images insert own" on public.learn_entry_images
  for insert with check (
    exists (
      select 1 from public.learn_entries le
      join public.learn_projects lp on lp.id = le.project_id
      where le.id = learn_entry_images.entry_id
        and lp.user_id = auth.uid()
    )
  );

create policy "learn_entry_images delete own" on public.learn_entry_images
  for delete using (
    exists (
      select 1 from public.learn_entries le
      join public.learn_projects lp on lp.id = le.project_id
      where le.id = learn_entry_images.entry_id
        and lp.user_id = auth.uid()
    )
  );

-- ============================================
-- NOTIFICATIONS RLS
-- ============================================
create policy "notifications select own" on public.notifications
  for select using (auth.uid() = user_id);

create policy "notifications insert own" on public.notifications
  for insert with check (auth.uid() = user_id);

create policy "notifications update own" on public.notifications
  for update using (auth.uid() = user_id);

create policy "notifications delete own" on public.notifications
  for delete using (auth.uid() = user_id);

-- ============================================
-- AFFIRMATION_FAVOURITES RLS
-- ============================================
create policy "affirmation_favourites select own" on public.affirmation_favourites
  for select using (auth.uid() = user_id);

create policy "affirmation_favourites insert own" on public.affirmation_favourites
  for insert with check (auth.uid() = user_id);

create policy "affirmation_favourites delete own" on public.affirmation_favourites
  for delete using (auth.uid() = user_id);

-- ============================================
-- USER_AFFIRMATIONS RLS
-- ============================================
create policy "user_affirmations select own" on public.user_affirmations
  for select using (auth.uid() = user_id);

create policy "user_affirmations insert own" on public.user_affirmations
  for insert with check (auth.uid() = user_id);

create policy "user_affirmations update own" on public.user_affirmations
  for update using (auth.uid() = user_id);

create policy "user_affirmations delete own" on public.user_affirmations
  for delete using (auth.uid() = user_id);

-- ============================================
-- SETTINGS RLS
-- ============================================
create policy "settings select own" on public.settings
  for select using (auth.uid() = user_id);

create policy "settings insert own" on public.settings
  for insert with check (auth.uid() = user_id);

create policy "settings update own" on public.settings
  for update using (auth.uid() = user_id);

create policy "settings delete own" on public.settings
  for delete using (auth.uid() = user_id);

-- ============================================
-- CUSTOM_CATEGORIES RLS
-- ============================================
create policy "custom_categories select own" on public.custom_categories
  for select using (auth.uid() = user_id);

create policy "custom_categories insert own" on public.custom_categories
  for insert with check (auth.uid() = user_id);

create policy "custom_categories update own" on public.custom_categories
  for update using (auth.uid() = user_id);

create policy "custom_categories delete own" on public.custom_categories
  for delete using (auth.uid() = user_id);

-- ============================================
-- AFFIRMATIONS (public read - no user_id)
-- ============================================
alter table public.affirmations enable row level security;

create policy "affirmations public read" on public.affirmations
  for select using (is_active = true);

-- ============================================
-- BANK_PRESETS (public read - reference data)
-- ============================================
alter table public.bank_presets enable row level security;

create policy "bank_presets public read" on public.bank_presets
  for select using (true);

COMMIT;