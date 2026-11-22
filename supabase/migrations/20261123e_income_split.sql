-- Desktop L · Income split for one month, for the signed-in user.
--
-- Every % is of that month's income. Needs / Wants / Invest are rounded to
-- 1 dp and Left over = 100 − the three, so the four always add up to exactly
-- 100.0 (Left over is negative when overspent).
--
-- Investments & savings = money moved into a Tabung or an asset that month:
--   · tabung_topup (to_account_id = the jar)
--   · a transfer whose to_account is a tabung
--   · an investment = a transfer with no to_account (asset_id, or the legacy
--     asset name in category), EXCEPT into a KWSP asset.
-- Pay-outs (tabung_withdraw) are not netted off.
--
-- Suggestions (at most 3, in this order), as `kind` + figures; the copy lives
-- in the UI:
--   1. invest_below_target — Invest & save below target while money is left
--      over: amount = target − current, rounded up to whole RM.
--   2. unassigned          — Left over > 10% of income.
--   3. needs_over_target   — Needs above target: the biggest Needs category.
--   4. wants_over_target   — Wants above target: the biggest Wants category.
--
-- Scoped to auth.uid() (no user argument), caller rights, RLS applies.

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
begin
  if v_uid is null then
    raise exception 'income_split: not signed in' using errcode = '42501';
  end if;
  if p_month is null then
    raise exception 'income_split: month is required' using errcode = '22004';
  end if;

  select coalesce(s.split_needs_pct, 50), coalesce(s.split_wants_pct, 30), coalesce(s.split_invest_pct, 20)
    into t_needs, t_wants, t_invest
    from (select 1) one
    left join settings s on s.user_id = v_uid;

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
  spend as (
    select 'category'::text                  as kind,
           coalesce(t.category, 'others')    as key,
           coalesce(t.category, 'others')    as category,
           null::text                        as label,
           coalesce(g.split_group, 'skip')   as grp,
           sum(t.amount)                     as amount
      from month_tx t
      left join category_groups g
        on g.user_id = v_uid and g.category = coalesce(t.category, 'others')
     where t.type = 'expense'
     group by coalesce(t.category, 'others'), coalesce(g.split_group, 'skip')
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
  'Income split for the month containing p_month, for auth.uid(): buckets, rows, % of income, ≤3 suggestions. Caller rights; RLS applies.';

revoke all on function public.income_split(date) from public, anon;
grant execute on function public.income_split(date) to authenticated;
