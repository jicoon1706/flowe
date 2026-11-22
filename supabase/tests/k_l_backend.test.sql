-- Desktop K + L backend tests: Gold and KWSP valuation, net worth, income
-- split, split targets and RLS.
--
-- Runs against a database that has migrations 20261123–20261123e applied.
-- Everything happens inside ONE transaction that never commits: the last
-- statement raises 'PASS: …' on purpose so the whole run rolls back, and any
-- failed check raises 'FAIL: …' (or 'assertion failed') first. Nothing is left
-- behind, so it is safe to run on any project:
--
--   execute this file as a single query (Supabase MCP execute_sql, or
--   psql -v ON_ERROR_STOP=1 -f supabase/tests/k_l_backend.test.sql)
--
-- Expected result: an error whose message starts with "PASS:".
--
-- Two throwaway users: A = …a1, B = …b1. Fixtures are inserted as the
-- connection's own role (RLS bypassed); every function and RLS check runs as
-- `authenticated` with request.jwt.claims.sub set to that user.

begin;

-- ─── Fixtures ───────────────────────────────────────────────────────────────

insert into auth.users (id, aud, role, email, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-4000-8000-0000000000a1', 'authenticated', 'authenticated', 'kl-test-a@example.invalid', '{"display_name":"KL Test A"}', now(), now()),
       ('00000000-0000-4000-8000-0000000000b1', 'authenticated', 'authenticated', 'kl-test-b@example.invalid', '{"display_name":"KL Test B"}', now(), now());

-- Signup seeded the default groups (profiles trigger).
do $$
declare n int;
begin
  select count(*) into n from public.category_groups where user_id = '00000000-0000-4000-8000-0000000000b1';
  assert n = 5, format('FAIL seed: expected 5 default groups on signup, got %s', n);
  assert (select split_group from public.category_groups
           where user_id = '00000000-0000-4000-8000-0000000000b1' and category = 'food') = 'needs',
         'FAIL seed: food should default to needs';
  assert (select split_group from public.category_groups
           where user_id = '00000000-0000-4000-8000-0000000000b1' and category = 'entertainment') = 'wants',
         'FAIL seed: entertainment should default to wants';
  assert not exists (select 1 from public.category_groups
           where user_id = '00000000-0000-4000-8000-0000000000b1' and category = 'health'),
         'FAIL seed: health should have no row (Skip)';
end $$;

-- A: one bank account (RM 12,000), one Tabung, an ASB asset (RM 6,000), a
-- PTPTN loan (RM 25,000).
insert into public.accounts (id, user_id, type, name)
values ('00000000-0000-4000-8000-00000000ac01', '00000000-0000-4000-8000-0000000000a1', 'bank', 'Maybank'),
       ('00000000-0000-4000-8000-00000000ac02', '00000000-0000-4000-8000-0000000000a1', 'tabung', 'Emergency Fund');
insert into public.bank_accounts (account_id, bank_name, opening_balance, current_balance)
values ('00000000-0000-4000-8000-00000000ac01', 'Maybank', 12000, 12000);
insert into public.tabung_accounts (account_id, target_amount, saved_amount, from_date, to_date)
values ('00000000-0000-4000-8000-00000000ac02', 10000, 0, '2026-01-01', '2027-12-31');
insert into public.assets (id, user_id, name, type, current_value)
values ('00000000-0000-4000-8000-00000000a501', '00000000-0000-4000-8000-0000000000a1', 'ASB', 'asb', 6000);
insert into public.liabilities (user_id, name, type, amount_owed, monthly_payment)
values ('00000000-0000-4000-8000-0000000000a1', 'PTPTN', 'study_loan', 25000, 0);
-- An unpriced (legacy) gold row: its value must never be recomputed.
insert into public.assets (id, user_id, name, type, current_value, quantity, unit, is_active)
values ('00000000-0000-4000-8000-00000000a5ff', '00000000-0000-4000-8000-0000000000a1', 'Old gold', 'gold', 500, 1.25, 'g', false);

-- ─── As user A ──────────────────────────────────────────────────────────────

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);

