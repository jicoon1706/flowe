/**
 * Tests for merchantLogo (src/utils/merchantLogo.ts).
 *
 * This helper decides whether a transaction row shows a brand logo or falls
 * back to its category icon. Getting a match wrong puts the wrong company's
 * logo on someone's spending, so the matching rules are pinned here.
 */

import {
  merchantCategory,
  merchantDomain,
  merchantLogoUrl,
  setMerchantSources,
  subscribeMerchantSources,
} from '@/src/utils/merchantLogo';

// Every test starts from the bundled list, so one test's curated rows can't
// leak into the next.
afterEach(() => setMerchantSources([]));

describe('merchantDomain()', () => {
  it('matches a merchant anywhere in the transaction name', () => {
    expect(merchantDomain('McDonalds KLCC')).toBe('mcdonalds.com.my');
    expect(merchantDomain('Lunch at KFC')).toBe('kfc.com.my');
  });

  it('ignores case and punctuation around the keyword', () => {
    expect(merchantDomain("mcdonald's drive thru")).toBe('mcdonalds.com.my');
    expect(merchantDomain('WATSONS #221')).toBe('watsons.com.my');
  });

  it('prefers the longest keyword so a specific brand beats a generic word', () => {
    // "99 speedmart" contains "speedmart"; both map to the same place here, but
    // the ordering rule is what stops short keywords hijacking longer names.
    expect(merchantDomain('99 SPEEDMART 1234')).toBe('99speedmart.com.my');
    expect(merchantDomain('Air Selangor bill')).toBe('airselangor.com');
  });

  it('matches whole words only, so brands do not hijack longer words', () => {
    expect(merchantDomain('Digital Ocean')).toBeUndefined();
    expect(merchantDomain('Overtime claim')).toBeUndefined();
    expect(merchantDomain('Nutshell Cafe')).toBeUndefined();
    // …while the brands those rules protect still match.
    expect(merchantDomain('Digi bill')).toBe('digi.com.my');
    expect(merchantDomain('Shell Seksyen 13')).toBe('shell.com.my');
  });

  it('returns undefined for an unknown merchant', () => {
    expect(merchantDomain('Kedai Makan Pak Din')).toBeUndefined();
    expect(merchantDomain('')).toBeUndefined();
    expect(merchantDomain(undefined)).toBeUndefined();
  });
});

describe('merchantLogoUrl()', () => {
  it('builds a logo URL from the matched domain only', () => {
    const url = merchantLogoUrl('Grab ride to office');
    expect(url).toContain('domain=grab.com');
    // The transaction's own text must never leave the device.
    expect(url).not.toContain('office');
  });

  it('returns undefined when nothing matches, so the caller falls back', () => {
    expect(merchantLogoUrl('Warung Kak Nor')).toBeUndefined();
  });

  it('shows no logo for a brand listed without a domain, and asks for none', () => {
    // Banks are recognised for their category alone: a transfer is not a
    // purchase from the bank, so the row draws the category icon.
    expect(merchantLogoUrl('Maybank transfer')).toBeUndefined();
    expect(merchantCategory('Maybank transfer')).toBe('others');
  });
});

describe('setMerchantSources()', () => {
  it('replaces the bundled list with the curated one', () => {
    setMerchantSources([{ keyword: 'kedai pak din', domain: 'kedaipakdin.my' }]);
    // A merchant added in the database is matched without an app update…
    expect(merchantDomain('Kedai Pak Din')).toBe('kedaipakdin.my');
    // …and the list is a replacement, not an addition, so removing a row there
    // actually removes it here.
    expect(merchantDomain('McDonalds KLCC')).toBeUndefined();
  });

  it('prefers an uploaded logo over the domain-derived one', () => {
    setMerchantSources([
      { keyword: 'mcdonald', domain: 'mcdonalds.com.my', logoUrl: 'https://cdn.test/mcd.png' },
    ]);
    expect(merchantLogoUrl('McDonalds KLCC')).toBe('https://cdn.test/mcd.png');
  });

  it('falls back to the bundled list when the fetch returns nothing', () => {
    // A failed or empty fetch must never leave the app with no logos at all.
    setMerchantSources([]);
    expect(merchantDomain('KFC Bangi')).toBe('kfc.com.my');
  });

  it('notifies subscribers so rows already on screen re-match', () => {
    const listener = jest.fn();
    const unsubscribe = subscribeMerchantSources(listener);

    setMerchantSources([{ keyword: 'grab', domain: 'grab.com' }]);
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    setMerchantSources([{ keyword: 'grab', domain: 'grab.com' }]);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe('merchantCategory()', () => {
  it('files a known merchant under the category it belongs to', () => {
    expect(merchantCategory('MCD Bangi')).toBe('food');
    expect(merchantCategory('Setel Petronas Seksyen 7')).toBe('transport');
    expect(merchantCategory('Watsons KLCC')).toBe('health');
    expect(merchantCategory('TNB bill')).toBe('bills');
    expect(merchantCategory('Netflix')).toBe('entertainment');
  });

  it('has no guess for an unknown merchant, so the default stands', () => {
    expect(merchantCategory('Warung Kak Nor')).toBeUndefined();
  });

  it('uses the category curated in the database over the bundled one', () => {
    setMerchantSources([
      { keyword: 'mcdonald', domain: 'mcdonalds.com.my', category: 'entertainment' },
    ]);
    expect(merchantCategory('McDonalds KLCC')).toBe('entertainment');
  });
});
