import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';
import type { EventSubscription } from 'expo-modules-core';

/** One raw notification the listener service captured, straight from Android. */
export interface CapturedNotification {
  id: string;
  packageName: string;
  title: string;
  text: string;
  /** Epoch millis Android posted it — this is the transaction's real time. */
  postedAt: number;
  /** Set when the user answered the quick-capture notification from the shade. */
  chosenType?: 'expense' | 'income' | null;
  chosenName?: string | null;
}

interface FloweNotificationsNativeModule {
  isPermissionGranted(): boolean;
  isListenerConnected(): boolean;
  ensureListenerBound(): void;
  openSettings(): void;
  isEnabled(): boolean;
  setEnabled(enabled: boolean): void;
  getWatchedPackages(): string[];
  setWatchedPackages(packages: string[]): void;
  getInstalledPackages(packages: string[]): string[];
  getCaptures(): CapturedNotification[];
  removeCapture(id: string): void;
  clearCaptures(): void;
  setDailyBudget(budget: number | null): void;
  setSpentToday(spent: number, date: string): void;
  getBudgetSnapshot(): BudgetSnapshot;
  recordBudgetExpense(amount: number): void;
  refreshBudgetWidget(): void;
  isBudgetWidgetPinned(): boolean;
  canRequestBudgetWidget(): boolean;
  requestBudgetWidget(): boolean;
  addListener(event: 'onCapture', listener: (capture: CapturedNotification) => void): EventSubscription;
}

/** What the native side currently believes about today's budget. */
export interface BudgetSnapshot {
  budget: number | null;
  spent: number;
  /** Local 'YYYY-MM-DD' that `spent` belongs to. */
  date: string | null;
}

// Android-only: iOS gives no app any way to read another app's notifications.
// `requireOptionalNativeModule` also keeps Expo Go and web working — the feature
// simply reports itself unavailable there instead of crashing on import.
const native = Platform.OS === 'android'
  ? requireOptionalNativeModule<FloweNotificationsNativeModule>('FloweNotifications')
  : null;

export const isAvailable = native !== null;

export function isPermissionGranted(): boolean {
  return native?.isPermissionGranted() ?? false;
}

/**
 * Whether Android is actually delivering notifications to the listener right
 * now. Access can be granted and this still be false — the system drops the
 * binding after an app update or force-stop and doesn't always restore it —
 * which is exactly when alerts silently go unread.
 */
export function isListenerConnected(): boolean {
  return native?.isListenerConnected() ?? false;
}

/**
 * Asks Android to bind the listener again if access is granted but the binding
 * has lapsed. A no-op when it's already connected, so it's safe to call on
 * every foreground.
 */
export function ensureListenerBound(): void {
  native?.ensureListenerBound();
}

/** Opens the system "Notification access" screen — the only way to grant this. */
export function openSettings(): void {
  native?.openSettings();
}

export function isEnabled(): boolean {
  return native?.isEnabled() ?? false;
}

export function setEnabled(enabled: boolean): void {
  native?.setEnabled(enabled);
}

export function getWatchedPackages(): string[] {
  return native?.getWatchedPackages() ?? [];
}

export function setWatchedPackages(packages: string[]): void {
  native?.setWatchedPackages(packages);
}

/**
 * Of `packages`, the ones installed on this phone. Off-Android (or without a
 * dev build) nothing is knowable, so every package is reported as installed and
 * the UI stays unrestricted rather than greying everything out.
 */
export function getInstalledPackages(packages: string[]): string[] {
  return native?.getInstalledPackages(packages) ?? packages;
}

export function getCaptures(): CapturedNotification[] {
  // Simulated captures first: in Expo Go they are the only ones there are.
  return [...devQueue, ...(native?.getCaptures() ?? [])];
}

export function removeCapture(id: string): void {
  const devIndex = devQueue.findIndex((c) => c.id === id);
  if (devIndex !== -1) {
    devQueue.splice(devIndex, 1);
    return;
  }
  native?.removeCapture(id);
}

export function clearCaptures(): void {
  native?.clearCaptures();
}

