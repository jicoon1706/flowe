-- auth_config.pin_hash becomes server-only.
--
-- Before: the owner RLS policies let any session read and write pin_hash
-- through PostgREST. It was an unsalted SHA-256 of a 6-digit PIN, so anyone
-- holding the session (a paired desktop, the laptop's browser profile) could
-- recover the PIN offline in under a second, or overwrite it without the old
-- PIN. Both bypassed verify-pin's lockout and old-PIN check.
-- (security-audit/run-1: flowe-akmal/auth_config.pin_hash:owner-readable-unsalted-pin-hash)
--
-- After: clients can only read and update the lock settings. The PIN is set,
-- checked and changed only by the verify-pin edge function (service role),
-- which also stores a salted PBKDF2 hash and upgrades old SHA-256 rows on the
-- next successful check.
--
-- Column privileges only work once the table-wide privilege is gone, so the
-- table grant is revoked first and the safe columns are granted back.
-- INSERT and DELETE are not granted back either: deleting your own row would
-- let verify-pin's 'set' action replace the PIN without the old one, and rows
-- are now created by verify-pin. reset_user_data is SECURITY DEFINER and still
-- deletes the row.
--
-- Deploy order: verify-pin and desktop-pair first, then the app builds that
-- stop selecting pin_hash, then this migration. Older app builds will fail to
-- save a PIN after this runs.

revoke all on table public.auth_config from anon, authenticated;

grant select (id, user_id, fingerprint_enabled, auto_lock_minutes, updated_at)
  on public.auth_config to authenticated;

grant update (fingerprint_enabled, auto_lock_minutes, updated_at)
  on public.auth_config to authenticated;

-- The RLS policies stay as they are (owner-only rows). With the grants above
-- they now cover only the lock settings.
