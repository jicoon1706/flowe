import { supabase } from '../lib/supabase';
import type { Result } from '../utils/result';
import type { EdgeFunctionError } from '../utils/result';
import type { CashflowSummary, AnalysisMonthly } from '../types';

export const edgeFunctionsService = {
  async getCashflowSummary(month: string): Promise<Result<CashflowSummary, EdgeFunctionError>> {
    const { data, error } = await supabase.functions.invoke('cashflow-summary', {
      body: { month },
    });
    if (error) return { ok: false, error: { message: error.message, code: error.code } };
    return { ok: true, data: data as CashflowSummary };
  },

  async getAnalysis(month: string): Promise<Result<AnalysisMonthly, EdgeFunctionError>> {
    const { data, error } = await supabase.functions.invoke('analysis-monthly', {
      body: { month },
    });
    if (error) return { ok: false, error: { message: error.message, code: error.code } };
    return { ok: true, data: data as AnalysisMonthly };
  },
};