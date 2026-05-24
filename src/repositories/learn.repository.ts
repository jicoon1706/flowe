import { supabase } from '../lib/supabase';
import type { Result } from '../utils/result';
import { fromSupabaseError } from '../utils/result';
import type { SupabaseError } from '../utils/result';
import type { LearnProject, LearnEntry, LearnEntryImage } from '../types';

export const learnRepository = {
  async createProject(userId: string, name: string): Promise<Result<LearnProject, SupabaseError>> {
    const { data, error } = await supabase
      .from('learn_projects')
      .insert({ user_id: userId, name })
      .select()
      .single();
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as LearnProject };
  },

  async renameProject(id: string, name: string): Promise<Result<void, SupabaseError>> {
    const { error } = await supabase
      .from('learn_projects')
      .update({ name, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: undefined };
  },

  async deleteProject(id: string): Promise<Result<void, SupabaseError>> {
    const { error } = await supabase.from('learn_projects').delete().eq('id', id);
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: undefined };
  },

  async fetchEntries(projectId: string): Promise<Result<LearnEntry[], SupabaseError>> {
    const { data, error } = await supabase
      .from('learn_entries')
      .select('*, learn_entry_images(*)')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as LearnEntry[] };
  },

  async createEntry(projectId: string, userId: string, body: string): Promise<Result<LearnEntry, SupabaseError>> {
    const { data, error } = await supabase
      .from('learn_entries')
      .insert({ project_id: projectId, user_id: userId, body })
      .select()
      .single();
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as LearnEntry };
  },

  async updateEntry(id: string, body: string): Promise<Result<LearnEntry, SupabaseError>> {
    const { data, error } = await supabase
      .from('learn_entries')
      .update({ body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as LearnEntry };
  },

  async deleteEntry(id: string): Promise<Result<void, SupabaseError>> {
    const { error } = await supabase.from('learn_entries').delete().eq('id', id);
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: undefined };
  },

  async attachImage(entryId: string, storagePath: string): Promise<Result<LearnEntryImage, SupabaseError>> {
    const { data, error } = await supabase
      .from('learn_entry_images')
      .insert({ entry_id: entryId, storage_path: storagePath })
      .select()
      .single();
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as LearnEntryImage };
  },

  async removeImage(imageId: string): Promise<Result<void, SupabaseError>> {
    const { error } = await supabase.from('learn_entry_images').delete().eq('id', imageId);
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: undefined };
  },
};