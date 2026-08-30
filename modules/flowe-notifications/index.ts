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
  openSettings(): void;
  isEnabled(): boolean;
  setEnabled(enabled: boolean): void;
  getWatchedPackages(): string[];
  setWatchedPackages(packages: string[]): void;
  getCaptures(): CapturedNotification[];
  removeCapture(id: string): void;
  clearCaptures(): void;
  addListener(event: 'onCapture', listener: (capture: CapturedNotification) => void): EventSubscription;
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

export function getCaptures(): CapturedNotification[] {
  return native?.getCaptures() ?? [];
}

export function removeCapture(id: string): void {
  native?.removeCapture(id);
}

export function clearCaptures(): void {
  native?.clearCaptures();
}

/** Fires while the app is running; anything captured while it wasn't is in `getCaptures()`. */
export function addCaptureListener(
  listener: (capture: CapturedNotification) => void
): EventSubscription | null {
  return native?.addListener('onCapture', listener) ?? null;
}
