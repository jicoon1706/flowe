-- Backfill tabung_accounts.monthly_topup (AUDIT-2026-11-22 T1 / T8).
--
-- 20261124 added monthly_topup without filling it, and update_tabung requires
-- it to be above 0. Every Tabung made before that migration (and any made
-- since without a monthly amount) has NULL, so its first Edit asks for one.
--
-- Fill it with the Tabung's own plan: target ÷ the months from the start date
-- to the target date (both months counted), rounded UP to the cent. Rounding up
-- keeps the client rule "target date follows target ÷ monthly top-up"
-- (tabungPlan.targetMonthFor: months = ceil(target / monthly), ending in month
-- from + months − 1) on the stored target month, so nothing moves when Edit
-- opens.
--
-- Left as NULL on purpose (Edit still asks for these):
--   * target_amount ≤ 0 or NULL: there is no plan to derive;
--   * from_date / to_date NULL or to_date before from_date.
-- Never overwrites a value that is already set. Idempotent. No schema, RLS,
-- function or grant change; the existing check (monthly_topup > 0) holds,
-- since target > 0 and months ≥ 1 give at least RM 0.01.

update public.tabung_accounts ta
   set monthly_topup = ceil(ta.target_amount * 100 / plan.months) / 100
  from (
    select account_id,
           ((extract(year from to_date) - extract(year from from_date)) * 12
            + (extract(month from to_date) - extract(month from from_date)) + 1)::int as months
      from public.tabung_accounts
     where from_date is not null and to_date is not null and to_date >= from_date
  ) plan
 where plan.account_id = ta.account_id
   and ta.monthly_topup is null
   and ta.target_amount > 0;
