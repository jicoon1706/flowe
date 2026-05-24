import { useState, useEffect } from 'react';
import { edgeFunctionsService } from '../services/edgeFunctions';
import type { CashflowSummary } from '../types';
import type { EdgeFunctionError } from '../utils/result';

export function useCashflow(month: string) {
  const [summary, setSummary] = useState<CashflowSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<EdgeFunctionError | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    edgeFunctionsService.getCashflowSummary(month).then(result => {
      if (result.ok) setSummary(result.data);
      else setError(result.error);
      setLoading(false);
    });
  }, [month]);

  return { summary, loading, error };
}