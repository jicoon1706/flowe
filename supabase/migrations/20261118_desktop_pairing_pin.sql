-- Flowe Desktop: pairing codes and server-side PIN checks.
--
-- 1. pin_attempts      — wrong-PIN counter and lockout per user. Written only by
--                        the verify-pin and desktop-pair edge functions (service
--                        role); clients have no policy, so they can't reset it.
-- 2. desktop_pairings  — one-time codes the phone creates (Settings › Security ›
--                        Use Flowe on desktop). Only a SHA-256 of the code is
--                        stored; a code lives 5 minutes, is used once, and is
--                        voided after 5 wrong PINs.
--
-- Both tables have RLS on and no policies: only the service role reads them.

create table if not exists public.pin_attempts (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  failed       integer not null default 0 check (failed >= 0),
  locked_until timestamptz,
  updated_at   timestamptz not null default now()
);

comment on table public.pin_attempts is
  'Wrong-PIN counter per user (5 tries, then 15 minutes locked). Service role only.';

alter table public.pin_attempts enable row level security;
revoke all on public.pin_attempts from public, anon, authenticated;

create table if not exists public.desktop_pairings (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  code_hash  text not null unique,
  expires_at timestamptz not null,
  used_at    timestamptz,
  failed     integer not null default 0 check (failed >= 0),
  created_at timestamptz not null default now()
);

comment on table public.desktop_pairings is
  'One-time desktop pairing codes (SHA-256 only), 5-minute life, single use. Service role only.';

create index if not exists desktop_pairings_user_idx on public.desktop_pairings (user_id);

alter table public.desktop_pairings enable row level security;
revoke all on public.desktop_pairings from public, anon, authenticated;
