import { supabase } from '../lib/supabase';
import { fromSupabaseError } from '../utils/result';
import type { Result, SupabaseError } from '../utils/result';
import type { AuthConfig } from '../types/database.types';

/**
 * Lock settings only. The PIN hash is server-only (migration
 * 20261126_pin_hash_server_only): set, check and change the PIN through
 * `edgeFunctionsService.setPin / checkPin / changePin`.
 */
export type AuthConfigSettings = Pick<AuthConfig, 'fingerprint_enabled' | 'auto_lock_minutes'>;

export const authConfigRepository = {
  /** The user's lock settings, or null when no row exists yet. */
  async fetch(userId: string): Promise<Result<AuthConfigSettings | null, SupabaseError>> {
    const { data, error } = await supabase
      .from('auth_config')
      .select('fingerprint_enabled, auto_lock_minutes')
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
