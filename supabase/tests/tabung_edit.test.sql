-- Edit Tabung backend tests: update_tabung validation, the saved-so-far floor
-- in both progress modes, the cover bucket policy and RLS.
--
-- Runs against a database that has migration 20261124_tabung_edit applied.
-- Same harness as k_l_backend.test.sql: ONE transaction that never commits.
-- The last statement raises 'PASS: …' on purpose so the run rolls back; any
-- failed check raises 'FAIL: …' first. Safe to run on any project:
--
--   execute this file as a single query (Supabase MCP execute_sql, or
--   psql -v ON_ERROR_STOP=1 -f supabase/tests/tabung_edit.test.sql)
--
-- Expected result: an error whose message starts with "PASS:".
--
-- Two throwaway users: A = …a2 (owns the Tabung), B = …b2.

begin;

-- ─── Fixtures ───────────────────────────────────────────────────────────────

insert into auth.users (id, aud, role, email, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-4000-8000-0000000000a2', 'authenticated', 'authenticated', 'te-test-a@example.invalid', '{"display_name":"TE Test A"}', now(), now()),
       ('00000000-0000-4000-8000-0000000000b2', 'authenticated', 'authenticated', 'te-test-b@example.invalid', '{"display_name":"TE Test B"}', now(), now());

insert into public.accounts (id, user_id, type, name)
values ('00000000-0000-4000-8000-00000000ad01', '00000000-0000-4000-8000-0000000000a2', 'bank', 'Maybank'),
       ('00000000-0000-4000-8000-00000000ad02', '00000000-0000-4000-8000-0000000000a2', 'tabung', 'Tabung Rumah');
insert into public.bank_accounts (account_id, bank_name, opening_balance, current_balance)
values ('00000000-0000-4000-8000-00000000ad01', 'Maybank', 10000, 10000);
insert into public.tabung_accounts (account_id, target_amount, saved_amount, from_date, to_date, template_type)
values ('00000000-0000-4000-8000-00000000ad02', 5000, 2000, '2026-03-01', '2026-07-31', 'home');

-- The d-tabung-edit board: RM 4,000 topped up since March (RM 2,000 paid out
-- since, so the balance is RM 2,000). One top-up before March doesn't count.
insert into public.transactions (user_id, type, name, amount, category, to_account_id, from_account_id, date) values
  ('00000000-0000-4000-8000-0000000000a2', 'tabung_topup', 'Top-up', 500.00,  'tabung', '00000000-0000-4000-8000-00000000ad02', '00000000-0000-4000-8000-00000000ad01', '2026-02-10'),
  ('00000000-0000-4000-8000-0000000000a2', 'tabung_topup', 'Top-up', 1000.00, 'tabung', '00000000-0000-4000-8000-00000000ad02', '00000000-0000-4000-8000-00000000ad01', '2026-03-05'),
  ('00000000-0000-4000-8000-0000000000a2', 'tabung_topup', 'Top-up', 1000.00, 'tabung', '00000000-0000-4000-8000-00000000ad02', '00000000-0000-4000-8000-00000000ad01', '2026-04-05'),
  ('00000000-0000-4000-8000-0000000000a2', 'tabung_topup', 'Top-up', 1000.00, 'tabung', '00000000-0000-4000-8000-00000000ad02', '00000000-0000-4000-8000-00000000ad01', '2026-05-05'),
  ('00000000-0000-4000-8000-0000000000a2', 'tabung_topup', 'Top-up', 1000.00, 'tabung', '00000000-0000-4000-8000-00000000ad02', '00000000-0000-4000-8000-00000000ad01', '2026-06-05');

-- ─── Validation, as A ───────────────────────────────────────────────────────

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a2","role":"authenticated"}', true);

create function pg_temp.edit_error(p_goal text, p_name text, p_target numeric, p_monthly numeric, p_from date, p_to date)
returns text language plpgsql as $$
begin
  perform public.update_tabung('00000000-0000-4000-8000-00000000ad02', p_goal, p_name, p_target, p_monthly, p_from, p_to, null);
  return null;
exception when others then
  return sqlstate || ' ' || sqlerrm;
end $$;

do $$
begin
  assert pg_temp.edit_error('home', '   ', 5000, 1000, '2026-03-01', '2026-07-31') = '23514 Give your Tabung a name', 'FAIL empty name';
  assert pg_temp.edit_error('home', repeat('x', 41), 5000, 1000, '2026-03-01', '2026-07-31') = '23514 Keep the name to 40 characters', 'FAIL long name';
  assert pg_temp.edit_error('boat', 'X', 5000, 1000, '2026-03-01', '2026-07-31') = '23514 Choose a goal type', 'FAIL goal type';
  assert pg_temp.edit_error('home', 'X', 0, 1000, '2026-03-01', '2026-07-31') = '23514 Enter a target above RM 0.00', 'FAIL zero target';
  assert pg_temp.edit_error('home', 'X', 3000, 1000, '2026-03-01', '2026-07-31') = '23514 Can''t be lower than RM 4,000.00 saved so far',
         format('FAIL floor (contributed): %s', pg_temp.edit_error('home', 'X', 3000, 1000, '2026-03-01', '2026-07-31'));
  assert pg_temp.edit_error('home', 'X', 5000, 0, '2026-03-01', '2026-07-31') = '23514 Enter a monthly top-up above RM 0.00', 'FAIL zero monthly';
  assert pg_temp.edit_error('home', 'X', 5000, null, '2026-03-01', '2026-07-31') = '23514 Enter a monthly top-up above RM 0.00', 'FAIL null monthly';
  assert pg_temp.edit_error('home', 'X', 5000, 1000, '2026-03-01', '2026-02-28') = '23514 Target date can''t be before the start date', 'FAIL dates';
  -- Moving the start date earlier counts the February top-up too.
  assert pg_temp.edit_error('home', 'X', 4000, 1000, '2026-02-01', '2026-07-31') = '23514 Can''t be lower than RM 4,500.00 saved so far', 'FAIL floor follows start date';
  -- Target equal to the floor is allowed.
  assert pg_temp.edit_error('home', 'X', 4000, 1000, '2026-03-01', '2026-07-31') is null, 'FAIL target = saved should pass';
end $$;

-- A good save writes both rows; a blank cover is stored as null.
select public.update_tabung('00000000-0000-4000-8000-00000000ad02', 'travel', '  Bali 2026  ', 6000.005, 1250.004,
                            '2026-03-01', '2026-08-31', '  ');
do $$
declare a record; t record;
begin
  select name, icon into a from public.accounts where id = '00000000-0000-4000-8000-00000000ad02';
  select * into t from public.tabung_accounts where account_id = '00000000-0000-4000-8000-00000000ad02';
  assert a.name = 'Bali 2026', format('FAIL name trimmed: %s', a.name);
  assert a.icon = 'travel' and t.icon = 'travel' and t.template_type = 'travel', 'FAIL goal type stored';
  assert t.target_amount = 6000.01 and t.monthly_topup = 1250.00, format('FAIL rounding: %s / %s', t.target_amount, t.monthly_topup);
  assert t.from_date = '2026-03-01' and t.to_date = '2026-08-31', 'FAIL dates stored';
  assert t.cover_path is null, 'FAIL blank cover should be null';
end $$;

select public.update_tabung('00000000-0000-4000-8000-00000000ad02', 'travel', 'Bali 2026', 6000, 1250,
                            '2026-03-01', '2026-08-31', '00000000-0000-4000-8000-0000000000a2/ad02-1.jpg');
do $$
begin
  assert (select cover_path from public.tabung_accounts where account_id = '00000000-0000-4000-8000-00000000ad02')
         = '00000000-0000-4000-8000-0000000000a2/ad02-1.jpg', 'FAIL cover stored';
end $$;
reset role;

-- Balance mode: the floor is the balance (RM 2,000), not the top-ups.
update public.tabung_accounts set progress_mode = 'balance' where account_id = '00000000-0000-4000-8000-00000000ad02';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a2","role":"authenticated"}', true);
do $$
begin
  assert pg_temp.edit_error('home', 'X', 1999.99, 1000, '2026-03-01', '2026-07-31') = '23514 Can''t be lower than RM 2,000.00 saved so far', 'FAIL floor (balance)';
  assert pg_temp.edit_error('home', 'X', 2000, 1000, '2026-03-01', '2026-07-31') is null, 'FAIL balance floor equal should pass';
end $$;
reset role;

-- ─── RLS: B can't edit A's Tabung ───────────────────────────────────────────

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000b2","role":"authenticated"}', true);
do $$
begin
  begin
    perform public.update_tabung('00000000-0000-4000-8000-00000000ad02', 'home', 'Mine now', 9000, 100, '2026-03-01', '2026-12-31', null);
    raise exception 'FAIL rls: B edited A''s Tabung';
  exception when sqlstate 'P0002' then null;
  end;
end $$;
reset role;
do $$
begin
  assert (select name from public.accounts where id = '00000000-0000-4000-8000-00000000ad02') = 'X',
         'FAIL rls: A''s Tabung changed';
end $$;

-- ─── Schema: constraint and bucket ──────────────────────────────────────────

do $$
begin
  begin
    update public.tabung_accounts set monthly_topup = 0 where account_id = '00000000-0000-4000-8000-00000000ad02';
    raise exception 'FAIL constraint: monthly_topup = 0 accepted';
  exception when check_violation then null;
  end;
  assert exists (select 1 from storage.buckets where id = 'tabung-covers' and not public), 'FAIL bucket missing or public';
  assert exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects'
                  and policyname = 'tabung_covers user folder access'), 'FAIL bucket policy missing';
end $$;

-- ─── Done: always roll back ─────────────────────────────────────────────────

do $$ begin raise exception 'PASS: Edit Tabung backend tests'; end $$;
rollback;
