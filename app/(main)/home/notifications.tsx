import { useCallback, useMemo } from 'react';
import { hrefForNotification } from '@/src/lib/notificationRules';
import { RefreshControl, View } from 'react-native';
import { Pressable } from '@/components/ui/Pressable';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import {
  ArrowDownRight, ArrowUpDown, ArrowUpRight, Bell, BookOpen, ChartPie, Check, Gauge, Landmark, RefreshCw, Repeat, Sparkles, Target, TrendingUp, type LucideIcon,
} from 'lucide-react-native';
import { colors, radius } from '@/theme/tokens';
import { EmptyState } from '@/components/ui/EmptyState';
import { GlassIconButton } from '@/components/ui/GlassIconButton';
import { HeroScreen } from '@/components/ui/HeroScreen';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { TopBar } from '@/components/ui/TopBar';
import { useToast } from '@/components/ui/ToastProvider';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/src/hooks/useNotifications';
import type { Notification, NotificationType } from '@/src/types';

const ICON: Record<NotificationType, LucideIcon> = {
  expense: ArrowDownRight, income: ArrowUpRight, transfer: ArrowUpDown, recurring: Repeat, alert: Gauge,
  tabung: Target, milestone: Target, asset: TrendingUp, liability: Landmark, cashflow: ChartPie,
  note: BookOpen, affirmation: Sparkles, project: BookOpen,
};

/** Where tapping an alert goes (each alert opens its source; shared with the OS pushes). */
function sourceOf(n: Notification): Href {
  return hrefForNotification(n.type, n.related_entity_id) as Href;
}

function when(iso: string): string {
  const d = new Date(iso);
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return d.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', hour12: false });
  if (today.getTime() - d.getTime() < 6 * 86_400_000) return d.toLocaleDateString('en-MY', { weekday: 'short' });
  return d.toLocaleDateString('en-MY', { day: 'numeric', month: 'short' });
}

/** home/notifications — unread = weight 600 + black dot; ✓ marks all read; each row opens its source. */
export default function NotificationsScreen() {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const { notifications, loading, error, fetchNotifications, markAsRead, markAllRead } = useNotifications();
  useFocusEffect(useCallback(() => { fetchNotifications(); }, [fetchNotifications]));

  const groups = useMemo(() => {
    const today = new Date().toDateString();
    return [
      { title: 'Today', items: notifications.filter((n) => new Date(n.created_at).toDateString() === today) },
      { title: 'Earlier', items: notifications.filter((n) => new Date(n.created_at).toDateString() !== today) },
    ].filter((g) => g.items.length);
  }, [notifications]);
  const unread = notifications.some((n) => !n.is_read);

  const open = async (n: Notification) => {
    if (!n.is_read) markAsRead(n.id);
    router.push(sourceOf(n));
  };

  const markAll = async () => {
    if (!user) return;
    const res = await markAllRead(user.id);
    if (!res.ok) toast.failure('Couldn’t mark them read', { label: 'Retry', onPress: markAll });
  };

  const firstLoad = loading && notifications.length === 0;

  return (
    <HeroScreen
      contentWidth="form"
      heroHeight={164}
      refreshControl={<RefreshControl refreshing={loading && notifications.length > 0} onRefresh={fetchNotifications} tintColor={colors['on-primary']} />}
      hero={<TopBar title="Notifications" onBack={() => router.back()} right={<GlassIconButton icon={Check} accessibilityLabel="Mark all read" onPress={markAll} disabled={!unread} />} />}
      sheetPadding={{ top: 16 }}
    >
      {firstLoad ? (
        <View style={{ gap: 14 }} accessibilityLabel="Loading notifications">
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 12 }}>
              <Skeleton width={40} height={40} />
              <View style={{ flex: 1, gap: 6 }}><Skeleton width="70%" height={14} /><Skeleton width="90%" height={12} /></View>
            </View>
          ))}
        </View>
      ) : error && !notifications.length ? (
        <EmptyState icon={RefreshCw} title="Couldn’t load notifications" body="Check your connection and try again." ctaLabel="Try again" onCta={fetchNotifications} />
      ) : !notifications.length ? (
        <EmptyState icon={Bell} title="You’re all caught up" body="Detected payments, budget alerts and bills due show up here." />
      ) : (
        groups.map((g) => (
          <View key={g.title}>
            <Text variant="label-sm" tone="muted" accessibilityRole="header">{g.title}</Text>
            {g.items.map((n) => {
              const Icon = ICON[n.type] ?? Bell;
              return (
                <Pressable
                  key={n.id}
                  onPress={() => open(n)}
                  accessibilityRole="button"
                  accessibilityLabel={`${n.is_read ? '' : 'Unread. '}${n.message}. ${n.sub_text ?? ''}`}
                  style={({ pressed }) => ({ flexDirection: 'row', gap: 12, paddingVertical: 10, opacity: pressed ? 0.7 : 1 })}
                >
                  <View style={{ width: 40, height: 40, borderRadius: radius.full, backgroundColor: colors['surface-container'], alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={19} color={colors['on-surface']} strokeWidth={1.75} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text variant="body-md" size={15} weight={n.is_read ? 400 : 600}>{n.message}</Text>
                    {n.sub_text ? <Text variant="body-md" size={13} tone="muted">{n.sub_text}</Text> : null}
                    <Text variant="label-sm" tone="muted">{when(n.created_at)}</Text>
                  </View>
                  <View style={{ width: 8, height: 8, borderRadius: radius.full, marginTop: 6, backgroundColor: n.is_read ? 'transparent' : colors.secondary }} />
                </Pressable>
              );
            })}
          </View>
        ))
      )}
    </HeroScreen>
  );
}
