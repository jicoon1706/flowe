export type SupabaseError = {
  code: string;
  message: string;
  details?: string;
  hint?: string;
};

export type Result<T, E = SupabaseError> =
  | { ok: true; data: T }
  | { ok: false; error: E };

export type EdgeFunctionError = {
  message: string;
  code?: string;
};

export function fromSupabaseError(err: any): SupabaseError {
  return {
    code: err?.code ?? 'UNKNOWN',
    message: err?.message ?? 'An unknown error occurred',
    details: err?.details,
    hint: err?.hint,
  };
}