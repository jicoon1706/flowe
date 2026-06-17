import { useState, useCallback } from 'react';
import { assetsRepository, CreateAssetRequest } from '../repositories/assets.repository';
import type { Asset } from '../types';
import type { SupabaseError } from '../utils/result';
import { notify, formatRM } from '../services/notifications';

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
    if (result.ok) {
      notify({ type: 'asset', emoji: '🏦', message: 'Asset added', sub_text: `${req.name} • ${formatRM(req.current_value)}`, related_entity_id: result.data.id });
      await fetchAssets();
    } else setError(result.error);
    setLoading(false);
    return result;
  }, [fetchAssets]);

  const updateAsset = useCallback(async (id: string, patch: Partial<Asset>) => {
    setLoading(true);
    setError(null);
    const result = await assetsRepository.update(id, patch);
    if (result.ok) {
      const name = patch.name ?? assets.find((a) => a.id === id)?.name ?? 'Asset';
      const value = patch.current_value ?? assets.find((a) => a.id === id)?.current_value ?? 0;
      notify({ type: 'asset', emoji: '🏦', message: 'Asset updated', sub_text: `${name} • ${formatRM(value)}`, related_entity_id: id });
      await fetchAssets();
    } else setError(result.error);
    setLoading(false);
    return result;
  }, [fetchAssets, assets]);

  const deleteAsset = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    const name = assets.find((a) => a.id === id)?.name ?? 'Asset';
    const result = await assetsRepository.softDelete(id);
    if (result.ok) {
      notify({ type: 'asset', emoji: '🏦', message: 'Asset removed', sub_text: name, related_entity_id: id });
      await fetchAssets();
    } else setError(result.error);
    setLoading(false);
    return result;
  }, [fetchAssets, assets]);

  return { assets, loading, error, fetchAssets, createAsset, updateAsset, deleteAsset };
}