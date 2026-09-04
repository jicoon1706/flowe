import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
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
import { notify, formatRM } from '../services/notifications';

/** A capture that parsed cleanly and is waiting for the user to confirm it. */
export interface DetectedTransaction {
  id: string;
  parsed: ParsedNotification;
  /** App the alert came from, e.g. 'Setel'. */
  sourceLabel: string;
  /** Account we matched, or undefined when the user has to choose. */
  accountId?: string;
  /** Name the user typed into the notification, when they answered from the shade. */
  suggestedName?: string;
}

/** What the transaction would be called if nobody edits it. */
function detectedName(item: DetectedTransaction): string {
  return item.suggestedName || item.parsed.merchant || item.sourceLabel;
}

function refFor(item: DetectedTransaction): DetectionRef {
  return {
    packageId: item.parsed.packageId,
    amount: item.parsed.amount,
    postedAt: item.parsed.postedAt,
  };
}

/**
 * Drives the auto-detect flow: reads what the Android listener queued, parses
 * it, files everything it can read with confidence, and hands back the rest for
 * the in-app island to confirm.
 *
 * Filing without asking is the default — the user already made the payment, so
 * a second confirmation is a chore, not a safeguard. `shouldAutoSave` is what
 * keeps that honest: it only lets through detections where every field was read
 * out of the alert rather than guessed.
 *
 * Captures survive in native storage until they're written to Supabase, because
 * the listener runs with no session — the app is the only place that can post.
 */
