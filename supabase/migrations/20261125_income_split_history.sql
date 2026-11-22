-- Income split history: past months keep the groups and targets they had.
--
-- Until now income_split(p_month) applied TODAY's targets (settings.split_*)
-- and TODAY's category_groups to every month, so editing groups rewrote
-- history. This adds a per-user snapshot table and makes income_split read
-- the snapshot in force for the month it is asked about.
--
-- Rules
--   · One row per (user, effective_month). A row applies from its month on,
--     until the next row. effective_month = '-infinity' is "always before".
--   · save_income_split_groups writes the row for the CURRENT month
--     (Asia/Kuala_Lumpur), so a save in November applies from November on and
--     October and earlier keep what they had. Saving twice in one month
--     overwrites that month's row.
--   · The first save of a user with no history also stores the state BEFORE
--     the save as the '-infinity' row. No backfill is needed: a user with no
--     history row gets today's tables, exactly as before this migration.
--   · income_split takes the latest row with effective_month <= the month;
--     with none, it falls back to settings + category_groups (unchanged).
--   · Reset all data clears the history with everything else.
-- Signatures and the JSON income_split returns are unchanged.
--
-- Idempotent. RLS: four policies, auth.uid() = user_id, like category_groups.

-- ─── 1. Table ───────────────────────────────────────────────────────────────

create table if not exists public.income_split_history (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references public.profiles(id) on delete cascade,
  effective_month date        not null,
  needs           smallint    not null,
  wants           smallint    not null,
  invest          smallint    not null,
  -- {"food": "needs", "shopping": "wants", "health": "skip", …}; missing = skip.
  groups          jsonb       not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id, effective_month),
  constraint income_split_history_targets_check check (
    needs  between 0 and 100 and
    wants  between 0 and 100 and
    invest between 0 and 100 and
    needs + wants + invest = 100),
  constraint income_split_history_groups_check check (jsonb_typeof(groups) = 'object'),
  constraint income_split_history_month_check check (
    effective_month = '-infinity'::date or effective_month = date_trunc('month', effective_month)::date)
);

comment on table public.income_split_history is
  'Income split: the groups and targets in force from effective_month on (''-infinity'' = before the first change). Written by save_income_split_groups; read by income_split.';

alter table public.income_split_history enable row level security;

drop policy if exists "income_split_history select own" on public.income_split_history;
create policy "income_split_history select own" on public.income_split_history
  for select using (auth.uid() = user_id);
drop policy if exists "income_split_history insert own" on public.income_split_history;
create policy "income_split_history insert own" on public.income_split_history
  for insert with check (auth.uid() = user_id);
drop policy if exists "income_split_history update own" on public.income_split_history;
create policy "income_split_history update own" on public.income_split_history
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "income_split_history delete own" on public.income_split_history;
create policy "income_split_history delete own" on public.income_split_history
  for delete using (auth.uid() = user_id);

revoke all on public.income_split_history from anon;
grant select, insert, update, delete on public.income_split_history to authenticated;

-- ─── 2. Save groups + targets: also snapshot them ───────────────────────────
--
-- Body as 20261123c (checked against the live function on 2026-11-22) plus
-- the snapshot steps marked "new".

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
  v_uid   uuid := auth.uid();
  -- new: the user's current month, in Malaysia time.
  v_month date := date_trunc('month', now() at time zone 'Asia/Kuala_Lumpur')::date;
begin
  if v_uid is null then
    raise exception 'save_income_split_groups: not signed in' using errcode = '42501';
  end if;
  if p_needs is null or p_wants is null or p_invest is null
     or p_needs < 0 or p_wants < 0 or p_invest < 0
     or p_needs + p_wants + p_invest <> 100 then
    raise exception 'Targets must add up to 100%%' using errcode = '23514';
  end if;

  -- new: first change ever → keep the state before it for every earlier month.
  if not exists (select 1 from income_split_history where user_id = v_uid) then
    insert into income_split_history (user_id, effective_month, needs, wants, invest, groups)
    select v_uid, '-infinity'::date,
           coalesce(s.split_needs_pct, 50), coalesce(s.split_wants_pct, 30), coalesce(s.split_invest_pct, 20),
           coalesce((select jsonb_object_agg(g.category, g.split_group)
                       from category_groups g where g.user_id = v_uid), '{}'::jsonb)
      from (select 1) one
      left join settings s on s.user_id = v_uid;
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

  -- new: the state after the save applies from this month on.
  insert into income_split_history (user_id, effective_month, needs, wants, invest, groups)
  values (v_uid, v_month, p_needs, p_wants, p_invest,
          coalesce((select jsonb_object_agg(g.category, g.split_group)
                      from category_groups g where g.user_id = v_uid), '{}'::jsonb))
  on conflict (user_id, effective_month) do update
    set needs      = excluded.needs,
        wants      = excluded.wants,
        invest     = excluded.invest,
        groups     = excluded.groups,
        updated_at = now();
