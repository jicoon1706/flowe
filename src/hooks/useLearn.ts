import { useState, useCallback } from 'react';
import { learnRepository } from '../repositories/learn.repository';
import type { LearnProject, LearnEntry } from '../types';
import type { SupabaseError } from '../utils/result';

export function useLearn() {
  const [projects] = useState<LearnProject[]>([]);
  const [entries, setEntries] = useState<LearnEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<SupabaseError | null>(null);

  const createProject = useCallback(async (userId: string, name: string) => {
    setLoading(true);
    setError(null);
    const result = await learnRepository.createProject(userId, name);
    setLoading(false);
    return result;
  }, []);

  const fetchEntries = useCallback(async (projectId: string) => {
    setLoading(true);
    setError(null);
    const result = await learnRepository.fetchEntries(projectId);
    if (result.ok) setEntries(result.data);
    else setError(result.error);
    setLoading(false);
  }, []);

  const createEntry = useCallback(async (projectId: string, userId: string, body: string) => {
    setLoading(true);
    setError(null);
    const result = await learnRepository.createEntry(projectId, userId, body);
    if (result.ok) await fetchEntries(projectId);
    else setError(result.error);
    setLoading(false);
    return result;
  }, [fetchEntries]);

  return { projects, entries, loading, error, createProject, fetchEntries, createEntry };
}