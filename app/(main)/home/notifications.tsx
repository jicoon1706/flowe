import { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Bell, ChevronLeft } from '../../../components/ui/icons';
import { formatDistanceToNow, isToday, isYesterday } from 'date-fns';

interface Notification {
  id: string;
  emoji: string;
  message: string;
  subText: string;
  time: Date;
  isRead: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  // Today (5)
  { id: '1', emoji: '💰', message: 'You reached Rich pattern this month!', subText: 'Your passive income exceeded expenses', time: new Date(Date.now() - 1000 * 60 * 30), isRead: false },
  { id: '2', emoji: '⚠️', message: 'Unifi bill due tomorrow', subText: 'RM 89 — Auto-deducted from Maybank', time: new Date(Date.now() - 1000 * 60 * 60 * 2), isRead: false },
  { id: '3', emoji: '💸', message: 'RM 24.50 — Food & Drink', subText: 'Saved compared to last month', time: new Date(Date.now() - 1000 * 60 * 60 * 4), isRead: true },
  { id: '4', emoji: '🔄', message: 'RM 89 Unifi recorded', subText: 'Recurring payment auto-logged', time: new Date(Date.now() - 1000 * 60 * 60 * 6), isRead: true },
  { id: '5', emoji: '💵', message: 'RM 3,500 Salary → Maybank', subText: 'From: Employer HQ', time: new Date(Date.now() - 1000 * 60 * 60 * 8), isRead: false },
  // Yesterday (4)
  { id: '6', emoji: '🎉', message: 'Tabung Raya complete!', subText: 'You reached your RM 5,000 goal', time: new Date(Date.now() - 1000 * 60 * 60 * 26), isRead: false },
  { id: '7', emoji: '↔️', message: 'RM 200 Maybank → Tabung Raya', subText: 'Transfer successful', time: new Date(Date.now() - 1000 * 60 * 60 * 28), isRead: true },
  { id: '8', emoji: '🐷', message: 'Tabung Raya — Goal RM 500', subText: 'Only RM 150 left to go!', time: new Date(Date.now() - 1000 * 60 * 60 * 30), isRead: true },
  { id: '9', emoji: '📈', message: 'ASB added', subText: 'RM 10,000 — New asset recorded', time: new Date(Date.now() - 1000 * 60 * 60 * 32), isRead: true },
  // Earlier (6)
  { id: '10', emoji: '✨', message: '"Spend with intention."', subText: 'Daily affirmation saved', time: new Date(Date.now() - 1000 * 60 * 60 * 48), isRead: true },
  { id: '11', emoji: '📁', message: '"Investing Notes" project created', subText: 'Start adding your lessons', time: new Date(Date.now() - 1000 * 60 * 60 * 72), isRead: true },
  { id: '12', emoji: '📝', message: '"Bajet Raya" saved', subText: 'Notes updated successfully', time: new Date(Date.now() - 1000 * 60 * 60 * 96), isRead: true },
  { id: '13', emoji: '💰', message: 'You reached Middle pattern', subText: 'Net cash flow: RM 450', time: new Date(Date.now() - 1000 * 60 * 60 * 120), isRead: true },
  { id: '14', emoji: '⚠️', message: 'TNB bill due in 3 days', subText: 'RM 120 — Auto-deducted', time: new Date(Date.now() - 1000 * 60 * 60 * 144), isRead: true },
  { id: '15', emoji: '🎉', message: 'Emergency Fund 50% complete!', subText: 'Keep going, RM 2,500 more', time: new Date(Date.now() - 1000 * 60 * 60 * 168), isRead: true },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  const visibleNotifications = notifications.filter((n) => !deletedIds.has(n.id));
  const unreadCount = visibleNotifications.filter((n) => !n.isRead).length;

  const todayNotifications = visibleNotifications.filter((n) => isToday(n.time));
  const yesterdayNotifications = visibleNotifications.filter((n) => isYesterday(n.time));
  const earlierNotifications = visibleNotifications.filter(
    (n) => !isToday(n.time) && !isYesterday(n.time)
  );

  const markAllRead = () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true }))
    );
  };

  const markRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const deleteNotification = (id: string) => {
    setDeletedIds((prev) => new Set([...prev, id]));
  };

  const handleNotificationPress = (notification: Notification) => {
    if (!notification.isRead) {
      markRead(notification.id);
    }
  };

  const renderNotificationItem = (notification: Notification) => (
    <Pressable
      key={notification.id}
      onPress={() => {
        handleNotificationPress(notification);
      }}
      onLongPress={() => deleteNotification(notification.id)}
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

  const renderSection = (title: string, items: Notification[]) => {
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
          <Pressable onPress={markAllRead}>
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
