-- auth_config.pin_hash privilege tests (migration 20261126_pin_hash_server_only).
-- Same harness as k_l_backend.test.sql: ONE transaction that never commits.
-- The last statement raises 'PASS: …' on purpose so the run rolls back; any
-- failed check raises 'FAIL: …' first. Run on a local or branch database:
--
--   psql -v ON_ERROR_STOP=1 -f supabase/tests/pin_hash_privileges.test.sql
--
-- Expected result: an error whose message starts with "PASS:".

begin;

insert into auth.users (id, aud, role, email, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-4000-8000-0000000000a9', 'authenticated', 'authenticated', 'ph-test-a@example.invalid', '{"display_name":"PH Test A"}', now(), now());

insert into public.auth_config (user_id, pin_hash, fingerprint_enabled, auto_lock_minutes)
values ('00000000-0000-4000-8000-0000000000a9', 'pbkdf2$100000$AAAAAAAAAAAAAAAAAAAAAA==$00', false, 5);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a9","role":"authenticated"}', true);

-- 1. The lock settings are still readable and writable by the owner.
do $$
declare v int;
begin
  select auto_lock_minutes into v from public.auth_config;
  if v is distinct from 5 then raise exception 'FAIL: owner cannot read auto_lock_minutes'; end if;
  update public.auth_config set auto_lock_minutes = 10, fingerprint_enabled = true, updated_at = now();
  select auto_lock_minutes into v from public.auth_config;
  if v is distinct from 10 then raise exception 'FAIL: owner cannot update lock settings'; end if;
end $$;

-- 2. pin_hash cannot be read.
do $$
begin
  perform pin_hash from public.auth_config;
  raise exception 'FAIL: authenticated can select pin_hash';
exception when insufficient_privilege then null;
end $$;

-- 3. pin_hash cannot be overwritten.
do $$
begin
  update public.auth_config set pin_hash = 'x';
  raise exception 'FAIL: authenticated can update pin_hash';
exception when insufficient_privilege then null;
end $$;

-- 4. No insert (rows come from verify-pin) and no delete (would let 'set' replace the PIN).
do $$
begin
  delete from public.auth_config;
  raise exception 'FAIL: authenticated can delete auth_config';
exception when insufficient_privilege then null;
end $$;

do $$
begin
  insert into public.auth_config (user_id, pin_hash) values ('00000000-0000-4000-8000-0000000000a9', 'x');
  raise exception 'FAIL: authenticated can insert auth_config';
exception when insufficient_privilege then null;
end $$;

-- 5. anon gets nothing.
reset role;
set local role anon;
do $$
begin
  perform fingerprint_enabled from public.auth_config;
  raise exception 'FAIL: anon can select auth_config';
exception when insufficient_privilege then null;
end $$;

do $$ begin raise exception 'PASS: auth_config.pin_hash is server-only'; end $$;
