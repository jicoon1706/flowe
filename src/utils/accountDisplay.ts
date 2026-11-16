import type { Account, AccountWithDetails } from '../types/database.types';
import { institutionDomain } from '../../constants/institutionDomains';

/** The detail rows Supabase joins onto an `accounts` row. */
export type AnyAccount = Account & Partial<Pick<AccountWithDetails, 'bank_accounts' | 'wallet_accounts' | 'tabung_accounts'>>;

/** Stored balance: bank/wallet `current_balance`, tabung `saved_amount`. */
export function accountBalance(a: AnyAccount): number {
  if (a.type === 'bank') return Number(a.bank_accounts?.current_balance ?? 0);
  if (a.type === 'wallet') return Number(a.wallet_accounts?.current_balance ?? 0);
  return Number(a.tabung_accounts?.saved_amount ?? 0);
}

/** Logo domain for a bank or wallet (by bank name, then account name). */
export function accountDomain(a: AnyAccount | undefined | null): string | undefined {
  if (!a || a.type === 'tabung') return undefined;
  return institutionDomain(a.bank_accounts?.bank_name, a.name);
}

/** Last 4 digits for the hero card ('•••• 4021'), when the user stored them. */
export function accountMask(a: AnyAccount): string | undefined {
  const n = a.bank_accounts?.account_number;
  return n ? `•••• ${n.slice(-4)}` : undefined;
}

/** Bank/wallet accounts money can move through (not tabung). */
export function spendableAccounts<T extends AnyAccount>(accounts: T[]): T[] {
  return accounts.filter((a) => a.type === 'bank' || a.type === 'wallet');
}

export function sumBalances(accounts: AnyAccount[]): number {
  return Math.round(accounts.reduce((s, a) => s + accountBalance(a), 0) * 100) / 100;
}

export const ACCOUNT_GROUP_LABEL: Record<Account['type'], string> = {
  bank: 'Banks',
  wallet: 'E-wallets',
  tabung: 'Tabung',
};
