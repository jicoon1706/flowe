// AUDIT-2026-11 B10: a tabung's starting amount is stored as its opening
// amount, which recalculate_account_balances (migration 20261121) starts from.

const mockInserts: { table: string; row: any }[] = [];

jest.mock('../src/lib/supabase', () => ({
  supabase: {
    from: (table: string) => {
      const builder: any = {
        insert: (row: any) => { mockInserts.push({ table, row }); return builder; },
        select: () => builder,
        single: async () => ({ data: { id: `${table}-1` }, error: null }),
      };
      return builder;
    },
  },
}));

import { accountsRepository } from '../src/repositories/accounts.repository';

const base = { user_id: 'u', name: 'Laptop', target_amount: 4000, from_date: '2026-11-18', to_date: '2027-06-30' };

beforeEach(() => { mockInserts.length = 0; });

test('a starting amount is written as both the balance and the opening amount', async () => {
  await accountsRepository.createTabungAccount({ ...base, starting_amount: 500 });
  const tabung = mockInserts.find((i) => i.table === 'tabung_accounts')!.row;
  expect(tabung.saved_amount).toBe(500);
  expect(tabung.opening_amount).toBe(500);
});

test('an empty jar sends no opening amount (works before the migration)', async () => {
  await accountsRepository.createTabungAccount({ ...base });
  const tabung = mockInserts.find((i) => i.table === 'tabung_accounts')!.row;
  expect(tabung.saved_amount).toBe(0);
  expect('opening_amount' in tabung).toBe(false);
});
