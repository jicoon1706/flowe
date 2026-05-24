import { useState, useCallback } from 'react';
import { notificationsRepository } from '../repositories/notifications.repository';
import type { Notification } from '../types';
import type { SupabaseError } from '../utils/result';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<SupabaseError | null>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await notificationsRepository.fetchAll();
    if (result.ok) setNotifications(result.data);
    else setError(result.error);
    setLoading(false);
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    const result = await notificationsRepository.markAsRead(id);
    if (result.ok) await fetchNotifications();
    else setError(result.error);
    setLoading(false);
    return result;
  }, [fetchNotifications]);

  const markAllRead = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    const result = await notificationsRepository.markAllRead(userId);
    if (result.ok) await fetchNotifications();
    else setError(result.error);
    setLoading(false);
    return result;
  }, [fetchNotifications]);

  return { notifications, loading, error, fetchNotifications, markAsRead, markAllRead };
}