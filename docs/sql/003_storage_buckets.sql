-- Flowe Migration 003: Storage Buckets
-- Requires 001_init_schema.sql to have run first

BEGIN;

-- ============================================
-- STORAGE BUCKETS
-- ============================================
insert into storage.buckets (id, name, public)
values
  ('avatars',      'avatars',      false),
  ('receipts',     'receipts',     false),
  ('learn-images', 'learn-images', false)
on conflict (id) do nothing;

-- ============================================
-- STORAGE RLS POLICIES
-- ============================================

-- Avatars: user can only access their own folder {user_id}/avatar.jpg
create policy "avatars user folder access" on storage.objects
  for all using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Receipts: user can only access their own folder {user_id}/
create policy "receipts user folder access" on storage.objects
  for all using (
    bucket_id = 'receipts'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Learn images: user can only access their own folder {user_id}/{entry_id}/
create policy "learn_images user folder access" on storage.objects
  for all using (
    bucket_id = 'learn-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

COMMIT;