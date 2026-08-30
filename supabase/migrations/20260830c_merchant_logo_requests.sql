-- Merchants a user wants Flowe to recognise, but which aren't in
-- `public.merchant_logos` yet.
--
-- The logo list is curated (see 20260830_merchant_logos.sql) — nobody writes to
-- it from the app, which is what keeps one user's typo from putting a wrong
-- mark on everyone's transactions. This table is the way in: a user says "Mixue
-- isn't recognised", it lands here, and whoever curates the list decides
-- whether it becomes a `merchant_logos` row.

create table if not exists public.merchant_logo_requests (
  id           uuid          primary key default gen_random_uuid(),
  user_id      uuid          not null references auth.users (id) on delete cascade,
  -- What the user typed. Kept verbatim rather than normalised: how they write
  -- the name is itself a hint about how it shows up on their statements.
  merchant     varchar(80)   not null,
  -- Optional: a transaction name the merchant appears under, so the keyword can
  -- be matched against something real rather than guessed.
  example_name varchar(120),
  -- Optional: the category the user thinks it belongs to.
  category     varchar(30),
  -- 'pending' until someone acts on it; 'added' once the merchant is live;
  -- 'declined' for anything that isn't a real brand.
  status       varchar(12)   not null default 'pending',
  created_at   timestamptz   default now()
);

create index if not exists merchant_logo_requests_user_idx
  on public.merchant_logo_requests (user_id, created_at desc);

-- One pending request per merchant per user: tapping submit twice, or asking
-- again next month because nothing has happened yet, shouldn't fill the table.
create unique index if not exists merchant_logo_requests_unique_pending
  on public.merchant_logo_requests (user_id, lower(merchant))
  where status = 'pending';

alter table public.merchant_logo_requests enable row level security;

-- A user sees and files only their own requests. Nobody updates or deletes from
-- the app — a request's fate is decided by whoever curates the logo list.
drop policy if exists "users read their own merchant requests" on public.merchant_logo_requests;
create policy "users read their own merchant requests"
  on public.merchant_logo_requests for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "users file their own merchant requests" on public.merchant_logo_requests;
create policy "users file their own merchant requests"
  on public.merchant_logo_requests for insert
  to authenticated
  with check (auth.uid() = user_id);
