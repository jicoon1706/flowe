// Matches a transaction's name against merchants Flowe knows, so a row can show
// the real brand mark instead of a generic icon, and a new expense can guess its
// own category. Deliberately a plain local table: no lookup service is contacted
// to *identify* the merchant, only to fetch the logo of a domain listed here.
//
// Keywords are matched case-insensitively as whole words, so "McDonalds KLCC",
// "MCD KLCC" and "mcdonald's drive thru" all resolve. Longer keywords win, which
// keeps "grabcar" from being read as plain "grab".
//
// This is the offline fallback. The live list lives in Supabase
// (public.merchant_logos) and replaces this one at launch — see
// services/merchantLogos.ts.

/**
 * Category ids come from `expenseCategories` in constants/categories.ts.
 *
 * A null domain means "recognise the name, show no logo": the brand is here for
 * its category guess alone, and the row falls back to the category icon.
 */
type BundledMerchant = readonly [keyword: string, domain: string | null, category: string];

const BUNDLED_MERCHANTS: BundledMerchant[] = [
  // ─── Food & drink ───
  ['mcdonald', 'mcdonalds.com.my', 'food'],
  ['mcd', 'mcdonalds.com.my', 'food'],
  ['kfc', 'kfc.com.my', 'food'],
  ['burger king', 'burgerking.com.my', 'food'],
  ['domino', 'dominos.com.my', 'food'],
  ['pizza hut', 'pizzahut.com.my', 'food'],
  ['subway', 'subway.com', 'food'],
  ['starbucks', 'starbucks.com.my', 'food'],
  ['zus', 'zuscoffee.com', 'food'],
  ['tealive', 'tealive.com.my', 'food'],
  ['old town', 'oldtown.com.my', 'food'],
  ['secretrecipe', 'secretrecipe.com.my', 'food'],
  ['secret recipe', 'secretrecipe.com.my', 'food'],
  ['texas', 'texaschicken.com.my', 'food'],
  ['marrybrown', 'marrybrown.com', 'food'],
  ['nando', 'nandos.com.my', 'food'],
  ['sushi', 'sushiking.com.my', 'food'],
  ['foodpanda', 'foodpanda.com.my', 'food'],
  ['luckin', 'luckincoffee.com', 'food'],
  ['krispy', 'krispykreme.com', 'food'],

  // ─── Groceries (filed as Food & Drink) ───
  ['99 speedmart', '99speedmart.com.my', 'food'],
  ['speedmart', '99speedmart.com.my', 'food'],
  ['aeon', 'aeonretail.com.my', 'food'],
  ['tesco', 'lotuss.com.my', 'food'],
  ['lotus', 'lotuss.com.my', 'food'],
  ['mydin', 'mydin.com.my', 'food'],
  ['giant', 'giant.com.my', 'food'],
  ['jaya grocer', 'jayagrocer.com', 'food'],
  ['village grocer', 'villagegrocer.com.my', 'food'],

  // ─── Health & pharmacy ───
  ['watsons', 'watsons.com.my', 'health'],
  ['guardian', 'guardian.com.my', 'health'],

  // ─── Shopping ───
  ['mr diy', 'mrdiy.com', 'shopping'],
  ['ikea', 'ikea.com', 'shopping'],
  ['uniqlo', 'uniqlo.com', 'shopping'],
  ['padini', 'padini.com', 'shopping'],
  ['shopee', 'shopee.com.my', 'shopping'],
  ['lazada', 'lazada.com.my', 'shopping'],
  ['zalora', 'zalora.com.my', 'shopping'],

  // ─── Transport, fuel & travel ───
  ['grab', 'grab.com', 'transport'],
  ['grabcar', 'grab.com', 'transport'],
  ['lalamove', 'lalamove.com', 'transport'],
  ['petronas', 'petronas.com', 'transport'],
  ['setel', 'setel.com', 'transport'],
  ['shell', 'shell.com.my', 'transport'],
  ['petron', 'petron.com.my', 'transport'],
  ['caltex', 'caltex.com', 'transport'],
  ['touch', 'touchngo.com.my', 'transport'],
  ['tng', 'touchngo.com.my', 'transport'],
  ['airasia', 'airasia.com', 'transport'],
  ['malaysia airlines', 'malaysiaairlines.com', 'transport'],
  ['ktm', 'ktmb.com.my', 'transport'],
  ['rapidkl', 'myrapid.com.my', 'transport'],

  // ─── Bills, telco & utilities ───
  ['tnb', 'tnb.com.my', 'bills'],
  ['maxis', 'maxis.com.my', 'bills'],
  ['hotlink', 'hotlink.com.my', 'bills'],
  ['celcom', 'celcom.com.my', 'bills'],
  ['digi', 'digi.com.my', 'bills'],
  ['umobile', 'u.com.my', 'bills'],
  // No logo published anywhere usable — recognised for its category only.
  ['unifi', null, 'bills'],
  ['time', 'time.com.my', 'bills'],
  ['astro', 'astro.com.my', 'bills'],
  ['syabas', 'airselangor.com', 'bills'],
  ['air selangor', 'airselangor.com', 'bills'],
  ['indah', null, 'bills'],
  ['google', 'google.com', 'bills'],
  ['apple', null, 'bills'],
  ['microsoft', 'microsoft.com', 'bills'],
  // A Claude subscription bills as either name, depending on the card.
  ['claude', 'claude.ai', 'bills'],
  ['anthropic', 'claude.ai', 'bills'],

  // ─── Entertainment & subscriptions ───
  ['netflix', 'netflix.com', 'entertainment'],
  ['spotify', 'spotify.com', 'entertainment'],
  ['youtube', 'youtube.com', 'entertainment'],
  ['disney', 'disneyplus.com', 'entertainment'],
  ['steam', 'steampowered.com', 'entertainment'],

  // ─── Banks (fees, transfers — nothing more specific to say) ───
  // No logos: a bank transfer is not a purchase from the bank, so its mark on
  // the row would say less than the category icon does. They stay listed for
  // the category guess, which keeps a transfer out of Food & Drink.
  ['maybank', null, 'others'],
  ['cimb', null, 'others'],
  ['public bank', null, 'others'],
  ['rhb', null, 'others'],
  ['hong leong', null, 'others'],
  ['ambank', null, 'others'],
  ['bsn', null, 'others'],
  ['bank islam', null, 'others'],
];

