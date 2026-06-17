-- ============================================
-- Add 'liability' to the notification_type enum
-- ============================================
-- The app records an in-app notification when a liability is added, updated, or
-- removed. The original enum (001_init_schema.sql) only had 'asset', so without
-- this value those inserts are rejected by Postgres.
--
-- NOTE: `alter type ... add value` cannot run inside a transaction block in
-- Postgres < 12. Run this statement on its own (the Supabase SQL editor does).

alter type notification_type add value if not exists 'liability' after 'asset';
