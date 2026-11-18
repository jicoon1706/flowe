import { amountProblem, MAX_AMOUNT, formatRM, roundCents } from './money';

export type TxKind = 'expense' | 'income' | 'transfer';

export interface AddFormState {
  kind: TxKind;
  amount: number | null;
  accountId: string | null;
  /** Transfer destination (account or asset id). */
  toId: string | null;
  /** Available balance of the source account (expense / transfer), if known. */
  available?: number | null;
  /** Whether the app is locked (don't print the available figure). */
  locked?: boolean;
  sourceName?: string;
}

export type AddFieldError = { field: 'amount' | 'account' | 'to'; message: string; saveLabel: string };

/**
 * The first thing stopping Save, in the order the canvas checks them
 * (section K): amount, account, transfer destination, same account, balance.
 * Null when Save is allowed.
 */
export function addFormError(s: AddFormState): AddFieldError | null {
  const amt = amountProblem(s.amount);
  if (amt === 'zero') return { field: 'amount', message: 'Enter an amount above RM 0.00', saveLabel: 'Enter an amount' };
  if (amt === 'too-large') return { field: 'amount', message: `Amounts go up to ${formatRM(MAX_AMOUNT)}`, saveLabel: 'Amount too large' };
  if (!s.accountId) return { field: 'account', message: 'Add an account first, then save.', saveLabel: 'Choose an account' };
  if (s.kind === 'transfer' && !s.toId) return { field: 'to', message: 'Choose where the money goes.', saveLabel: 'Choose a destination' };
  if (s.kind === 'transfer' && s.toId === s.accountId) return { field: 'to', message: 'Pick two different accounts.', saveLabel: 'Choose a different account' };
  // Compared in whole cents: the available figure is often a float sum
  // (0.7 + 0.1 = 0.7999…), which wrongly refused an exact spend (AUDIT-2026-11 B8).
  if ((s.kind === 'expense' || s.kind === 'transfer') && s.available !== undefined && s.available !== null && s.amount !== null && roundCents(s.amount) > roundCents(s.available)) {
    const who = s.sourceName ?? 'This account';
    return {
      field: 'account',
      message: s.locked ? `${who} doesn't have enough for this.` : `${who} has ${formatRM(s.available)} available.`,
      saveLabel: 'Not enough balance',
    };
  }
  return null;
}
