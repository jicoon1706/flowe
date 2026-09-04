import { resolveDetectedAccount } from '../src/utils/resolveDetectedAccount';
import type { ParsedNotification } from '../src/utils/parseTransactionNotification';

function bank(id: string, bankName: string, last4?: string) {
  return { id, type: 'bank', bank_accounts: { bank_name: bankName, account_number: last4 } };
}

function wallet(id: string) {
  return { id, type: 'wallet', wallet_accounts: {} };
}

function detected(extra: Partial<ParsedNotification> = {}): ParsedNotification {
  return {
    amount: 10,
    type: 'expense',
    typeConfident: true,
    packageId: 'com.grabtaxi.passenger',
    wallet: false,
    postedAt: 0,
    ...extra,
  };
}

describe('resolveDetectedAccount', () => {
  it('picks the only wallet for an e-wallet payment', () => {
    const accounts = [wallet('w1'), bank('b1', 'maybank')];
    expect(resolveDetectedAccount(detected({ wallet: true }), accounts)).toBe('w1');
  });

  it('asks the user when several wallets could be the one', () => {
    expect(resolveDetectedAccount(detected({ wallet: true }), [wallet('w1'), wallet('w2')])).toBeUndefined();
  });

  it('matches the bank stored as an id or as a display name', () => {
    expect(resolveDetectedAccount(detected({ bankId: 'maybank' }), [bank('b1', 'maybank')])).toBe('b1');
    expect(resolveDetectedAccount(detected({ bankId: 'maybank' }), [bank('b1', 'Maybank')])).toBe('b1');
  });

  it('uses the last 4 digits to choose between accounts at the same bank', () => {
    const accounts = [bank('b1', 'maybank', '1111'), bank('b2', 'maybank', '2222')];
    expect(resolveDetectedAccount(detected({ bankId: 'maybank', accountLast4: '2222' }), accounts)).toBe('b2');
  });

  it('will not guess between same-bank accounts when the alert names no digits', () => {
    const accounts = [bank('b1', 'maybank', '1111'), bank('b2', 'maybank', '2222')];
    expect(resolveDetectedAccount(detected({ bankId: 'maybank' }), accounts)).toBeUndefined();
  });

  it('accepts a unique last-4 hit from another bank', () => {
    // A banking app that alerts for a card settled from an account elsewhere.
    const accounts = [bank('b1', 'maybank', '1111'), bank('b2', 'cimb', '9090')];
    expect(resolveDetectedAccount(detected({ bankId: 'maybank', accountLast4: '9090' }), accounts)).toBe('b2');
  });

  it('refuses an account whose digits contradict the alert', () => {
    const accounts = [bank('b1', 'maybank', '1111')];
    expect(resolveDetectedAccount(detected({ bankId: 'maybank', accountLast4: '2222' }), accounts)).toBeUndefined();
  });

  it('falls back to the one account with no digits stored', () => {
    const accounts = [bank('b1', 'maybank')];
    expect(resolveDetectedAccount(detected({ bankId: 'maybank', accountLast4: '2222' }), accounts)).toBe('b1');
  });

  it('reads a full account number stored instead of just the last 4', () => {
    const accounts = [bank('b1', 'maybank', '5141 2233 2222')];
    expect(resolveDetectedAccount(detected({ bankId: 'maybank', accountLast4: '2222' }), accounts)).toBe('b1');
  });

  it('returns nothing when the user has no bank accounts at all', () => {
    expect(resolveDetectedAccount(detected({ bankId: 'maybank' }), [wallet('w1')])).toBeUndefined();
  });

  it('files an e-wallet payment into the account pinned for that app', () => {
    // The everyday case: nothing in a Grab alert says which wallet paid, so
    // without a pin this question would be asked forever.
    const accounts = [wallet('w1'), wallet('w2')];
    const pins = { 'com.grabtaxi.passenger': 'w2' };
    expect(resolveDetectedAccount(detected({ wallet: true }), accounts, pins)).toBe('w2');
  });

  it('ignores a pin whose account has since been deleted', () => {
    const accounts = [wallet('w1'), wallet('w2')];
    const pins = { 'com.grabtaxi.passenger': 'gone' };
    expect(resolveDetectedAccount(detected({ wallet: true }), accounts, pins)).toBeUndefined();
  });

  it('lets the last 4 digits beat the pin, because they describe this payment', () => {
    const accounts = [bank('b1', 'maybank', '1111'), bank('b2', 'maybank', '2222')];
    const pins = { 'com.grabtaxi.passenger': 'b1' };
    expect(
      resolveDetectedAccount(detected({ bankId: 'maybank', accountLast4: '2222' }), accounts, pins)
    ).toBe('b2');
  });

  it('falls back to the pin when the bank match is ambiguous', () => {
    const accounts = [bank('b1', 'maybank', '1111'), bank('b2', 'maybank', '2222')];
    const pins = { 'com.grabtaxi.passenger': 'b1' };
    expect(resolveDetectedAccount(detected({ bankId: 'maybank' }), accounts, pins)).toBe('b1');
  });
});
