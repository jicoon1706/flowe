import { Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';
import { supabase } from '../lib/supabase';
import { notificationsRepository } from '../repositories/notifications.repository';
import { bannerAllowed, hrefForNotification, PUSH_ACTIONS, type PushCategory } from '../lib/notificationRules';
import { getNotificationSettings } from './notificationPrefs';
import { colors } from '../../theme/tokens';
import type { NotificationType } from '../types';

// OS notifications aren't supported in Expo Go on SDK 53+. Merely importing
// expo-notifications there auto-registers a device push-token listener, which
// logs a noisy "removed from Expo Go" error on Android. So in Expo Go we skip
// the module entirely (in-app notifications are still recorded) — OS banners
// require a development build. Outside Expo Go we lazy-load the module so that
// import side effect never runs in Expo Go.
const osNotificationsSupported = !isRunningInExpoGo();

type NotificationsModule = typeof import('expo-notifications');
let notificationsModule: NotificationsModule | null = null;
let handlerSet = false;

function getNotifications(): NotificationsModule | null {
  if (!osNotificationsSupported) return null;
  if (!notificationsModule) {
    notificationsModule = require('expo-notifications') as NotificationsModule;
  }
  if (!handlerSet) {
    handlerSet = true;
    // Show a banner even when the app is in the foreground (the common case
    // here, since transactions are added while the app is open).
    notificationsModule.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  }
  return notificationsModule;
}

let permissionGranted: boolean | null = null;

/** What a push carries besides its text: an action set and where a tap goes. */
export interface PushExtras {
  categoryId?: PushCategory;
  /** expo-router path opened by a tap on the body or an opening action. */
  href?: string;
}

function pushContent(title: string, body: string, extras?: PushExtras) {
  return {
    title,
    body,
    ...(extras?.categoryId ? { categoryIdentifier: extras.categoryId } : null),
    ...(extras?.href ? { data: { href: extras.href } } : null),
  };
}

/** Registers the canvas' action buttons (View, Open, Remind me later, Confirm all). */
async function registerCategories(Notifications: NotificationsModule): Promise<void> {
  await Promise.all(
    (Object.keys(PUSH_ACTIONS) as PushCategory[]).map((id) =>
      Notifications.setNotificationCategoryAsync(
        id,
        PUSH_ACTIONS[id].map((a) => ({ identifier: a.id, buttonTitle: a.title, options: { opensAppToForeground: a.opensApp } })),
      ),
    ),
  );
}

/**
 * Request OS notification permission and register the Android channel. Safe to
 * call multiple times — the permission check is cached after the first grant.
 * Call once on app start. A no-op (returns false) in Expo Go.
 */
export async function setupNotifications(): Promise<boolean> {
  const Notifications = getNotifications();
  if (!Notifications) {
    permissionGranted = false;
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: colors['primary-container'],
    });
  }
  try {
    await registerCategories(Notifications);
  } catch (e) {
    console.warn('[notifications] failed to register actions:', e);
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
 * the action that triggered them. A no-op in Expo Go.
 */
export async function presentLocalNotification(title: string, body: string, extras?: PushExtras): Promise<void> {
  try {
    if (permissionGranted === null) await setupNotifications();
    if (!permissionGranted) return;
    const Notifications = getNotifications();
    if (!Notifications) return;
    await Notifications.scheduleNotificationAsync({
      content: pushContent(title, body, extras),
      trigger: null, // null = deliver immediately
    });
  } catch (e) {
    console.warn('[notifications] failed to present:', e);
  }
}

/**
 * Schedule a local notification for a specific moment.
 *
 * `identifier` is the caller's own key, so re-scheduling the same thing
 * replaces it rather than stacking a second copy — which is what happens if you
 * let the OS assign ids and the app is opened twice before the trigger fires.
 * A time already past is dropped: the OS would otherwise fire it immediately,
 * which for a 5am reminder means waking someone at 11pm.
 *
 * Never throws. A no-op in Expo Go.
 */
export async function scheduleLocalNotificationAt(
  when: Date,
  title: string,
  body: string,
  identifier: string,
  extras?: PushExtras
): Promise<void> {
  try {
    if (when.getTime() <= Date.now()) return;
    if (permissionGranted === null) await setupNotifications();
    if (!permissionGranted) return;
    const Notifications = getNotifications();
    if (!Notifications) return;
    await Notifications.scheduleNotificationAsync({
      identifier,
      content: pushContent(title, body, extras),
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: when,
      },
    });
  } catch (e) {
    console.warn('[notifications] failed to schedule:', e);
  }
}

/**
 * Drop every notification this app scheduled whose identifier starts with
 * `prefix`. Used to clear a whole family of reminders before re-scheduling it,
 * so a rule the user paused or deleted doesn't still fire tomorrow morning.
 */
export async function cancelScheduledWithPrefix(prefix: string): Promise<void> {
  try {
    const Notifications = getNotifications();
    if (!Notifications) return;
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((n) => n.identifier.startsWith(prefix))
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
    );
  } catch (e) {
    console.warn('[notifications] failed to cancel scheduled:', e);
  }
}

/** The one RM formatter (lib/money), re-exported for the callers that import it from here. */
export { formatRM } from '../lib/money';

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
  /**
   * The OS push as the canvas draws it ("push · android · all 8 types"): a
   * plain title and body, an action set and a tap target. Without it the push
   * is "<emoji> <message>" / sub_text and opens the notification's source.
   */
  push?: { title: string; body: string } & PushExtras;
}): Promise<void> {
  // The OS banner follows Settings › Notifications (notif_* per type). The
  // in-app entry is the history behind the bell, so it is always written.
  // The switches are cached in memory, so this rarely waits on the network.
  const prefs = await getNotificationSettings();
  if (bannerAllowed(params.type, prefs)) {
    const href = params.push?.href ?? hrefForNotification(params.type, params.related_entity_id);
    if (params.push) await presentLocalNotification(params.push.title, params.push.body, { categoryId: params.push.categoryId, href });
    else await presentLocalNotification(`${params.emoji} ${params.message}`, params.sub_text ?? '', { href });
  }
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

export interface PushResponse {
  /** 'default' for a tap on the body, otherwise the action id (view, open, remind-later, confirm-all). */
  actionId: string;
  href?: string;
  title: string;
  body: string;
}

/**
 * Calls `handler` for every tap or action on a Flowe push, including the one
 * that launched the app. Returns the unsubscribe. A no-op in Expo Go.
 */
export function onPushResponse(handler: (r: PushResponse) => void): () => void {
  const Notifications = getNotifications();
  if (!Notifications) return () => {};
  const toResponse = (r: import('expo-notifications').NotificationResponse): PushResponse => {
    const c = r.notification.request.content;
    const href = typeof c.data?.href === 'string' ? c.data.href : undefined;
    const actionId = r.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER ? 'default' : r.actionIdentifier;
    return { actionId, href, title: c.title ?? '', body: c.body ?? '' };
  };
  const sub = Notifications.addNotificationResponseReceivedListener((r) => handler(toResponse(r)));
  Notifications.getLastNotificationResponseAsync()
    .then((r) => {
      if (r) {
        handler(toResponse(r));
        Notifications.clearLastNotificationResponseAsync?.().catch(() => {});
      }
    })
    .catch(() => {});
  return () => sub.remove();
}
