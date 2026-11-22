// Desktop K + L repositories: each call goes to the one server function, with
// the right arguments, and bad targets never leave the client.
const mockH = {
  rpc: jest.fn(async (..._args: unknown[]) => ({ data: null as unknown, error: null as unknown })),
  settingsRow: null as Record<string, number> | null,
};

jest.mock('../src/lib/supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockH.rpc(...args),
    from: () => {
      const builder: Record<string, unknown> = {
        select: () => builder,
        order: async () => ({ data: [{ category: 'food', split_group: 'needs' }], error: null }),
        maybeSingle: async () => ({ data: mockH.settingsRow, error: null }),
      };
      return builder;
    },
  },
}));

import { assetsRepository } from '../src/repositories/assets.repository';
import { incomeSplitRepository } from '../src/repositories/incomeSplit.repository';
import { netWorthRepository } from '../src/repositories/netWorth.repository';

beforeEach(() => {
  mockH.rpc.mockReset();
  mockH.rpc.mockImplementation(async () => ({ data: null, error: null }));
  mockH.settingsRow = null;
});

test('saveGold calls save_gold_asset (create when no id)', async () => {
  mockH.rpc.mockResolvedValueOnce({ data: { id: 'g1', current_value: 6525 }, error: null });
  const res = await assetsRepository.saveGold({ name: 'Public Gold GAP', grams: 12.5, purity: 999, pricePerGram: 522 });
  expect(res.ok).toBe(true);
  expect(mockH.rpc).toHaveBeenCalledWith('save_gold_asset', {
    p_id: null, p_name: 'Public Gold GAP', p_grams: 12.5, p_purity: 999, p_price_per_gram: 522, p_cost: null,
  });
});

test('saveKwsp calls save_kwsp_asset with the three balances', async () => {
  mockH.rpc.mockResolvedValueOnce({ data: { id: 'k1', current_value: 40000 }, error: null });
  await assetsRepository.saveKwsp({ id: 'k1', persaraan: 30000, sejahtera: 6000, fleksibel: 4000 });
  expect(mockH.rpc).toHaveBeenCalledWith('save_kwsp_asset', { p_id: 'k1', p_persaraan: 30000, p_sejahtera: 6000, p_fleksibel: 4000 });
});

test('a server error comes back as a Result, not a throw', async () => {
  mockH.rpc.mockResolvedValueOnce({ data: null, error: { code: '23514', message: 'Gold needs grams held above 0' } });
  const res = await assetsRepository.saveGold({ name: 'x', grams: 0, purity: 999, pricePerGram: 1 });
  expect(res).toEqual({ ok: false, error: { code: '23514', message: 'Gold needs grams held above 0', details: undefined, hint: undefined } });
});

test('fetchSplit and fetchBreakdown read the one server computation', async () => {
  mockH.rpc.mockResolvedValueOnce({ data: { state: 'empty', income: 0, month: '2026-11-01' }, error: null });
  const split = await incomeSplitRepository.fetchSplit('2026-11-01');
  expect(mockH.rpc).toHaveBeenLastCalledWith('income_split', { p_month: '2026-11-01' });
  expect(split.ok && split.data.state).toBe('empty');

  mockH.rpc.mockResolvedValueOnce({ data: { total_assets: 10, total_liabilities: 4, net_worth: 6, groups: [], liabilities: [] }, error: null });
  const nw = await netWorthRepository.fetchBreakdown();
  expect(mockH.rpc).toHaveBeenLastCalledWith('net_worth_breakdown');
  expect(nw.ok && nw.data.net_worth).toBe(6);
});

test('saveGroups rejects targets that do not add up to 100 without calling the server', async () => {
  const res = await incomeSplitRepository.saveGroups([{ category: 'food', group: 'needs' }], { needs: 50, wants: 35, invest: 20 });
  expect(res.ok).toBe(false);
  expect(!res.ok && res.error.message).toBe('Targets add up to 105%. Make them 100%.');
  expect(mockH.rpc).not.toHaveBeenCalled();
});

test('saveGroups sends groups and targets in one call', async () => {
  const res = await incomeSplitRepository.saveGroups([{ category: 'Kopi', group: 'wants' }], { needs: 50, wants: 30, invest: 20 });
  expect(res.ok).toBe(true);
  expect(mockH.rpc).toHaveBeenCalledWith('save_income_split_groups', {
    p_groups: [{ category: 'Kopi', group: 'wants' }], p_needs: 50, p_wants: 30, p_invest: 20,
  });
});

test('fetchTargets defaults to 50 / 30 / 20 without a settings row', async () => {
  const res = await incomeSplitRepository.fetchTargets();
  expect(res).toEqual({ ok: true, data: { needs: 50, wants: 30, invest: 20 } });
  mockH.settingsRow = { split_needs_pct: 60, split_wants_pct: 20, split_invest_pct: 20 };
  expect(await incomeSplitRepository.fetchTargets()).toEqual({ ok: true, data: { needs: 60, wants: 20, invest: 20 } });
});
