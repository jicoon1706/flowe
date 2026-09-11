import * as FloweNotifications from '../../modules/flowe-notifications';
import type { CapturedNotification } from '../../modules/flowe-notifications';
import {
  parseTransactionNotification,
  type ParsedNotification,
} from '../utils/parseTransactionNotification';
import { sourceForPackage } from '../../constants/notificationSources';
import { localYMD } from '../utils/date';
import {
  resolveDetectedAccount,
  type SourceAccountDefaults,
} from '../utils/resolveDetectedAccount';
import {
  shouldAutoSave,
  isCrossAppDuplicate,
  CROSS_APP_WINDOW_MS,
  type DetectionRef,
} from '../utils/shouldAutoSave';
import { sourceAccounts } from '../lib/detectPreferences';
import { merchantCategory } from '../utils/merchantLogo';
import { transactionsRepository } from '../repositories/transactions.repository';
import { notify, formatRM } from './notifications';

/**
 * Filing payments Flowe caught in bank / e-wallet notifications.
 *
 * This is the one implementation of "read the queue, file what needs no one,
 * hand back the rest". It runs in two places: inside the app, driven by
 * `useDetectedTransactions`, and inside the headless task Android wakes when
 * a capture is answered from the shade or arrives while Flowe is closed
 * (`autoFileTask.ts`). Both can be alive at once — the app backgrounded but
 * not killed — so anything that guards against double-filing lives here, at
 * module level, where both callers share it.
 *
 * Filing without asking is the default: the user already made the payment, a
 * second confirmation is a chore. `shouldAutoSave` keeps that honest by only
 * letting through detections where every field was read, not guessed.
 */

/** A capture that parsed cleanly and is waiting to be filed or completed. */
export interface DetectedTransaction {
  id: string;
  parsed: ParsedNotification;
  /** App the alert came from, e.g. 'Setel'. */
  sourceLabel: string;
  /** Account we matched, or undefined when the user has to choose. */
  accountId?: string;
  /** Name the user typed into the notification, when they answered from the shade. */
  suggestedName?: string;
  /**
   * The user already said Expense/Income from the shade. The daily-budget
   * live update was shown natively at that moment, so filing it must not
   * show it a second time.
   */
  answeredFromShade: boolean;
}

export interface SaveOverrides {
  name: string;
  type: 'expense' | 'income';
  accountId: string;
  category?: string;
}

export interface AutoFileContext {
  userId: string;
  accounts: any[];
  defaults: SourceAccountDefaults;
}

/** What the transaction would be called if nobody edits it. */
export function detectedName(item: DetectedTransaction): string {
  return item.suggestedName || item.parsed.merchant || item.sourceLabel;
}

function refFor(item: DetectedTransaction): DetectionRef {
  return {
    packageId: item.parsed.packageId,
    amount: item.parsed.amount,
    postedAt: item.parsed.postedAt,
  };
}

// ─── Shared state across the app and the headless task ─────────────────────

// Captures with a write in flight. A foreground refresh and the headless task
// can both read the queue in the same instant; the first to claim an id files
// it, the other skips it.
const inFlight = new Set<string>();

// Payments filed in this JS runtime, so a second app's alert for the same one
// is still recognised as a duplicate after the first has left the queue.
let savedRefs: DetectionRef[] = [];

// The hook wants to know when the headless task has changed the queue under
// it, so the island and the Home list don't keep showing a filed payment.
const listeners = new Set<() => void>();

