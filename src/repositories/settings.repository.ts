import { supabase } from '../lib/supabase';
import { fromSupabaseError, type Result, type SupabaseError } from '../utils/result';
import type { Settings } from '../types';

export const settingsRepository = {
  async fetch(userId: string): Promise<Result<Settings, SupabaseError>> {
    const { data, error } = await supabase
      .from('settings')
      .select()
      .eq('user_id', userId)
      .single();
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as Settings };
  },

  /**
   * The user's settings row, creating it with defaults if they don't have
   * one yet. Rows are only made lazily, so any screen reading settings for
   * the first time may be the one that creates them.
   */
  async fetchOrCreate(userId: string): Promise<Result<Settings, SupabaseError>> {
    const { data, error } = await supabase
      .from('settings')
      .select()
      .eq('user_id', userId)
      .maybeSingle();
    if (error) return { ok: false, error: fromSupabaseError(error) };
    if (data) return { ok: true, data: data as Settings };
    return settingsRepository.create(userId);
  },

  async create(userId: string): Promise<Result<Settings, SupabaseError>> {
    const { data, error } = await supabase
      .from('settings')
      .insert({ user_id: userId })
      .select()
      .single();
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as Settings };
  },

  async update(userId: string, patch: Partial<Settings>): Promise<Result<Settings, SupabaseError>> {
    const { data, error } = await supabase
      .from('settings')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select()
      .single();
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as Settings };
  },
};
