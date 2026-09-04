import type { ParsedNotification } from './parseTransactionNotification';

/**
 * Deciding whether a detected payment can be filed without asking.
 *
 * The default is to save: a payment the user already made shouldn't need a
 * second confirmation. But a wrong row filed silently is worse than a question,
 * so every field the transaction needs must be *read* rather than guessed —
 * the moment one of them is inference, the card is shown instead.
 */

export interface AutoSaveInput {
  parsed: ParsedNotification;
  /** From `resolveDetectedAccount` — undefined when the user has to choose. */
  accountId?: string;
  /** From `merchantCategory` — undefined for a merchant we don't know. */
  category?: string;
}

export function shouldAutoSave({ parsed, accountId, category }: AutoSaveInput): boolean {
  // Nowhere to file it. Two wallets and a Grab alert is the everyday case.
  if (!accountId) return false;

  // No merchant means the row would be named after the app ("Grab"), which
  // tells the user nothing when they scroll their history a week later.
  if (!parsed.merchant) return false;

  // The alert worded it both ways; `type` is the fallback, not a reading.
  if (!parsed.typeConfident) return false;

  // An expense with no category lands in the analysis screen as a blank, and
  // an unknown merchant is also the case where the name is least trustworthy.
  // Income carries no category, so it isn't held to this.
  if (parsed.type === 'expense' && !category) return false;

  return true;
}

/** The fields needed to tell two alerts about the same payment apart. */
export interface DetectionRef {
  packageId: string;
  amount: number;
  postedAt: number;
}

/**
 * How far apart two alerts for one payment can land. The bank's own alert
 * often trails the merchant app's by a minute or two; beyond that, two equal
 * amounts are more likely to be two real payments.
 */
export const CROSS_APP_WINDOW_MS = 3 * 60_000;

/**
 * True when another app has already announced this same payment.
 *
 * Paying inside Grab with a Maybank card can raise two alerts — one from each
 * app — for the same ringgit amount. The native listener only de-duplicates
 * identical text from the *same* package, so this is the guard that stops
 * auto-save quietly doubling a transaction. It deliberately doesn't decide
 * which of the two is right: it just refuses to file the second one silently.
 */
export function isCrossAppDuplicate(
  candidate: DetectionRef,
  others: DetectionRef[],
  windowMs: number = CROSS_APP_WINDOW_MS
): boolean {
  return others.some(
    (other) =>
      other.packageId !== candidate.packageId &&
      other.amount === candidate.amount &&
      Math.abs(other.postedAt - candidate.postedAt) < windowMs
  );
}
