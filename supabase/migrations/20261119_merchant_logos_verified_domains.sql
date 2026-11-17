-- Brings public.merchant_logos in line with the bundled list in
-- src/utils/merchantLogo.ts: every domain below was checked against logo.dev's
-- brand search (2026-11-17).
--
-- Rows with an uploaded file (logo_path) keep showing that file; for them the
-- domain only labels the brand for scripts/upload-merchant-logos.js. Rows
-- without a file (apple, indah, unifi) start drawing their logo.dev logo.
--
-- Left as they are on purpose: domino, sushi, giant, caltex, hotlink, umobile
-- and time. logo.dev has no Malaysian domain for them, but each already has an
-- uploaded file, and the upload script skips rows with a null domain. The bank
-- rows stay null as well (a transfer is not a purchase from the bank).

update public.merchant_logos as m
set domain = v.domain
from (values
  ('mcdonald',    'mcdonalds.com'),
  ('mcd',         'mcdonalds.com'),
  ('kfc',         'kfc.com'),
  ('burger king', 'bk.com'),
  ('texas',       'texaschicken.com'),
  ('foodpanda',   'foodpanda.my'),
  ('rapidkl',     'prasarana.com.my'),
  ('celcom',      'celcomdigi.com'),
  ('digi',        'celcomdigi.com'),
  ('disney',      'disney.com'),
  ('apple',       'apple.com'),
  ('indah',       'iwk.com.my'),
  ('unifi',       'myunifi.com.my')
) as v(keyword, domain)
where m.keyword = v.keyword;
