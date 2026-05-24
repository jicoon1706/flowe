import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Result, SupabaseError } from '../utils/result';

export const authRepository = {
  async signUp(
    email: string,
    password: string,
    displayName: string
  ): Promise<Result<User, SupabaseError>> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    if (error) return { ok: false, error: { code: error.code, message: error.message } };
    if (!data.user) return { ok: false, error: { code: 'NO_USER', message: 'Sign up succeeded but no user returned' } };
    return { ok: true, data: data.user };
  },

  async signIn(email: string, password: string): Promise<Result<User, SupabaseError>> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: { code: error.code, message: error.message } };
    if (!data.user) return { ok: false, error: { code: 'NO_USER', message: 'Sign in succeeded but no user returned' } };
    return { ok: true, data: data.user };
  },

  async signInAnonymously(): Promise<Result<User, SupabaseError>> {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) return { ok: false, error: { code: error.code, message: error.message } };
    if (!data.user) return { ok: false, error: { code: 'NO_USER', message: 'Anonymous sign in succeeded but no user returned' } };
    return { ok: true, data: data.user };
  },

  async signOut(): Promise<Result<void, SupabaseError>> {
    const { error } = await supabase.auth.signOut();
    if (error) return { ok: false, error: { code: error.code, message: error.message } };
    return { ok: true, data: undefined };
  },

  async getSession(): Promise<Result<Session | null, SupabaseError>> {
    const { data, error } = await supabase.auth.getSession();
    if (error) return { ok: false, error: { code: error.code, message: error.message } };
    return { ok: true, data: data.session };
  },

  async getUser(): Promise<Result<User | null, SupabaseError>> {
    const { data, error } = await supabase.auth.getUser();
    if (error) return { ok: false, error: { code: error.code, message: error.message } };
    return { ok: true, data: data.user };
  },

  async refreshSession(): Promise<Result<Session, SupabaseError>> {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) return { ok: false, error: { code: error.code, message: error.message } };
    if (!data.session) return { ok: false, error: { code: 'NO_SESSION', message: 'Refresh returned no session' } };
    return { ok: true, data: data.session };
  },
};