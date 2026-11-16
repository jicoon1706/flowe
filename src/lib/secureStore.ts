import * as SecureStore from 'expo-secure-store';

const KEYS = {
  pinSet: 'flowe.pin_set',
  pinHash: 'flowe.pin_hash',
  fingerprintEnabled: 'flowe.fingerprint_enabled',
  onboardingDone: 'flowe.onboarding_done',
} as const;

export const flags = {
  async pinSet(): Promise<boolean> {
    return (await SecureStore.getItemAsync(KEYS.pinSet)) === '1';
  },
  async onboardingDone(): Promise<boolean> {
    return (await SecureStore.getItemAsync(KEYS.onboardingDone)) === '1';
  },
  async fingerprintEnabled(): Promise<boolean> {
    return (await SecureStore.getItemAsync(KEYS.fingerprintEnabled)) === '1';
  },
  /** The device copy of the PIN hash, written by `setPin`. Null when absent. */
  async pinHash(): Promise<string | null> {
    return SecureStore.getItemAsync(KEYS.pinHash);
  },
  /** Refreshes the device copy of the PIN hash alone (same key and format as `setPin`). */
  async storePinHash(hash: string): Promise<void> {
    await SecureStore.setItemAsync(KEYS.pinHash, hash);
  },
  /** What the lock screen reads to decide whether to offer fingerprint. */
  async setFingerprintEnabled(enabled: boolean): Promise<void> {
    await SecureStore.setItemAsync(KEYS.fingerprintEnabled, enabled ? '1' : '0');
  },
  async setPin(hash: string, fingerprintEnabled: boolean): Promise<void> {
    // Clear old values first to prevent stale data
    await SecureStore.deleteItemAsync(KEYS.pinHash);
    await SecureStore.deleteItemAsync(KEYS.fingerprintEnabled);
    await SecureStore.deleteItemAsync(KEYS.pinSet);
    // Set new values
    await SecureStore.setItemAsync(KEYS.pinHash, hash);
    await SecureStore.setItemAsync(KEYS.fingerprintEnabled, fingerprintEnabled ? '1' : '0');
    await SecureStore.setItemAsync(KEYS.pinSet, '1');
  },
  async unsetPin(): Promise<void> {
    await SecureStore.deleteItemAsync(KEYS.pinHash);
    await SecureStore.deleteItemAsync(KEYS.fingerprintEnabled);
    await SecureStore.deleteItemAsync(KEYS.pinSet);
    await SecureStore.deleteItemAsync(KEYS.onboardingDone);
  },
  async markOnboardingDone(): Promise<void> {
    await SecureStore.setItemAsync(KEYS.onboardingDone, '1');
  },
};