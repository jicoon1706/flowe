/**
 * The decision the headless task and the app share: file now, or wait for
 * the user. Everything that touches Supabase or the native queue is mocked —
 * this is about `toDetected` + `decide`, which is where the "needs nobody"
 * judgement lives.
 */
// jest hoists these mocks above the import, so the order here is only for reading.
import { toDetected, decide } from '../src/services/autoFile';

jest.mock('../modules/flowe-notifications', () => ({
  isAvailable: false,
  getCaptures: () => [],
  removeCapture: jest.fn(),
  recordBudgetExpense: jest.fn(),
}));
jest.mock('../src/services/notifications', () => ({ notify: jest.fn(), formatRM: (n: number) => `RM ${n}` }));
jest.mock('../src/repositories/transactions.repository', () => ({ transactionsRepository: { create: jest.fn() } }));
jest.mock('../src/lib/detectPreferences', () => ({ sourceAccounts: { learn: jest.fn(), all: async () => ({}) } }));


const maybank = {
  id: 'acc-maybank-1234',
  type: 'bank',
  name: 'Maybank',
  bank_accounts: { bank_name: 'Maybank', account_number: '1234' },
};
const wallet1 = { id: 'w1', type: 'wallet', name: 'Grab', wallet_accounts: {} };
const wallet2 = { id: 'w2', type: 'wallet', name: 'TNG', wallet_accounts: {} };

function capture(extra: Partial<Parameters<typeof toDetected>[0]> = {}) {
  return {
    id: 'cap-1',
    packageName: 'com.maybank2u.life',
    title: 'Transaction Alert',
    text: 'RM 45.90 has been debited from your account ending 1234 at ZUS COFFEE',
    postedAt: Date.now(),
    ...extra,
  };
}

describe('auto-file decision', () => {
  it('files a bank alert with last-4 and a known merchant, no answer needed', () => {
    const item = toDetected(capture(), [maybank], {})!;
    expect(item.accountId).toBe('acc-maybank-1234');
    const values = decide(item, []);
    expect(values).toEqual({ name: 'ZUS COFFEE', type: 'expense', accountId: 'acc-maybank-1234', category: 'food' });
  });

  it('files a shade-answered payment under Others when the merchant is unknown', () => {
    const item = toDetected(
      capture({ text: 'RM 12.00 debited from account ending 1234 at KEDAI RUNCIT PAK MAT', chosenType: 'expense', chosenName: 'Groceries' }),
      [maybank],
      {}
    )!;
    expect(item.answeredFromShade).toBe(true);
    expect(decide(item, [])).toEqual({ name: 'Groceries', type: 'expense', accountId: 'acc-maybank-1234', category: 'others' });
  });

  it('waits for the user when an e-wallet alert cannot be placed', () => {
    const item = toDetected(
      capture({ packageName: 'com.grabtaxi.passenger', title: 'Payment successful', text: 'You paid RM50.00 at MCDONALDS Rawang', chosenType: 'expense', chosenName: 'Lunch' }),
      [wallet1, wallet2],
      {}
    )!;
    expect(item.accountId).toBeUndefined();
    expect(decide(item, [])).toBeNull();
  });

  it('places the e-wallet alert once a default wallet is pinned for that app', () => {
    const item = toDetected(
      capture({ packageName: 'com.grabtaxi.passenger', title: 'Payment successful', text: 'You paid RM50.00 at MCDONALDS Rawang', chosenType: 'expense', chosenName: 'Lunch' }),
      [wallet1, wallet2],
      { 'com.grabtaxi.passenger': 'w2' }
    )!;
    expect(decide(item, [])?.accountId).toBe('w2');
  });

  it('refuses to silently file a payment another app already announced', () => {
    const item = toDetected(capture(), [maybank], {})!;
    const other = { packageId: 'com.grabtaxi.passenger', amount: 45.9, postedAt: item.parsed.postedAt - 30_000 };
    expect(decide(item, [other])).toBeNull();
  });

  it('files income without a category', () => {
    const item = toDetected(
      capture({ packageName: 'com.cimb.octo', title: 'Credit Alert', text: 'MYR 3,200.00 has been credited to your account ending 1234', chosenType: 'income', chosenName: 'Salary' }),
      [maybank],
      {}
    )!;
    expect(decide(item, [])).toEqual({ name: 'Salary', type: 'income', accountId: 'acc-maybank-1234', category: undefined });
  });
});
