// AUDIT #18 part 1: investments move an asset's value through one atomic RPC.

const mockRpc = jest.fn();
jest.mock('../src/lib/supabase', () => ({
  supabase: { rpc: (...args: any[]) => mockRpc(...args) },
}));

import { assetsRepository } from '../src/repositories/assets.repository';

beforeEach(() => mockRpc.mockReset());

it('calls adjust_asset_value with the delta and month', async () => {
  mockRpc.mockResolvedValue({ data: '1250.50', error: null });
  const result = await assetsRepository.adjustValue('asset-1', 250.5, '2026-11-01');
  expect(mockRpc).toHaveBeenCalledWith('adjust_asset_value', {
    p_asset_id: 'asset-1',
    p_delta: 250.5,
    p_month: '2026-11-01',
  });
  expect(result).toEqual({ ok: true, data: 1250.5 });
});

it('passes a negative delta through for a reversal', async () => {
  mockRpc.mockResolvedValue({ data: 0, error: null });
  await assetsRepository.adjustValue('asset-1', -80, '2026-11-01');
  expect(mockRpc.mock.calls[0][1].p_delta).toBe(-80);
});

it('reports null when the asset is not the caller\'s or is gone', async () => {
  mockRpc.mockResolvedValue({ data: null, error: null });
  await expect(assetsRepository.adjustValue('missing', 10, '2026-11-01')).resolves.toEqual({ ok: true, data: null });
});

it('turns an RPC error into a failed Result instead of throwing', async () => {
  mockRpc.mockResolvedValue({ data: null, error: { code: 'PGRST202', message: 'function not found' } });
  const result = await assetsRepository.adjustValue('asset-1', 10, '2026-11-01');
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.error.code).toBe('PGRST202');
});
