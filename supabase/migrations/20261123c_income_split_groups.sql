-- Desktop L · Income split: per-user category → Needs / Wants / Skip, and
-- the split targets.
--
-- `category` is the value transactions.category holds: a built-in slug
-- ('food', 'bills', …) or a custom category's name. No row = Skip, so new and
-- custom categories count as Skip until the user moves them.
--
-- Idempotent. RLS: four policies, auth.uid() = user_id, like every other
-- user-owned table (docs/sql/002_rls_policies.sql).

-- ─── 1. category_groups ─────────────────────────────────────────────────────

create table if not exists public.category_groups (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references public.profiles(id) on delete cascade,
  category    varchar(50) not null,
  split_group text        not null check (split_group in ('needs', 'wants', 'skip')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, category)
);

comment on table public.category_groups is
  'Income split: which group (needs / wants / skip) each expense category counts towards. Missing = skip.';

alter table public.category_groups enable row level security;

drop policy if exists "category_groups select own" on public.category_groups;
create policy "category_groups select own" on public.category_groups
  for select using (auth.uid() = user_id);
drop policy if exists "category_groups insert own" on public.category_groups;
create policy "category_groups insert own" on public.category_groups
  for insert with check (auth.uid() = user_id);
drop policy if exists "category_groups update own" on public.category_groups;
create policy "category_groups update own" on public.category_groups
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "category_groups delete own" on public.category_groups;
create policy "category_groups delete own" on public.category_groups
  for delete using (auth.uid() = user_id);

revoke all on public.category_groups from anon;
grant select, insert, update, delete on public.category_groups to authenticated;

-- ─── 2. Targets on settings ─────────────────────────────────────────────────
--
-- Like monthly_budget. Settings rows are created lazily, so a missing row
-- means 50 / 30 / 20. The check is the server-side "must total 100" rule.

alter table public.settings
  add column if not exists split_needs_pct  smallint not null default 50,
  add column if not exists split_wants_pct  smallint not null default 30,
  add column if not exists split_invest_pct smallint not null default 20;

alter table public.settings drop constraint if exists settings_split_targets_check;
alter table public.settings add  constraint settings_split_targets_check check (
  split_needs_pct  between 0 and 100 and
  split_wants_pct  between 0 and 100 and
  split_invest_pct between 0 and 100 and
  split_needs_pct + split_wants_pct + split_invest_pct = 100
);

comment on column public.settings.split_needs_pct is 'Income split target for Needs, % of income. Needs + Wants + Invest = 100.';
comment on column public.settings.split_wants_pct is 'Income split target for Wants, % of income.';
comment on column public.settings.split_invest_pct is 'Income split target for Investments & savings, % of income.';

