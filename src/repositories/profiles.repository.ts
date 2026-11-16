import { supabase } from '../lib/supabase';
import { fromSupabaseError, type Result, type SupabaseError } from '../utils/result';
import type { Profile } from '../types';

export type ProfilePatch = Partial<Pick<Profile, 'display_name' | 'financial_identity' | 'avatar_url'>>;

export const profilesRepository = {
  /** The signed-in user's profile row, or null if it hasn't been created yet. */
  async fetch(userId: string): Promise<Result<Profile | null, SupabaseError>> {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: (data as Profile | null) ?? null };
  },

  async update(userId: string, patch: ProfilePatch): Promise<Result<Profile, SupabaseError>> {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as Profile };
  },
};
