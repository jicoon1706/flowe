import { supabase } from '../lib/supabase';
import { fromSupabaseError, type Result, type SupabaseError } from '../utils/result';

const BUCKETS = ['receipts', 'learn-images', 'avatars'] as const;

/** Lists every object path under `prefix` in `bucket`, one folder level at a time. */
async function listAll(bucket: string, prefix: string): Promise<string[]> {
  const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: 1000 });
  if (error || !data) return [];
  const paths: string[] = [];
  for (const item of data) {
    const path = `${prefix}/${item.name}`;
    // Folders come back without an id.
    if (item.id === null) paths.push(...(await listAll(bucket, path)));
    else paths.push(path);
  }
  return paths;
}

export const userDataRepository = {
  /**
   * Settings › Data › Reset all data: deletes every row the user owns in one
   * transaction (migration 20261120, `reset_user_data`).
   */
  async resetAll(): Promise<Result<void, SupabaseError>> {
    const { error } = await supabase.rpc('reset_user_data');
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: undefined };
  },

  /**
   * Deletes the user's files in every private bucket. Best-effort: resolves
   * to the number of files that could not be removed.
   */
  async purgeStorage(userId: string): Promise<number> {
    let failed = 0;
    for (const bucket of BUCKETS) {
      const paths = await listAll(bucket, userId);
      for (let i = 0; i < paths.length; i += 100) {
        const batch = paths.slice(i, i + 100);
        const { error } = await supabase.storage.from(bucket).remove(batch);
        if (error) failed += batch.length;
      }
    }
    return failed;
  },
};
