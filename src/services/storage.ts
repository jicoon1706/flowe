import { decode } from 'base64-arraybuffer';
import { supabase } from '../lib/supabase';
import type { Result, SupabaseError } from '../utils/result';

export const storageService = {
  // Avatars
  async uploadAvatar(userId: string, base64Image: string): Promise<Result<string, SupabaseError>> {
    const path = `${userId}/avatar.jpg`;
    const { error } = await supabase.storage
      .from('avatars')
      .upload(path, decode(base64Image), { contentType: 'image/jpeg', upsert: true });
    if (error) return { ok: false, error: { code: error.code, message: error.message } };
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    return { ok: true, data: data.publicUrl };
  },

  async deleteAvatar(userId: string): Promise<Result<void, SupabaseError>> {
    const { error } = await supabase.storage.from('avatars').remove([`${userId}/avatar.jpg`]);
    if (error) return { ok: false, error: { code: error.code, message: error.message } };
    return { ok: true, data: undefined };
  },

  // Receipts (private bucket — use signed URL)
  async uploadReceipt(userId: string, transactionId: string, base64Image: string): Promise<Result<string, SupabaseError>> {
    const path = `${userId}/${transactionId}.jpg`;
    const { error } = await supabase.storage
      .from('receipts')
      .upload(path, decode(base64Image), { contentType: 'image/jpeg' });
    if (error) return { ok: false, error: { code: error.code, message: error.message } };
    const { data, error: urlError } = await supabase.storage.from('receipts').createSignedUrl(path, 60 * 60);
    if (urlError) return { ok: false, error: { code: urlError.code, message: urlError.message } };
    return { ok: true, data: data.signedUrl };
  },

  async getReceiptUrl(path: string): Promise<Result<string, SupabaseError>> {
    const { data, error } = await supabase.storage.from('receipts').createSignedUrl(path, 60 * 60);
    if (error) return { ok: false, error: { code: error.code, message: error.message } };
    return { ok: true, data: data.signedUrl };
  },

  async deleteReceipt(path: string): Promise<Result<void, SupabaseError>> {
    const { error } = await supabase.storage.from('receipts').remove([path]);
    if (error) return { ok: false, error: { code: error.code, message: error.message } };
    return { ok: true, data: undefined };
  },

  // Learn Images (private bucket — use signed URL)
  async uploadLearnImage(userId: string, entryId: string, imageId: string, base64Image: string): Promise<Result<string, SupabaseError>> {
    const path = `${userId}/${entryId}/${imageId}.jpg`;
    const { error } = await supabase.storage
      .from('learn-images')
      .upload(path, decode(base64Image), { contentType: 'image/jpeg' });
    if (error) return { ok: false, error: { code: error.code, message: error.message } };
    const { data, error: urlError } = await supabase.storage.from('learn-images').createSignedUrl(path, 60 * 60);
    if (urlError) return { ok: false, error: { code: urlError.code, message: urlError.message } };
    return { ok: true, data: data.signedUrl };
  },

  async getLearnImageUrl(path: string): Promise<Result<string, SupabaseError>> {
    const { data, error } = await supabase.storage.from('learn-images').createSignedUrl(path, 60 * 60);
    if (error) return { ok: false, error: { code: error.code, message: error.message } };
    return { ok: true, data: data.signedUrl };
  },

  // Batch sign many learn images in a single request (much faster than N calls).
  async getLearnImageUrls(paths: string[]): Promise<Result<Record<string, string>, SupabaseError>> {
    if (paths.length === 0) return { ok: true, data: {} };
    const { data, error } = await supabase.storage.from('learn-images').createSignedUrls(paths, 60 * 60);
    if (error) return { ok: false, error: { code: error.code, message: error.message } };
    const map: Record<string, string> = {};
    for (const item of data ?? []) {
      if (item.path && item.signedUrl) map[item.path] = item.signedUrl;
    }
    return { ok: true, data: map };
  },

  async deleteLearnImage(path: string): Promise<Result<void, SupabaseError>> {
    const { error } = await supabase.storage.from('learn-images').remove([path]);
    if (error) return { ok: false, error: { code: error.code, message: error.message } };
    return { ok: true, data: undefined };
  },
};