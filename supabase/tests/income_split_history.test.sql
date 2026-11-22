-- Income split history (migration 20261125): past months keep the groups and
-- targets they had; a save applies from the current month on.
--
-- Runs against a database with migrations up to 20261125 applied. ONE
-- transaction that never commits: the last statement raises 'PASS: …' on
-- purpose so everything rolls back; a failed check raises 'FAIL: …' first.
--
--   execute this file as a single query (Supabase MCP execute_sql, or
--   psql -v ON_ERROR_STOP=1 -f supabase/tests/income_split_history.test.sql)
--
-- Expected result: an error whose message starts with "PASS:".
--
-- Months are relative to today in Asia/Kuala_Lumpur (the month the save RPC
-- writes): m0 = this month, m2 = two months ago. Users: C = …c1, D = …d1.

begin;

insert into auth.users (id, aud, role, email, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-4000-8000-0000000000c1', 'authenticated', 'authenticated', 'sh-test-c@example.invalid', '{"display_name":"SH Test C"}', now(), now()),
       ('00000000-0000-4000-8000-0000000000d1', 'authenticated', 'authenticated', 'sh-test-d@example.invalid', '{"display_name":"SH Test D"}', now(), now());

select set_config('sh_test.m0', date_trunc('month', now() at time zone 'Asia/Kuala_Lumpur')::date::text, true);
select set_config('sh_test.m2', (date_trunc('month', now() at time zone 'Asia/Kuala_Lumpur') - interval '2 months')::date::text, true);

-- Same money in both months: income 1000, food 500 (Needs), shopping 300 (Wants).
insert into public.transactions (user_id, type, name, amount, category, date)
select '00000000-0000-4000-8000-0000000000c1', v.type::public.transaction_type, v.name, v.amount, v.category, m.d + 1
  from (values (current_setting('sh_test.m0')::date), (current_setting('sh_test.m2')::date)) m(d)
 cross join (values ('income', 'Salary', 1000.00, 'salary'),
                    ('expense', 'Lunch', 500.00, 'food'),
                    ('expense', 'Shopee', 300.00, 'shopping')) v(type, name, amount, category);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000c1","role":"authenticated"}', true);

-- No history yet: both months use today's tables (defaults 50/30/20, shopping = Wants).
do $$
declare s jsonb;
begin
  assert not exists (select 1 from public.income_split_history), 'FAIL setup: C should start with no history';
  s := public.income_split(current_setting('sh_test.m2')::date);
  assert (s#>>'{buckets,wants,amount}')::numeric = 300, format('FAIL no-history m2: wants 300, got %s', s#>>'{buckets,wants,amount}');
  assert (s#>>'{targets,needs}')::int = 50, 'FAIL no-history m2: needs target 50';
end $$;

-- First save: shopping → Skip, targets 60 / 20 / 20.
select public.save_income_split_groups('[{"category":"shopping","group":"skip"}]'::jsonb, 60::smallint, 20::smallint, 20::smallint);

do $$
declare s jsonb; n int;
begin
  select count(*) into n from public.income_split_history;
  assert n = 2, format('FAIL first save: expected 2 history rows (-infinity + this month), got %s', n);
  assert (select groups->>'shopping' from public.income_split_history where effective_month = '-infinity') = 'wants',
         'FAIL first save: the -infinity row must hold the state BEFORE the save';
  assert (select needs from public.income_split_history where effective_month = '-infinity') = 50,
         'FAIL first save: the -infinity row must hold the old targets';
  assert (select groups->>'shopping' from public.income_split_history where effective_month = current_setting('sh_test.m0')::date) = 'skip',
         'FAIL first save: this month''s row must hold the new groups';

  -- This month: new groups and targets.
  s := public.income_split(current_setting('sh_test.m0')::date);
  assert (s#>>'{buckets,wants,amount}')::numeric = 0, format('FAIL m0: shopping is Skip now, wants 0, got %s', s#>>'{buckets,wants,amount}');
  assert (s#>>'{buckets,needs,amount}')::numeric = 500, 'FAIL m0: needs 500';
  assert (s#>>'{targets,needs}')::int = 60, 'FAIL m0: needs target 60';

  -- Two months ago: unchanged.
  s := public.income_split(current_setting('sh_test.m2')::date);
  assert (s#>>'{buckets,wants,amount}')::numeric = 300, format('FAIL m2: history must keep shopping in Wants, got %s', s#>>'{buckets,wants,amount}');
  assert (s#>>'{targets,needs}')::int = 50, format('FAIL m2: history must keep the 50%% target, got %s', s#>>'{targets,needs}');
  assert (s#>>'{buckets,left,pct}')::numeric = 20.0, format('FAIL m2: left 20.0%%, got %s', s#>>'{buckets,left,pct}');
end $$;

-- Second save in the same month overwrites this month's row only.
select public.save_income_split_groups('[{"category":"shopping","group":"wants"}]'::jsonb, 40::smallint, 40::smallint, 20::smallint);

do $$
declare s jsonb;
begin
  assert (select count(*) from public.income_split_history) = 2, 'FAIL second save: still 2 rows';
  s := public.income_split(current_setting('sh_test.m0')::date);
  assert (s#>>'{targets,needs}')::int = 40, 'FAIL second save: m0 needs target 40';
  assert (s#>>'{buckets,wants,amount}')::numeric = 300, 'FAIL second save: m0 shopping back in Wants';
  s := public.income_split(current_setting('sh_test.m2')::date);
  assert (s#>>'{targets,needs}')::int = 50, 'FAIL second save: m2 must not change';
end $$;

-- Targets that don't add up are still rejected, and write no history.
do $$
begin
  begin
    perform public.save_income_split_groups('[]'::jsonb, 50::smallint, 35::smallint, 20::smallint);
    raise exception 'FAIL targets: 105%% should be rejected';
  exception when check_violation then null;
  end;
  assert (select count(*) from public.income_split_history) = 2, 'FAIL targets: a rejected save wrote history';
end $$;

-- RLS: D sees none of C's history and can't write into it.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000d1","role":"authenticated"}', true);
do $$
begin
  assert not exists (select 1 from public.income_split_history), 'FAIL rls: D can read C''s history';
  begin
    insert into public.income_split_history (user_id, effective_month, needs, wants, invest)
    values ('00000000-0000-4000-8000-0000000000c1', '2020-01-01', 50, 30, 20);
    raise exception 'FAIL rls: D wrote a row for C';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

-- anon has no access to the table.
set local role anon;
do $$
begin
  begin
    perform 1 from public.income_split_history;
    raise exception 'FAIL grants: anon read income_split_history';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

-- Reset all data clears C's history.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000c1","role":"authenticated"}', true);
select public.reset_user_data();
do $$
begin
  assert not exists (select 1 from public.income_split_history), 'FAIL reset: history survived Reset all data';
end $$;
reset role;

do $$ begin raise exception 'PASS: income split history tests'; end $$;
rollback;
