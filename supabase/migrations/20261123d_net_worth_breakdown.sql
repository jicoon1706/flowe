-- Desktop K · Net worth = cash in accounts + every asset − every liability.
--
-- The ONE net worth computation: the Cashflow info hero, its breakdown and the
-- Cashflow Net worth card (current month) all read it. Cash = bank + wallet +
-- tabung balances of active accounts, the definition CashflowInfoPage used.
-- Shares are % of total assets to 1 dp, largest-remainder rounded so they add
-- up to exactly 100.0.
--
-- Caller rights: RLS applies, and every source is also filtered to auth.uid().

create or replace function public.net_worth_breakdown()
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
with cash as (
  select count(*)::int as n,
         coalesce(sum(coalesce(b.current_balance, w.current_balance, t.saved_amount, 0)), 0) as total
    from accounts a
    left join bank_accounts   b on a.type = 'bank'   and b.account_id = a.id
    left join wallet_accounts w on a.type = 'wallet' and w.account_id = a.id
    left join tabung_accounts t on a.type = 'tabung' and t.account_id = a.id
   where a.user_id = auth.uid() and a.is_active
),
groups as (
  select 'cash'::text as key, total, n from cash
  union all
  select type::text, sum(current_value), count(*)::int
    from assets
   where user_id = auth.uid() and is_active
   group by type
),
tot as (
  select coalesce(sum(total), 0) as assets from groups
),
shares as (
  select g.key, g.total, g.n, tot.assets,
         case when tot.assets > 0 then g.total * 1000 / tot.assets else 0 end as tenths
    from groups g, tot
),
ranked as (
  select s.*,
         floor(s.tenths) as base,
         row_number() over (order by s.tenths - floor(s.tenths) desc, s.total desc) as rn,
         (case when s.assets > 0 then 1000 else 0 end) - sum(floor(s.tenths)) over () as spare
    from shares s
),
liab as (
  select id, name, type::text as type, amount_owed
    from liabilities
   where user_id = auth.uid() and is_active
)
select jsonb_build_object(
  'total_assets',      (select assets from tot),
  'total_liabilities', coalesce((select sum(amount_owed) from liab), 0),
  'net_worth',         (select assets from tot) - coalesce((select sum(amount_owed) from liab), 0),
  'cash_accounts',     (select n from cash),
  'groups', coalesce((
     select jsonb_agg(jsonb_build_object(
              'key', key, 'total', total, 'count', n,
              'share_pct', (base + case when rn <= spare then 1 else 0 end) / 10.0)
            order by (key = 'cash') desc, total desc)
       from ranked), '[]'::jsonb),
  'liabilities', coalesce((
     select jsonb_agg(jsonb_build_object('id', id, 'name', name, 'type', type, 'amount_owed', amount_owed)
            order by amount_owed desc)
       from liab), '[]'::jsonb)
);
$$;

comment on function public.net_worth_breakdown() is
  'Net worth now: cash + assets by type (with share of total assets) − liabilities. Caller rights; RLS applies.';

revoke all on function public.net_worth_breakdown() from public, anon;
grant execute on function public.net_worth_breakdown() to authenticated;