end;
$$;

revoke all on function public.save_income_split_groups(jsonb, smallint, smallint, smallint) from public, anon;
grant execute on function public.save_income_split_groups(jsonb, smallint, smallint, smallint) to authenticated;

-- ─── 3. income_split: read the snapshot in force for the month ──────────────
--
-- Body as 20261123e (checked against the live function on 2026-11-22). Changed:
-- where the targets come from, and which group a category counts towards
-- (marked "new"). Everything else, including the JSON shape, is unchanged.

create or replace function public.income_split(p_month date)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_start  date := date_trunc('month', p_month)::date;
  v_end    date := (date_trunc('month', p_month) + interval '1 month')::date;
  v_income numeric;
  t_needs  int; t_wants int; t_invest int;
  v_needs  numeric; v_wants numeric; v_invest numeric; v_left numeric;
  p_needs  numeric; p_wants numeric; p_invest numeric; p_left numeric;
  v_rows   jsonb;
  v_sugg   jsonb := '[]'::jsonb;
  v_gap    numeric;
  v_big    record;
  v_hist   record;          -- new
  v_groups jsonb;           -- new: null = use category_groups (no history)
begin
  if v_uid is null then
    raise exception 'income_split: not signed in' using errcode = '42501';
  end if;
  if p_month is null then
    raise exception 'income_split: month is required' using errcode = '22004';
  end if;

  -- new: the snapshot in force for this month, if the user has any.
  select h.needs, h.wants, h.invest, h.groups
    into v_hist
    from income_split_history h
   where h.user_id = v_uid and h.effective_month <= v_start
   order by h.effective_month desc
   limit 1;

  if found then
    t_needs := v_hist.needs; t_wants := v_hist.wants; t_invest := v_hist.invest;
    v_groups := v_hist.groups;
  else
    select coalesce(s.split_needs_pct, 50), coalesce(s.split_wants_pct, 30), coalesce(s.split_invest_pct, 20)
      into t_needs, t_wants, t_invest
      from (select 1) one
      left join settings s on s.user_id = v_uid;
  end if;

  select coalesce(sum(amount), 0) into v_income
    from transactions
   where user_id = v_uid and type = 'income' and date >= v_start and date < v_end;

  if v_income <= 0 then
    return jsonb_build_object(
      'month', v_start, 'state', 'empty', 'income', 0,
      'targets', jsonb_build_object('needs', t_needs, 'wants', t_wants, 'invest', t_invest),
      'buckets', null, 'rows', '[]'::jsonb, 'suggestions', '[]'::jsonb);
  end if;

  with month_tx as (
    select t.*
      from transactions t
     where t.user_id = v_uid and t.date >= v_start and t.date < v_end
  ),
  spend_tx as (             -- new: the group comes from the snapshot when there is one
    select coalesce(t.category, 'others') as cat,
           t.amount,
           case when v_groups is not null
                then coalesce(v_groups ->> coalesce(t.category, 'others'), 'skip')
                else coalesce(g.split_group, 'skip')
           end as grp
      from month_tx t
      left join category_groups g
        on v_groups is null and g.user_id = v_uid and g.category = coalesce(t.category, 'others')
     where t.type = 'expense'
  ),
  spend as (
    select 'category'::text as kind,
           s.cat            as key,
           s.cat            as category,
           null::text       as label,
           s.grp            as grp,
           sum(s.amount)    as amount
      from spend_tx s
     group by s.cat, s.grp
  ),
  into_tabung as (
    select 'tabung'::text                as kind,
           'tabung:' || a.id::text       as key,
           null::text                    as category,
           'Tabung · ' || a.name         as label,
           'invest'::text                as grp,
           sum(t.amount)                 as amount
      from month_tx t
      join accounts a on a.id = t.to_account_id and a.type = 'tabung'
     where t.type in ('tabung_topup', 'transfer')
     group by a.id, a.name
  ),
  into_asset as (
    select 'asset'::text                                          as kind,
           'asset:' || coalesce(t.asset_id::text, t.category, '') as key,
           null::text                                             as category,
           coalesce(x.name, t.category, 'Investment') || ' top-up' as label,
           'invest'::text                                         as grp,
           sum(t.amount)                                          as amount
      from month_tx t
      left join assets x on x.id = t.asset_id
     where t.type = 'transfer'
       and t.to_account_id is null
       and (x.id is null or x.type <> 'kwsp')
     group by coalesce(t.asset_id::text, t.category, ''), coalesce(x.name, t.category, 'Investment')
  ),
  all_rows as (
    select * from spend where grp <> 'skip'
    union all select * from into_tabung
    union all select * from into_asset
  )
  select coalesce(sum(amount) filter (where grp = 'needs'), 0),
         coalesce(sum(amount) filter (where grp = 'wants'), 0),
         coalesce(sum(amount) filter (where grp = 'invest'), 0),
         coalesce(jsonb_agg(jsonb_build_object(
             'kind', kind, 'key', key, 'category', category, 'label', label, 'group', grp,
             'amount', amount, 'pct', round(amount * 100 / v_income, 1))
           order by case grp when 'needs' then 1 when 'wants' then 2 else 3 end, amount desc, key), '[]'::jsonb)
    into v_needs, v_wants, v_invest, v_rows
    from all_rows;

  v_left   := v_income - v_needs - v_wants - v_invest;
  p_needs  := round(v_needs  * 100 / v_income, 1);
  p_wants  := round(v_wants  * 100 / v_income, 1);
  p_invest := round(v_invest * 100 / v_income, 1);
  p_left   := 100 - p_needs - p_wants - p_invest;

  -- 1. Invest & save below target, while something is left over.
  v_gap := round(v_income * t_invest / 100.0, 2) - v_invest;
  if p_invest < t_invest and v_left > 0 and v_gap > 0 then
    v_sugg := v_sugg || jsonb_build_array(jsonb_build_object(
      'kind', 'invest_below_target',
      'amount', ceil(v_gap),
      'target_pct', t_invest,
      'current_pct', p_invest,
      'target_amount', round(v_income * t_invest / 100.0, 2)));
  end if;

  -- 2. More than 10% of income not assigned.
  if p_left > 10 then
    v_sugg := v_sugg || jsonb_build_array(jsonb_build_object(
      'kind', 'unassigned', 'amount', v_left, 'pct', p_left));
  end if;

  -- 3. Needs above target → the biggest Needs category.
  if p_needs > t_needs then
    select r->>'category' as category, (r->>'amount')::numeric as amount
      into v_big
      from jsonb_array_elements(v_rows) r
     where r->>'group' = 'needs'
     order by (r->>'amount')::numeric desc
     limit 1;
    v_sugg := v_sugg || jsonb_build_array(jsonb_build_object(
      'kind', 'needs_over_target', 'category', v_big.category, 'amount', v_big.amount,
      'pct', p_needs, 'target_pct', t_needs));
  end if;

  -- 4. Wants above target → the biggest Wants category.
  if p_wants > t_wants then
    select r->>'category' as category, (r->>'amount')::numeric as amount
      into v_big
      from jsonb_array_elements(v_rows) r
     where r->>'group' = 'wants'
     order by (r->>'amount')::numeric desc
     limit 1;
    v_sugg := v_sugg || jsonb_build_array(jsonb_build_object(
      'kind', 'wants_over_target', 'category', v_big.category, 'amount', v_big.amount,
      'pct', p_wants, 'target_pct', t_wants));
  end if;

  -- At most 3, in rule order.
  select coalesce(jsonb_agg(e.s order by e.i), '[]'::jsonb)
    into v_sugg
    from (select s, i from jsonb_array_elements(v_sugg) with ordinality as x(s, i) order by i limit 3) e;

  return jsonb_build_object(
    'month',   v_start,
    'state',   case when v_left < 0 then 'overspent' else 'ok' end,
    'income',  v_income,
    'targets', jsonb_build_object('needs', t_needs, 'wants', t_wants, 'invest', t_invest),
    'buckets', jsonb_build_object(
      'needs',  jsonb_build_object('amount', v_needs,  'pct', p_needs),
      'wants',  jsonb_build_object('amount', v_wants,  'pct', p_wants),
      'invest', jsonb_build_object('amount', v_invest, 'pct', p_invest),
      'left',   jsonb_build_object('amount', v_left,   'pct', p_left)),
    'rows',        v_rows,
    'suggestions', v_sugg);
end;
$$;

comment on function public.income_split(date) is
  'Income split for the month containing p_month, for auth.uid(): buckets, rows, % of income, ≤3 suggestions. Groups and targets as in force that month (income_split_history), else today''s. Caller rights; RLS applies.';

revoke all on function public.income_split(date) from public, anon;
grant execute on function public.income_split(date) to authenticated;

-- ─── 4. Reset all data also clears the history ──────────────────────────────
--
-- Body as 20261123c (checked against the live function on 2026-11-22) plus the
-- line marked "new".

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
  delete from income_split_history    where user_id = uid;  -- new (split history)
  delete from category_groups         where user_id = uid;
  perform seed_default_category_groups(uid);
end;
$$;

revoke all on function public.reset_user_data() from public, anon;
grant execute on function public.reset_user_data() to authenticated;
