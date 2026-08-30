/**
 * Uploads high-resolution merchant logos to Supabase Storage and points the
 * matching `merchant_logos` rows at them.
 *
 * The app falls back to a favicon derived from each brand's domain, which is
 * small and inconsistent. Dropping a proper file in here replaces it — no app
 * update needed, since the app reads this table at launch.
 *
 * Usage:
 *   node scripts/upload-merchant-logos.js ./logos
 *
 * Every file in that folder is matched to a row by filename: the name (without
 * extension) must equal the row's `keyword`, with spaces written as either
 * spaces or hyphens — `mcdonald.png`, `99-speedmart.png`, `air selangor.png`.
 * One file per brand is enough: the matched keyword identifies a domain, and
 * every keyword pointing at that domain gets the same file, so `mcdonald.png`
 * covers the `mcd` row too.
 * PNG with a transparent background at 256×256 or larger works best; the app
 * renders them at ~23pt so anything sharper than that is wasted bytes.
 *
 * Requires a service-role key — this writes to a table the app can only read:
 *   SUPABASE_URL=...  SUPABASE_SERVICE_ROLE_KEY=...  node scripts/…
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Enough of a public-suffix list for the domains this table holds.
const TLD = /\.(com|net|org|co|my|ai|io)(\.(my|uk|sg|id))?$/;

/**
 * The comparable identity of a brand. 'kfc.com.my' and 'kfc.com' are the same
 * company with a different storefront, and 'sushi-king' is 'sushiking' — a logo
 * downloaded under any of those spellings belongs to the same row.
 */
function brandCore(value) {
  return value.toLowerCase().replace(TLD, '').replace(/[^a-z0-9]/g, '');
}

const BUCKET = 'merchant-logos';
const EXTENSIONS = { '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml' };

async function main() {
  const dir = process.argv[2];
  if (!dir) {
    console.error('Usage: node scripts/upload-merchant-logos.js <folder-of-logos>');
    process.exit(1);
  }

  const url = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first.');
    console.error('The service-role key is required: the app role can only read this table.');
    process.exit(1);
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const { data: rows, error: rowsError } = await supabase
    .from('merchant_logos')
    .select('keyword, domain');
  if (rowsError) {
    console.error('Could not read merchant_logos:', rowsError.message);
    process.exit(1);
  }
  // A brand is its domain, not its keyword: 'mcd' and 'mcdonald' are one logo.
  const domainOf = new Map(rows.map((r) => [r.keyword, r.domain]));
  const keywordsOf = rows.reduce((map, r) => {
    map.set(r.domain, [...(map.get(r.domain) ?? []), r.keyword]);
    return map;
  }, new Map());

  // Files are named by whoever downloaded them: 'mcd.webp' from the keyword
  // list, or 'kfc.com-logo.webp' straight out of a logo service. Both land.
  const byCore = new Map();
  for (const row of rows) {
    // A null domain is a brand listed for its category alone (banks): it shows
    // the category icon by design, so there is nothing to upload for it.
    if (!row.domain) continue;
    for (const core of [brandCore(row.domain), brandCore(row.keyword)]) {
      const seen = byCore.get(core);
      // Two brands answering to one spelling is a guess worth refusing.
      if (seen === undefined) byCore.set(core, row.domain);
      else if (seen !== row.domain) byCore.set(core, null);
    }
  }

  /** The domain a filename refers to, or null when nothing matches it. */
  const resolve = (base) => {
    const asKeyword = base.replace(/-/g, ' ').trim();
    if (domainOf.has(asKeyword)) return domainOf.get(asKeyword);
    if (keywordsOf.has(base)) return base;
    return byCore.get(brandCore(base)) ?? null;
  };

  const files = fs.readdirSync(dir).filter((f) => EXTENSIONS[path.extname(f).toLowerCase()]);
  if (files.length === 0) {
    console.error(`No image files in ${dir}`);
    process.exit(1);
  }

  let uploaded = 0;
  const unmatched = [];
  /** domain → the file already uploaded for it. */
  const done = new Map();

  for (const file of files) {
    const extension = path.extname(file).toLowerCase();
    // A trailing '-logo' is what logo services tack on; it names no brand.
    const base = path.basename(file, extension).toLowerCase().replace(/-logo$/, '').trim();

    const domain = resolve(base);
    if (!domain) {
      const asKeyword = base.replace(/-/g, ' ').trim();
      if (domainOf.has(asKeyword)) {
        console.log(`  – ${file}: skipped, "${asKeyword}" is listed without a logo on purpose`);
      } else {
        unmatched.push(file);
      }
      continue;
    }

    // Two files for one brand ('mcd.png' and 'mcdonald.png') would each claim
    // every row of it, so the second silently undoes the first.
    if (done.has(domain)) {
      console.log(`  – ${file}: skipped, ${domain} already uploaded from ${done.get(domain)}`);
      continue;
    }

    // Named for the brand, not the file: two spellings of one logo must not
    // become two objects in the bucket.
    const objectPath = `${domain}${extension}`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(objectPath, fs.readFileSync(path.join(dir, file)), {
        contentType: EXTENSIONS[extension],
        upsert: true,
        // Long-lived: a brand's logo file is replaced by uploading over it,
        // which changes nothing about the URL, so let devices hold onto it.
        cacheControl: '604800',
      });
    if (uploadError) {
      console.error(`  ✗ ${file}: ${uploadError.message}`);
      continue;
    }

    // Every keyword pointing at this brand should use the same file, so match
    // on domain rather than assuming one row per logo.
    const { error: updateError } = await supabase
      .from('merchant_logos')
      .update({ logo_path: objectPath, updated_at: new Date().toISOString() })
      .eq('domain', domain);
    if (updateError) {
      console.error(`  ✗ ${file}: uploaded but row not updated — ${updateError.message}`);
      continue;
    }

    const covered = keywordsOf.get(domain) ?? [];
    console.log(`  ✓ ${file} → ${objectPath}  (${covered.join(', ')})`);
    done.set(domain, file);
    uploaded++;
  }

  console.log(`\nUploaded ${uploaded} of ${files.length} file(s).`);
  if (unmatched.length > 0) {
    console.log(
      `\nNo merchant_logos row matched these, so they were skipped:\n  ${unmatched.join('\n  ')}\n` +
        'Add a row with that keyword first, or rename the file to an existing keyword.'
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
