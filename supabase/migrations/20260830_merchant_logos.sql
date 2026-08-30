-- Merchant logos: shared reference data mapping a keyword found in a
-- transaction's name to a brand and its logo.
--
-- Not user data — every user reads the same rows and nobody writes them from
-- the app. The app keeps a bundled copy of this list as an offline fallback
-- (src/utils/merchantLogo.ts), so adding a merchant here reaches users without
-- an app update, while someone with no connection still gets the built-in ones.

create table if not exists public.merchant_logos (
  id          uuid          primary key default gen_random_uuid(),
  -- Lowercase, matched as a whole word against the transaction name. Several
  -- keywords may point at one brand ("mcd" and "mcdonald").
  keyword     varchar(60)   not null unique,
  -- Human-readable brand name, for whoever curates this table.
  label       varchar(60)   not null,
  -- Used to build a logo URL when no file has been uploaded. Null means the
  -- brand is listed for its category alone and shows no logo at all — the row
  -- falls back to the category icon (banks, for instance).
  domain      varchar(120),
  -- Expense category to preselect when this merchant is recognised. Must be a
  -- category id from constants/categories.ts: food, transport, bills, shopping,
  -- health, entertainment, others. Null means "don't guess".
  category    varchar(30),
  -- Object path in the 'merchant-logos' bucket. Best quality; wins when set.
  logo_path   text,
  -- Explicit logo URL, for a brand whose logo is better fetched from elsewhere.
  logo_url    text,
  is_active   boolean       default true,
  updated_at  timestamptz   default now()
);

create index if not exists merchant_logos_active_idx
  on public.merchant_logos (is_active);

alter table public.merchant_logos enable row level security;

-- Readable by anyone signed in (Flowe signs users in anonymously at first
-- launch) and by anon. No insert/update/delete policy: the table is curated
-- from the Supabase dashboard or the upload script, never from the app.
drop policy if exists "merchant logos are readable by all users" on public.merchant_logos;
create policy "merchant logos are readable by all users"
  on public.merchant_logos for select
  to authenticated, anon
  using (true);

-- Public bucket: these are brand marks shown in every user's list, so there's
-- nothing to scope to a user, and signed URLs would only defeat image caching.
insert into storage.buckets (id, name, public)
values ('merchant-logos', 'merchant-logos', true)
on conflict (id) do update set public = true;

drop policy if exists "merchant logos are publicly readable" on storage.objects;
create policy "merchant logos are publicly readable"
  on storage.objects for select
  using (bucket_id = 'merchant-logos');