-- ─── 3. Default groups ──────────────────────────────────────────────────────
--
-- Needs = Food & Drink, Bills, Transport; Wants = Shopping, Entertainment
-- (the app's "Leisure"). A custom category literally named Groceries / Leisure
-- joins Needs / Wants. Health, Others and every other category stay Skip.
-- SECURITY DEFINER because it runs from the profiles trigger; it takes a user
-- id, so no client role may call it.

create or replace function public.seed_default_category_groups(p_user uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.category_groups (user_id, category, split_group)
  values (p_user, 'food', 'needs'),
         (p_user, 'bills', 'needs'),
         (p_user, 'transport', 'needs'),
         (p_user, 'shopping', 'wants'),
         (p_user, 'entertainment', 'wants')
  on conflict (user_id, category) do nothing;

  insert into public.category_groups (user_id, category, split_group)
  select distinct on (c.name) c.user_id, c.name,
         case when lower(c.name) = 'groceries' then 'needs' else 'wants' end
    from public.custom_categories c
   where c.user_id = p_user
     and c.transaction_type = 'expense'
     and lower(c.name) in ('groceries', 'leisure')
  on conflict (user_id, category) do nothing;
$$;

revoke all on function public.seed_default_category_groups(uuid) from public, anon, authenticated;

-- On signup. Every user (anonymous ones included) gets a profiles row from
-- handle_new_user; seeding from a trigger on profiles leaves that function
-- untouched.
create or replace function public.profiles_seed_category_groups()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.seed_default_category_groups(new.id);
  return new;
end;
$$;

revoke all on function public.profiles_seed_category_groups() from public, anon, authenticated;

drop trigger if exists profiles_seed_category_groups on public.profiles;
create trigger profiles_seed_category_groups
  after insert on public.profiles
  for each row execute function public.profiles_seed_category_groups();

-- Existing users.
select public.seed_default_category_groups(p.id) from public.profiles p;

-- ─── 4. Save groups + targets together (Edit groups drawer) ─────────────────
--
-- p_groups: [{"category": "food", "group": "needs"}, …]. All or nothing.

create or replace function public.save_income_split_groups(
  p_groups jsonb,
  p_needs  smallint,
  p_wants  smallint,
  p_invest smallint
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'save_income_split_groups: not signed in' using errcode = '42501';
  end if;
  if p_needs is null or p_wants is null or p_invest is null
     or p_needs < 0 or p_wants < 0 or p_invest < 0
     or p_needs + p_wants + p_invest <> 100 then
    raise exception 'Targets must add up to 100%%' using errcode = '23514';
  end if;

  insert into settings (user_id, split_needs_pct, split_wants_pct, split_invest_pct)
  values (v_uid, p_needs, p_wants, p_invest)
  on conflict (user_id) do update
    set split_needs_pct  = excluded.split_needs_pct,
        split_wants_pct  = excluded.split_wants_pct,
        split_invest_pct = excluded.split_invest_pct,
        updated_at       = now();

  insert into category_groups (user_id, category, split_group)
  select v_uid, g->>'category', g->>'group'
    from jsonb_array_elements(coalesce(p_groups, '[]'::jsonb)) g
   where coalesce(g->>'category', '') <> ''
  on conflict (user_id, category) do update
    set split_group = excluded.split_group, updated_at = now();
end;
$$;

revoke all on function public.save_income_split_groups(jsonb, smallint, smallint, smallint) from public, anon;
grant execute on function public.save_income_split_groups(jsonb, smallint, smallint, smallint) to authenticated;

-- ─── 5. Reset all data clears the groups, then restores the defaults ────────
--
-- profiles survives a reset, so the signup trigger won't fire again. Same body
-- as 20261120_reset_user_data.sql (checked against the live function on
-- 2026-11-21) plus the two marked lines.

create or replace function public.reset_user_data()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'reset_user_data: not signed in' using errcode = '42501';
  end if;

  -- Transactions first: they reference accounts, rules and assets.
  delete from transactions            where user_id = uid;
  delete from recurring_rules         where user_id = uid;
  delete from notifications           where user_id = uid;
  delete from learn_projects          where user_id = uid;  -- cascades entries and their images
  delete from learn_entries           where user_id = uid;  -- any orphaned by an older client
  delete from user_affirmations       where user_id = uid;
  delete from affirmation_favourites  where user_id = uid;
  delete from custom_categories       where user_id = uid;
  delete from merchant_logo_requests  where user_id = uid;
  delete from assets                  where user_id = uid;  -- cascades asset_values
  delete from liabilities             where user_id = uid;  -- cascades liability_values
  delete from accounts                where user_id = uid;  -- cascades bank / wallet / tabung rows
  delete from settings                where user_id = uid;
  delete from auth_config             where user_id = uid;
  delete from desktop_pairings        where user_id = uid;
  delete from category_groups         where user_id = uid;  -- new (Desktop L)
  perform seed_default_category_groups(uid);                -- new (Desktop L)
end;
$$;

revoke all on function public.reset_user_data() from public, anon;
grant execute on function public.reset_user_data() to authenticated;
