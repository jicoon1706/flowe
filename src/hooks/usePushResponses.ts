import { useEffect } from 'react';
import { useRouter, type Href } from 'expo-router';
import { onPushResponse, scheduleLocalNotificationAt } from '../services/notifications';
import { REMIND_LATER_MS } from '../lib/notificationRules';

/**
 * Taps and actions on Flowe's pushes (canvas "push · android · all 8 types"):
 * - body tap, View, Open → the push's own screen (`href`);
 * - Remind me later → the same reminder again in 3 hours, without opening Flowe;
 * - Confirm all → Home with the due-bills sheet open, every bill ticked.
 * Opening a locked route still asks for the PIN first (LockedRouteGuard).
 */
export function usePushResponses(): void {
  const router = useRouter();
  useEffect(() => onPushResponse((r) => {
    if (r.actionId === 'remind-later') {
      scheduleLocalNotificationAt(
        new Date(Date.now() + REMIND_LATER_MS),
        r.title,
        r.body,
        `flowe-recurring-later-${Date.now()}`,
        { categoryId: 'recurring-before', href: r.href },
      );
      return;
    }
    if (r.actionId === 'confirm-all') {
      router.navigate({ pathname: '/', params: { recurring: 'due' } });
      return;
    }
    if (r.href) router.push(r.href as Href);
  }), [router]);
}
