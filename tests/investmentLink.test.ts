// AUDIT #18 part 2: investments find their asset by id, with the name as the
// fallback, and ordinary transactions never send the new column (so they keep
// working before the 20261116 migration is applied).

const mockRpc = jest.fn(async () => ({ data: 0, error: null }));
const mockAssetLookups: string[] = [];
const mockInserts: any[] = [];
let mockDeletedRow: any = null;

jest.mock('../src/lib/supabase', () => ({
  supabase: {
    rpc: (...args: any[]) => (mockRpc as any)(...args),
    from: (table: string) => {
      const b: any = {
        _op: 'select',
        select: () => b,
        eq: (col: string, val: string) => {
          if (table === 'assets' && col === 'name') mockAssetLookups.push(val);
          return b;
        },
        insert: (row: any) => { mockInserts.push(row); b._op = 'insert'; return b; },
        delete: () => { b._op = 'delete'; return b; },
        maybeSingle: async () => ({ data: table === 'assets' ? { id: 'asset-by-name' } : null, error: null }),
        single: async () =>
          table === 'transactions' && b._op === 'insert'
            ? { data: { id: 'tx-new' }, error: null }
            : { data: mockDeletedRow, error: null },
        then: (resolve: any) => resolve({ error: null }),
      };
      return b;
    },
  },
}));

import { transactionsRepository } from '../src/repositories/transactions.repository';

beforeEach(() => {
  mockRpc.mockClear();
  mockAssetLookups.length = 0;
  mockInserts.length = 0;
});

const investment = { type: 'transfer', amount: 300, category: 'ASB', from_account_id: 'acc-1', to_account_id: null };

it('deleting an investment reverses the asset it is linked to by id', async () => {
  mockDeletedRow = { ...investment, asset_id: 'asset-by-id' };
  await transactionsRepository.delete('tx-1');
  expect(mockAssetLookups).toEqual([]);
  expect(mockRpc).toHaveBeenCalledWith('adjust_asset_value', expect.objectContaining({ p_asset_id: 'asset-by-id', p_delta: -300 }));
});

it('falls back to the asset name for rows without an id', async () => {
  mockDeletedRow = { ...investment, asset_id: null };
  await transactionsRepository.delete('tx-1');
  expect(mockAssetLookups).toEqual(['ASB']);
  expect(mockRpc).toHaveBeenCalledWith('adjust_asset_value', expect.objectContaining({ p_asset_id: 'asset-by-name' }));
});

it('also works on a row from before the migration (no asset_id key at all)', async () => {
  mockDeletedRow = { ...investment };
  await transactionsRepository.delete('tx-1');
  expect(mockRpc).toHaveBeenCalledWith('adjust_asset_value', expect.objectContaining({ p_asset_id: 'asset-by-name' }));
});

it('does not touch any asset when deleting an ordinary expense', async () => {
  mockDeletedRow = { type: 'expense', amount: 20, category: 'food', from_account_id: 'acc-1', to_account_id: null };
  await transactionsRepository.delete('tx-1');
  expect(mockRpc).not.toHaveBeenCalledWith('adjust_asset_value', expect.anything());
});

it('an ordinary transaction is created without an asset_id key', async () => {
  await transactionsRepository.create({ user_id: 'u', type: 'expense', name: 'Lunch', amount: 12, date: '2026-11-16' });
  expect(mockInserts[0]).not.toHaveProperty('asset_id');
});

it('an investment is created with its asset_id', async () => {
  await transactionsRepository.create({ user_id: 'u', type: 'transfer', name: 'ASB', amount: 300, from_account_id: 'acc-1', date: '2026-11-16', asset_id: 'asset-1' });
  expect(mockInserts[0]).toMatchObject({ asset_id: 'asset-1' });
});
