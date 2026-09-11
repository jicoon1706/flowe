import { isOpenWhileLocked } from '../src/utils/lockRoutes';

describe('isOpenWhileLocked', () => {
  it('leaves home and the add-transaction form open', () => {
    expect(isOpenWhileLocked('/')).toBe(true);
    expect(isOpenWhileLocked('/add-transaction')).toBe(true);
    expect(isOpenWhileLocked('/add-transaction/')).toBe(true);
  });

  it('locks every other tab and nested screen', () => {
    expect(isOpenWhileLocked('/calendar')).toBe(false);
    expect(isOpenWhileLocked('/cashflow')).toBe(false);
    expect(isOpenWhileLocked('/settings')).toBe(false);
    expect(isOpenWhileLocked('/settings/security')).toBe(false);
    expect(isOpenWhileLocked('/home/accounts')).toBe(false);
    expect(isOpenWhileLocked('/home/account/abc')).toBe(false);
  });

  it('does not let a prefix of an open route through', () => {
    expect(isOpenWhileLocked('/add-transaction-history')).toBe(false);
    expect(isOpenWhileLocked('/home')).toBe(false);
  });
});
