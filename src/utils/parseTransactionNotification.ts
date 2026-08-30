import { sourceForPackage } from '../../constants/notificationSources';

// Turns a raw Android notification from a bank or e-wallet app into the fields
// Flowe needs to prefill a transaction. Kept as a pure function so the messy
// part — every bank words its alerts differently — is unit-testable without a
// device. Anything it can't read confidently is left undefined for the user.

export interface RawNotification {
  /** Android package that posted it, e.g. 'com.setel.mobile'. */
  packageName: string;
  title: string;
  text: string;
  /** Epoch millis when Android posted it. */
  postedAt: number;
}

export interface ParsedNotification {
  amount: number;
  /** 'expense' when money left the account, 'income' when it arrived. */
  type: 'expense' | 'income';
  /** Merchant or counterparty, when the alert names one. */
  merchant?: string;
  /** Last 4 digits of the account/card the alert mentions. */
  accountLast4?: string;
  /** Bank id from `MALAYSIAN_BANKS`, derived from the posting app. */
  bankId?: string;
  /** True when the source app is an e-wallet rather than a bank. */
  wallet: boolean;
  postedAt: number;
}

// Words that mean money left the account. Checked before the credit words
// because "payment received" and "payment to" share a stem.
const DEBIT_HINTS = [
  'debited', 'debit', 'spent', 'paid', 'payment to', 'purchase', 'withdrawn',
  'withdrawal', 'deducted', 'charged', 'transfer to', 'sent to', 'you paid',
  'transaksi', 'pembayaran', 'ditolak',
];

const CREDIT_HINTS = [
  'credited', 'credit', 'received', 'refund', 'refunded', 'cashback',
  'deposited', 'transfer from', 'reload', 'topped up', 'top-up', 'top up',
  'diterima', 'masuk',
];

// Alerts that aren't transactions at all — OTPs, balance reminders, promos.
const IGNORE_HINTS = [
  'otp', 'one-time password', 'one time password', 'verification code',
  'tac ', 'do not share', 'promo', 'promotion', 'reward point', 'statement is ready',
  'password', 'login', 'log in', 'sign in', 'security alert',
];

/** RM 1,234.56 / RM1234.56 / MYR 12.30 / 12.30 MYR */
const AMOUNT_PATTERNS = [
  /(?:rm|myr)\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i,
  /([0-9][0-9,]*\.[0-9]{2})\s*(?:rm|myr)/i,
];

function findAmount(text: string): number | undefined {
  for (const pattern of AMOUNT_PATTERNS) {
    const match = text.match(pattern);
    if (!match) continue;
    const value = Number(match[1].replace(/,/g, ''));
    if (Number.isFinite(value) && value > 0) return value;
  }
  return undefined;
}

function findLast4(text: string): string | undefined {
  // "a/c ending 1234", "****1234", "x1234", "card ...1234"
  const match = text.match(/(?:ending|ends with|\*{2,}|x{2,}|\.{3})\s*([0-9]{4})\b/i);
  return match?.[1];
}

/**
 * Merchant name from the phrases banks actually use. Deliberately conservative:
 * a wrong guess here becomes a wrong transaction name, and the user is going to
 * confirm the name anyway.
 */
function findMerchant(text: string): string | undefined {
  const patterns = [
    /(?:at|to|from)\s+([A-Z0-9][A-Za-z0-9&'’.\- ]{2,40}?)(?=\s+(?:on|for|via|using|with)\b|[.,!]|$)/,
    /merchant[:\s]+([A-Za-z0-9&'’.\- ]{2,40})/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    const value = match?.[1]?.trim().replace(/\s{2,}/g, ' ');
    if (value && value.length >= 3) return value;
  }
  return undefined;
}

function matchesAny(haystack: string, needles: string[]): boolean {
  return needles.some((needle) => haystack.includes(needle));
}

/**
 * Parse one notification, or return null when it isn't a transaction alert.
 * Returning null is the common case — most notifications from these apps are
 * OTPs, promos and reminders, and surfacing those as transactions would be
 * worse than missing a real one.
 */
export function parseTransactionNotification(raw: RawNotification): ParsedNotification | null {
  const source = sourceForPackage(raw.packageName);
  if (!source) return null;

  const combined = `${raw.title ?? ''} ${raw.text ?? ''}`.trim();
  if (!combined) return null;
  const lower = combined.toLowerCase();

  if (matchesAny(lower, IGNORE_HINTS)) return null;

  const amount = findAmount(combined);
  if (amount === undefined) return null;

  const isDebit = matchesAny(lower, DEBIT_HINTS);
  const isCredit = matchesAny(lower, CREDIT_HINTS);
  // Ambiguous wording (both or neither) defaults to expense: the overwhelming
  // majority of these alerts are spending, and the user confirms the type anyway.
  const type: 'expense' | 'income' = isCredit && !isDebit ? 'income' : 'expense';

  return {
    amount,
    type,
    merchant: findMerchant(combined),
    accountLast4: findLast4(combined),
    bankId: source.bankId,
    wallet: !!source.wallet,
    postedAt: raw.postedAt,
  };
}
