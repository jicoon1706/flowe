import {
  shouldAutoSave,
  isCrossAppDuplicate,
  CROSS_APP_WINDOW_MS,
} from '../src/utils/shouldAutoSave';
import type { ParsedNotification } from '../src/utils/parseTransactionNotification';

function parsed(extra: Partial<ParsedNotification> = {}): ParsedNotification {
  return {
    amount: 50,
    type: 'expense',
    typeConfident: true,
    packageId: 'com.grabtaxi.passenger',
    merchant: 'ZUS COFFEE',
    wallet: true,
    postedAt: 0,
    ...extra,
  };
}

describe('shouldAutoSave', () => {
  it('files a payment where every field was read from the alert', () => {
    expect(shouldAutoSave({ parsed: parsed(), accountId: 'a1', category: 'food' })).toBe(true);
  });

  it('asks when there is no account to file it into', () => {
    expect(shouldAutoSave({ parsed: parsed(), accountId: undefined, category: 'food' })).toBe(false);
  });

  it('asks when the alert never named a merchant', () => {
    // The row would be called "Grab", which says nothing a week later.
    expect(
      shouldAutoSave({ parsed: parsed({ merchant: undefined }), accountId: 'a1', category: 'food' })
    ).toBe(false);
  });

  it('asks when the alert worded it as both a debit and a credit', () => {
    expect(
      shouldAutoSave({ parsed: parsed({ typeConfident: false }), accountId: 'a1', category: 'food' })
    ).toBe(false);
  });

  it('asks when an expense has no category', () => {
    expect(shouldAutoSave({ parsed: parsed(), accountId: 'a1', category: undefined })).toBe(false);
  });

  it('files income without a category, because income never carries one', () => {
    expect(
      shouldAutoSave({ parsed: parsed({ type: 'income' }), accountId: 'a1', category: undefined })
    ).toBe(true);
  });
});

describe('isCrossAppDuplicate', () => {
  const candidate = { packageId: 'com.grabtaxi.passenger', amount: 50, postedAt: 1_000_000 };

  it('spots the same payment announced by a second app', () => {
    const others = [{ packageId: 'com.maybank2u.life', amount: 50, postedAt: 1_060_000 }];
    expect(isCrossAppDuplicate(candidate, others)).toBe(true);
  });

  it('does not treat a second alert from the same app as a duplicate', () => {
    // Same-package repeats are the native listener's job; if one gets through
    // it is a genuinely separate payment as far as this rule is concerned.
    const others = [{ packageId: 'com.grabtaxi.passenger', amount: 50, postedAt: 1_060_000 }];
    expect(isCrossAppDuplicate(candidate, others)).toBe(false);
  });

  it('lets two equal amounts through once they are far enough apart', () => {
    const others = [
      { packageId: 'com.maybank2u.life', amount: 50, postedAt: 1_000_000 + CROSS_APP_WINDOW_MS + 1 },
    ];
    expect(isCrossAppDuplicate(candidate, others)).toBe(false);
  });

  it('ignores a different amount from another app', () => {
    const others = [{ packageId: 'com.maybank2u.life', amount: 51, postedAt: 1_000_000 }];
    expect(isCrossAppDuplicate(candidate, others)).toBe(false);
  });

  it('is unbothered by an empty queue', () => {
    expect(isCrossAppDuplicate(candidate, [])).toBe(false);
  });
});
