import { supabase } from '../lib/supabase';
import { localYMD } from '../utils/date';
import type { Result, EdgeFunctionError } from '../utils/result';
import type { CashflowSummary, AnalysisMonthly, ReceiptData } from '../types';

export interface DesktopPairingCode {
  /** Shown as "XXXX-XXXX". */
  code: string;
  /** ISO time the code stops working. */
  expiresAt: string;
}

/** verify-pin's answer to a PIN check. A wrong PIN is not an error: `ok` is false. */
export interface PinCheck {
  ok: boolean;
  attemptsLeft?: number;
  lockedUntil?: string | null;
}

/** HTTP status of a failed invoke (FunctionsHttpError carries the Response as `context`). */
function statusOf(error: unknown): number | undefined {
  const status = (error as { context?: { status?: unknown } } | null)?.context?.status;
  return typeof status === 'number' ? status : undefined;
}

async function invokeVerifyPin(body: Record<string, unknown>): Promise<Result<PinCheck, EdgeFunctionError>> {
  const { data, error } = await supabase.functions.invoke('verify-pin', { body });
  if (error) {
    const status = statusOf(error);
    return { ok: false, error: { message: error.message, code: status === undefined ? undefined : String(status) } };
  }
  const res = (data ?? {}) as PinCheck & { error?: string };
  if (typeof res.ok !== 'boolean') return { ok: false, error: { message: res.error ?? 'Empty response' } };
  return { ok: true, data: { ok: res.ok, attemptsLeft: res.attemptsLeft, lockedUntil: res.lockedUntil ?? null } };
}

export const edgeFunctionsService = {
  /**
   * The PIN lives only on the server (`verify-pin`). These three calls are the
   * only way the app sets, checks or changes it; it never reads the stored hash.
   */
  checkPin(pin: string): Promise<Result<PinCheck, EdgeFunctionError>> {
    return invokeVerifyPin({ pin });
  },

  /** First-time setup. Fails with code '409' when the account already has a PIN. */
  setPin(pin: string, fingerprintEnabled: boolean): Promise<Result<PinCheck, EdgeFunctionError>> {
    return invokeVerifyPin({ action: 'set', pin, fingerprintEnabled });
  },

  /** Needs the current PIN. Fails with code '409' when the account has no server PIN yet. */
  changePin(pin: string, newPin: string): Promise<Result<PinCheck, EdgeFunctionError>> {
    return invokeVerifyPin({ action: 'change', pin, newPin });
  },

  // Extract structured fields from a base64 receipt image via the `receipt-ocr`
  // Edge Function (OpenAI vision). The image is sent raw — no transaction exists
  // yet at scan time, so it isn't uploaded to the receipts bucket until submit.
  async scanReceipt(base64Image: string): Promise<Result<ReceiptData, EdgeFunctionError>> {
    // The model can't know what day it is, so ambiguous years (a smudged or
    // 2-digit year) used to come back hallucinated. Sending the device's local
    // date lets the function anchor every date rule to the user's today.
    const today = localYMD(new Date());
    const { data, error } = await supabase.functions.invoke('receipt-ocr', {
      body: { image: base64Image, today },
    });
    if (error) return { ok: false, error: { message: error.message, code: error.code } };
    // The function returns { error } (200-wrapped as data by some clients) or the payload.
    if (data && typeof data === 'object' && 'error' in data) {
      return { ok: false, error: { message: String((data as any).error) } };
    }
    return { ok: true, data: data as ReceiptData };
  },

  /**
   * A one-time code for signing Flowe Desktop in as this user (`desktop-pair`).
   * It lasts 5 minutes; asking again replaces the previous code.
   */
  async createDesktopPairingCode(): Promise<Result<DesktopPairingCode, EdgeFunctionError>> {
    const { data, error } = await supabase.functions.invoke('desktop-pair', { body: { action: 'create' } });
    if (error) return { ok: false, error: { message: error.message, code: error.code } };
    const body = data as Partial<DesktopPairingCode> & { error?: string };
    if (!body?.code || !body.expiresAt) return { ok: false, error: { message: body?.error ?? 'No code returned' } };
    return { ok: true, data: { code: body.code, expiresAt: body.expiresAt } };
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