// AUDIT-2026-11 B4: PostgREST truncates a response at Max Rows (1,000 by
// default) without an error, so Export and account history must page.

const mockRanges: [number, number][] = [];
let mockTotal = 1005;

jest.mock('../src/lib/supabase', () => ({
  supabase: {
    from: () => {
      const builder: any = {
        select: () => builder,
        order: () => builder,
        or: () => builder,
        range: async (from: number, to: number) => {
          mockRanges.push([from, to]);
          const n = Math.max(0, Math.min(to, mockTotal - 1) - from + 1);
          return { data: Array.from({ length: n }, (_, i) => ({ id: `tx-${from + i}`, amount: 1 })), error: null };
        },
      };
      return builder;
    },
  },
}));

import { fetchAllPages, transactionsRepository } from '../src/repositories/transactions.repository';

beforeEach(() => { mockRanges.length = 0; });

test('Export reads past the first 1,000 rows', async () => {
  mockTotal = 1005;
  const res = await transactionsRepository.fetchAll();
  expect(res.ok && res.data.length).toBe(1005);
  expect(mockRanges).toEqual([[0, 999], [1000, 1999]]);
});

test('an account history of exactly 1,000 rows asks once more and stops', async () => {
  mockTotal = 1000;
  const res = await transactionsRepository.fetchByAccount('acc-1');
  expect(res.ok && res.data.length).toBe(1000);
  expect(mockRanges).toEqual([[0, 999], [1000, 1999]]);
});

test('an error on a later page is returned, not swallowed', async () => {
  let call = 0;
  const res = await fetchAllPages(async () => {
    call += 1;
    return call === 1
      ? { data: Array.from({ length: 1000 }, () => ({})), error: null }
      : { data: null, error: { message: 'timeout' } };
  });
  expect(res.error).toEqual({ message: 'timeout' });
});