export function onQueueChanged(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function emitQueueChanged() {
  listeners.forEach((l) => { try { l(); } catch {} });
}

// ─── Parsing ────────────────────────────────────────────────────────────────

export function toDetected(
  capture: CapturedNotification,
  accounts: any[],
  defaults: SourceAccountDefaults
): DetectedTransaction | null {
  // The shade also offers "Ignore", which the native side handles by deleting
  // the capture outright — so it should never arrive here. Guarded anyway:
  // anything that isn't one of the two real types must not become one.
  const answered =
    capture.chosenType === 'expense' || capture.chosenType === 'income'
      ? capture.chosenType
      : undefined;
  const parsed = parseTransactionNotification({
    packageName: capture.packageName,
    title: capture.title,
    text: capture.text,
    postedAt: capture.postedAt,
    // The user has already called it a transaction from the shade; the
    // parser must not overrule them and quietly drop their answer.
    confirmed: !!answered,
  });
  if (!parsed) return null;
  return {
    id: capture.id,
    parsed: answered ? { ...parsed, type: answered, typeConfident: true } : parsed,
    sourceLabel: sourceForPackage(capture.packageName)?.label ?? capture.packageName,
    accountId: resolveDetectedAccount(parsed, accounts, defaults),
    suggestedName: capture.chosenName ?? undefined,
    answeredFromShade: !!answered,
  };
}

// ─── Deciding ───────────────────────────────────────────────────────────────

/**
 * The values to file this detection with if it needs no one — or null when
 * the user has to complete it.
 *
 * Two ways through. Answered from the shade *and* the account is known: the
 * user has spoken, so it's filed under "Others" if the merchant isn't one we
 * know, so the row is complete rather than blank. Otherwise the auto-save
 * rule, which is what lets a payment be recorded with no interaction at all —
 * and which refuses to guess a category.
 */
export function decide(item: DetectedTransaction, others: DetectionRef[]): SaveOverrides | null {
  const type = item.parsed.type;
  const name = detectedName(item);
  const guessed = type === 'expense' ? merchantCategory(name) : undefined;

  const answeredAndPlaced = item.answeredFromShade && !!item.accountId;
  const confident =
    !isCrossAppDuplicate(refFor(item), others) &&
    shouldAutoSave({ parsed: item.parsed, accountId: item.accountId, category: guessed });

  if (!answeredAndPlaced && !confident) return null;
  return {
    name,
    type,
    accountId: item.accountId!,
    category: type === 'expense' ? guessed ?? 'others' : undefined,
  };
}

// ─── Filing ─────────────────────────────────────────────────────────────────

/**
 * Writes one detection to Supabase and retires its capture. Safe to call from
 * two places at once for the same id — the second call returns `ok: false`.
 */
export async function fileDetected(
  userId: string,
  detected: DetectedTransaction,
  values: SaveOverrides
): Promise<{ ok: true; data: { id: string } } | { ok: false }> {
  if (inFlight.has(detected.id)) return { ok: false };
  // Already filed by the other runtime and pulled from the queue.
  if (!FloweNotifications.getCaptures().some((c) => c.id === detected.id)) return { ok: false };
  inFlight.add(detected.id);

  try {
    const isIncome = values.type === 'income';
    const result = await transactionsRepository.create({
      user_id: userId,
      type: values.type,
      name: values.name,
      amount: detected.parsed.amount,
      category: values.category,
      from_account_id: isIncome ? undefined : values.accountId,
      to_account_id: isIncome ? values.accountId : undefined,
      // The alert's post time is when the payment happened, so the transaction
      // is dated then rather than whenever Flowe next ran.
      date: localYMD(new Date(detected.parsed.postedAt)),
      note: `Auto-detected from ${detected.sourceLabel}`,
    });
    if (!result.ok) return { ok: false };

    FloweNotifications.removeCapture(detected.id);

    // Remember what was just filed, so the same payment announced by a
    // second app a minute later isn't filed again behind the user's back.
    const now = Date.now();
    savedRefs = [...savedRefs, refFor(detected)].filter(
      (r) => now - r.postedAt < CROSS_APP_WINDOW_MS * 2
    );

    // The user picking an account we couldn't work out is the only new
    // information here — remember it, and this app stops asking.
    if (!detected.accountId) {
      await sourceAccounts.learn(detected.parsed.packageId, values.accountId);
    }

    // An outside-app expense moves today's budget: show the live update.
    // A shade answer already did this natively the moment it was tapped,
    // and the payment is dated by the alert, so only today's count.
    if (
      !isIncome &&
      !detected.answeredFromShade &&
      localYMD(new Date(detected.parsed.postedAt)) === localYMD(new Date())
    ) {
      FloweNotifications.recordBudgetExpense(detected.parsed.amount);
    }

    notify({
      type: values.type,
      emoji: isIncome ? '💰' : '🧾',
      message: `${isIncome ? 'Income' : 'Expense'} added automatically`,
      sub_text: `${values.name} • ${formatRM(detected.parsed.amount)} from ${detected.sourceLabel}`,
      related_entity_id: result.data.id,
    });

    return { ok: true, data: { id: result.data.id } };
  } finally {
    inFlight.delete(detected.id);
  }
}

// ─── The whole queue ────────────────────────────────────────────────────────

export interface ProcessResult {
  /** Filed on this pass, with no one asked. */
  filed: DetectedTransaction[];
  /** Still waiting on the user. */
  pending: DetectedTransaction[];
}

/**
 * Reads everything the listener queued, prunes what isn't a transaction,
 * files what needs no one, and returns the rest.
 */
export async function processQueue(ctx: AutoFileContext): Promise<ProcessResult> {
  const captures = FloweNotifications.getCaptures();
  const detected = captures
    .map((c) => toDetected(c, ctx.accounts, ctx.defaults))
    .filter((d): d is DetectedTransaction => d !== null);

  // Drop captures that parsed as nothing so the queue doesn't grow forever.
  const parsedIds = new Set(detected.map((d) => d.id));
  captures.forEach((c) => {
    if (!parsedIds.has(c.id)) FloweNotifications.removeCapture(c.id);
  });

  const filed: DetectedTransaction[] = [];
  const pending: DetectedTransaction[] = [];
  for (const item of detected) {
    // Everything else this payment could be confused with: the rest of the
    // queue, plus what has already been filed in this runtime.
    const others = [
      ...detected.filter((d) => d.id !== item.id).map(refFor),
      ...savedRefs,
    ];
    const values = decide(item, others);
    if (values) {
      const result = await fileDetected(ctx.userId, item, values);
      if (result.ok) { filed.push(item); continue; }
      // Claimed by the other runtime mid-pass, or gone — either way not ours
      // to show as pending if it no longer exists.
      if (!FloweNotifications.getCaptures().some((c) => c.id === item.id)) continue;
    }
    pending.push(item);
  }

  if (filed.length > 0) emitQueueChanged();
  return { filed, pending };
}
