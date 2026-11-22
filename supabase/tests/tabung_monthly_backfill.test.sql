-- Backfill of tabung_accounts.monthly_topup (migration 20261124c).
--
-- Same harness as tabung_edit.test.sql: ONE transaction that never commits.
-- It inserts throwaway rows, runs the migration's UPDATE, checks the results,
-- then raises 'PASS: …' so everything rolls back (any failed check raises
-- 'FAIL: …' first). Safe to run on any project that has 20261124 applied.
--
-- Expected result: an error whose message starts with "PASS:".

begin;

insert into auth.users (id, aud, role, email, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-4000-8000-0000000000c3', 'authenticated', 'authenticated', 'mb-test@example.invalid', '{}', now(), now());

insert into public.accounts (id, user_id, type, name)
values ('00000000-0000-4000-8000-00000000c301', '00000000-0000-4000-8000-0000000000c3', 'tabung', 'Plan 3 months'),
       ('00000000-0000-4000-8000-00000000c302', '00000000-0000-4000-8000-0000000000c3', 'tabung', 'Same month'),
       ('00000000-0000-4000-8000-00000000c303', '00000000-0000-4000-8000-0000000000c3', 'tabung', 'No target'),
       ('00000000-0000-4000-8000-00000000c304', '00000000-0000-4000-8000-0000000000c3', 'tabung', 'Already set'),
       ('00000000-0000-4000-8000-00000000c305', '00000000-0000-4000-8000-0000000000c3', 'tabung', 'Across a year');

insert into public.tabung_accounts (account_id, target_amount, saved_amount, from_date, to_date, monthly_topup)
values ('00000000-0000-4000-8000-00000000c301', 1000,   0, '2026-01-15', '2026-03-31', null),  -- 3 months → 333.34
       ('00000000-0000-4000-8000-00000000c302',  500,   0, '2026-05-01', '2026-05-31', null),  -- 1 month  → 500.00
       ('00000000-0000-4000-8000-00000000c303',    0,   0, '2026-01-01', '2026-12-31', null),  -- stays NULL
       ('00000000-0000-4000-8000-00000000c304', 1200,   0, '2026-01-01', '2026-12-31', 75),    -- kept at 75
       ('00000000-0000-4000-8000-00000000c305', 2400, 100, '2026-11-01', '2027-10-31', null);  -- 12 months → 200.00

-- The migration, verbatim.
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

do $$
declare v numeric;
begin
  select monthly_topup into v from public.tabung_accounts where account_id = '00000000-0000-4000-8000-00000000c301';
  assert v = 333.34, format('FAIL 3-month plan: %s', v);
  -- ceil(1000 / 333.34) = 3 months → still ends in March (client targetMonthFor).
  assert ceil(1000 / v) = 3, 'FAIL 3-month plan moves the target month';
  select monthly_topup into v from public.tabung_accounts where account_id = '00000000-0000-4000-8000-00000000c302';
  assert v = 500, format('FAIL same-month plan: %s', v);
  select monthly_topup into v from public.tabung_accounts where account_id = '00000000-0000-4000-8000-00000000c303';
  assert v is null, 'FAIL no-target Tabung was filled';
  select monthly_topup into v from public.tabung_accounts where account_id = '00000000-0000-4000-8000-00000000c304';
  assert v = 75, 'FAIL existing monthly_topup overwritten';
  select monthly_topup into v from public.tabung_accounts where account_id = '00000000-0000-4000-8000-00000000c305';
  assert v = 200, format('FAIL across-year plan: %s', v);
end $$;

do $$ begin raise exception 'PASS: monthly_topup backfill'; end $$;
rollback;
