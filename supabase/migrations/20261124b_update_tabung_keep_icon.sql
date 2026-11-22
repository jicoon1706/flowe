-- update_tabung keeps the Tabung's own icon.
--
-- 20261124 wrote the goal type into accounts.icon and tabung_accounts.icon.
-- Screens draw a Tabung from template_type first (tabungIcon), so that write
-- only wiped custom / emoji icons the phone still shows. Same function, minus
-- the two icon assignments. Signature, rules, grants unchanged.

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
         updated_at = now()
   where id = p_account_id;

  update tabung_accounts
     set template_type = p_goal_type,
         target_amount = round(p_target, 2),
         monthly_topup = round(p_monthly_topup, 2),
         from_date     = p_from_date,
         to_date       = p_to_date,
         cover_path    = nullif(btrim(coalesce(p_cover_path, '')), '')
   where account_id = p_account_id;
end;
$$;
