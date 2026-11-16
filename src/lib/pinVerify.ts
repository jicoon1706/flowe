import { hashPin } from './pinCrypto';
import { flags } from './secureStore';
import { authConfigRepository } from '../repositories/authConfig.repository';

/**
 * Checks a PIN against both stored copies of its hash.
 *
 * The device copy (secure-store) is what makes unlocking work offline, and
 * the only copy that exists if anonymous sign-in failed during setup. It used
 * to be written but never read, so the lock screen needed the network to
 * accept a correct PIN (AUDIT #1).
 *
 * The server copy (`auth_config.pin_hash`) is still consulted when the device
 * copy doesn't match. Changing the PIN used to update only the server, so a
 * user who did that before this fix has their current PIN only there. When the
 * server matches, the device copy is refreshed so the next unlock works offline.
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
  const remote = await authConfigRepository.fetch(userId);
  if (!remote.ok || !remote.data?.pin_hash) return false;
  if (hashed !== remote.data.pin_hash) return false;

  if (local !== hashed) {
    try {
      await flags.storePinHash(hashed);
    } catch {
      // Unlocking still succeeds; the device copy is refreshed next time.
    }
  }
  return true;
}
