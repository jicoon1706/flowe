-- Account balances, moved server-side.
--
-- Until now a transaction's balance impact was applied from the client as a
-- read-modify-write: SELECT current_balance, add the delta in JS, UPDATE. That
-- is safe only while one writer exists, and auto-detect gave us several. Every
-- captured bank alert starts its own headless JS task (`AutoFileTaskService`),
-- and the foreground app files from the same queue at the same time, so two
-- payments landing seconds apart would both read the pre-payment balance and
-- the second UPDATE would overwrite the first. Both transaction rows exist, but
-- the account only moved by one of them — which is exactly the drift a user
-- sees as "my transactions match the bank, my balance doesn't".
--
-- `adjust_account_balance` does the same arithmetic in a single UPDATE, so
-- Postgres' row lock serialises concurrent writers and no delta can be lost.
-- `recalculate_account_balances` repairs balances that already drifted.
--
-- Both run as `security invoker`, so RLS still scopes every row to auth.uid()
-- and a user can only ever move their own accounts.

-- ─── Atomic adjustment ──────────────────────────────────────────────────────

create or replace function public.adjust_account_balance(
  p_account_id uuid,
  p_delta numeric
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_type text;
begin
  if p_account_id is null or p_delta is null or p_delta = 0 then
    return;
  end if;

  select type into v_type from accounts where id = p_account_id;
  -- Not ours, or gone: RLS already hid it, and there is nothing to move.
  if v_type is null then
    return;
  end if;

  if v_type = 'bank' then
    update bank_accounts
       set current_balance = coalesce(current_balance, 0) + p_delta
     where account_id = p_account_id;
  elsif v_type = 'wallet' then
    update wallet_accounts
       set current_balance = coalesce(current_balance, 0) + p_delta
     where account_id = p_account_id;
  elsif v_type = 'tabung' then
    update tabung_accounts
       set saved_amount = coalesce(saved_amount, 0) + p_delta
     where account_id = p_account_id;
  end if;
end;
$$;

-- ─── Repair ─────────────────────────────────────────────────────────────────
--
-- Rebuilds every active account from its opening balance plus the effect of
-- every transaction that touches it. This is the truth the incremental path is
-- supposed to arrive at, so it is also the fix for any account that fell behind
-- while the client did the arithmetic.
--
-- Note it discards a balance the user typed in by hand on the account screen:
-- that writes `current_balance` without moving `opening_balance`, so there is no
-- record of the correction to preserve. The UI says so before running it.

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
      -- top-ups.
      update tabung_accounts
         set saved_amount = greatest(0, v_delta)
       where account_id = v_account.id;
    end if;

    v_fixed := v_fixed + 1;
  end loop;

  return v_fixed;
end;
$$;

grant execute on function public.adjust_account_balance(uuid, numeric) to authenticated, anon;
grant execute on function public.recalculate_account_balances() to authenticated, anon;