// ─── Daily budget widget ────────────────────────────────────────────────────
// A 2x2 home-screen widget showing how much of today's budget is left: a ring
// that drains as the day goes on, the figure in the middle, "spent of budget"
// underneath. Unlike the live update it replaced, it doesn't wait for Flowe to
// catch a payment and it doesn't go away — it's on screen every unlock.
//
// The native side holds its own copy of the budget and of today's spend, so it
// still draws correctly with the app closed, and a payment answered from the
// notification shade moves the ring immediately.

/** Stores the budget natively and redraws; null puts the widget in its "set a budget" state. */
export function setDailyBudget(budget: number | null): void {
  native?.setDailyBudget(budget);
}

/** Today's spend so far, as computed from the real transactions. */
export function setSpentToday(spent: number, date: string): void {
  native?.setSpentToday(spent, date);
}

export function getBudgetSnapshot(): BudgetSnapshot {
  return native?.getBudgetSnapshot() ?? { budget: null, spent: 0, date: null };
}

/**
 * Adds an expense to today's running total and redraws the widget. Only ever
 * called for payments dated today.
 */
export function recordBudgetExpense(amount: number): void {
  native?.recordBudgetExpense(amount);
}

/** Redraws from what's already stored — cheap, and a no-op with no widget placed. */
export function refreshBudgetWidget(): void {
  native?.refreshBudgetWidget();
}

/** Whether the user has actually put the widget on their home screen. */
export function isBudgetWidgetPinned(): boolean {
  return native?.isBudgetWidgetPinned() ?? false;
}

/**
 * Whether the launcher will accept an in-app request to add the widget. Most
 * have since Android 8; the ones that haven't leave the long-press → Widgets
 * route, which is what Settings falls back to explaining.
 */
export function canRequestBudgetWidget(): boolean {
  return native?.canRequestBudgetWidget() ?? false;
}

/**
 * Asks the launcher to offer the widget for placement. The user still decides
 * where it goes — or whether it goes at all. False means the launcher refused
 * to even ask.
 */
export function requestBudgetWidget(): boolean {
  return native?.requestBudgetWidget() ?? false;
}

/** Fires while the app is running; anything captured while it wasn't is in `getCaptures()`. */
export function addCaptureListener(
  listener: (capture: CapturedNotification) => void
): EventSubscription | null {
  const nativeSub = native?.addListener('onCapture', listener) ?? null;
  if (!__DEV__) return nativeSub;
  // Without this a simulated capture would sit in the queue until something
  // else happened to refresh — the point is to watch it land immediately.
  devListeners.add(listener);
  return {
    remove() {
      nativeSub?.remove();
      devListeners.delete(listener);
    },
  } as EventSubscription;
}

// ─── Simulated captures (development only) ──────────────────────────────────
// Expo Go has no native module, so a real detection can never arrive there and
// the whole flow is untestable without a dev build on a phone that actually
// receives bank alerts. Injecting a capture here runs the *real* pipeline —
// parse, account resolution, the auto-save rule, the island, the Supabase
// write — with only the Android listener faked.
//
// Every entry point is behind `__DEV__`, and the queue is empty in release, so
// `getCaptures()` behaves exactly as before once the app is built for
// production.

const devQueue: CapturedNotification[] = [];
const devListeners = new Set<(capture: CapturedNotification) => void>();

/** True while a simulated capture is waiting — lets callers run the flow without a native module. */
export function hasDevCaptures(): boolean {
  return __DEV__ && devQueue.length > 0;
}

export interface DevCaptureInput {
  packageName: string;
  title: string;
  text: string;
  /** Defaults to now; set it to test how a payment is dated. */
  postedAt?: number;
}

/** Pushes a fake bank alert into the queue as though Android had just posted it. */
export function injectDevCapture(input: DevCaptureInput): CapturedNotification | null {
  if (!__DEV__) return null;
  const capture: CapturedNotification = {
    id: `dev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    packageName: input.packageName,
    title: input.title,
    text: input.text,
    postedAt: input.postedAt ?? Date.now(),
  };
  devQueue.push(capture);
  devListeners.forEach((listener) => listener(capture));
  return capture;
}

/** Drops anything simulated that hasn't been filed or dismissed yet. */
export function clearDevCaptures(): void {
  devQueue.length = 0;
}
