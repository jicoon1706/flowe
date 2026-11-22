-- Edit Tabung (d-tabung-edit · n-tabung-edit · t-n-tabung-edit).
--
-- The edit drawer / sheet changes goal type, name, target, monthly top-up,
-- start date, target date and an optional cover photo, all in one save.
--
-- 1. tabung_accounts gains monthly_topup and cover_path. Goal type, start and
--    target date reuse template_type, from_date and to_date.
-- 2. A private `tabung-covers` bucket, user-folder RLS like avatars/receipts.
-- 3. update_tabung(): one transaction over accounts + tabung_accounts, with
--    the same validation as the client (spec "Edit Tabung"):
--      name not empty (≤ 40), target ≥ saved toward goal, monthly top-up > 0,
--      target date ≥ start date, goal type one of the six keys.
--    "Saved toward goal" is the number on the Tabung card: Σ tabung_topup
--    since the start date ('contributed', the default) or the balance
--    ('balance' mode).
--
-- Caller rights: RLS on accounts / tabung_accounts applies; ownership is also
-- checked against auth.uid(). Idempotent.

-- ─── 1. Columns ─────────────────────────────────────────────────────────────

alter table public.tabung_accounts
  add column if not exists monthly_topup numeric(12,2),
  add column if not exists cover_path text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'tabung_accounts_monthly_topup_positive') then
    alter table public.tabung_accounts
      add constraint tabung_accounts_monthly_topup_positive
      check (monthly_topup is null or monthly_topup > 0);
  end if;
end $$;

comment on column public.tabung_accounts.monthly_topup is
  'Planned monthly top-up (RM). The target date follows target ÷ monthly top-up.';
comment on column public.tabung_accounts.cover_path is
  'Optional cover photo: object path in the tabung-covers bucket ({user_id}/{file}).';

-- ─── 2. Cover photo bucket ──────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('tabung-covers', 'tabung-covers', false)
on conflict (id) do nothing;

drop policy if exists "tabung_covers user folder access" on storage.objects;
create policy "tabung_covers user folder access" on storage.objects for all
  using (bucket_id = 'tabung-covers' and public.storage_folder_allowed((storage.foldername(name))[1]))
  with check (bucket_id = 'tabung-covers' and (storage.foldername(name))[1] = auth.uid()::text);

-- ─── 3. update_tabung ───────────────────────────────────────────────────────

create or replace function public.update_tabung(
  p_account_id    uuid,
  p_goal_type     text,
  p_name          text,
  p_target        numeric,
  p_monthly_topup numeric,
  p_from_date     date,
  p_to_date       date,
  p_cover_path    text
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_name  text := btrim(coalesce(p_name, ''));
  v_mode  text;
  v_saved numeric;
begin
  if auth.uid() is null then
    raise exception 'update_tabung: not signed in' using errcode = '42501';
  end if;

  select ta.progress_mode,
         case when ta.progress_mode = 'balance'
              then greatest(0, coalesce(ta.saved_amount, 0))
              else public.tabung_contributed(a.id, coalesce(p_from_date, ta.from_date))
         end
    into v_mode, v_saved
    from accounts a
    join tabung_accounts ta on ta.account_id = a.id
   where a.id = p_account_id
     and a.user_id = auth.uid()
     and a.type = 'tabung';
  if not found then
    raise exception 'update_tabung: Tabung not found' using errcode = 'P0002';
  end if;

  if v_name = '' then
    raise exception 'Give your Tabung a name' using errcode = '23514';
  end if;
  if char_length(v_name) > 40 then
    raise exception 'Keep the name to 40 characters' using errcode = '23514';
  end if;
  if p_goal_type is null or p_goal_type not in ('emergency', 'travel', 'raya', 'education', 'home', 'custom') then
    raise exception 'Choose a goal type' using errcode = '23514';
  end if;
  if p_target is null or p_target <= 0 then
    raise exception 'Enter a target above RM 0.00' using errcode = '23514';
  end if;
  if round(p_target, 2) < round(v_saved, 2) then
    raise exception 'Can''t be lower than RM % saved so far', to_char(v_saved, 'FM999,999,999,990.00')
      using errcode = '23514';
  end if;
  if p_monthly_topup is null or p_monthly_topup <= 0 then
    raise exception 'Enter a monthly top-up above RM 0.00' using errcode = '23514';
  end if;
  if p_from_date is null or p_to_date is null or p_to_date < p_from_date then
    raise exception 'Target date can''t be before the start date' using errcode = '23514';
  end if;

  update accounts
     set name = v_name,
         icon = p_goal_type,
         updated_at = now()
   where id = p_account_id;

  update tabung_accounts
     set template_type = p_goal_type,
         icon          = p_goal_type,
         target_amount = round(p_target, 2),
         monthly_topup = round(p_monthly_topup, 2),
         from_date     = p_from_date,
         to_date       = p_to_date,
         cover_path    = nullif(btrim(coalesce(p_cover_path, '')), '')
   where account_id = p_account_id;
end;
$$;

comment on function public.update_tabung(uuid, text, text, numeric, numeric, date, date, text) is
  'Edit Tabung: goal type, name, target, monthly top-up, dates, cover in one transaction. Caller rights; RLS applies.';

revoke all on function public.update_tabung(uuid, text, text, numeric, numeric, date, date, text) from public, anon;
grant execute on function public.update_tabung(uuid, text, text, numeric, numeric, date, date, text) to authenticated;
