import { useCallback, useRef, useState } from 'react';
import { accountsRepository } from '../repositories/accounts.repository';
import { storageService } from '../services/storage';
import {
  fieldOfServerError,
  undoValues,
  validateTabungEdit,
  type TabungEditErrors,
  type TabungEditValues,
} from '../lib/tabungEdit';
import type { Result, SupabaseError } from '../utils/result';

/** A save that worked: what to restore if the user taps Undo on the toast. */
export interface TabungEditSaved {
  previous: TabungEditValues;
  /** What the save wrote. */
  written: TabungEditValues;
}

/**
 * Edit Tabung (d-tabung-edit · t-n-tabung-edit · n-tabung-edit). Validates on
 * the client with the shared rules, then saves through update_tabung, which
 * re-checks them; a server rule failure lands on its field in `errors`.
 *
 * Covers: `uploadCover` stores a new file and returns its path for the form;
 * `discardCover` removes one that was uploaded but never saved (Cancel /
 * Discard). A replaced cover stays in storage until `finalize()` (call it when
 * the Undo toast closes) so Undo can put it back.
 *
 * The caller refreshes its accounts / progress after `save` or `undo`.
 */
export function useTabungEdit(accountId: string) {
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<TabungEditErrors>({});
  const replaced = useRef<{ old: string | null; current: string | null } | null>(null);

  const write = useCallback(
    (v: TabungEditValues) =>
      accountsRepository.updateTabung({
        accountId,
        goalType: v.goalType ?? 'custom',
        name: v.name,
        target: v.target ?? 0,
        monthlyTopup: v.monthlyTopup ?? 0,
        fromDate: v.fromDate,
        toDate: v.toDate,
        coverPath: v.coverPath,
      }),
    [accountId],
  );

  const save = useCallback(
    async (initial: TabungEditValues, values: TabungEditValues, saved: number): Promise<Result<TabungEditSaved, SupabaseError>> => {
      const invalid = validateTabungEdit(values, saved);
      setErrors(invalid);
      if (Object.keys(invalid).length > 0) {
        return { ok: false, error: { code: 'VALIDATION', message: Object.values(invalid)[0] ?? 'Check the form' } };
      }
      setSaving(true);
      const res = await write(values);
      setSaving(false);
      if (!res.ok) {
        const field = res.error.code === '23514' ? fieldOfServerError(res.error.message) : null;
        if (field) setErrors({ [field]: res.error.message });
        return res;
      }
      replaced.current = initial.coverPath !== values.coverPath ? { old: initial.coverPath, current: values.coverPath } : null;
      return { ok: true, data: { previous: initial, written: values } };
    },
    [write],
  );

  /** Undo on the saved toast: write the values from before the save. */
  const undo = useCallback(
    async (savedEdit: TabungEditSaved): Promise<Result<void, SupabaseError>> => {
      setSaving(true);
      const res = await write(undoValues(savedEdit.previous, savedEdit.written));
      setSaving(false);
      if (res.ok && replaced.current) {
        // The cover saved a moment ago is no longer referenced.
        const { current } = replaced.current;
        replaced.current = null;
        if (current) await storageService.deleteTabungCover(current);
      }
      return res;
    },
    [write],
  );

  /** The Undo window closed: the replaced cover can go. */
  const finalize = useCallback(async () => {
    const r = replaced.current;
    replaced.current = null;
    if (r?.old) await storageService.deleteTabungCover(r.old);
  }, []);

  const uploadCover = useCallback(
    async (userId: string, base64Image: string): Promise<Result<string, SupabaseError>> => {
      setUploading(true);
      const res = await storageService.uploadTabungCover(userId, accountId, base64Image);
      setUploading(false);
      return res;
    },
    [accountId],
  );

  /** Remove a cover uploaded in this edit but not saved (Cancel / Discard / picked another). */
  const discardCover = useCallback(async (path: string) => {
    await storageService.deleteTabungCover(path);
  }, []);

  /** A signed URL for a cover path (1 hour), or null. */
  const coverUrl = useCallback(async (path: string): Promise<string | null> => {
    const res = await storageService.getTabungCoverUrls([path]);
    return res.ok ? res.data[path] ?? null : null;
  }, []);

  const clearError = useCallback((field: keyof TabungEditErrors) => {
    setErrors((prev) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  return { save, undo, finalize, uploadCover, discardCover, coverUrl, saving, uploading, errors, clearError };
}
