-- Lets a recovered user keep reading files uploaded under an earlier (lost) anonymous login's folder.
-- Add a row to public.storage_folder_aliases (user_id = new login, old_folder = old login id) to grant it.
create table if not exists public.storage_folder_aliases (
  user_id uuid not null references auth.users(id) on delete cascade,
  old_folder text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, old_folder)
);
alter table public.storage_folder_aliases enable row level security;

create or replace function public.storage_folder_allowed(folder text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select folder = auth.uid()::text
      or exists (select 1 from public.storage_folder_aliases a
                 where a.user_id = auth.uid() and a.old_folder = folder);
$$;
revoke all on function public.storage_folder_allowed(text) from public;
grant execute on function public.storage_folder_allowed(text) to authenticated;

drop policy if exists "avatars user folder access" on storage.objects;
drop policy if exists "receipts user folder access" on storage.objects;
drop policy if exists "learn_images user folder access" on storage.objects;

create policy "avatars user folder access" on storage.objects for all
  using (bucket_id = 'avatars' and public.storage_folder_allowed((storage.foldername(name))[1]))
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "receipts user folder access" on storage.objects for all
  using (bucket_id = 'receipts' and public.storage_folder_allowed((storage.foldername(name))[1]))
  with check (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "learn_images user folder access" on storage.objects for all
  using (bucket_id = 'learn-images' and public.storage_folder_allowed((storage.foldername(name))[1]))
  with check (bucket_id = 'learn-images' and (storage.foldername(name))[1] = auth.uid()::text);
