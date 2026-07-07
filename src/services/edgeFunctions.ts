import { supabase } from '../lib/supabase';
import type { Result, EdgeFunctionError } from '../utils/result';
import type { CashflowSummary, AnalysisMonthly, ReceiptData } from '../types';

export const edgeFunctionsService = {
  // Extract structured fields from a base64 receipt image via the `receipt-ocr`
  // Edge Function (OpenAI vision). The image is sent raw — no transaction exists
  // yet at scan time, so it isn't uploaded to the receipts bucket until submit.
  async scanReceipt(base64Image: string): Promise<Result<ReceiptData, EdgeFunctionError>> {
    const { data, error } = await supabase.functions.invoke('receipt-ocr', {
      body: { image: base64Image },
    });
    if (error) return { ok: false, error: { message: error.message, code: error.code } };
    // The function returns { error } (200-wrapped as data by some clients) or the payload.
    if (data && typeof data === 'object' && 'error' in data) {
      return { ok: false, error: { message: String((data as any).error) } };
    }
    return { ok: true, data: data as ReceiptData };
  },

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