-- K · Gold: value = grams × PG Buy price; price_date = save date (MYT).
do $$
declare a public.assets;
declare today date := (now() at time zone 'Asia/Kuala_Lumpur')::date;
begin
  a := public.save_gold_asset(null, 'Public Gold GAP', 12.5, 999::smallint, 522.00, 6900.00);
  assert a.current_value = 6525.00, format('FAIL gold: 12.5 g × 522.00 should be 6525.00, got %s', a.current_value);
  assert a.purity = 999 and a.unit = 'g' and a.quantity = 12.5, 'FAIL gold: purity / unit / grams not stored';
  assert a.price_date = today, format('FAIL gold: price_date should be %s, got %s', today, a.price_date);
  assert a.current_value - a.cost = -375.00, 'FAIL gold: gain/loss should be -375.00';
  assert round((a.current_value - a.cost) / a.cost * 100, 1) = -5.4, 'FAIL gold: gain/loss % should be -5.4';
  assert (select value from public.asset_values where asset_id = a.id and month = date_trunc('month', today)::date) = 6525.00,
         'FAIL gold: this month''s asset_values row missing';

  -- 916 purity and a new price recompute the value.
  a := public.save_gold_asset(a.id, 'Public Gold GAP', 10, 916::smallint, 480.10, null);
  assert a.current_value = 4801.00 and a.purity = 916 and a.cost is null, format('FAIL gold: update should give 4801.00 @ 916, got %s', a.current_value);
  -- A direct write can't break the formula either.
  update public.assets set current_value = 1 where id = a.id returning * into a;
  assert a.current_value = 4801.00, 'FAIL gold: trigger should keep value = grams × price';
  -- Investing into a priced gold asset adds to cost, not value (Q3).
  perform public.adjust_asset_value(a.id, 100, date_trunc('month', today)::date);
  select * into a from public.assets where id = a.id;
  assert a.current_value = 4801.00 and a.cost = 100, format('FAIL gold: investment should add to cost (got value %s cost %s)', a.current_value, a.cost);
  -- Back to the board's figures for the net worth test.
  a := public.save_gold_asset(a.id, 'Public Gold GAP', 12.5, 999::smallint, 522.00, 6900.00);
end $$;

do $$
begin
  begin
    perform public.save_gold_asset(null, 'Bad purity', 1, 917::smallint, 500, null);
    raise exception 'FAIL gold: purity 917 should be rejected';
  exception when check_violation then null;
  end;
  begin
    perform public.save_gold_asset(null, 'No grams', 0, 999::smallint, 500, null);
    raise exception 'FAIL gold: 0 grams should be rejected';
  exception when check_violation then null;
  end;
  begin
    perform public.save_gold_asset(null, 'No price', 1, 999::smallint, 0, null);
    raise exception 'FAIL gold: price 0 should be rejected';
  exception when check_violation then null;
  end;
end $$;

-- K · legacy gold untouched by unrelated updates (as the owner role).
reset role;
update public.assets set note = 'touched' where id = '00000000-0000-4000-8000-00000000a5ff';
do $$
begin
  assert (select current_value from public.assets where id = '00000000-0000-4000-8000-00000000a5ff') = 500,
         'FAIL gold: an unpriced gold row must keep its stored value';
end $$;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);

-- K · KWSP: value = Persaraan + Sejahtera + Fleksibel.
do $$
declare k public.assets;
begin
  k := public.save_kwsp_asset(null, 20000, 6000, 4000);
  k := public.save_kwsp_asset(k.id, 30000, 6000, 4000);
  assert k.current_value = 40000, format('FAIL kwsp: sum should be 40000, got %s', k.current_value);
  assert k.name = 'KWSP / EPF' and k.monthly_income = 0 and k.type = 'kwsp', 'FAIL kwsp: fixed name / no monthly income';
  begin
    perform public.save_kwsp_asset(null, 0, 0, 0);
    raise exception 'FAIL kwsp: all-zero balances should be rejected';
  exception when check_violation then null;
  end;
  begin
    perform public.save_kwsp_asset(k.id, -1, 0, 5);
    raise exception 'FAIL kwsp: a negative balance should be rejected';
  exception when check_violation then null;
  end;
end $$;

