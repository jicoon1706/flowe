import { hashPin } from './pinCrypto';
import { flags } from './secureStore';
import { edgeFunctionsService } from '../services/edgeFunctions';

/**
 * Checks a PIN against the device copy first, then the server.
 *
 * The device copy (secure-store) is what makes unlocking work offline, and
 * the only copy that exists if anonymous sign-in failed during setup.
 *
 * When the device copy doesn't match (or is missing, e.g. after a reinstall),
 * the PIN is checked by the `verify-pin` edge function. The app never reads
 * the server's stored hash (it isn't readable by clients), and a wrong PIN here
 * counts towards the server's 5-attempt lockout. When the server accepts the
 * PIN, the device copy is refreshed so the next unlock works offline.
 */
export async function verifyPin(pin: string, userId: string | null | undefined): Promise<boolean> {
  const hashed = await hashPin(pin);

  let local: string | null = null;
  try {
    local = await flags.pinHash();
  } catch {
    local = null;
  }
  if (local && hashed === local) return true;

  if (!userId) return false;
  const remote = await edgeFunctionsService.checkPin(pin);
  if (!remote.ok || !remote.data.ok) return false;

  try {
    await flags.storePinHash(hashed);
  } catch {
    // Unlocking still succeeds; the device copy is refreshed next time.
  }
  return true;
}
