import { supabase } from '../lib/supabase';
import { fromSupabaseError } from '../utils/result';
import type { Result, SupabaseError } from '../utils/result';

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
};