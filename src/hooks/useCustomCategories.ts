import { useState, useCallback } from 'react';
import { customCategoriesRepository } from '../repositories/customCategories.repository';
import type { CustomCategory } from '../types';
import type { SupabaseError } from '../utils/result';

export function useCustomCategories() {
  const [categories, setCategories] = useState<CustomCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<SupabaseError | null>(null);

  const fetchCategories = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    const result = await customCategoriesRepository.fetchAll(userId);
    if (result.ok) setCategories(result.data);
    else setError(result.error);
    setLoading(false);
  }, []);

  const createCategory = useCallback(async (req: Omit<CustomCategory, 'id' | 'created_at' | 'is_active'>) => {
    setLoading(true);
    setError(null);
    const result = await customCategoriesRepository.create(req);
    setLoading(false);
    return result;
  }, []);

  const updateCategory = useCallback(
    async (id: string, patch: Partial<Pick<CustomCategory, 'name' | 'icon' | 'color'>>) => {
      setLoading(true);
      setError(null);
      const result = await customCategoriesRepository.update(id, patch);
      if (!result.ok) setError(result.error);
      setLoading(false);
      return result;
    },
    []
  );

  // Soft delete: the rows stay so transactions already filed under this
  // category keep resolving their name and colour, they just leave the picker.
  const deleteCategory = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    const result = await customCategoriesRepository.softDelete(id);
    if (!result.ok) setError(result.error);
    setLoading(false);
    return result;
  }, []);

  return { categories, loading, error, fetchCategories, createCategory, updateCategory, deleteCategory };
}