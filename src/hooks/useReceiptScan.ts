import { useState, useCallback } from 'react';
import { edgeFunctionsService } from '../services/edgeFunctions';
import type { ReceiptData } from '../types';
import type { EdgeFunctionError } from '../utils/result';

// Drives receipt OCR from the add-transaction screen. `scan` returns the parsed
// ReceiptData on success (or null on failure) so the caller can prefill the
// form inline, while this hook owns the loading/error state for the button UI.
export function useReceiptScan() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<EdgeFunctionError | null>(null);

  const scan = useCallback(async (base64Image: string): Promise<ReceiptData | null> => {
    setLoading(true);
    setError(null);
    const result = await edgeFunctionsService.scanReceipt(base64Image);
    setLoading(false);
    if (result.ok) return result.data;
    setError(result.error);
    return null;
  }, []);

  return { scan, loading, error };
}
