// AUDIT #4: switching on "Recurring" while adding a transaction must produce a
// rule, starting after the payment that was just recorded.

jest.mock('@/src/lib/supabase', () => ({ supabase: {} }));
jest.mock('@/src/repositories/recurring.repository', () => ({ recurringRepository: {} }));
jest.mock('@/src/repositories/transactions.repository', () => ({ transactionsRepository: {} }));
jest.mock('@/src/services/notifications', () => ({ notify: jest.fn(), formatRM: (n: number) => `RM ${n}` }));

import { ruleFromTransaction, type RuleFromTransactionInput } from '@/src/services/recurring';

const base: RuleFromTransactionInput = {
  userId: 'user-1',
  type: 'expense',
  name: 'Netflix',
  amount: 55,
  category: 'entertainment',
  accountId: 'acc-1',
  transactionDate: '2026-11-16',
  frequency: 'monthly',
  startDate: '2026-11-16',
  endDate: null,
  reminder: 'none',
};

it('builds an expense rule from the transaction fields', () => {
  expect(ruleFromTransaction(base)).toMatchObject({
    user_id: 'user-1',
    type: 'expense',
    name: 'Netflix',
    amount: 55,
    category: 'entertainment',
    from_account_id: 'acc-1',
    to_account_id: undefined,
    frequency: 'monthly',
    start_date: '2026-11-16',
    reminder_enabled: false,
    reminder_offset: 'none',
  });
});

it('starts after the transaction just saved, so it is not offered twice', () => {
  expect(ruleFromTransaction(base)?.next_date).toBe('2026-12-16');
  expect(ruleFromTransaction({ ...base, frequency: 'weekly' })?.next_date).toBe('2026-11-23');
  expect(ruleFromTransaction({ ...base, frequency: 'yearly' })?.next_date).toBe('2027-11-16');
});

it('skips past occurrences when the start date is earlier than the transaction', () => {
  expect(ruleFromTransaction({ ...base, startDate: '2026-08-31' })?.next_date).toBe('2026-11-30');
});

it('keeps a future start date as the first occurrence', () => {
  expect(ruleFromTransaction({ ...base, startDate: '2026-12-01' })?.next_date).toBe('2026-12-01');
});

it('routes income to the destination account', () => {
  expect(ruleFromTransaction({ ...base, type: 'income' })).toMatchObject({
    from_account_id: undefined,
    to_account_id: 'acc-1',
  });
});

it('carries the end date and reminder', () => {
  expect(ruleFromTransaction({ ...base, endDate: '2027-06-30', reminder: '1_day' })).toMatchObject({
    end_date: '2027-06-30',
    reminder_enabled: true,
    reminder_offset: '1_day',
  });
});

it('ignores an unknown reminder id', () => {
  expect(ruleFromTransaction({ ...base, reminder: 'whenever' })?.reminder_offset).toBe('none');
});

it('returns null for types a rule cannot hold', () => {
  expect(ruleFromTransaction({ ...base, type: 'transfer' })).toBeNull();
});
