import { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Bell, ChevronLeft } from '../../../components/ui/icons';
import { formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { useAuth } from '../../../context/AuthContext';
import { useNotifications } from '../../../src/hooks/useNotifications';
import { LoadingView } from '../../../components/ui/LoadingView';
import { ErrorView } from '../../../components/ui/ErrorView';

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { notifications: hookNotifications, loading, error, fetchNotifications, markAsRead, markAllRead } = useNotifications();
  const [localReadIds, setLocalReadIds] = useState<Set<string>>(new Set());

  useFocusEffect(useCallback(() => {
    fetchNotifications();
  }, [fetchNotifications]));

  if (loading) return <LoadingView />;
  if (error) return <ErrorView error={error} onRetry={fetchNotifications} />;

  // Merge hook notifications with local read state
  const notifications = hookNotifications.map(n => ({
    id: n.id,
    emoji: n.emoji ?? '🔔',
    message: n.title ?? 'Notification',
    subText: n.body ?? '',
    time: new Date(n.created_at),
    isRead: n.is_read || localReadIds.has(n.id),
  }));

  const deletedIds = new Set<string>();
  const visibleNotifications = notifications.filter((n) => !deletedIds.has(n.id));
  const unreadCount = visibleNotifications.filter((n) => !n.isRead).length;

  const todayNotifications = visibleNotifications.filter((n) => isToday(n.time));
  const yesterdayNotifications = visibleNotifications.filter((n) => isYesterday(n.time));
  const earlierNotifications = visibleNotifications.filter(
    (n) => !isToday(n.time) && !isYesterday(n.time)
  );

  const handleMarkAllRead = async () => {
    if (user) await markAllRead(user.id);
    setLocalReadIds(new Set(notifications.map(n => n.id)));
  };

  const handleMarkRead = async (id: string) => {
    await markAsRead(id);
    setLocalReadIds(prev => new Set([...prev, id]));
  };

  const renderNotificationItem = (notification: { id: string; emoji: string; message: string; subText: string; time: Date; isRead: boolean }) => (
    <Pressable
      key={notification.id}
      onPress={() => handleMarkRead(notification.id)}
      className={`flex-row items-start px-4 py-3 border-b border-border ${
        !notification.isRead ? 'bg-card/50' : ''
      }`}
    >
      <Text className="text-2xl mr-3">{notification.emoji}</Text>
      <View className="flex-1">
        <Text
          className={`text-sm font-medium ${
            !notification.isRead ? 'text-foreground' : 'text-muted-foreground'
          }`}
        >
          {notification.message}
        </Text>
        <Text className="text-xs text-muted-foreground mt-0.5">{notification.subText}</Text>
      </View>
      <View className="items-end">
        <Text className="text-xs text-muted-foreground">
          {formatDistanceToNow(notification.time, { addSuffix: false })}
        </Text>
        {!notification.isRead && (
          <View className="w-2 h-2 rounded-full bg-blue-400 mt-1.5" />
        )}
      </View>
    </Pressable>
  );

  const renderSection = (title: string, items: typeof notifications) => {
    if (items.length === 0) return null;
    return (
      <View>
        <Text className="text-xs text-muted-foreground px-4 py-2 uppercase tracking-wider">
          {title}
        </Text>
        {items.map(renderNotificationItem)}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-border">
        <Pressable onPress={() => router.back()} className="mr-3">
          <ChevronLeft size={24} color="#fff" />
        </Pressable>
        <View className="flex-1 flex-row items-center">
          <Bell size={20} color="#fff" />
          <Text className="text-lg font-semibold ml-2 text-foreground">Notifications</Text>
          {unreadCount > 0 && (
            <View className="bg-primary rounded-full px-2 py-0.5 ml-2">
              <Text className="text-xs font-semibold text-primary-foreground">{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <Pressable onPress={handleMarkAllRead}>
            <Text className="text-sm text-muted-foreground">Mark all read</Text>
          </Pressable>
        )}
      </View>

      {/* Content */}
      {visibleNotifications.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Bell size={48} color="#666" />
          <Text className="text-lg font-medium text-muted-foreground mt-4">All caught up!</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {renderSection('Today', todayNotifications)}
          {renderSection('Yesterday', yesterdayNotifications)}
          {renderSection('Earlier', earlierNotifications)}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
