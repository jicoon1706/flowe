import { supabase } from '../lib/supabase';
import { fromSupabaseError, type Result, type SupabaseError } from '../utils/result';
import type { Affirmation, AffirmationFavourite, UserAffirmation, AffirmationCategory } from '../types';

export const affirmationsRepository = {
  async fetchActive(): Promise<Result<Affirmation[], SupabaseError>> {
    const { data, error } = await supabase
      .from('affirmations')
      .select()
      .eq('is_active', true);
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as Affirmation[] };
  },

  async fetchByCategory(category: AffirmationCategory): Promise<Result<Affirmation[], SupabaseError>> {
    const { data, error } = await supabase
      .from('affirmations')
      .select()
      .eq('is_active', true)
      .eq('category', category);
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as Affirmation[] };
  },

  async fetchFavourites(userId: string): Promise<Result<AffirmationFavourite[], SupabaseError>> {
    const { data, error } = await supabase
      .from('affirmation_favourites')
      .select('*, affirmations(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as AffirmationFavourite[] };
  },

  async addFavourite(userId: string, affirmationId: string): Promise<Result<AffirmationFavourite, SupabaseError>> {
    const { data, error } = await supabase
      .from('affirmation_favourites')
      .insert({ user_id: userId, affirmation_id: affirmationId })
      .select()
      .single();
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as AffirmationFavourite };
  },

  async removeFavourite(userId: string, affirmationId: string): Promise<Result<void, SupabaseError>> {
    const { error } = await supabase
      .from('affirmation_favourites')
      .delete()
      .eq('user_id', userId)
      .eq('affirmation_id', affirmationId);
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: undefined };
  },

  async fetchUserAffirmations(userId: string): Promise<Result<UserAffirmation[], SupabaseError>> {
    const { data, error } = await supabase
      .from('user_affirmations')
      .select()
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as UserAffirmation[] };
  },

  async addUserAffirmation(userId: string, text: string, category: AffirmationCategory): Promise<Result<UserAffirmation, SupabaseError>> {
    const { data, error } = await supabase
      .from('user_affirmations')
      .insert({ user_id: userId, text, category })
      .select()
      .single();
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as UserAffirmation };
  },

  async removeUserAffirmation(id: string): Promise<Result<void, SupabaseError>> {
    const { error } = await supabase
      .from('user_affirmations')
      .update({ is_active: false })
      .eq('id', id);
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: undefined };
  },
};