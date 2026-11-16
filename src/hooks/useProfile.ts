import { useCallback, useEffect, useState } from 'react';
import { profilesRepository, type ProfilePatch } from '../repositories/profiles.repository';
import type { Profile } from '../types';
import type { SupabaseError } from '../utils/result';

/** The user's profile (display name, financial identity). */
export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<SupabaseError | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const res = await profilesRepository.fetch(userId);
    if (res.ok) { setProfile(res.data); setError(null); } else setError(res.error);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const updateProfile = useCallback(async (patch: ProfilePatch) => {
    if (!userId) return { ok: false as const, error: { code: 'NO_USER', message: 'Not signed in' } };
    const res = await profilesRepository.update(userId, patch);
    if (res.ok) setProfile(res.data);
    return res;
  }, [userId]);

  return { profile, displayName: profile?.display_name ?? '', loading, error, fetchProfile, updateProfile };
}
