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
 * The user's accounts at one bank. `bank_name` is stored as the bank id by
 * onboarding but as the display name by the accounts screen, so both are
 * accepted rather than migrating rows the user can't see.
 */
export function bankAccountsFor(accounts: any[], bankId: string | undefined): any[] {
  const bankAccounts = accounts.filter((a) => a.type === 'bank');
  if (!bankId) return bankAccounts;
  const bankName = MALAYSIAN_BANKS.find((b) => b.id === bankId)?.name.toLowerCase();
  return bankAccounts.filter((a) => {
    const stored = String(embed(a.bank_accounts).bank_name ?? '').toLowerCase();
    return stored === bankId || (!!bankName && stored === bankName);
  });
}

/** Accounts a notification from `source` could ever land in. */
export function accountsForSource(source: NotificationSource, accounts: any[]): any[] {
  return source.wallet ? walletAccounts(accounts) : bankAccountsFor(accounts, source.bankId);
}
