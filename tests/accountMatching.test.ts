import { bankAccountsFor, accountsForSource } from '../src/utils/accountMatching';
import { NOTIFICATION_SOURCES } from '../constants/notificationSources';

function bank(id: string, bankName: string) {
  return { id, type: 'bank', bank_accounts: { bank_name: bankName } };
}

/**
 * The spellings Flowe actually stores in `bank_accounts.bank_name`, keyed by the
 * `bankId` a notification source carries:
 *
 *  - onboarding writes the bank id           → 'hong-leong'
 *  - the accounts screen writes a preset name → 'Hong Leong'   (`bank_presets`)
 *  - `MALAYSIAN_BANKS` displays              → 'Hong Leong Bank'
 *
 * All three have to match, or the bank's app is judged unusable by Settings →
 * Auto-detect, pruned out of the watch list, and its alerts are never captured.
 */
const SPELLINGS: [bankId: string, stored: string[]][] = [
  ['maybank', ['maybank', 'Maybank']],
  ['cimb', ['cimb', 'CIMB', 'CIMB Bank']],
  ['public', ['public', 'Public Bank']],
  ['rhb', ['rhb', 'RHB', 'RHB Bank']],
  ['hong-leong', ['hong-leong', 'Hong Leong', 'Hong Leong Bank']],
  ['ambank', ['ambank', 'AmBank']],
  ['bank-islam', ['bank-islam', 'Bank Islam']],
  ['bsn', ['bsn', 'BSN']],
];

describe('bankAccountsFor', () => {
  it.each(SPELLINGS)('matches every spelling stored for %s', (bankId, stored) => {
    stored.forEach((name) => {
      expect(bankAccountsFor([bank('b1', name)], bankId).map((a) => a.id)).toEqual(['b1']);
    });
  });

  it('does not match a different bank', () => {
    const accounts = [bank('b1', 'CIMB Bank'), bank('b2', 'Maybank')];
    expect(bankAccountsFor(accounts, 'maybank').map((a) => a.id)).toEqual(['b2']);
    expect(bankAccountsFor(accounts, 'cimb').map((a) => a.id)).toEqual(['b1']);
  });

  it('keeps banks whose name is only the generic word apart', () => {
    // 'Bank Islam' and 'Bank Rakyat' both reduce to their distinguishing word,
    // and must not collapse into each other.
    const accounts = [bank('b1', 'Bank Islam'), bank('b2', 'Bank Rakyat')];
    expect(bankAccountsFor(accounts, 'bank-islam').map((a) => a.id)).toEqual(['b1']);
    expect(bankAccountsFor(accounts, 'bank-rakyat').map((a) => a.id)).toEqual(['b2']);
  });

  it('ignores an account with no bank name rather than matching everything', () => {
    expect(bankAccountsFor([bank('b1', '')], 'maybank')).toEqual([]);
  });

  it('returns every bank account when the alert names no bank', () => {
    const accounts = [bank('b1', 'Maybank'), bank('b2', 'CIMB')];
    expect(bankAccountsFor(accounts, undefined)).toHaveLength(2);
  });
});

describe('accountsForSource', () => {
  it('finds an account for every bank app Flowe watches', () => {
    // The regression this guards: a source whose `bankId` matches none of the
    // user's accounts is dropped from the watch list, so the listener never even
    // sees its notifications.
    NOTIFICATION_SOURCES.filter((s) => !s.wallet).forEach((source) => {
      const stored = SPELLINGS.find(([id]) => id === source.bankId);
      if (!stored) return;
      stored[1].forEach((name) => {
        expect(accountsForSource(source, [bank('b1', name)])).toHaveLength(1);
      });
    });
  });
});
