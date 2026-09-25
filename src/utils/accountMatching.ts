import { MALAYSIAN_BANKS } from '../../constants/banks';
import type { NotificationSource } from '../../constants/notificationSources';

/**
 * Matching a detected payment to one of the user's accounts.
 *
 * Two callers need the same answer: `resolveDetectedAccount` when a payment
 * arrives, and Settings → Auto-detect when it decides whether watching an app
 * would be useful at all. Keeping the rules here means the screen can't promise
 * a match the resolver won't make.
 */

/**
 * Supabase returns a to-one embed as an object, but the same row read through a
 * different select comes back as a one-element array. Normalise before reading.
 */
export function embed(value: any): any {
  return (Array.isArray(value) ? value[0] : value) ?? {};
}

/** Last 4 digits stored against a bank account, when the user filled them in. */
export function accountLast4(account: any): string | undefined {
  const digits = String(embed(account.bank_accounts).account_number ?? '').replace(/\D/g, '');
  return digits.length >= 4 ? digits.slice(-4) : undefined;
}

export function walletAccounts(accounts: any[]): any[] {
  return accounts.filter((a) => a.type === 'wallet');
}

/**
 * Words that say nothing about *which* bank this is. Dropping them is what
 * lets the three spellings of the same bank Flowe stores meet in the middle:
 * onboarding writes the bank id ('hong-leong'), the accounts screen writes the
 * name from the `bank_presets` table ('Hong Leong'), and `MALAYSIAN_BANKS`
 * calls it 'Hong Leong Bank'.
 *
 * Only ever removed as whole words, so 'Maybank' and 'AmBank' survive intact.
 */
const GENERIC_BANK_WORDS = new Set(['bank', 'banking', 'berhad', 'bhd', 'malaysia']);

/**
 * One bank, spelled one way.
 *
 * An exact string compare used to decide this, and it quietly cost the user
 * every detection from half the banks Flowe supports: `bank_presets` seeds
 * 'CIMB', 'RHB', 'Hong Leong', 'Affin' and 'Alliance', while `MALAYSIAN_BANKS`
 * calls the same banks 'CIMB Bank', 'RHB Bank', 'Hong Leong Bank', 'Affin Bank'
 * and 'Alliance Bank'. An account added from the accounts screen therefore
 * matched nothing — so Settings → Auto-detect judged the bank's app unusable,
 * pruned it out of the watch list, and the listener never even captured its
 * alerts. 'Maybank' happened to be spelled identically in both, which is why
 * only some banks were ever detected.
 */
function bankKey(value: string): string {
  return value
    .toLowerCase()
    // Hyphens in an id, punctuation in a display name: both are just spacing.
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter((word) => word && !GENERIC_BANK_WORDS.has(word))
    .join('');
}

/**
 * The user's accounts at one bank. `bank_name` is stored as the bank id by
 * onboarding, as a `bank_presets` name by the accounts screen, and shown from
 * `MALAYSIAN_BANKS` — so all three spellings are accepted rather than migrating
 * rows the user can't see.
 */
export function bankAccountsFor(accounts: any[], bankId: string | undefined): any[] {
  const bankAccounts = accounts.filter((a) => a.type === 'bank');
  if (!bankId) return bankAccounts;
  const wanted = new Set([bankKey(bankId)]);
  const displayName = MALAYSIAN_BANKS.find((b) => b.id === bankId)?.name;
  if (displayName) wanted.add(bankKey(displayName));
  return bankAccounts.filter((a) => {
    const stored = String(embed(a.bank_accounts).bank_name ?? '');
    const key = bankKey(stored);
    return !!key && wanted.has(key);
  });
}

/** Accounts a notification from `source` could ever land in. */
export function accountsForSource(source: NotificationSource, accounts: any[]): any[] {
  return source.wallet ? walletAccounts(accounts) : bankAccountsFor(accounts, source.bankId);
}
