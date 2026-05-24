import { supabase } from '../lib/supabase';
import { fromSupabaseError, type Result, type SupabaseError } from '../utils/result';
import type { Notification } from '../types';

export const notificationsRepository = {
  async fetchAll(): Promise<Result<Notification[], SupabaseError>> {
    const { data, error } = await supabase
      .from('notifications')
      .select()
      .order('created_at', { ascending: false });
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as Notification[] };
  },

  async getUnreadCount(): Promise<Result<number, SupabaseError>> {
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('is_read', false);
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: count ?? 0 };
  },

  async create(notif: Omit<Notification, 'id' | 'created_at'>): Promise<Result<Notification, SupabaseError>> {
    const { data, error } = await supabase.from('notifications').insert(notif as any).select().single();
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as Notification };
  },

  async markAsRead(id: string): Promise<Result<void, SupabaseError>> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: undefined };
  },

  async markAllRead(userId: string): Promise<Result<void, SupabaseError>> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: undefined };
  },

  async delete(id: string): Promise<Result<void, SupabaseError>> {
    const { error } = await supabase.from('notifications').delete().eq('id', id);
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: undefined };
  },
};