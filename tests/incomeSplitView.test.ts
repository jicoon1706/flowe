// Desktop L · bar, links and the Edit groups list (dl-split, dl-split-over, dl-edit-groups).
import { groupCategories, groupNote, rowHref, rowName, splitBar } from '../src/lib/incomeSplitView';
import type { IncomeSplit, IncomeSplitRow } from '../src/types/database.types';

const ok: IncomeSplit = {
  month: '2026-11-01', state: 'ok', income: 4450, targets: { needs: 50, wants: 30, invest: 20 },
  buckets: { needs: { amount: 2073.91, pct: 46.6 }, wants: { amount: 412.79, pct: 9.3 }, invest: { amount: 500, pct: 11.2 }, left: { amount: 1463.3, pct: 32.9 } },
  rows: [], suggestions: [],
};

describe('splitBar', () => {
  it('draws the four parts as % of income (dl-split)', () => {
    const bar = splitBar(ok)!;
    expect(bar.segments).toEqual([
      { part: 'needs', width: 46.6 }, { part: 'wants', width: 9.3 }, { part: 'invest', width: 11.2 }, { part: 'left', width: 32.9 },
    ]);
    expect(bar.incomeAt).toBeNull();
    expect(bar.label).toBe('Income split: Needs 46.6%, Wants 9.3%, Investments & savings 11.2%, Left over 32.9%');
  });

  it('spans what was used and marks income when overspent (dl-split-over)', () => {
    const over: IncomeSplit = { ...ok, state: 'overspent', buckets: { needs: { amount: 3204, pct: 72 }, wants: { amount: 1824.5, pct: 41 }, invest: { amount: 0, pct: 0 }, left: { amount: -578.5, pct: -13 } } };
    const bar = splitBar(over)!;
    expect(bar.segments).toEqual([{ part: 'needs', width: 63.72 }, { part: 'wants', width: 36.28 }]);
    expect(bar.incomeAt).toBe(88.5);
    expect(bar.label).toBe('Income split: Needs 72.0%, Wants 41.0%, Investments & savings 0.0%, Left over -13.0%');
  });

  it('has nothing to draw for an empty month', () => {
    expect(splitBar({ ...ok, state: 'empty', income: 0, buckets: null })).toBeNull();
  });
});

describe('rows', () => {
  const cat: IncomeSplitRow = { kind: 'category', key: 'food', category: 'food', label: null, group: 'needs', amount: 706.22, pct: 15.9 };
  const tabung: IncomeSplitRow = { kind: 'tabung', key: 'tabung:abc', category: null, label: 'Tabung · Emergency Fund', group: 'invest', amount: 200, pct: 4.5 };
  const asset: IncomeSplitRow = { kind: 'asset', key: 'asset:xyz', category: null, label: 'ASB top-up', group: 'invest', amount: 300, pct: 6.7 };

  it('names rows', () => {
    expect(rowName(cat, () => 'Food & Drink')).toBe('Food & Drink');
    expect(rowName(tabung, () => '')).toBe('Tabung · Emergency Fund');
  });

  it('links each row to its transactions for the month', () => {
    expect(rowHref(cat, '2026-11')).toBe('/transactions?category=food&month=2026-11');
    expect(rowHref(tabung, '2026-11')).toBe('/transactions?types=tabung_topup&account=abc&month=2026-11');
    expect(rowHref(asset, '2026-11')).toBe('/transactions?types=transfer&search=ASB&month=2026-11');
  });

  it('writes the group card notes', () => {
    expect(groupNote('needs', 46.6, 50)).toBe('46.6% of income · guide 50%');
    expect(groupNote('left', 32.9)).toBe('32.9% of income · not assigned yet');
    expect(groupNote('left', -13)).toBe('−13.0% of income · more than you earned');
  });
});

describe('groupCategories', () => {
  it('lists built-ins, custom and seeded categories, Needs first', () => {
    const list = groupCategories(
      [{ id: 'food', name: 'Food & Drink' }, { id: 'transport', name: 'Transport' }, { id: 'shopping', name: 'Shopping' }, { id: 'health', name: 'Health' }],
      [{ name: 'Kopi' }],
      { food: 'needs', transport: 'needs', shopping: 'wants', Groceries: 'needs', Leisure: 'wants' },
    );
    expect(list.map((c) => `${c.label}:${c.group}`)).toEqual([
      'Food & Drink:needs', 'Transport:needs', 'Groceries:needs', 'Shopping:wants', 'Leisure:wants', 'Health:skip', 'Kopi (custom):skip',
    ]);
  });
});