-- K · Net worth includes Gold and KWSP (the dn-networth-breakdown figures).
do $$
declare nw jsonb;
declare shares numeric;
begin
  nw := public.net_worth_breakdown();
  assert (nw->>'total_assets')::numeric = 64525.00, format('FAIL net worth: total assets 64525.00, got %s', nw->>'total_assets');
  assert (nw->>'total_liabilities')::numeric = 25000.00, 'FAIL net worth: liabilities 25000.00';
  assert (nw->>'net_worth')::numeric = 39525.00, format('FAIL net worth: 39525.00, got %s', nw->>'net_worth');
  assert (nw->>'cash_accounts')::int = 2, 'FAIL net worth: 2 cash accounts';
  select sum((g->>'share_pct')::numeric) into shares from jsonb_array_elements(nw->'groups') g;
  assert shares = 100.0, format('FAIL net worth: shares should total 100.0, got %s', shares);
  assert (select (g->>'share_pct')::numeric from jsonb_array_elements(nw->'groups') g where g->>'key' = 'kwsp') = 62.0, 'FAIL net worth: KWSP 62.0%';
  assert (select (g->>'share_pct')::numeric from jsonb_array_elements(nw->'groups') g where g->>'key' = 'gold') = 10.1, 'FAIL net worth: Gold 10.1%';
  assert (select (g->>'share_pct')::numeric from jsonb_array_elements(nw->'groups') g where g->>'key' = 'cash') = 18.6, 'FAIL net worth: cash 18.6%';
  assert (nw->'groups'->0->>'key') = 'cash', 'FAIL net worth: cash row first';
end $$;

-- L · Targets must total 100 (server side: RPC and constraint).
do $$
begin
  begin
    perform public.save_income_split_groups('[]'::jsonb, 50::smallint, 35::smallint, 20::smallint);
    raise exception 'FAIL targets: 105%% should be rejected by the RPC';
  exception when check_violation then null;
  end;
  begin
    insert into public.settings (user_id, split_needs_pct, split_wants_pct, split_invest_pct)
    values ('00000000-0000-4000-8000-0000000000a1', 60, 30, 20);
    raise exception 'FAIL targets: 110%% should be rejected by the constraint';
  exception when check_violation then null;
  end;
  -- Valid save, plus custom Groceries / Leisure groups.
  perform public.save_income_split_groups(
    '[{"category":"Groceries","group":"needs"},{"category":"Leisure","group":"wants"},{"category":"health","group":"skip"}]'::jsonb,
    50::smallint, 30::smallint, 20::smallint);
  assert (select split_needs_pct + split_wants_pct + split_invest_pct from public.settings
           where user_id = '00000000-0000-4000-8000-0000000000a1') = 100, 'FAIL targets: valid save not stored';
end $$;

-- L · Income split fixtures (as owner role, dated in test months).
reset role;
-- A's gold id, read as the owner role (B can't see it, which is the point).
select set_config('kl_test.a_gold',
  (select id::text from public.assets
    where user_id = '00000000-0000-4000-8000-0000000000a1' and type = 'gold' and is_active limit 1), true);
