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
import { resolveDetectedAccount } from '../utils/resolveDetectedAccount';
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

/**
 * Drives the auto-detect flow: reads what the Android listener queued, parses
 * it, files anything the user already answered from the notification shade, and
 * hands back the rest for the in-app island to confirm.
 *
 * Captures survive in native storage until they're written to Supabase, because
 * the listener runs with no session — the app is the only place that can post.
 */
export function useDetectedTransactions(userId: string | undefined, accounts: any[]) {
  const [pending, setPending] = useState<DetectedTransaction[]>([]);
  // Guards against a capture being written twice when a foreground event and
  // the live listener deliver it at the same moment.
  const savingRef = useRef<Set<string>>(new Set());
  const accountsRef = useRef(accounts);
  accountsRef.current = accounts;

  const toDetected = useCallback((capture: CapturedNotification): DetectedTransaction | null => {
    const parsed = parseTransactionNotification({
      packageName: capture.packageName,
      title: capture.title,
      text: capture.text,
      postedAt: capture.postedAt,
    });
    if (!parsed) return null;
    return {
      id: capture.id,
      parsed: capture.chosenType ? { ...parsed, type: capture.chosenType } : parsed,
      sourceLabel: sourceForPackage(capture.packageName)?.label ?? capture.packageName,
      accountId: resolveDetectedAccount(parsed, accountsRef.current),
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

  const refresh = useCallback(async () => {
    if (!FloweNotifications.isAvailable || !FloweNotifications.isEnabled()) {
      setPending([]);
      return;
    }

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
      // Answered from the shade *and* we know the account: file it without
      // bothering the user — that's the "never open the app" path.
      const answered = captures.find((c) => c.id === item.id)?.chosenType;
      if (answered && item.accountId) {
        const result = await save(item, {
          name: item.suggestedName || item.parsed.merchant || item.sourceLabel,
          type: answered,
          accountId: item.accountId,
        });
        if (result.ok) continue;
      }
      stillPending.push(item);
    }
    setPending(stillPending);
  }, [toDetected, save]);

  useEffect(() => {
    refresh();

    const subscription = FloweNotifications.addCaptureListener(() => { refresh(); });
    // Answering from the shade happens while Flowe is backgrounded, so the
    // queue is re-read whenever the app comes forward.
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });

    return () => {
      subscription?.remove();
      appStateSub.remove();
    };
  }, [refresh]);

  return { pending, save, dismiss, refresh };
}
