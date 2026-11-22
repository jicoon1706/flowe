// Desktop K · KWSP / EPF sum and split (the SQL sum is covered by
// flowe-akmal/supabase/tests/k_l_backend.test.sql).
import { kwspBalancesOf, kwspFormReady, kwspSplit, kwspTotal } from '../src/lib/kwsp';

describe('kwspTotal', () => {
  it('is Persaraan + Sejahtera + Fleksibel (dn-kwsp-filled: RM 40,000.00)', () => {
    expect(kwspTotal({ persaraan: 30000, sejahtera: 6000, fleksibel: 4000 })).toBe(40000);
  });
  it('sums in sen, so cents never drift', () => {
    expect(kwspTotal({ persaraan: 0.1, sejahtera: 0.2, fleksibel: 0 })).toBe(0.3);
    expect(kwspTotal({ persaraan: 12345.67, sejahtera: 2468.13, fleksibel: 1645.42 })).toBe(16459.22);
  });
  it('treats a missing balance as 0', () => {
    expect(kwspTotal({ persaraan: 500 })).toBe(500);
    expect(kwspTotal({ persaraan: null, sejahtera: null, fleksibel: null })).toBe(0);
  });
});

describe('kwspSplit', () => {
  it('gives each account its share (dn-kwsp-detail: 75 / 15 / 10)', () => {
    expect(kwspSplit({ persaraan: 30000, sejahtera: 6000, fleksibel: 4000 }).map((s) => s.pct)).toEqual([75, 15, 10]);
  });
  it('always adds up to 100', () => {
    const s = kwspSplit({ persaraan: 1, sejahtera: 1, fleksibel: 1 });
    expect(s.reduce((t, x) => t + x.pct, 0)).toBe(100);
    expect(s.map((x) => x.pct)).toEqual([34, 33, 33]);
  });
  it('is all 0 when there is nothing in it', () => {
    expect(kwspSplit({ persaraan: 0, sejahtera: 0, fleksibel: 0 }).map((s) => s.pct)).toEqual([0, 0, 0]);
  });
  it('keeps the account labels in order', () => {
    expect(kwspSplit({ persaraan: 1, sejahtera: 0, fleksibel: 0 }).map((s) => s.label)).toEqual(['Akaun Persaraan', 'Akaun Sejahtera', 'Akaun Fleksibel']);
  });
});

describe('KWSP form', () => {
  it('needs at least one balance above 0 and none negative', () => {
    expect(kwspFormReady({})).toBe(false);
    expect(kwspFormReady({ persaraan: 0, sejahtera: 0, fleksibel: 0 })).toBe(false);
    expect(kwspFormReady({ fleksibel: 4000 })).toBe(true);
    expect(kwspFormReady({ persaraan: -1, fleksibel: 4000 })).toBe(false);
  });
  it('reads the balances off an asset row', () => {
    expect(kwspBalancesOf({ kwsp_persaraan: 30000, kwsp_sejahtera: null, kwsp_fleksibel: 4000 })).toEqual({ persaraan: 30000, sejahtera: 0, fleksibel: 4000 });
  });
});
