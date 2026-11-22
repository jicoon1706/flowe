import { useCallback, useEffect, useRef, useState } from 'react';
import { incomeSplitRepository, type CategoryGroupChange } from '../repositories/incomeSplit.repository';
import type { SplitGroup, SplitTargets } from '../types';
import type { SupabaseError } from '../utils/result';

interface Loaded {
  groups: Record<string, SplitGroup>;
  targets: SplitTargets | null;
  error: SupabaseError | null;
}

/**
 * Desktop / tablet / phone L: the user's category → Needs / Wants / Skip map and split targets,
 * for the Edit groups drawer. `groupOf` answers Skip for a category with no
 * row. `save` writes both in one server call and re-reads them. Pass
 * `enabled = false` to skip loading until the drawer opens.
 */
export function useCategoryGroups(enabled = true) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [saving, setSaving] = useState(false);
  const latest = useRef(0);

  const refresh = useCallback(async () => {
    const request = ++latest.current;
    const [g, t] = await Promise.all([incomeSplitRepository.fetchGroups(), incomeSplitRepository.fetchTargets()]);
    if (request !== latest.current) return;
    if (!g.ok) setLoaded({ groups: {}, targets: null, error: g.error });
    else if (!t.ok) setLoaded({ groups: {}, targets: null, error: t.error });
    else setLoaded({ groups: Object.fromEntries(g.data.map((r) => [r.category, r.split_group])), targets: t.data, error: null });
  }, []);

  useEffect(() => { if (enabled) refresh(); }, [enabled, refresh]);

  const groups = loaded?.groups;
  const groupOf = useCallback((category: string): SplitGroup => groups?.[category] ?? 'skip', [groups]);

  const save = useCallback(async (changes: CategoryGroupChange[], next: SplitTargets) => {
    setSaving(true);
    const res = await incomeSplitRepository.saveGroups(changes, next);
    setSaving(false);
    if (res.ok) await refresh();
    return res;
  }, [refresh]);

  return {
    groups: groups ?? {},
    groupOf,
    targets: loaded?.targets ?? null,
    error: loaded?.error ?? null,
    loading: enabled && loaded === null,
    saving,
    refresh,
    save,
  };
}
