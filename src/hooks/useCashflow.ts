import { useState, useEffect, useCallback } from 'react';
import { edgeFunctionsService } from '../services/edgeFunctions';
import type { CashflowSummary } from '../types';
import type { EdgeFunctionError } from '../utils/result';

export function useCashflow(month: string) {
  const [summary, setSummary] = useState<CashflowSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<EdgeFunctionError | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await edgeFunctionsService.getCashflowSummary(month);
    if (result.ok) setSummary(result.data);
    else setError(result.error);
    setLoading(false);
  }, [month]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { summary, loading, error, refetch };
}
