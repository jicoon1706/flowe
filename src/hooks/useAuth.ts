import { useState, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { authRepository } from '../repositories/auth.repository';
import type { SupabaseError } from '../utils/result';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<SupabaseError | null>(null);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await authRepository.getUser();
    if (result.ok) setUser(result.data);
    else setError(result.error);
    setLoading(false);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    const result = await authRepository.signIn(email, password);
    if (result.ok) setUser(result.data);
    else setError(result.error);
    setLoading(false);
    return result;
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    const result = await authRepository.signOut();
    if (result.ok) setUser(null);
    setLoading(false);
    return result;
  }, []);

  return { user, loading, error, fetchUser, signIn, signOut };
}