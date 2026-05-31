import { useState, useEffect, useCallback } from 'react';
import { edgeFunctionsService } from '../services/edgeFunctions';
import type { AnalysisMonthly } from '../types';
import type { EdgeFunctionError } from '../utils/result';

export function useAnalysis(month: string) {
  const [analysis, setAnalysis] = useState<AnalysisMonthly | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<EdgeFunctionError | null>(null);

  const fetchAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await edgeFunctionsService.getAnalysis(month);
    if (result.ok) setAnalysis(result.data);
    else setError(result.error);
    setLoading(false);
  }, [month]);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  return { analysis, loading, error, refetch: fetchAnalysis };
}