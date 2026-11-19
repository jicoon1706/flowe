/** Longest name the Add / Edit transaction field accepts. */
export const TX_NAME_MAX = 60;

/** Caps a name at TX_NAME_MAX characters (used for typing and for a scanned merchant). */
export function clampTxName(raw: string): string {
  return raw.slice(0, TX_NAME_MAX);
}

/**
 * Name saved on the transaction: the trimmed, capped input, or the fallback
 * (category label, "Transfer to …") when the field is left empty.
 */
export function resolveTxName(input: string, fallback: string): string {
  return clampTxName(input.trim()).trim() || fallback;
}
