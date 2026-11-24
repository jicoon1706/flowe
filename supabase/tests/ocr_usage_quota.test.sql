-- receipt-ocr quota tests (migration 20261126b_ocr_usage_quota).
-- Same harness as k_l_backend.test.sql: ONE transaction that never commits.
-- The last statement raises 'PASS: …' on purpose so the run rolls back; any
-- failed check raises 'FAIL: …' first. Run on a local or branch database:
--
--   psql -v ON_ERROR_STOP=1 -f supabase/tests/ocr_usage_quota.test.sql
--
-- Expected result: an error whose message starts with "PASS:".

begin;

insert into auth.users (id, aud, role, email, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-4000-8000-0000000000a8', 'authenticated', 'authenticated', 'ocr-test-a@example.invalid', '{"display_name":"OCR A"}', now(), now()),
       ('00000000-0000-4000-8000-0000000000b8', 'authenticated', 'authenticated', 'ocr-test-b@example.invalid', '{"display_name":"OCR B"}', now(), now());

-- 1. Per-user limit: 3 allowed, the 4th refused, and the refused call is not counted.
do $$
declare i int; ok boolean; n int;
begin
  for i in 1..3 loop
    if not public.ocr_usage_take('00000000-0000-4000-8000-0000000000a8', 3, 100) then
      raise exception 'FAIL: call % under the user limit was refused', i;
    end if;
  end loop;
  if public.ocr_usage_take('00000000-0000-4000-8000-0000000000a8', 3, 100) then
    raise exception 'FAIL: 4th call over the user limit was allowed';
  end if;
  select count into n from public.ocr_usage where user_id = '00000000-0000-4000-8000-0000000000a8';
  if n <> 3 then raise exception 'FAIL: refused call was counted (count = %)', n; end if;
end $$;

-- 2. Global cap: user B is refused once the day's total reaches it, even with user quota left.
do $$
begin
  if public.ocr_usage_take('00000000-0000-4000-8000-0000000000b8', 30, 3) then
    raise exception 'FAIL: global cap of 3 not enforced';
  end if;
end $$;

-- 3. Clients can't read, write or call it.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a8","role":"authenticated"}', true);
do $$
begin
  perform 1 from public.ocr_usage;
  raise exception 'FAIL: authenticated can read ocr_usage';
exception when insufficient_privilege then null;
end $$;
do $$
begin
  perform public.ocr_usage_take('00000000-0000-4000-8000-0000000000a8', 1000, 1000);
  raise exception 'FAIL: authenticated can call ocr_usage_take';
exception when insufficient_privilege then null;
end $$;

reset role;
do $$ begin raise exception 'PASS: receipt-ocr quota holds'; end $$;
