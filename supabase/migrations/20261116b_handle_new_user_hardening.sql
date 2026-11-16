-- Hardening for public.handle_new_user (Supabase security advisor, 2026-11-16).
--
-- handle_new_user is the trigger function on auth.users (on_auth_user_created)
-- that creates each new user's profiles row, including anonymous sign-ins,
-- which is how every Flowe user starts. Two advisor warnings applied:
--
--  1. function_search_path_mutable: it ran SECURITY DEFINER with whatever
--     search_path the caller had. Pinning it to '' is safe because the body
--     already names public.profiles in full.
--  2. anon/authenticated could execute it directly via
--     /rest/v1/rpc/handle_new_user. It is only meant to run as a trigger.
--     Postgres doesn't check EXECUTE when firing a trigger, so revoking it
--     does not affect sign-up; supabase_auth_admin (the role Auth inserts
--     users as) is granted it explicitly anyway, belt and braces.
--
-- The function body and the trigger are unchanged. Idempotent.

alter function public.handle_new_user() set search_path = '';

revoke execute on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.handle_new_user() to supabase_auth_admin, service_role;
