import { useState, useCallback } from 'react';
import { affirmationsRepository } from '../repositories/affirmations.repository';
import type { Affirmation, UserAffirmation, AffirmationCategory } from '../types';
import type { SupabaseError } from '../utils/result';

export function useAffirmations() {
  const [affirmations, setAffirmations] = useState<Affirmation[]>([]);
  const [userAffirmations, setUserAffirmations] = useState<UserAffirmation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<SupabaseError | null>(null);

  const fetchAffirmations = useCallback(async (category?: AffirmationCategory) => {
    setLoading(true);
    setError(null);
    const result = category
      ? await affirmationsRepository.fetchByCategory(category)
      : await affirmationsRepository.fetchActive();
    if (result.ok) setAffirmations(result.data);
    else setError(result.error);
    setLoading(false);
  }, []);

  const fetchUserAffirmations = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    const result = await affirmationsRepository.fetchUserAffirmations(userId);
    if (result.ok) setUserAffirmations(result.data);
    else setError(result.error);
    setLoading(false);
  }, []);

  const addUserAffirmation = useCallback(async (userId: string, text: string, category: AffirmationCategory) => {
    setLoading(true);
    setError(null);
    const result = await affirmationsRepository.addUserAffirmation(userId, text, category);
    setLoading(false);
    return result;
  }, []);

  return { affirmations, userAffirmations, loading, error, fetchAffirmations, fetchUserAffirmations, addUserAffirmation };
}