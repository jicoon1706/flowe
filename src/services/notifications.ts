import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { supabase } from '../lib/supabase';
import { notificationsRepository } from '../repositories/notifications.repository';
import type { NotificationType } from '../types';

// Show a banner even when the app is in the foreground (the common case here,
// since transactions are added while the app is open).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let permissionGranted: boolean | null = null;

/**
 * Request OS notification permission and register the Android channel. Safe to
 * call multiple times — the permission check is cached after the first grant.
 * Call once on app start.
 */
export async function setupNotifications(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#C5FF00',
    });
  }

  const settings = await Notifications.getPermissionsAsync();
  let status = settings.status;
  if (status !== 'granted') {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  permissionGranted = status === 'granted';
  return permissionGranted;
}

/**
 * Fire an immediate local notification (OS banner). Ensures permission first so
 * callers don't have to. Never throws — notification failures shouldn't break
 * the action that triggered them.
 */
export async function presentLocalNotification(title: string, body: string): Promise<void> {
  try {
    if (permissionGranted === null) await setupNotifications();
    if (!permissionGranted) return;
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: null, // null = deliver immediately
    });
  } catch (e) {
    console.warn('[notifications] failed to present:', e);
  }
}

/** Format a number as a Malaysian Ringgit amount, e.g. 1234.5 -> "RM 1,234.50". */
export function formatRM(value: number): string {
  return `RM ${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

/**
 * Record a notification for an app event: writes the in-app entry (bell screen)
 * AND fires the OS banner. Best-effort — any failure is logged, never thrown, so
 * it can't break the action that triggered it. The user id is resolved from the
 * current session so callers don't need to pass it.
 */
export async function notify(params: {
  type: NotificationType;
  emoji: string;
  message: string;
  sub_text?: string;
  related_entity_id?: string;
}): Promise<void> {
  // Banner first — it's local and shouldn't wait on the network round-trip.
  presentLocalNotification(`${params.emoji} ${params.message}`, params.sub_text ?? '');
  try {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id;
    if (!userId) return;
    await notificationsRepository.create({
      user_id: userId,
      type: params.type,
      emoji: params.emoji,
      message: params.message,
      sub_text: params.sub_text,
      is_read: false,
      related_entity_id: params.related_entity_id,
    });
  } catch (e) {
    console.warn('[notifications] failed to record:', e);
  }
}
