// AUDIT-2026-11 B2: a manual balance correction must survive "Recalculate
// balances" (opening + Σ transactions) and move the balance atomically.

const mockRpc = jest.fn(async (..._args: any[]) => ({ error: null as any }));
const mockUpdates: { table: string; patch: any }[] = [];
let mockStored = { current_balance: 1000.1, opening_balance: 500 };

jest.mock('../src/lib/supabase', () => ({
  supabase: {
    rpc: (...args: any[]) => mockRpc(...args),
    from: (table: string) => {
      const builder: any = {
        select: () => builder,
        update: (patch: any) => { mockUpdates.push({ table, patch }); return { eq: async () => ({ error: null }) }; },
        eq: () => builder,
        single: async () => ({ data: mockStored, error: null }),
      };
      return builder;
    },
  },
}));

import { accountsRepository } from '../src/repositories/accounts.repository';

beforeEach(() => {
  mockRpc.mockClear();
  mockUpdates.length = 0;
  mockStored = { current_balance: 1000.1, opening_balance: 500 };
});

test('shifts the opening balance and moves the current balance by the same delta', async () => {
  const res = await accountsRepository.setBalance('acc-1', 'bank', 1200);
  expect(res.ok).toBe(true);
  // 1200 − 1000.10 = 199.90 exactly, not 199.89999999999998
  expect(mockUpdates).toEqual([{ table: 'bank_accounts', patch: { opening_balance: 699.9 } }]);
  expect(mockRpc).toHaveBeenCalledWith('adjust_account_balance', { p_account_id: 'acc-1', p_delta: 199.9 });
});

test('uses the wallet table for wallets and handles a lower balance', async () => {
  mockStored = { current_balance: 80, opening_balance: 100 };
  await accountsRepository.setBalance('w-1', 'wallet', 50);
  expect(mockUpdates[0]).toEqual({ table: 'wallet_accounts', patch: { opening_balance: 70 } });
  expect(mockRpc).toHaveBeenCalledWith('adjust_account_balance', { p_account_id: 'w-1', p_delta: -30 });
});

test('a retry after the balance already moved does nothing', async () => {
  mockStored = { current_balance: 1200, opening_balance: 699.9 };
  const res = await accountsRepository.setBalance('acc-1', 'bank', 1200);
  expect(res.ok).toBe(true);
  expect(mockUpdates).toEqual([]);
  expect(mockRpc).not.toHaveBeenCalled();
});

test('a failed balance move puts the opening balance back', async () => {
  mockRpc.mockResolvedValueOnce({ error: { code: '08006', message: 'network' } });
  const res = await accountsRepository.setBalance('acc-1', 'bank', 1200);
  expect(res.ok).toBe(false);
  expect(mockUpdates.map((u) => u.patch.opening_balance)).toEqual([699.9, 500]);
});
