-- AUDIT-2026-11 B10: a tabung's starting amount survives "Recalculate balances".
--
-- A tabung created with a starting amount (onboarding, Add Tabung) wrote that
-- amount straight into saved_amount with no transaction behind it. The repair
-- rebuilt a jar as Σ transactions only, so the starting amount vanished. A jar
-- now has an opening amount, exactly like bank/wallet opening_balance, and the
-- repair starts from it.
--
-- Idempotent: `if not exists`, a backfill that only touches rows still at 0,
-- and `create or replace`. Apply this before shipping the app build that sends
-- opening_amount on create.

-- ─── 1. The column ──────────────────────────────────────────────────────────

alter table public.tabung_accounts
  add column if not exists opening_amount numeric not null default 0;

comment on column public.tabung_accounts.opening_amount is
  'Money already in the jar when it was created (the starting amount). '
  'recalculate_account_balances rebuilds saved_amount as opening_amount + Σ transactions.';

-- ─── 2. Backfill existing jars ──────────────────────────────────────────────
--
-- Whatever saved_amount holds beyond what its transactions explain is the
-- starting amount, so the next Recalculate leaves the jar where it is.
-- Floored at 0: a jar holding *less* than its transactions explain has
-- drifted the other way, and the repair should still fix that rather than
-- freeze it in. A jar whose starting amount was already wiped by an earlier
-- Recalculate can't be recovered here (nothing records it).

update public.tabung_accounts ta
   set opening_amount = greatest(0, coalesce(ta.saved_amount, 0) - coalesce(flows.delta, 0))
  from (
    select a.id as account_id,
           coalesce(sum(case
             when t.to_account_id = a.id and t.type in ('income', 'transfer', 'tabung_topup') then t.amount
             when t.from_account_id = a.id and t.type in ('expense', 'transfer', 'tabung_topup') then -t.amount
             when t.to_account_id = a.id and t.type = 'tabung_withdraw' then -t.amount
             when t.from_account_id = a.id and t.type = 'tabung_withdraw' then t.amount
             else 0
           end), 0) as delta
      from public.accounts a
      left join public.transactions t
        on t.from_account_id = a.id or t.to_account_id = a.id
     where a.type = 'tabung'
     group by a.id
  ) flows
 where ta.account_id = flows.account_id
   and ta.opening_amount = 0;

-- ─── 3. The repair starts a jar from its opening amount ─────────────────────
--
-- Same function as 20261116_audit_sql.sql; only the tabung branch changes
-- (`opening_amount + v_delta` instead of `v_delta`).

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
      -- Starts from the jar's opening amount (AUDIT-2026-11 B10). Not
      -- clamped: a negative jar is a real inconsistency the user should see.
      update tabung_accounts
         set saved_amount = coalesce(opening_amount, 0) + v_delta
       where account_id = v_account.id;
    end if;

    v_fixed := v_fixed + 1;
  end loop;

  return v_fixed;
end;
$$;

grant execute on function public.recalculate_account_balances() to authenticated, anon;
