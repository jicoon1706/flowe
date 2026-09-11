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
  /**
   * True when the user has already said this is a transaction — they tapped
   * Expense or Income on the shade notification. Their word outranks every
   * heuristic here: the alert is accepted as long as it names an amount.
   */
  confirmed?: boolean;
}

export interface ParsedNotification {
  amount: number;
  /** 'expense' when money left the account, 'income' when it arrived. */
  type: 'expense' | 'income';
  /**
   * False when the alert used both debit and credit wording, so `type` is the
   * fallback guess rather than a reading. Auto-save refuses these; the card
   * shows the toggle and lets the user settle it.
   */
  typeConfident: boolean;
  /** Android package that posted the alert, e.g. 'com.grabtaxi.passenger'. */
  packageId: string;
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
  'credited', 'credit', 'received', 'refund', 'refunded',
  'deposited', 'transfer from', 'reload', 'topped up', 'top-up', 'top up',
  'diterima', 'masuk',
];

/**
 * Words that say a transaction happened without saying which way the money
 * went — "Transaction Alert: RM 20.00 at ZUS COFFEE", "DuitNow QR successful",
 * "Payment successful". Enough to accept the alert; not enough to be sure of
 * the direction, so these alone make an unconfident expense that the card asks
 * about rather than one that files itself.
 */
const MOVEMENT_PATTERNS = [
  /\btransa(?:ction|ksi)\b/i,
  /\bsuccessful(?:ly)?\b|\bberjaya\b/i,
  /\bduitnow\b|\bfpx\b|\bjompay\b|\bqr\b/i,
  /\btransfer(?:red)?\b|\bpindahan\b/i,
  /\bpayment\b|\bbayaran\b/i,
  /\bspen[dt]\b|\bwithdraw(?:n|al)?\b|\bbelanja\b/i,
  /\bcash\s*(?:in|out)\b/i,
  // An amount followed by a counterparty is the shape of a receipt, whatever
  // verb the bank chose: "RM 20.00 at ZUS COFFEE", "RM 50.00 to ALI".
  /(?:rm|myr)\s*[0-9][0-9,.]*\s+(?:at|to|from|kepada|dari|di)\s+\S/i,
];

// Alerts that aren't transactions at all — OTPs, balance reminders, promos.
// Only phrases that never appear in a real payment alert belong here: a debit
// alert that ends "Available balance RM 1,234.56" or "You earned 12 reward
// points" is still a debit alert, and used to be dropped for it.
const IGNORE_HINTS = [
  // Security and account admin.
  'one-time password', 'one time password', 'verification code',
  'tac ', 'do not share', 'password', 'login', 'log in', 'sign in',
  'security alert', 'statement is ready', 'e-statement',
  // Marketing. These are the alerts that were being filed as expenses: they
  // name a ringgit amount and read like a payment, but nothing has moved.
  'promo', 'promotion', 'promosi', 'discount', 'diskaun', 'voucher', 'baucar',
  'rebate', 'coupon', 'giveaway', 'contest', 'peraduan', 'exclusive deal',
  'limited time', 'don’t miss', "don't miss", 'shop now', 'buy now',
  'apply now', 'claim now', 'claim your', 'tuntut', 'terms apply', 't&c',
  'terms and conditions', 'syarat', 'valid till', 'valid until', 'sah sehingga',
  'while stocks last', 'sign up now', 'refer a friend',
  'when you spend', 'minimum spend', 'interest rate', 'sale ends', 'offer ends',
  // Reminders about money that hasn't moved yet.
  'payment due', 'due on', 'due date', 'minimum payment',
  'low balance', 'balance enquiry', 'reminder:',
];

/**
 * Security codes, word-bounded: 'otp' as a bare substring is also the middle
 * of a payment at a hotpot restaurant.
 */
const SECURITY_PATTERN = /\b(?:otp|tac)\b/i;

/**
 * The balance a bank prints after the movement — "Available balance RM 1,234.56",
 * "Baki: RM 50.00", "RM 950.00 left". It is an amount, so it would be read as
 * *the* amount whenever it comes first; stripping it out before looking for the
 * transaction amount is what keeps a balance from being filed as a payment, and
 * a payment from being filed at the balance.
 */
