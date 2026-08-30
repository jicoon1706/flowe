# Merchant logos

Drop logo files in **this folder**, then upload them:

```bash
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
  node scripts/upload-merchant-logos.js ./logos
```

They go to the public `merchant-logos` bucket and each matching row in
`public.merchant_logos` gets its `logo_path` set. Users pick them up on their
next app launch — no app update, no rebuild.

Nothing here is bundled into the app; the folder is only a staging area, and
files are `.gitignore`d so a few MB of PNGs don't land in the repo.

## File rules

- **Name the file after the keyword** in the table below. Spaces may be written
  as hyphens: `99-speedmart.png` and `99 speedmart.png` both work.
- **PNG with a transparent background**, square, **256×256 or larger**. The app
  draws them at about 23pt, so anything sharper than 256 is wasted bytes.
- SVG, WebP and JPG are accepted too, but transparent PNG is the safe choice.
- You don't have to do all of them. Anything without a file falls back to a
  favicon fetched from the brand's domain — lower quality, but it works today.
- **One file per brand, not per keyword.** `mcd` and `mcdonald` are the same
  logo, so `mcdonald.png` alone updates both rows — the script matches the
  filename to a keyword, then applies the file to every row with that domain.
  Drop in both and the second is skipped with a note.

Use official brand-kit files where a company publishes one. These are
trademarks: if a brand objects, clear that row's `logo_path` and it reverts to
the favicon with no deploy.

## The list

One file per **brand**. Where a brand has several keywords the extra ones are
listed under `also matches` — they are covered by the same file, you do not
need a second copy.

A brand with **no logo** is recognised for its category only and always draws
the category icon; there is nothing to download for it.

`category` is what a new expense is filed under when the merchant is recognised.
Both the category and the keyword are editable in the `merchant_logos` table —
this is just what Flowe ships with.

### Food & drink

| filename | matches a name containing | also matches | category |
|---|---|---|---|
| `mcdonald.png` | mcdonald | mcd | Food & Drink |
| `kfc.png` | kfc | — | Food & Drink |
| `burger-king.png` | burger king | — | Food & Drink |
| `domino.png` | domino | — | Food & Drink |
| `pizza-hut.png` | pizza hut | — | Food & Drink |
| `subway.png` | subway | — | Food & Drink |
| `starbucks.png` | starbucks | — | Food & Drink |
| `zus.png` | zus | — | Food & Drink |
| `tealive.png` | tealive | — | Food & Drink |
| `old-town.png` | old town | — | Food & Drink |
| `secretrecipe.png` | secretrecipe | secret recipe | Food & Drink |
| `texas.png` | texas | — | Food & Drink |
| `marrybrown.png` | marrybrown | — | Food & Drink |
| `nando.png` | nando | — | Food & Drink |
| `sushi.png` | sushi | — | Food & Drink |
| `foodpanda.png` | foodpanda | — | Food & Drink |
| `luckin.png` | luckin | — | Food & Drink |
| `krispy.png` | krispy | — | Food & Drink |

### Groceries (filed as Food & Drink)

| filename | matches a name containing | also matches | category |
|---|---|---|---|
| `99-speedmart.png` | 99 speedmart | speedmart | Food & Drink |
| `aeon.png` | aeon | — | Food & Drink |
| `tesco.png` | tesco | lotus | Food & Drink |
| `mydin.png` | mydin | — | Food & Drink |
| `giant.png` | giant | — | Food & Drink |
| `jaya-grocer.png` | jaya grocer | — | Food & Drink |
| `village-grocer.png` | village grocer | — | Food & Drink |

### Health & pharmacy

| filename | matches a name containing | also matches | category |
|---|---|---|---|
| `watsons.png` | watsons | — | Health |
| `guardian.png` | guardian | — | Health |

### Shopping

| filename | matches a name containing | also matches | category |
|---|---|---|---|
| `mr-diy.png` | mr diy | — | Shopping |
| `ikea.png` | ikea | — | Shopping |
| `uniqlo.png` | uniqlo | — | Shopping |
| `padini.png` | padini | — | Shopping |
| `shopee.png` | shopee | — | Shopping |
| `lazada.png` | lazada | — | Shopping |
| `zalora.png` | zalora | — | Shopping |

### Transport, fuel & travel

| filename | matches a name containing | also matches | category |
|---|---|---|---|
| `grab.png` | grab | grabcar | Transport |
| `lalamove.png` | lalamove | — | Transport |
| `petronas.png` | petronas | — | Transport |
| `setel.png` | setel | — | Transport |
| `shell.png` | shell | — | Transport |
| `petron.png` | petron | — | Transport |
| `caltex.png` | caltex | — | Transport |
| `touch.png` | touch | tng | Transport |
| `airasia.png` | airasia | — | Transport |
| `malaysia-airlines.png` | malaysia airlines | — | Transport |
| `ktm.png` | ktm | — | Transport |
| `rapidkl.png` | rapidkl | — | Transport |

### Bills, telco & utilities

| filename | matches a name containing | also matches | category |
|---|---|---|---|
| `tnb.png` | tnb | — | Bills |
| `maxis.png` | maxis | — | Bills |
| `hotlink.png` | hotlink | — | Bills |
| `celcom.png` | celcom | — | Bills |
| `digi.png` | digi | — | Bills |
| `umobile.png` | umobile | — | Bills |
| — *(no logo)* | unifi | — | Bills |
| `time.png` | time | — | Bills |
| `astro.png` | astro | — | Bills |
| `syabas.png` | syabas | air selangor | Bills |
| — *(no logo)* | indah | — | Bills |
| `google.png` | google | — | Bills |
| — *(no logo)* | apple | — | Bills |
| `microsoft.png` | microsoft | — | Bills |
| `claude.png` | claude | anthropic | Bills |

### Entertainment & subscriptions

| filename | matches a name containing | also matches | category |
|---|---|---|---|
| `netflix.png` | netflix | — | Entertainment |
| `spotify.png` | spotify | — | Entertainment |
| `youtube.png` | youtube | — | Entertainment |
| `disney.png` | disney | — | Entertainment |
| `steam.png` | steam | — | Entertainment |

### Banks (fees, transfers — nothing more specific to say)

| filename | matches a name containing | also matches | category |
|---|---|---|---|
| — *(no logo)* | maybank | — | Others |
| — *(no logo)* | cimb | — | Others |
| — *(no logo)* | public bank | — | Others |
| — *(no logo)* | rhb | — | Others |
| — *(no logo)* | hong leong | — | Others |
| — *(no logo)* | ambank | — | Others |
| — *(no logo)* | bsn | — | Others |
| — *(no logo)* | bank islam | — | Others |
