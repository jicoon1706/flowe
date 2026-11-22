/**
 * Income split · months already fetched, shared by the split page, its
 * history strip and the Cashflow card, so revisiting a month is instant and
 * the strip and the page can never show different figures for one month.
 * Identical file in flowe-desktop/src/lib/services.
 *
 * - One income_split call per month at a time: concurrent asks share it.
 * - Dropped whole when any transaction is written (onTransactionsChanged),
 *   after Edit groups saves, and on reset / sign-out (clearIncomeSplitCache).
 *   Mounted hooks hear about it (subscribeIncomeSplits) and reload.
 * - Failures aren't cached; the next ask retries.
 * - Also holds the date of the user's first transaction (the earliest month
 *   the split page lets you step back to), dropped the same way.
 */
import { incomeSplitRepository } from '../repositories/incomeSplit.repository';
import { onTransactionsChanged, transactionsRepository } from '../repositories/transactions.repository';
import type { IncomeSplit } from '../types';
import type { SupabaseError } from '../utils/result';

export interface SplitEntry {
  data: IncomeSplit | null;
  error: SupabaseError | null;
}

const months = new Map<string, SplitEntry>();
const pending = new Map<string, Promise<SplitEntry>>();
let firstDate: Promise<string | null> | null = null;
let generation = 0;
const listeners = new Set<() => void>();
let unsubscribe: (() => void) | null = null;

function drop(): void {
  generation++;
  months.clear();
  pending.clear();
  firstDate = null;
}

/** Forget everything (reset all data, sign-out). Mounted hooks reload. */
export function clearIncomeSplitCache(): void {
  drop();
  listeners.forEach((l) => l());
}

/** Calls `listener` after every clear. Starts watching transaction writes on first use. */
export function subscribeIncomeSplits(listener: () => void): () => void {
  if (!unsubscribe) unsubscribe = onTransactionsChanged(clearIncomeSplitCache);
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

/** The cached answer for a month ('YYYY-MM-01'), without fetching. */
export function peekIncomeSplit(monthStart: string): SplitEntry | null {
  return months.get(monthStart) ?? null;
}

/** The month's split: from the cache, a request already on its way, or a new one. */
export function loadIncomeSplit(monthStart: string): Promise<SplitEntry> {
  const hit = months.get(monthStart);
  if (hit) return Promise.resolve(hit);
  const inFlight = pending.get(monthStart);
  if (inFlight) return inFlight;
  const gen = generation;
  const request = incomeSplitRepository.fetchSplit(monthStart).then((res): SplitEntry => {
    const entry = res.ok ? { data: res.data, error: null } : { data: null, error: res.error };
    // An answer that started before a clear may be stale: hand it back, don't keep it.
    if (gen === generation) {
      pending.delete(monthStart);
      if (res.ok) months.set(monthStart, entry);
    }
    return entry;
  });
  pending.set(monthStart, request);
  return request;
}

/** 'YYYY-MM-DD' of the user's earliest transaction, or null with none (or on a failed read). */
export function loadFirstTransactionDate(): Promise<string | null> {
  if (!firstDate) {
    const gen = generation;
    const request = transactionsRepository.fetchFirstDate().then((res) => {
      if (!res.ok && gen === generation) firstDate = null; // retry next time
      return res.ok ? res.data : null;
    });
    firstDate = request;
  }
  return firstDate;
}
