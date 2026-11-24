-- Daily quota for receipt-ocr, which spends the operator's OpenAI key.
--
-- Before: receipt-ocr never checked the caller and had no limit, so anyone
-- holding the public anon key (or any anonymous sign-in) could run up the
-- OpenAI bill. (security-audit/run-1: receipt-ocr unauthenticated-unmetered-openai-proxy)
--
-- ocr_usage counts calls per user per day. ocr_usage_take() takes one unit
-- atomically and refuses past the per-user limit, or past a global daily cap.
-- The global cap matters because anonymous sign-ins make new users free. Only
-- the service role (the edge function) can call it; clients can neither read
-- nor write the table.
--
-- Deploy order: apply this migration before deploying the new receipt-ocr,
-- which fails closed (503) when it cannot take a unit.

create table if not exists public.ocr_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day     date not null,
  count   int  not null default 0 check (count >= 0),
  primary key (user_id, day)
);

alter table public.ocr_usage enable row level security;
revoke all on table public.ocr_usage from public, anon, authenticated;

create or replace function public.ocr_usage_take(p_user uuid, p_user_limit int, p_global_limit int)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_today date := (now() at time zone 'Asia/Kuala_Lumpur')::date;
  v_total int;
  v_user  int;
begin
  if p_user is null or p_user_limit < 1 or p_global_limit < 1 then
    return false;
  end if;

  -- One taker at a time per day, so the global total can't be overshot by
  -- concurrent calls. Held only until this statement's transaction ends.
  perform pg_advisory_xact_lock(hashtext('public.ocr_usage'), v_today - date '2000-01-01');

  select coalesce(sum(u.count), 0) into v_total from public.ocr_usage u where u.day = v_today;
  if v_total >= p_global_limit then
    return false;
  end if;

  insert into public.ocr_usage as u (user_id, day, count)
  values (p_user, v_today, 1)
  on conflict (user_id, day) do update set count = u.count + 1
  returning u.count into v_user;

  if v_user > p_user_limit then
    update public.ocr_usage set count = count - 1 where user_id = p_user and day = v_today;
    return false;
  end if;
  return true;
end;
$$;

revoke all on function public.ocr_usage_take(uuid, int, int) from public, anon, authenticated;
grant execute on function public.ocr_usage_take(uuid, int, int) to service_role;