/** One brand Flowe can recognise, from the bundled list or the database. */
export interface MerchantSource {
  keyword: string;
  /** Null for a brand listed only for its category — it shows no logo. */
  domain: string | null;
  /** Ready-to-use logo URL (an uploaded file, or a curated override). */
  logoUrl?: string;
  /** Expense category id to preselect for this merchant. */
  category?: string;
}

// Whole words only. Substring matching put Digi's logo on "digital", TIME's on
// "overtime" and Shell's on anything ending in -shell, which is worse than no
// logo at all. A trailing plural or possessive is still the same brand, so
// "mcdonalds" and "mcdonald's" both match "mcdonald".
function matcherFor(keyword: string): RegExp {
  return new RegExp(
    `(?:^|[^a-z0-9])${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:['’]?s)?(?:[^a-z0-9]|$)`
  );
}

/** Longest keyword first, so a specific brand beats a generic word inside it. */
function compile(sources: MerchantSource[]) {
  return [...sources]
    .sort((a, b) => b.keyword.length - a.keyword.length)
    .map((source) => ({ source, pattern: matcherFor(source.keyword) }));
}

const BUNDLED: MerchantSource[] = BUNDLED_MERCHANTS.map(([keyword, domain, category]) => ({
  keyword,
  domain,
  category,
}));

// The list currently in force. Starts as the bundled one so the very first
// render — before any network call — already shows logos, and is replaced by
// `setMerchantSources` once the database copy arrives.
let matchers = compile(BUNDLED);

/**
 * Swaps in the curated list from the database. Called once at startup by
 * services/merchantLogos.ts; passing an empty list restores the bundled one, so
 * a failed or empty fetch can never leave the app with no merchants at all.
 */
export function setMerchantSources(sources: MerchantSource[]) {
  matchers = compile(sources.length > 0 ? sources : BUNDLED);
  listeners.forEach((listener) => listener());
}

// The list is swapped in after startup, by which time rows are already on
// screen. They subscribe so a newly curated logo appears without waiting for
// the next data refresh.
const listeners = new Set<() => void>();

export function subscribeMerchantSources(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

/** The merchant matching a transaction name, or undefined when none does. */
export function matchMerchant(name: string | undefined): MerchantSource | undefined {
  if (!name) return undefined;
  const haystack = name.toLowerCase();
  return matchers.find(({ pattern }) => pattern.test(haystack))?.source;
}

/** The domain for a transaction name, or undefined when nothing matches. */
export function merchantDomain(name: string | undefined): string | undefined {
  return matchMerchant(name)?.domain ?? undefined;
}

/**
 * The expense category this merchant usually falls under, for prefilling the
 * form. Always a suggestion — the user's own choice wins.
 */
export function merchantCategory(name: string | undefined): string | undefined {
  return matchMerchant(name)?.category;
}

/**
 * Logo URL for a transaction name, or undefined to fall back to the category
 * icon. An uploaded file wins; otherwise the logo is derived from the brand's
 * domain. Either way only the domain travels — never the transaction name,
 * amount, or anything else about the user.
 */
export function merchantLogoUrl(name: string | undefined, size = 128): string | undefined {
  const source = matchMerchant(name);
  if (!source) return undefined;
  if (source.logoUrl) return source.logoUrl;
  // Listed for its category only — no domain to derive a logo from, and no
  // request to make. The caller draws the category icon instead.
  if (!source.domain) return undefined;
  return `https://www.google.com/s2/favicons?domain=${source.domain}&sz=${size}`;
}