insert into public.transactions (user_id, type, name, amount, category, to_account_id, from_account_id, asset_id, date) values
  -- 2026-11: the dl-split board.
  ('00000000-0000-4000-8000-0000000000a1', 'income',  'Salary',    4000.00, 'salary',        null, null, null, '2026-11-01'),
  ('00000000-0000-4000-8000-0000000000a1', 'income',  'Freelance',  450.00, 'freelance',     null, null, null, '2026-11-15'),
  ('00000000-0000-4000-8000-0000000000a1', 'expense', 'Lunch',      706.22, 'food',          null, null, null, '2026-11-03'),
  ('00000000-0000-4000-8000-0000000000a1', 'expense', 'Lotus',      549.56, 'Groceries',     null, null, null, '2026-11-04'),
  ('00000000-0000-4000-8000-0000000000a1', 'expense', 'TNB',        462.53, 'bills',         null, null, null, '2026-11-05'),
  ('00000000-0000-4000-8000-0000000000a1', 'expense', 'Grab',       355.60, 'transport',     null, null, null, '2026-11-06'),
  ('00000000-0000-4000-8000-0000000000a1', 'expense', 'Shopee',     253.64, 'shopping',      null, null, null, '2026-11-07'),
  ('00000000-0000-4000-8000-0000000000a1', 'expense', 'Cinema',     159.15, 'Leisure',       null, null, null, '2026-11-08'),
  ('00000000-0000-4000-8000-0000000000a1', 'expense', 'Clinic',     100.00, 'health',        null, null, null, '2026-11-09'),  -- Skip
  ('00000000-0000-4000-8000-0000000000a1', 'expense', 'Gadget',      80.00, 'Gadget',        null, null, null, '2026-11-09'),  -- no row = Skip
  ('00000000-0000-4000-8000-0000000000a1', 'tabung_topup', 'Top up', 200.00, null, '00000000-0000-4000-8000-00000000ac02', '00000000-0000-4000-8000-00000000ac01', null, '2026-11-10'),
  ('00000000-0000-4000-8000-0000000000a1', 'transfer', 'ASB top-up', 300.00, 'ASB',          null, '00000000-0000-4000-8000-00000000ac01', '00000000-0000-4000-8000-00000000a501', '2026-11-11'),
  ('00000000-0000-4000-8000-0000000000a1', 'tabung_withdraw', 'Pay out', 50.00, null, '00000000-0000-4000-8000-00000000ac02', '00000000-0000-4000-8000-00000000ac01', null, '2026-11-12'),  -- not netted
  -- 2026-10: the dl-split-over board.
  ('00000000-0000-4000-8000-0000000000a1', 'income',  'Salary',    4450.00, 'salary',        null, null, null, '2026-10-01'),
  ('00000000-0000-4000-8000-0000000000a1', 'expense', 'Food',      1150.00, 'food',          null, null, null, '2026-10-02'),
  ('00000000-0000-4000-8000-0000000000a1', 'expense', 'Groceries',  820.00, 'Groceries',     null, null, null, '2026-10-03'),
  ('00000000-0000-4000-8000-0000000000a1', 'expense', 'Bills',      690.00, 'bills',         null, null, null, '2026-10-04'),
  ('00000000-0000-4000-8000-0000000000a1', 'expense', 'Transport',  544.00, 'transport',     null, null, null, '2026-10-05'),
  ('00000000-0000-4000-8000-0000000000a1', 'expense', 'Shopping',  1512.30, 'shopping',      null, null, null, '2026-10-06'),
  ('00000000-0000-4000-8000-0000000000a1', 'expense', 'Leisure',    312.20, 'Leisure',       null, null, null, '2026-10-07'),
  -- 2026-08: every rule fires → only the first 3 are returned.
  ('00000000-0000-4000-8000-0000000000a1', 'income',  'Salary',    1000.00, 'salary',        null, null, null, '2026-08-01'),
  ('00000000-0000-4000-8000-0000000000a1', 'expense', 'Food',       510.00, 'food',          null, null, null, '2026-08-02'),
  ('00000000-0000-4000-8000-0000000000a1', 'expense', 'Shopping',   310.00, 'shopping',      null, null, null, '2026-08-03');
-- 2026-11 also: money into KWSP must not count as Invest & save.
insert into public.transactions (user_id, type, name, amount, category, from_account_id, asset_id, date)
select '00000000-0000-4000-8000-0000000000a1', 'transfer', 'KWSP voluntary', 1000.00, 'KWSP / EPF',
       '00000000-0000-4000-8000-00000000ac01', id, '2026-11-12'
  from public.assets where user_id = '00000000-0000-4000-8000-0000000000a1' and type = 'kwsp';

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);

