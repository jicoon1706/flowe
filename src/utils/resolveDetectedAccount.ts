import type { ParsedNotification } from './parseTransactionNotification';
import { accountLast4, bankAccountsFor, walletAccounts } from './accountMatching';

/** Package name → account id the user pinned (or last used) for that app. */
export type SourceAccountDefaults = Record<string, string>;

/**
 * The pinned account for the app that posted this alert, if it still exists.
 * A pin outlives the account it names — deleting an account must not start
 * filing payments into a row that isn't there.
 */
function pinnedAccount(
  parsed: ParsedNotification,
  accounts: any[],
  defaults: SourceAccountDefaults
): string | undefined {
  const id = defaults[parsed.packageId];
  return id && accounts.some((a) => a.id === id) ? id : undefined;
}

/**
 * Work out which of the user's accounts a detected payment came from.
 *
 * The alert tells us the posting app (so the bank) and often the last 4 digits
 * of the account, which together are enough to pick the right row without
 * asking. When they aren't, a default the user pinned for that app settles it
 * — that's the only signal an e-wallet alert can ever offer, since nothing in
 * a Grab or TNG notification says which of several wallets paid.
 *
 * Order matters: digits printed in the alert describe *this* payment, so they
 * beat a pin, which only describes the app in general. Anything still
 * unresolved returns undefined and the user picks — guessing an account would
 * silently move the wrong balance.
 */
export function resolveDetectedAccount(
  parsed: ParsedNotification,
  accounts: any[],
  sourceDefaults: SourceAccountDefaults = {}
): string | undefined {
  const pinned = pinnedAccount(parsed, accounts, sourceDefaults);

  // An e-wallet payment belongs to a wallet account when the user has exactly
  // one; with several there's no signal in the alert to choose between them,
  // so only an explicit pin can answer it.
  if (parsed.wallet) {
    if (pinned) return pinned;
    const wallets = walletAccounts(accounts);
    return wallets.length === 1 ? wallets[0].id : undefined;
  }

  const allBankAccounts = accounts.filter((a) => a.type === 'bank');
  if (allBankAccounts.length === 0) return pinned;

  const sameBank = bankAccountsFor(accounts, parsed.bankId);

  // The last 4 digits are decisive when the alert prints them: they identify
  // one account even where the user holds several at the same bank, which is
  // exactly the case the bank name alone can't settle.
  if (parsed.accountLast4) {
    const withinBank = sameBank.filter((a) => accountLast4(a) === parsed.accountLast4);
    if (withinBank.length === 1) return withinBank[0].id;

    // Some apps post alerts for accounts held at another bank (a card paid from
    // a linked account, a shared banking app). A last-4 hit that is unique
    // across every bank account is still unambiguous, so honour it.
    if (withinBank.length === 0) {
      const anywhere = allBankAccounts.filter((a) => accountLast4(a) === parsed.accountLast4);
      if (anywhere.length === 1) return anywhere[0].id;
    }

    // The alert named an account we can't place. Every candidate that *does*
    // carry digits is now known to be the wrong one; only fall through when
    // some accounts have no digits stored to compare against.
    const undigited = sameBank.filter((a) => !accountLast4(a));
    if (undigited.length === 1) return undigited[0].id;
    return pinned;
  }

  if (pinned) return pinned;

  // Otherwise only commit when the bank match is unambiguous.
  return sameBank.length === 1 ? sameBank[0].id : undefined;
}