-- ─── Seed: the list Flowe already ships with ────────────────────────────────
insert into public.merchant_logos (keyword, label, domain, category) values
  ('mcdonald', 'McDonald''s', 'mcdonalds.com.my', 'food'),
  ('mcd', 'McDonald''s', 'mcdonalds.com.my', 'food'),
  ('kfc', 'KFC', 'kfc.com.my', 'food'),
  ('burger king', 'Burger King', 'burgerking.com.my', 'food'),
  ('domino', 'Domino''s Pizza', 'dominos.com.my', 'food'),
  ('pizza hut', 'Pizza Hut', 'pizzahut.com.my', 'food'),
  ('subway', 'Subway', 'subway.com', 'food'),
  ('starbucks', 'Starbucks', 'starbucks.com.my', 'food'),
  ('zus', 'ZUS Coffee', 'zuscoffee.com', 'food'),
  ('tealive', 'Tealive', 'tealive.com.my', 'food'),
  ('old town', 'OldTown White Coffee', 'oldtown.com.my', 'food'),
  ('secretrecipe', 'Secret Recipe', 'secretrecipe.com.my', 'food'),
  ('secret recipe', 'Secret Recipe', 'secretrecipe.com.my', 'food'),
  ('texas', 'Texas Chicken', 'texaschicken.com.my', 'food'),
  ('marrybrown', 'Marrybrown', 'marrybrown.com', 'food'),
  ('nando', 'Nando''s', 'nandos.com.my', 'food'),
  ('sushi', 'Sushi King', 'sushiking.com.my', 'food'),
  ('foodpanda', 'foodpanda', 'foodpanda.com.my', 'food'),
  ('luckin', 'Luckin Coffee', 'luckincoffee.com', 'food'),
  ('krispy', 'Krispy Kreme', 'krispykreme.com', 'food'),
  ('99 speedmart', '99 Speedmart', '99speedmart.com.my', 'food'),
  ('speedmart', '99 Speedmart', '99speedmart.com.my', 'food'),
  ('aeon', 'AEON', 'aeonretail.com.my', 'food'),
  ('tesco', 'Lotus''s', 'lotuss.com.my', 'food'),
  ('lotus', 'Lotus''s', 'lotuss.com.my', 'food'),
  ('mydin', 'MYDIN', 'mydin.com.my', 'food'),
  ('giant', 'Giant', 'giant.com.my', 'food'),
  ('jaya grocer', 'Jaya Grocer', 'jayagrocer.com', 'food'),
  ('village grocer', 'Village Grocer', 'villagegrocer.com.my', 'food'),
  ('watsons', 'Watsons', 'watsons.com.my', 'health'),
  ('guardian', 'Guardian', 'guardian.com.my', 'health'),
  ('mr diy', 'MR.DIY', 'mrdiy.com', 'shopping'),
  ('ikea', 'IKEA', 'ikea.com', 'shopping'),
  ('uniqlo', 'UNIQLO', 'uniqlo.com', 'shopping'),
  ('padini', 'Padini', 'padini.com', 'shopping'),
  ('shopee', 'Shopee', 'shopee.com.my', 'shopping'),
  ('lazada', 'Lazada', 'lazada.com.my', 'shopping'),
  ('zalora', 'ZALORA', 'zalora.com.my', 'shopping'),
  ('grab', 'Grab', 'grab.com', 'transport'),
  ('grabcar', 'Grab', 'grab.com', 'transport'),
  ('lalamove', 'Lalamove', 'lalamove.com', 'transport'),
  ('petronas', 'PETRONAS', 'petronas.com', 'transport'),
  ('setel', 'Setel', 'setel.com', 'transport'),
  ('shell', 'Shell', 'shell.com.my', 'transport'),
  ('petron', 'Petron', 'petron.com.my', 'transport'),
  ('caltex', 'Caltex', 'caltex.com', 'transport'),
  ('touch', 'Touch ''n Go', 'touchngo.com.my', 'transport'),
  ('tng', 'Touch ''n Go', 'touchngo.com.my', 'transport'),
  ('airasia', 'AirAsia', 'airasia.com', 'transport'),
  ('malaysia airlines', 'Malaysia Airlines', 'malaysiaairlines.com', 'transport'),
  ('ktm', 'KTM', 'ktmb.com.my', 'transport'),
  ('rapidkl', 'Rapid KL', 'myrapid.com.my', 'transport'),
  ('tnb', 'Tenaga Nasional', 'tnb.com.my', 'bills'),
  ('maxis', 'Maxis', 'maxis.com.my', 'bills'),
  ('hotlink', 'Hotlink', 'hotlink.com.my', 'bills'),
  ('celcom', 'Celcom', 'celcom.com.my', 'bills'),
  ('digi', 'Digi', 'digi.com.my', 'bills'),
  ('umobile', 'U Mobile', 'u.com.my', 'bills'),
  -- No logo published anywhere usable — recognised for its category only.
  ('unifi', 'unifi', null, 'bills'),
  ('time', 'TIME', 'time.com.my', 'bills'),
  ('astro', 'Astro', 'astro.com.my', 'bills'),
  ('syabas', 'Air Selangor', 'airselangor.com', 'bills'),
  ('air selangor', 'Air Selangor', 'airselangor.com', 'bills'),
  ('indah', 'Indah Water', null, 'bills'),
  ('google', 'Google', 'google.com', 'bills'),
  ('apple', 'Apple', null, 'bills'),
  ('microsoft', 'Microsoft', 'microsoft.com', 'bills'),
  -- A Claude subscription bills as either name, depending on the card.
  ('claude', 'Claude', 'claude.ai', 'bills'),
  ('anthropic', 'Claude', 'claude.ai', 'bills'),
  ('netflix', 'Netflix', 'netflix.com', 'entertainment'),
  ('spotify', 'Spotify', 'spotify.com', 'entertainment'),
  ('youtube', 'YouTube', 'youtube.com', 'entertainment'),
  ('disney', 'Disney+', 'disneyplus.com', 'entertainment'),
  ('steam', 'Steam', 'steampowered.com', 'entertainment'),
  -- No logos: a transfer is not a purchase from the bank, so its mark would
  -- say less than the category icon. Listed for the category guess only.
  ('maybank', 'Maybank', null, 'others'),
  ('cimb', 'CIMB', null, 'others'),
  ('public bank', 'Public Bank', null, 'others'),
  ('rhb', 'RHB', null, 'others'),
  ('hong leong', 'Hong Leong Bank', null, 'others'),
  ('ambank', 'AmBank', null, 'others'),
  ('bsn', 'BSN', null, 'others'),
  ('bank islam', 'Bank Islam', null, 'others')
on conflict (keyword) do update set
  label    = excluded.label,
  domain   = excluded.domain,
  category = excluded.category;
