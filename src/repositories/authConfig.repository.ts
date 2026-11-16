import { supabase } from '../lib/supabase';
import { fromSupabaseError } from '../utils/result';
import type { Result, SupabaseError } from '../utils/result';
import type { AuthConfig } from '../types/database.types';

export type AuthConfigSettings = Pick<AuthConfig, 'pin_hash' | 'fingerprint_enabled' | 'auto_lock_minutes'>;

export const authConfigRepository = {
  async upsert(params: {
    userId: string;
    pinHash: string;
    fingerprintEnabled: boolean;
  }): Promise<Result<void, SupabaseError>> {
    const { error } = await supabase
      .from('auth_config')
      .upsert(
        {
          user_id: params.userId,
          pin_hash: params.pinHash,
          fingerprint_enabled: params.fingerprintEnabled,
        },
        { onConflict: 'user_id' }
      );
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: undefined };
  },

  /** The user's PIN/lock settings, or null when no row exists yet. */
  async fetch(userId: string): Promise<Result<AuthConfigSettings | null, SupabaseError>> {
    const { data, error } = await supabase
      .from('auth_config')
      .select('pin_hash, fingerprint_enabled, auto_lock_minutes')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: (data as AuthConfigSettings | null) ?? null };
  },

  async update(
    userId: string,
    patch: { fingerprint_enabled?: boolean; auto_lock_minutes?: number | null },
  ): Promise<Result<void, SupabaseError>> {
    const { error } = await supabase
      .from('auth_config')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: undefined };
  },
};
