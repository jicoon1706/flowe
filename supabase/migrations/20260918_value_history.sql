-- Month-by-month value history for assets and liabilities.
--
-- The balance-sheet trend used to be rebuilt from `assets.current_value` on
-- every request, so editing an asset in September rewrote August, July and
-- every earlier month too — there was nothing else to build them from. That
-- makes growth impossible to track: the chart only ever showed the present,
-- copied backwards.
--
-- Each row here is "what this asset/liability was worth as of this month".
-- One row per (asset, month); saving the same month again overwrites it.
-- Months with no row inherit the most recent earlier one, so a value only
-- ever changes when the user records a new one for that month.

create table if not exists public.asset_values (
  id          uuid          primary key default gen_random_uuid(),
  asset_id    uuid          not null references public.assets(id) on delete cascade,
  user_id     uuid          not null references public.profiles(id) on delete cascade,
  -- Always the 1st of the month; the check keeps a stray day-of-month out.
  month       date          not null check (month = date_trunc('month', month)::date),
  value       numeric(12,2) not null check (value >= 0),
  -- Mirrors assets.quantity so a gold holding's weight is tracked too.
  quantity    numeric(16,4),
  created_at  timestamptz   default now(),
  updated_at  timestamptz   default now(),
  unique (asset_id, month)
);

create table if not exists public.liability_values (
  id            uuid          primary key default gen_random_uuid(),
  liability_id  uuid          not null references public.liabilities(id) on delete cascade,
  user_id       uuid          not null references public.profiles(id) on delete cascade,
  month         date          not null check (month = date_trunc('month', month)::date),
  amount_owed   numeric(12,2) not null check (amount_owed >= 0),
  created_at    timestamptz   default now(),
  updated_at    timestamptz   default now(),
  unique (liability_id, month)
);

create index if not exists asset_values_user_month_idx on public.asset_values (user_id, month);
create index if not exists liability_values_user_month_idx on public.liability_values (user_id, month);

comment on table public.asset_values is
  'Value of an asset as of a given month (1st of month). Missing months carry the previous value forward.';
comment on table public.liability_values is
  'Amount owed on a liability as of a given month (1st of month). Missing months carry the previous value forward.';

-- RLS: each user sees and writes only their own history.
alter table public.asset_values enable row level security;
alter table public.liability_values enable row level security;

drop policy if exists "users manage their own asset values" on public.asset_values;
create policy "users manage their own asset values"
  on public.asset_values for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "users manage their own liability values" on public.liability_values;
create policy "users manage their own liability values"
  on public.liability_values for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Backfill: every existing asset/liability gets one row at the month it was
-- acquired (or created, when no date was given) holding its present value —
-- the same picture the old trend painted, but now it stays put.
insert into public.asset_values (asset_id, user_id, month, value, quantity)
select
  a.id,
  a.user_id,
  date_trunc('month', coalesce(a.date_acquired, a.created_at::date))::date,
  a.current_value,
  a.quantity
from public.assets a
where a.is_active = true
on conflict (asset_id, month) do nothing;

insert into public.liability_values (liability_id, user_id, month, amount_owed)
select
  l.id,
  l.user_id,
  date_trunc('month', l.created_at::date)::date,
  l.amount_owed
from public.liabilities l
where l.is_active = true
on conflict (liability_id, month) do nothing;
