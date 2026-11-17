-- Settings › Data › Reset all data: a full reset (decision Q2 in docs/V2_GAPS.md).
--
-- Deletes everything the signed-in user owns, in one transaction, so a reset
-- can't stop half-way. The client then deletes the user's storage folders
-- (receipts/, learn-images/, avatars/), clears its PIN and onboarding flags,
-- signs out and goes back to /welcome.
--
-- SECURITY DEFINER so it doesn't depend on every table having a DELETE
-- policy; every statement is pinned to auth.uid(), and only signed-in users
-- (anonymous sessions included) may call it. Kept: the profiles row (the
-- auth.users trigger owns it; onboarding renames it) and pin_attempts (a
-- reset must not clear a PIN lockout).

create or replace function public.reset_user_data()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'reset_user_data: not signed in' using errcode = '42501';
  end if;

  -- Transactions first: they reference accounts, rules and assets.
  delete from transactions            where user_id = uid;
  delete from recurring_rules         where user_id = uid;
  delete from notifications           where user_id = uid;
  delete from learn_projects          where user_id = uid;  -- cascades entries and their images
  delete from learn_entries           where user_id = uid;  -- any orphaned by an older client
  delete from user_affirmations       where user_id = uid;
  delete from affirmation_favourites  where user_id = uid;
  delete from custom_categories       where user_id = uid;
  delete from merchant_logo_requests  where user_id = uid;
  delete from assets                  where user_id = uid;  -- cascades asset_values
  delete from liabilities             where user_id = uid;  -- cascades liability_values
  delete from accounts                where user_id = uid;  -- cascades bank / wallet / tabung rows
  delete from settings                where user_id = uid;
  delete from auth_config             where user_id = uid;
  delete from desktop_pairings        where user_id = uid;
end;
$$;

comment on function public.reset_user_data() is
  'Settings › Data › Reset all data: deletes every row the caller owns (keeps profiles and pin_attempts).';

revoke all on function public.reset_user_data() from public, anon;
grant execute on function public.reset_user_data() to authenticated;