-- L · the dl-split month: sums to 100%, Skip and KWSP excluded.
do $$
declare s jsonb;
declare total numeric;
begin
  s := public.income_split('2026-11-20');
  assert s->>'state' = 'ok', format('FAIL split: state ok, got %s', s->>'state');
  assert (s->>'income')::numeric = 4450.00, 'FAIL split: income 4450.00';
  assert (s#>>'{buckets,needs,amount}')::numeric  = 2073.91, format('FAIL split: needs 2073.91, got %s', s#>>'{buckets,needs,amount}');
  assert (s#>>'{buckets,wants,amount}')::numeric  =  412.79, format('FAIL split: wants 412.79, got %s', s#>>'{buckets,wants,amount}');
  assert (s#>>'{buckets,invest,amount}')::numeric =  500.00, format('FAIL split: invest 500.00 (KWSP + pay-out excluded), got %s', s#>>'{buckets,invest,amount}');
  assert (s#>>'{buckets,left,amount}')::numeric   = 1463.30, format('FAIL split: left 1463.30, got %s', s#>>'{buckets,left,amount}');
  assert (s#>>'{buckets,needs,pct}')::numeric = 46.6 and (s#>>'{buckets,wants,pct}')::numeric = 9.3
     and (s#>>'{buckets,invest,pct}')::numeric = 11.2 and (s#>>'{buckets,left,pct}')::numeric = 32.9,
         'FAIL split: percentages 46.6 / 9.3 / 11.2 / 32.9';
  total := (s#>>'{buckets,needs,pct}')::numeric + (s#>>'{buckets,wants,pct}')::numeric
         + (s#>>'{buckets,invest,pct}')::numeric + (s#>>'{buckets,left,pct}')::numeric;
  assert total = 100.0, format('FAIL split: parts must sum to 100.0, got %s', total);
  assert not exists (select 1 from jsonb_array_elements(s->'rows') r where r->>'category' in ('health', 'Gadget')),
         'FAIL split: Skip categories must not be listed';
  assert not exists (select 1 from jsonb_array_elements(s->'rows') r where r->>'label' like 'KWSP%'),
         'FAIL split: KWSP must not count as Invest & save';
  assert jsonb_array_length(s->'rows') = 8, format('FAIL split: 8 rows, got %s', jsonb_array_length(s->'rows'));
  assert s->'rows'->0->>'category' = 'food' and s->'rows'->6->>'label' = 'ASB top-up' and s->'rows'->7->>'label' = 'Tabung · Emergency Fund',
         'FAIL split: row order (needs, wants, invest; largest first)';
  assert jsonb_array_length(s->'suggestions') = 2, format('FAIL split: 2 suggestions, got %s', s->'suggestions');
  assert s->'suggestions'->0->>'kind' = 'invest_below_target' and (s->'suggestions'->0->>'amount')::numeric = 390
     and (s->'suggestions'->0->>'target_amount')::numeric = 890.00, 'FAIL split: suggestion 1 = Move RM 390 (guide RM 890.00)';
  assert s->'suggestions'->1->>'kind' = 'unassigned' and (s->'suggestions'->1->>'amount')::numeric = 1463.30,
         'FAIL split: suggestion 2 = RM 1,463.30 not assigned';
end $$;

-- L · overspent (dl-split-over).
do $$
declare s jsonb;
begin
  s := public.income_split('2026-10-01');
  assert s->>'state' = 'overspent', format('FAIL over: state overspent, got %s', s->>'state');
  assert (s#>>'{buckets,left,amount}')::numeric = -578.50, format('FAIL over: left -578.50, got %s', s#>>'{buckets,left,amount}');
  assert (s#>>'{buckets,needs,pct}')::numeric = 72.0 and (s#>>'{buckets,wants,pct}')::numeric = 41.0
     and (s#>>'{buckets,invest,pct}')::numeric = 0.0 and (s#>>'{buckets,left,pct}')::numeric = -13.0,
         'FAIL over: 72.0 / 41.0 / 0.0 / -13.0';
  assert jsonb_array_length(s->'suggestions') = 2, format('FAIL over: 2 suggestions, got %s', s->'suggestions');
  assert s->'suggestions'->0->>'kind' = 'needs_over_target' and s->'suggestions'->0->>'category' = 'food'
     and (s->'suggestions'->0->>'amount')::numeric = 1150.00, 'FAIL over: biggest need = food 1150.00';
  assert s->'suggestions'->1->>'kind' = 'wants_over_target' and s->'suggestions'->1->>'category' = 'shopping'
     and (s->'suggestions'->1->>'amount')::numeric = 1512.30, 'FAIL over: biggest want = shopping 1512.30';
end $$;

-- L · no income → empty; at most 3 suggestions.
do $$
declare s jsonb;
begin
  s := public.income_split('2026-09-01');
  assert s->>'state' = 'empty' and (s->>'income')::numeric = 0 and s->'buckets' = 'null'::jsonb,
         format('FAIL empty: %s', s);
  s := public.income_split('2026-08-01');
  assert jsonb_array_length(s->'suggestions') = 3, format('FAIL max3: expected 3, got %s', s->'suggestions');
  assert s->'suggestions'->0->>'kind' = 'invest_below_target' and s->'suggestions'->1->>'kind' = 'unassigned'
     and s->'suggestions'->2->>'kind' = 'needs_over_target', 'FAIL max3: rule order';
end $$;

-- ─── As user B: RLS ─────────────────────────────────────────────────────────

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000b1","role":"authenticated"}', true);

do $$
declare n int;
begin
  assert (select count(*) from public.assets where user_id = '00000000-0000-4000-8000-0000000000a1') = 0, 'FAIL rls: B reads A''s assets';
  assert (select count(*) from public.category_groups where user_id = '00000000-0000-4000-8000-0000000000a1') = 0, 'FAIL rls: B reads A''s groups';
  assert (select count(*) from public.settings where user_id = '00000000-0000-4000-8000-0000000000a1') = 0, 'FAIL rls: B reads A''s settings';
  assert (select count(*) from public.category_groups) = 5, 'FAIL rls: B should see exactly its own 5 groups';

  update public.category_groups set split_group = 'skip' where user_id = '00000000-0000-4000-8000-0000000000a1';
  get diagnostics n = row_count;
  assert n = 0, 'FAIL rls: B updated A''s groups';
  update public.assets set kwsp_persaraan = 1 where user_id = '00000000-0000-4000-8000-0000000000a1';
  get diagnostics n = row_count;
  assert n = 0, 'FAIL rls: B updated A''s assets';
  delete from public.category_groups where user_id = '00000000-0000-4000-8000-0000000000a1';
  get diagnostics n = row_count;
  assert n = 0, 'FAIL rls: B deleted A''s groups';

  begin
    insert into public.category_groups (user_id, category, split_group)
    values ('00000000-0000-4000-8000-0000000000a1', 'food', 'skip');
    raise exception 'FAIL rls: B inserted a group for A';
  exception when insufficient_privilege or unique_violation then null;
  end;

  begin
    perform public.save_gold_asset(current_setting('kl_test.a_gold')::uuid, 'Hijack', 1, 999::smallint, 1, null);
    raise exception 'FAIL rls: B saved A''s gold';
  exception when no_data_found then null;
  end;

  assert (public.net_worth_breakdown()->>'total_assets')::numeric = 0, 'FAIL rls: B''s net worth includes A''s data';
  assert public.income_split('2026-11-01')->>'state' = 'empty', 'FAIL rls: B''s split includes A''s income';
  -- B saving its own groups never touches A's.
  perform public.save_income_split_groups('[{"category":"food","group":"skip"}]'::jsonb, 40::smallint, 40::smallint, 20::smallint);
end $$;

reset role;
do $$
begin
  assert (select split_group from public.category_groups
           where user_id = '00000000-0000-4000-8000-0000000000a1' and category = 'food') = 'needs',
         'FAIL rls: A''s food group changed by B';
  assert (select split_needs_pct from public.settings where user_id = '00000000-0000-4000-8000-0000000000a1') = 50,
         'FAIL rls: A''s targets changed by B';
  assert (select name from public.assets where id = current_setting('kl_test.a_gold')::uuid) = 'Public Gold GAP',
         'FAIL rls: A''s gold renamed by B';
end $$;

-- anon can't call the new functions.
set local role anon;
do $$
begin
  begin
    perform public.income_split('2026-11-01');
    raise exception 'FAIL grants: anon executed income_split';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.net_worth_breakdown();
    raise exception 'FAIL grants: anon executed net_worth_breakdown';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

-- Reset all data restores A's default groups.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
select public.reset_user_data();
do $$
begin
  assert (select count(*) from public.category_groups) = 5, 'FAIL reset: defaults not restored';
  assert not exists (select 1 from public.category_groups where category = 'Groceries'), 'FAIL reset: custom group survived';
end $$;
reset role;

-- ─── Done: always roll back ─────────────────────────────────────────────────

do $$ begin raise exception 'PASS: K + L backend tests'; end $$;
rollback;
