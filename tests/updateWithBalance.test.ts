// AUDIT #3: editing a transaction must not move a balance unless the row
// itself was actually updated.

const mockRpc = jest.fn(async () => ({ error: null }));
let mockUpdateResult: { data: any; error: any } = { data: null, error: null };
const mockOldRow = { type: 'expense', amount: 50, from_account_id: 'acc-1', to_account_id: null };

jest.mock('../src/lib/supabase', () => ({
  supabase: {
    rpc: (...args: any[]) => (mockRpc as any)(...args),
    from: () => {
      let updating = false;
      const builder: any = {
        select: () => builder,
        eq: () => builder,
        update: () => { updating = true; return builder; },
        single: async () => (updating ? mockUpdateResult : { data: mockOldRow, error: null }),
      };
      return builder;
    },
  },
}));

import { transactionsRepository } from '../src/repositories/transactions.repository';

const req = {
  user_id: 'u',
  type: 'expense' as const,
  name: 'Lunch',
  amount: 80,
  from_account_id: 'acc-1',
  date: '2026-11-16',
};

beforeEach(() => mockRpc.mockClear());

test('a failed row update leaves every balance untouched', async () => {
  mockUpdateResult = { data: null, error: { code: '08006', message: 'network' } };
  const result = await transactionsRepository.updateWithBalance('tx-1', req);
  expect(result.ok).toBe(false);
  expect(mockRpc).not.toHaveBeenCalled();
});

test('a successful update reverses the old effect and applies the new one', async () => {
  mockUpdateResult = { data: { id: 'tx-1' }, error: null };
  const result = await transactionsRepository.updateWithBalance('tx-1', req);
  expect(result.ok).toBe(true);
  expect(mockRpc).toHaveBeenNthCalledWith(1, 'adjust_account_balance', { p_account_id: 'acc-1', p_delta: 50 });
  expect(mockRpc).toHaveBeenNthCalledWith(2, 'adjust_account_balance', { p_account_id: 'acc-1', p_delta: -80 });
});