const BALANCE_PATTERNS = [
  /\b(?:(?:available|avail\.?|outstanding|current|remaining|closing|ledger|new)\s+)?(?:balance\b|baki\b|bal\b\.?)(?:\s+(?:is|now|of|semasa|tersedia|after\s+(?:this\s+)?(?:transaction|txn)))*\s*[:=-]?\s*(?:rm|myr)\s*[0-9][0-9,]*(?:\.[0-9]{1,2})?/gi,
  /(?:rm|myr)\s*[0-9][0-9,]*(?:\.[0-9]{1,2})?\s*(?:is\s+)?(?:available|remaining|left)\b/gi,
];

function stripBalances(text: string): string {
  return BALANCE_PATTERNS.reduce((acc, pattern) => acc.replace(pattern, ' '), text);
}

/**
 * Marketing that survives the word list, caught by shape instead: a hedged
 * amount ("up to RM50"), or an amount that is an incentive rather than a
 * movement ("RM5 off", "RM50 cashback").
 */
const PROMO_PATTERNS = [
  /\b(?:up\s*to|as\s*low\s*as|from\s*(?:only\s*)?|starting\s*(?:from|at)|save)\s*(?:rm|myr)\s*[0-9]/i,
  /(?:rm|myr)\s*[0-9][0-9,.]*\s*(?:off|cashback|rebate|voucher|discount|bonus|free)\b/i,
  /\b(?:get|enjoy|earn|win|grab|claim|redeem)\s+(?:up\s*to\s*)?(?:rm|myr)\s*[0-9]/i,
  /[0-9]{1,3}\s*%\s*(?:off|discount|cashback|rebate)/i,
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
  // "a/c ending 1234", "****1234", "card ...1234", "acc no. 1234"
  const patterns = [
    /(?:ending(?:\s+(?:in|with))?|ends\s+with|berakhir(?:\s+dengan)?)\s*(?:[*x•.]{2,}\s*)?([0-9]{4})\b/i,
    /[*x•.]{3,}\s*([0-9]{4})\b/i,
    /\b(?:a\/c|acc(?:ount)?|akaun|card|kad)\s*(?:no\.?|number|#)?\s*[:\-]?\s*(?:[*x•.]{2,}\s*)?([0-9]{4})\b/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }
  return undefined;
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

  // The user tapped Expense/Income on the shade notification: they have said
  // it's a transaction, and the only thing left to read is how much.
  if (!raw.confirmed) {
    if (SECURITY_PATTERN.test(combined)) return null;
    if (matchesAny(lower, IGNORE_HINTS)) return null;
    if (PROMO_PATTERNS.some((pattern) => pattern.test(combined))) return null;
  }

  // The balance after the movement is also an amount; it must not be the one
  // we read. An alert that names nothing but a balance isn't a transaction.
  const amount = findAmount(stripBalances(combined));
  if (amount === undefined) return null;

  const isDebit = matchesAny(lower, DEBIT_HINTS);
  const isCredit = matchesAny(lower, CREDIT_HINTS);
  const isMovement = MOVEMENT_PATTERNS.some((pattern) => pattern.test(combined));

  // No word for money actually moving means this isn't a transaction alert,
  // whatever else it says. An amount on its own is the shape a promo, a fee
  // schedule and a balance reminder all share, so it can't be trusted: an
  // unwanted detection costs the user a wrong transaction, a missed one only
  // costs them a tap in the app.
  if (!raw.confirmed && !isDebit && !isCredit && !isMovement) return null;

  // Both words present is real — "RM20 debited, payment received by merchant" —
  // and there the debit is the movement on the user's own account. With no
  // directional word at all, a payment is the overwhelmingly common case.
  const type: 'expense' | 'income' = isCredit && !isDebit ? 'income' : 'expense';

  return {
    amount,
    type,
    // The direction is a reading only when exactly one family of words
    // matched. Both — "RM20 debited, payment received by merchant" — or neither
    // — "Transaction successful RM20 at ZUS" — is an inference, and auto-save
    // refuses to act on it.
    typeConfident: isDebit !== isCredit,
    packageId: raw.packageName,
    merchant: findMerchant(combined),
    accountLast4: findLast4(combined),
    bankId: source.bankId,
    wallet: !!source.wallet,
    postedAt: raw.postedAt,
  };
}
