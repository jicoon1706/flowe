// Desktop L · parsing and wording the server's income split and net worth.
// The computation itself (sums to 100%, overspent, empty, Skip and KWSP
// excluded, targets ≠ 100 rejected, RLS) is tested against the database in
// flowe-akmal/supabase/tests/k_l_backend.test.sql; these cases use that
// test's real outputs.
import {
  guideLabel, incomeUsedPct, overspentBy, parseIncomeSplit, parseNetWorthBreakdown, pct1, pctShort, suggestionCopy, targetsProblem,
} from '../src/lib/incomeSplit';

const NOVEMBER = {
  month: '2026-11-01', state: 'ok', income: 4450.0,
  targets: { needs: 50, wants: 30, invest: 20 },
  buckets: {
    needs: { amount: 2073.91, pct: 46.6 }, wants: { amount: 412.79, pct: 9.3 },
    invest: { amount: 500.0, pct: 11.2 }, left: { amount: 1463.3, pct: 32.9 },
  },
  rows: [
    { kind: 'category', key: 'food', category: 'food', label: null, group: 'needs', amount: 706.22, pct: 15.9 },
    { kind: 'asset', key: 'asset:x', category: null, label: 'ASB top-up', group: 'invest', amount: '300.00', pct: '6.7' },
    { kind: 'tabung', key: 'tabung:y', category: null, label: 'Tabung · Emergency Fund', group: 'invest', amount: 200, pct: 4.5 },
  ],
  suggestions: [
    { kind: 'invest_below_target', amount: 390, target_pct: 20, current_pct: 11.2, target_amount: 890.0 },
    { kind: 'unassigned', amount: 1463.3, pct: 32.9 },
  ],
};

const OCTOBER = {
  month: '2026-10-01', state: 'overspent', income: 4450,
  targets: { needs: 50, wants: 30, invest: 20 },
  buckets: {
    needs: { amount: 3204, pct: 72.0 }, wants: { amount: 1824.5, pct: 41.0 },
    invest: { amount: 0, pct: 0.0 }, left: { amount: -578.5, pct: -13.0 },
  },
  rows: [],
  suggestions: [
    { kind: 'needs_over_target', category: 'food', amount: 1150, pct: 72.0, target_pct: 50 },
    { kind: 'wants_over_target', category: 'shopping', amount: 1512.3, pct: 41.0, target_pct: 30 },
  ],
};

const names: Record<string, string> = { food: 'Food & Drink', shopping: 'Shopping' };
const label = (c: string) => names[c] ?? c;

describe('parseIncomeSplit', () => {
  it('keeps the four parts, which add up to exactly 100%', () => {
    const s = parseIncomeSplit(NOVEMBER);
    expect(s.state).toBe('ok');
    const b = s.buckets!;
    expect(Math.round((b.needs.pct + b.wants.pct + b.invest.pct + b.left.pct) * 10) / 10).toBe(100);
    expect(b.left.amount).toBe(1463.3);
  });
  it('coerces numbers that arrive as strings', () => {
    const row = parseIncomeSplit(NOVEMBER).rows[1];
    expect(row).toEqual({ kind: 'asset', key: 'asset:x', category: null, label: 'ASB top-up', group: 'invest', amount: 300, pct: 6.7 });
  });
  it('an empty month has no buckets and no suggestions', () => {
    const s = parseIncomeSplit({ month: '2026-09-01', state: 'empty', income: 0, targets: { needs: 50, wants: 30, invest: 20 }, buckets: null, rows: [], suggestions: [] });
    expect(s.state).toBe('empty');
    expect(s.buckets).toBeNull();
    expect(s.suggestions).toEqual([]);
  });
  it('never shows more than 3 suggestions', () => {
    const many = { ...NOVEMBER, suggestions: [...NOVEMBER.suggestions, ...OCTOBER.suggestions] };
    expect(parseIncomeSplit(many).suggestions).toHaveLength(3);
  });
  it('falls back to 50 / 30 / 20 when targets are missing', () => {
    expect(parseIncomeSplit({ state: 'empty' }).targets).toEqual({ needs: 50, wants: 30, invest: 20 });
  });
});

describe('overspent', () => {
  it('reports the overspent amount and the % of income used (dl-split-over)', () => {
    const s = parseIncomeSplit(OCTOBER);
    expect(s.state).toBe('overspent');
    expect(overspentBy(s)).toBe(578.5);
    expect(incomeUsedPct(s)).toBe(113);
    expect(pct1(s.buckets!.left.pct)).toBe('−13.0%');
  });
  it('is 0 when something is left over', () => {
    expect(overspentBy(parseIncomeSplit(NOVEMBER))).toBe(0);
  });
});

