import { useState, useCallback } from 'react';
import { assetsRepository, CreateAssetRequest } from '../repositories/assets.repository';
import type { Asset } from '../types';
import type { SupabaseError } from '../utils/result';

export function useAssets() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<SupabaseError | null>(null);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await assetsRepository.fetchAll();
    if (result.ok) setAssets(result.data);
    else setError(result.error);
    setLoading(false);
  }, []);

  const createAsset = useCallback(async (req: CreateAssetRequest) => {
    setLoading(true);
    setError(null);
    const result = await assetsRepository.create(req);
    if (result.ok) await fetchAssets();
    else setError(result.error);
    setLoading(false);
    return result;
  }, [fetchAssets]);

  return { assets, loading, error, fetchAssets, createAsset };
}