import { supabase } from '../lib/supabase';
import { fromSupabaseError, type Result, type SupabaseError } from '../utils/result';
import type { CustomCategory } from '../types';

export const customCategoriesRepository = {
  async fetchAll(userId: string): Promise<Result<CustomCategory[], SupabaseError>> {
    const { data, error } = await supabase
      .from('custom_categories')
      .select()
      .eq('user_id', userId)
      .eq('is_active', true);
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as CustomCategory[] };
  },

  async create(req: Omit<CustomCategory, 'id' | 'created_at' | 'is_active'>): Promise<Result<CustomCategory, SupabaseError>> {
    const { data, error } = await supabase.from('custom_categories').insert(req as any).select().single();
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as CustomCategory };
  },

  // Only name/icon/colour are editable: transaction_type is what the category
  // is filed under, and changing it would strand the transactions already
  // tagged with it on the wrong tab.
  async update(
    id: string,
    patch: Partial<Pick<CustomCategory, 'name' | 'icon' | 'color'>>
  ): Promise<Result<CustomCategory, SupabaseError>> {
    const { data, error } = await supabase
      .from('custom_categories')
      .update(patch as any)
      .eq('id', id)
      .select()
      .single();
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as CustomCategory };
  },

  async softDelete(id: string): Promise<Result<void, SupabaseError>> {
    const { error } = await supabase
      .from('custom_categories')
      .update({ is_active: false })
      .eq('id', id);
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: undefined };
  },
};