import { MALAYSIAN_BANKS } from '../../constants/banks';
import type { ParsedNotification } from './parseTransactionNotification';

/**
 * Work out which of the user's accounts a detected payment came from.
 *
 * The alert tells us the posting app (so the bank) and often the last 4 digits
 * of the account, which together are enough to pick the right row without
 * asking. When they aren't, we return undefined and the user picks — guessing
 * an account would silently move the wrong balance.
 */
export function resolveDetectedAccount(
  parsed: ParsedNotification,
  accounts: any[]
): string | undefined {
  // An e-wallet payment belongs to a wallet account when the user has exactly
  // one; with several there's no signal in the alert to choose between them.
  if (parsed.wallet) {
    const wallets = accounts.filter((a) => a.type === 'wallet');
    return wallets.length === 1 ? wallets[0].id : undefined;
  }

  const bankAccounts = accounts.filter((a) => a.type === 'bank');
  if (bankAccounts.length === 0) return undefined;

  const bankName = MALAYSIAN_BANKS.find((b) => b.id === parsed.bankId)?.name.toLowerCase();
  const sameBank = parsed.bankId
    ? bankAccounts.filter((a) => {
        const stored = a.bank_accounts?.bank_name?.toLowerCase();
        return stored === parsed.bankId || (!!bankName && stored === bankName);
      })
    : bankAccounts;

  const candidates = sameBank.length > 0 ? sameBank : bankAccounts;

  // The last 4 digits are decisive when the alert prints them.
  if (parsed.accountLast4) {
    const byNumber = candidates.find(
      (a) => a.bank_accounts?.account_number?.slice(-4) === parsed.accountLast4
    );
    if (byNumber) return byNumber.id;
  }

  // Otherwise only commit when the bank match is unambiguous.
  return sameBank.length === 1 ? sameBank[0].id : undefined;
}