export function useDetectedTransactions(userId: string | undefined, accounts: any[]) {
  const [pending, setPending] = useState<DetectedTransaction[]>([]);
  // Guards against a capture being written twice when a foreground event and
  // the live listener deliver it at the same moment.
  const savingRef = useRef<Set<string>>(new Set());
  // Detections the island has shown and timed out of. The capture itself stays
  // queued — the Android notification is still sitting in the shade — this only
  // stops the in-app island from hovering over the user indefinitely.
  const snoozedRef = useRef<Set<string>>(new Set());
  const accountsRef = useRef(accounts);
  accountsRef.current = accounts;
  const defaultsRef = useRef<SourceAccountDefaults>({});
  // Payments filed in this session, so a second app's alert for the same one
  // is still recognised as a duplicate after the first has left the queue.
  const savedRefs = useRef<DetectionRef[]>([]);

  const toDetected = useCallback((capture: CapturedNotification): DetectedTransaction | null => {
    const parsed = parseTransactionNotification({
      packageName: capture.packageName,
      title: capture.title,
      text: capture.text,
      postedAt: capture.postedAt,
    });
    if (!parsed) return null;
    // The shade also offers "Ignore", which the native side handles by deleting
    // the capture outright — so it should never arrive here. Guarded anyway:
    // anything that isn't one of the two real types must not become one.
    const answered =
      capture.chosenType === 'expense' || capture.chosenType === 'income'
        ? capture.chosenType
        : undefined;
    return {
      id: capture.id,
      parsed: answered ? { ...parsed, type: answered, typeConfident: true } : parsed,
      sourceLabel: sourceForPackage(capture.packageName)?.label ?? capture.packageName,
      accountId: resolveDetectedAccount(parsed, accountsRef.current, defaultsRef.current),
      suggestedName: capture.chosenName ?? undefined,
    };
  }, []);

  const save = useCallback(
    async (detected: DetectedTransaction, overrides: { name: string; type: 'expense' | 'income'; accountId: string; category?: string }) => {
      if (!userId) return { ok: false as const };
      if (savingRef.current.has(detected.id)) return { ok: false as const };
      savingRef.current.add(detected.id);

      const isIncome = overrides.type === 'income';
      const result = await transactionsRepository.create({
        user_id: userId,
        type: overrides.type,
        name: overrides.name,
        amount: detected.parsed.amount,
        category: overrides.category,
        from_account_id: isIncome ? undefined : overrides.accountId,
        to_account_id: isIncome ? overrides.accountId : undefined,
        // The alert's post time is when the payment happened, so the transaction
        // is dated then rather than whenever Flowe next opened.
        date: localYMD(new Date(detected.parsed.postedAt)),
        note: `Auto-detected from ${detected.sourceLabel}`,
      });

      savingRef.current.delete(detected.id);

      if (result.ok) {
        FloweNotifications.removeCapture(detected.id);
        setPending((prev) => prev.filter((p) => p.id !== detected.id));

        // Remember what was just filed, so the same payment announced by a
        // second app a minute later isn't filed again behind the user's back.
        const now = Date.now();
        savedRefs.current = [...savedRefs.current, refFor(detected)].filter(
          (r) => now - r.postedAt < CROSS_APP_WINDOW_MS * 2
        );

        // The user picking an account we couldn't work out is the only new
        // information here — remember it, and this app stops asking.
        if (!detected.accountId) {
          const next = await sourceAccounts.learn(detected.parsed.packageId, overrides.accountId);
          defaultsRef.current = next;
        }

        notify({
          type: overrides.type,
          emoji: isIncome ? '💰' : '🧾',
          message: `${isIncome ? 'Income' : 'Expense'} added automatically`,
          sub_text: `${overrides.name} • ${formatRM(detected.parsed.amount)} from ${detected.sourceLabel}`,
          related_entity_id: result.data.id,
        });
      }
      return result;
    },
    [userId]
  );

  const dismiss = useCallback((id: string) => {
    FloweNotifications.removeCapture(id);
    setPending((prev) => prev.filter((p) => p.id !== id));
  }, []);

  /**
   * Hides a detection from the island without discarding it. Used when the
   * island times out: the payment is still unfiled and its notification is
   * still in the shade, so the user can come back to it there — the app just
   * stops nagging about it on this visit.
   */
  const snooze = useCallback((id: string) => {
    snoozedRef.current.add(id);
    setPending((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const refresh = useCallback(async () => {
    // A simulated capture keeps the flow alive where there is no native module
    // to report itself available — Expo Go, and the simulator.
    const live = FloweNotifications.isAvailable && FloweNotifications.isEnabled();
    if (!live && !FloweNotifications.hasDevCaptures()) {
      setPending([]);
      return;
    }

    // Read before parsing: which account an app's payments belong to is part of
    // resolving them, and it changes from the settings screen mid-session.
    defaultsRef.current = await sourceAccounts.all();

    const captures = FloweNotifications.getCaptures();
    const detected = captures
      .map(toDetected)
      .filter((d): d is DetectedTransaction => d !== null);

    // Drop captures that parsed as nothing so the queue doesn't grow forever.
    const parsedIds = new Set(detected.map((d) => d.id));
    captures.forEach((c) => {
      if (!parsedIds.has(c.id)) FloweNotifications.removeCapture(c.id);
    });

    const stillPending: DetectedTransaction[] = [];
    for (const item of detected) {
      const shadeAnswer = captures.find((c) => c.id === item.id)?.chosenType;
      const answered = shadeAnswer === 'expense' || shadeAnswer === 'income' ? shadeAnswer : undefined;
      const type = answered ?? item.parsed.type;
      const name = detectedName(item);
      // Filed without the user seeing a form, so the merchant's usual category
      // is the only guess available — better than none at all.
      const category = type === 'expense' ? merchantCategory(name) : undefined;

      // Everything else this payment could be confused with: the rest of the
      // queue, plus what has already been filed in this session.
      const others = [
        ...detected.filter((d) => d.id !== item.id).map(refFor),
        ...savedRefs.current,
      ];
      const duplicate = isCrossAppDuplicate(refFor(item), others);

      // Answered from the shade *and* we know the account: the user has spoken,
      // so file it. Otherwise fall back to the auto-save rule, which is what
      // lets a payment be recorded with no interaction at all.
      const answeredAndPlaced = !!answered && !!item.accountId;
      const confident =
        !duplicate &&
        shouldAutoSave({ parsed: item.parsed, accountId: item.accountId, category });

      if (answeredAndPlaced || confident) {
        const result = await save(item, {
          name,
          type,
          accountId: item.accountId!,
          category,
        });
        if (result.ok) continue;
      }
      stillPending.push(item);
    }
    // A capture that's gone (saved elsewhere, or pruned) shouldn't keep its
    // snooze around, or an id reuse would silently hide a live detection.
    snoozedRef.current.forEach((id) => {
      if (!parsedIds.has(id)) snoozedRef.current.delete(id);
    });
    setPending(stillPending.filter((item) => !snoozedRef.current.has(item.id)));
  }, [toDetected, save]);

  useEffect(() => {
    refresh();

    const subscription = FloweNotifications.addCaptureListener(() => { refresh(); });
    // Answering from the shade happens while Flowe is backgrounded, so the
    // queue is re-read whenever the app comes forward.
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      // Coming back to Flowe — often by tapping the very notification that was
      // left in the shade — is a fresh chance to deal with it, so timed-out
      // detections are offered again.
      snoozedRef.current.clear();
      refresh();
    });

    return () => {
      subscription?.remove();
      appStateSub.remove();
    };
  }, [refresh]);

  return { pending, save, dismiss, snooze, refresh };
}
