import { supabase } from '../lib/supabase';
import { fromSupabaseError, type Result, type SupabaseError } from '../utils/result';
import type { BankPreset } from '../types';

export const bankPresetsRepository = {
  async fetchAll(): Promise<Result<BankPreset[], SupabaseError>> {
    const { data, error } = await supabase
      .from('bank_presets')
      .select()
      .order('id');
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as BankPreset[] };
  },
};
