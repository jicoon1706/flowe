import { useState, useEffect } from 'react';
import { edgeFunctionsService } from '../services/edgeFunctions';
import type { AnalysisMonthly } from '../types';
import type { EdgeFunctionError } from '../utils/result';

export function useAnalysis(month: string) {
  const [analysis, setAnalysis] = useState<AnalysisMonthly | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<EdgeFunctionError | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    edgeFunctionsService.getAnalysis(month).then(result => {
      if (result.ok) setAnalysis(result.data);
      else setError(result.error);
      setLoading(false);
    });
  }, [month]);

  return { analysis, loading, error };
}