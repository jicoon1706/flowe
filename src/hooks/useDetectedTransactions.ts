import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import * as FloweNotifications from '../../modules/flowe-notifications';
import { sourceAccounts } from '../lib/detectPreferences';
import {
  processQueue,
  fileDetected,
  onQueueChanged,
  type DetectedTransaction,
  type SaveOverrides,
} from '../services/autoFile';

export type { DetectedTransaction, SaveOverrides } from '../services/autoFile';

/**
 * The app's view of the auto-detect queue: files what it can on every
 * foreground and hands back the rest — as a floating island the moment it
 * lands, and as the "needs your input" list on Home for as long as it stays
 * unfiled.
 *
 * The filing itself lives in `services/autoFile.ts`, shared with the headless
 * task that does the same job while Flowe is closed. This hook only adds the
 * React state around it.
 */
export function useDetectedTransactions(userId: string | undefined, accounts: any[]) {
  // Everything unfiled, in the order it arrived. This is what Home lists.
  const [pending, setPending] = useState<DetectedTransaction[]>([]);
  // Detections the island has shown and timed out of. The capture itself stays
  // queued — it's still in the shade and in the Home list — this only stops the
  // island from hovering over the user indefinitely.
  const [snoozedIds, setSnoozedIds] = useState<ReadonlySet<string>>(() => new Set());
  const accountsRef = useRef(accounts);
  accountsRef.current = accounts;

  const save = useCallback(
    async (detected: DetectedTransaction, overrides: SaveOverrides) => {
      if (!userId) return { ok: false as const };
      const result = await fileDetected(userId, detected, overrides);
      if (result.ok) setPending((prev) => prev.filter((p) => p.id !== detected.id));
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
   * island times out: the payment is still unfiled, still in the shade and
   * still listed on Home, so the user can come back to it — the island just
   * stops nagging about it on this visit.
   */
  const snooze = useCallback((id: string) => {
    setSnoozedIds((prev) => new Set(prev).add(id));
  }, []);

  const refresh = useCallback(async () => {
    // A simulated capture keeps the flow alive where there is no native module
    // to report itself available — Expo Go, and the simulator.
    const live = FloweNotifications.isAvailable && FloweNotifications.isEnabled();
    if (!live && !FloweNotifications.hasDevCaptures()) {
      setPending([]);
      return;
    }
    if (!userId) return;

    // Every foreground is a chance to notice the listener has been dropped
    // (an app update does it, and Android won't rebind on its own) and get it
    // back before the next payment goes unread.
    if (live) FloweNotifications.ensureListenerBound();

    // Read before parsing: which account an app's payments belong to is part of
    // resolving them, and it changes from the settings screen mid-session.
    const defaults = await sourceAccounts.all();
    const { pending: stillPending } = await processQueue({
      userId,
      accounts: accountsRef.current,
      defaults,
    });

    const ids = new Set(stillPending.map((d) => d.id));
    // A capture that's gone (saved elsewhere, or pruned) shouldn't keep its
    // snooze around, or an id reuse would silently hide a live detection.
    setSnoozedIds((prev) => {
      const next = new Set([...prev].filter((id) => ids.has(id)));
      return next.size === prev.size ? prev : next;
    });
    setPending(stillPending);
  }, [userId]);

  useEffect(() => {
    refresh();

    const subscription = FloweNotifications.addCaptureListener(() => { refresh(); });
    // The headless task may have filed something while the app sat in the
    // background — re-read so the island and the list drop it.
    const unsubscribeQueue = onQueueChanged(() => { refresh(); });
    // Answering from the shade happens while Flowe is backgrounded, so the
    // queue is re-read whenever the app comes forward.
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      // Coming back to Flowe — often by tapping the very notification that was
      // left in the shade — is a fresh chance to deal with it, so timed-out
      // detections are offered again.
      setSnoozedIds(new Set());
      refresh();
    });

    return () => {
      subscription?.remove();
      unsubscribeQueue();
      appStateSub.remove();
    };
  }, [refresh]);

  // The one detection the island should be hovering with right now: the oldest
  // unfiled one the user hasn't already waved away this visit.
  const prompt = pending.find((item) => !snoozedIds.has(item.id)) ?? null;

  return { pending, prompt, save, dismiss, snooze, refresh };
}
