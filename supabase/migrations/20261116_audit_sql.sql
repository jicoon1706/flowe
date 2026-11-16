-- Audit fixes that need the database (AUDIT.md #18, #21, #30).
--
-- Checked against the live `flowe` project on 2026-11-16 (read-only; see
-- AUDIT.md "Live database check"). Every statement is idempotent
-- (`create or replace`, `if not exists`, a backfill that only fills nulls), so
-- running this file twice is safe.
--
-- All functions follow `adjust_account_balance`: `security invoker`, so RLS
-- keeps scoping every row to auth.uid(), with a fixed search_path.

-- ─── #18 part 1: atomic asset value changes ────────────────────────────────
--
-- An investment moves money into an asset. The app used to read
-- assets.current_value, add in JS and write it back, so two overlapping
-- writes could lose one, and deleting an investment never updated the month's
-- point on the trend chart. This does the arithmetic in one UPDATE (the row
-- lock serialises writers) and records the result as that month's value.
--
-- The floor at 0 keeps assets_current_value_check (current_value >= 0) true;
-- the JS it replaces floored the same way.

create or replace function public.adjust_asset_value(
  p_asset_id uuid,
  p_delta    numeric,
  p_month    date
)
returns numeric
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_value numeric;
  v_user  uuid;
  v_qty   numeric;
begin
  if p_asset_id is null then
    return null;
  end if;

  if p_delta is null or p_delta = 0 then
    select current_value into v_value from assets where id = p_asset_id;
    return v_value;
  end if;

  update assets
     set current_value = greatest(0, current_value + p_delta),
         updated_at    = now()
   where id = p_asset_id
  returning current_value, user_id, quantity into v_value, v_user, v_qty;

  -- Not ours (RLS hid it) or gone: nothing moved.
  if v_user is null then
    return null;
  end if;

  insert into asset_values (asset_id, user_id, month, value, quantity)
  values (p_asset_id, v_user, date_trunc('month', coalesce(p_month, current_date))::date, v_value, v_qty)
  on conflict (asset_id, month)
  do update set value = excluded.value, quantity = excluded.quantity, updated_at = now();

  return v_value;
end;
$$;

-- ─── #18 part 2: investments point at their asset by id ────────────────────
--
-- An investment is a transfer with no destination account; the asset it fed
-- was identified only by its name in `category`, so renaming the asset (or a
-- second asset with the same name) broke edits and deletes. `category` keeps
-- the name for display; `asset_id` is the link.

alter table public.transactions
  add column if not exists asset_id uuid references public.assets(id) on delete set null;

-- Link existing investments only where the name names exactly one of the
-- user's assets (all 5 in live data on 2026-11-16). Anything ambiguous stays
-- null and the app falls back to the name for it.
update public.transactions t
   set asset_id = a.id
  from public.assets a
 where t.asset_id is null
   and t.type = 'transfer'
   and t.to_account_id is null
   and a.user_id = t.user_id
   and a.name = t.category
   and (select count(*) from public.assets a2
         where a2.user_id = t.user_id and a2.name = t.category) = 1;

-- ─── #21: approving a recurring occurrence, all or nothing ─────────────────
--
-- The app created the transaction and then advanced the rule in a second
-- request; if the second failed, the same occurrence was offered again and
-- could be approved twice. Here the advance, the transaction and the balance
-- move commit together, and only while `p_occurrence` is still the one
-- awaiting approval — so a repeat approval returns null and does nothing.
-- `p_next_date` is computed by the app's tested addInterval.

create or replace function public.approve_recurring_occurrence(
  p_rule_id    uuid,
  p_occurrence date,
  p_next_date  date
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  r    recurring_rules%rowtype;
  v_tx uuid;
begin
  update recurring_rules
     set next_date = p_next_date, last_applied_at = now(), updated_at = now()
   where id = p_rule_id
     and coalesce(next_date, start_date) = p_occurrence
  returning * into r;

  -- Already approved (or skipped), not ours, or gone.
  if r.id is null then
    return null;
  end if;

  -- recurring_rules.type shares the transaction enum, but only expense and
  -- income have a defined effect here. Raising rolls back the advance too.
  if r.type not in ('expense', 'income') then
    raise exception 'approve_recurring_occurrence: unsupported rule type %', r.type;
  end if;

  insert into transactions (user_id, type, name, amount, category,
                            from_account_id, to_account_id, date, is_recurring, recurring_id)
  values (r.user_id, r.type, r.name, r.amount,
          coalesce(r.category, case when r.type = 'expense' then 'bills' else 'others' end),
          case when r.type = 'expense' then r.from_account_id end,
          case when r.type = 'income'  then r.to_account_id   end,
          p_occurrence, true, r.id)
  returning id into v_tx;

  perform adjust_account_balance(
    case when r.type = 'expense' then r.from_account_id else r.to_account_id end,
    case when r.type = 'expense' then -r.amount else r.amount end
  );

  return v_tx;
end;
$$;

-- ─── #30: the repair no longer clamps a tabung at 0 ────────────────────────
--
-- adjust_account_balance lets a jar go negative (e.g. a top-up deleted after
-- a withdrawal), but this repair used to floor it at 0, so the repair and the
-- everyday path disagreed and the shortfall vanished. It now reports the
-- truth, as it already does for bank and wallet accounts. Unchanged
-- otherwise; no live tabung was affected on 2026-11-16.

create or replace function public.recalculate_account_balances()
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_account record;
  v_delta numeric;
  v_fixed integer := 0;
begin
  for v_account in
    select id, type from accounts where user_id = auth.uid() and is_active = true
  loop
    select coalesce(sum(
      case
        -- Money out of this account.
        when t.from_account_id = v_account.id and t.type in ('expense', 'transfer', 'tabung_topup')
          then -t.amount
        -- Money into this account.
        when t.to_account_id = v_account.id and t.type in ('income', 'transfer', 'tabung_topup')
          then t.amount
        -- A withdrawal empties the jar (`to_account_id`) and pays out to the
        -- bank that funded it (`from_account_id`) — see applyBalanceEffect.
        when t.to_account_id = v_account.id and t.type = 'tabung_withdraw'
          then -t.amount
        when t.from_account_id = v_account.id and t.type = 'tabung_withdraw'
          then t.amount
        else 0
      end
    ), 0)
      into v_delta
      from transactions t
     where t.from_account_id = v_account.id
        or t.to_account_id = v_account.id;

    if v_account.type = 'bank' then
      update bank_accounts
         set current_balance = coalesce(opening_balance, 0) + v_delta
       where account_id = v_account.id;
    elsif v_account.type = 'wallet' then
      update wallet_accounts
         set current_balance = coalesce(opening_balance, 0) + v_delta
       where account_id = v_account.id;
    elsif v_account.type = 'tabung' then
      -- A jar has no opening balance: it starts empty and is only ever fed by
      -- top-ups. Not clamped: a negative jar is a real inconsistency the user
      -- should see, and adjust_account_balance doesn't clamp either.
      update tabung_accounts
         set saved_amount = v_delta
       where account_id = v_account.id;
    end if;

    v_fixed := v_fixed + 1;
  end loop;

  return v_fixed;
end;
$$;

grant execute on function public.adjust_asset_value(uuid, numeric, date) to authenticated, anon;
grant execute on function public.approve_recurring_occurrence(uuid, date, date) to authenticated, anon;
grant execute on function public.recalculate_account_balances() to authenticated, anon;
