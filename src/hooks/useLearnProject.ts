import { useCallback, useEffect, useState } from 'react';
import { learnRepository } from '../repositories/learn.repository';
import { storageService } from '../services/storage';
import type { LearnEntryWithImages, LearnProject } from '../types';
import type { SupabaseError } from '../utils/result';

/**
 * One learn project with its entries and signed URLs for their photos.
 * Wraps the learn repository and storage service for the project, entry and
 * editor screens.
 */
export function useLearnProject(projectId: string | undefined) {
  const [project, setProject] = useState<LearnProject | null>(null);
  const [entries, setEntries] = useState<LearnEntryWithImages[]>([]);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<SupabaseError | null>(null);

  const refresh = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    const [p, e] = await Promise.all([learnRepository.fetchProject(projectId), learnRepository.fetchEntries(projectId)]);
    if (p.ok) setProject(p.data);
    if (e.ok) {
      const rows = e.data as LearnEntryWithImages[];
      setEntries(rows);
      const paths = rows.flatMap((r) => r.learn_entry_images ?? []).map((i) => i.storage_path).filter(Boolean);
      if (paths.length) {
        const urls = await storageService.getLearnImageUrls(paths);
        if (urls.ok) setImageUrls(urls.data);
      }
    }
    setError(!p.ok ? p.error : !e.ok ? e.error : null);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { refresh(); }, [refresh]);

  const rename = useCallback((name: string) => learnRepository.renameProject(projectId ?? '', name), [projectId]);
  const remove = useCallback(() => learnRepository.deleteProject(projectId ?? ''), [projectId]);
  const deleteEntry = useCallback((id: string) => learnRepository.deleteEntry(id), []);

  return { project, entries, imageUrls, loading, error, refresh, rename, remove, deleteEntry };
}