describe('suggestionCopy (board copy)', () => {
  it('dl-split suggestion 1 and 2', () => {
    const [a, b] = parseIncomeSplit(NOVEMBER).suggestions.map((s) => suggestionCopy(s, 'November', label));
    expect(a).toMatchObject({
      title: 'Move RM 390 a month to reach 20%',
      body: 'Invest & save is 11.2% of income. The guide is 20% (RM 890.00).',
      action: 'Top up a Tabung', target: 'tabung',
    });
    expect(b).toMatchObject({
      title: 'RM 1,463.30 isn’t assigned yet',
      body: '32.9% of November’s income is still sitting in your accounts.',
      action: 'Move to Tabung', target: 'tabung',
    });
  });
  it('dl-split-over: names the biggest category in each group', () => {
    const [n, w] = parseIncomeSplit(OCTOBER).suggestions.map((s) => suggestionCopy(s, 'October', label));
    expect(n).toMatchObject({
      title: 'Food & Drink is your biggest need: RM 1,150.00',
      body: 'Needs are 72% of income against a 50% guide.',
      action: 'View transactions', target: 'transactions', category: 'food',
    });
    expect(w).toMatchObject({
      title: 'Shopping is your biggest want: RM 1,512.30',
      body: 'Wants are 41% of income against a 30% guide.',
      category: 'shopping',
    });
  });
});

describe('targets', () => {
  it('must add up to 100 (dl-edit-groups: 50 / 35 / 20 = 105%)', () => {
    expect(targetsProblem({ needs: 50, wants: 35, invest: 20 })).toBe('Targets add up to 105%. Make them 100%.');
    expect(targetsProblem({ needs: 50, wants: 30, invest: 10 })).toBe('Targets add up to 90%. Make them 100%.');
    expect(targetsProblem({ needs: 50, wants: 30, invest: 20 })).toBeNull();
    expect(targetsProblem({ needs: 100, wants: 0, invest: 0 })).toBeNull();
  });
  it('rejects fractions and out-of-range values', () => {
    expect(targetsProblem({ needs: 50.5, wants: 29.5, invest: 20 })).not.toBeNull();
    expect(targetsProblem({ needs: 120, wants: -20, invest: 0 })).not.toBeNull();
  });
  it('labels the guide', () => {
    expect(guideLabel({ needs: 50, wants: 30, invest: 20 })).toBe('Guide: 50 / 30 / 20');
  });
});

describe('percent formatting', () => {
  it('pct1 keeps one decimal; pctShort trims .0', () => {
    expect(pct1(46.6)).toBe('46.6%');
    expect(pct1(0)).toBe('0.0%');
    expect(pctShort(72)).toBe('72%');
    expect(pctShort(11.2)).toBe('11.2%');
    expect(pctShort(-13)).toBe('−13%');
  });
});

describe('parseNetWorthBreakdown', () => {
  it('keeps totals and shares (dn-networth-breakdown)', () => {
    const nw = parseNetWorthBreakdown({
      total_assets: 64525, total_liabilities: 25000, net_worth: 39525, cash_accounts: 5,
      groups: [
        { key: 'cash', total: 12000, count: 5, share_pct: 18.6 },
        { key: 'kwsp', total: 40000, count: 1, share_pct: 62.0 },
        { key: 'gold', total: '6525.00', count: 1, share_pct: '10.1' },
        { key: 'asb', total: 6000, count: 1, share_pct: 9.3 },
      ],
      liabilities: [{ id: 'l1', name: 'PTPTN', type: 'study_loan', amount_owed: 25000 }],
    });
    expect(nw.net_worth).toBe(nw.total_assets - nw.total_liabilities);
    expect(Math.round(nw.groups.reduce((s, g) => s + g.share_pct, 0) * 10) / 10).toBe(100);
    expect(nw.groups.find((g) => g.key === 'gold')).toEqual({ key: 'gold', total: 6525, count: 1, share_pct: 10.1 });
    expect(nw.liabilities[0].name).toBe('PTPTN');
  });
  it('an empty answer is all zeros', () => {
    expect(parseNetWorthBreakdown(null)).toEqual({ total_assets: 0, total_liabilities: 0, net_worth: 0, cash_accounts: 0, groups: [], liabilities: [] });
  });
});
