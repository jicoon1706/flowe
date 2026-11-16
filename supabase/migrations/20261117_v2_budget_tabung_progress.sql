-- Flowe v2: monthly budget, live budget updates, Tabung progress that keeps moving.
--
-- 1. settings.monthly_budget   — optional monthly spending limit (Settings › Budget).
-- 2. settings.live_budget_mode — what the pinned Android live update shows:
--      'off' | 'daily' | 'monthly' | 'both'. Default 'daily'.
-- 3. tabung_accounts.progress_mode — how a Tabung's ring is computed:
--      'contributed' (default): sum of tabung_topup since from_date ÷ target.
--                               Pay-outs never pull it back.
--      'balance':               saved_amount ÷ target.
-- 4. tabung_monthly_flows view + tabung_contributed() function. Both run with
--    the caller's rights (security_invoker / security invoker), so the
--    transactions RLS policy (user_id = auth.uid()) still decides what is seen.
--
-- Additive only: no existing column, row or policy changes.

alter table public.settings
  add column if not exists monthly_budget numeric(12, 2)
    check (monthly_budget is null or monthly_budget > 0);

comment on column public.settings.monthly_budget is
  'Intended spend per month, in RM. Null = no monthly limit.';

alter table public.settings
  add column if not exists live_budget_mode text not null default 'daily'
    check (live_budget_mode in ('off', 'daily', 'monthly', 'both'));

comment on column public.settings.live_budget_mode is
  'Pinned live budget notification (Android): off | daily | monthly | both.';

alter table public.tabung_accounts
  add column if not exists progress_mode text not null default 'contributed'
    check (progress_mode in ('contributed', 'balance'));

comment on column public.tabung_accounts.progress_mode is
  'contributed = Σ tabung_topup since from_date ÷ target (pay-outs never reduce it); balance = saved_amount ÷ target.';

-- Money into and out of each Tabung, per calendar month. A top-up and a
-- pay-out both name the Tabung in to_account_id (see applyBalanceEffect).
create or replace view public.tabung_monthly_flows
  with (security_invoker = true) as
select
  t.user_id,
  t.to_account_id                                                    as account_id,
  date_trunc('month', t.date)::date                                  as month,
  coalesce(sum(t.amount) filter (where t.type = 'tabung_topup'), 0)    as topped_up,
  coalesce(sum(t.amount) filter (where t.type = 'tabung_withdraw'), 0) as paid_out
from public.transactions t
where t.type in ('tabung_topup', 'tabung_withdraw')
  and t.to_account_id is not null
group by t.user_id, t.to_account_id, date_trunc('month', t.date);

comment on view public.tabung_monthly_flows is
  'Per Tabung and month: topped_up (tabung_topup) and paid_out (tabung_withdraw). Caller rights; RLS applies.';

-- Total contributed to a Tabung since a date (its from_date): the numerator of
-- the default progress ring.
create or replace function public.tabung_contributed(p_account_id uuid, p_since date)
returns numeric
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(sum(t.amount), 0)
  from public.transactions t
  where t.to_account_id = p_account_id
    and t.type = 'tabung_topup'
    and t.date >= p_since;
$$;

comment on function public.tabung_contributed(uuid, date) is
  'Σ tabung_topup into a Tabung on or after p_since. Caller rights; RLS applies.';

revoke all on function public.tabung_contributed(uuid, date) from public, anon;
grant execute on function public.tabung_contributed(uuid, date) to authenticated;

revoke all on public.tabung_monthly_flows from public, anon;
grant select on public.tabung_monthly_flows to authenticated;
