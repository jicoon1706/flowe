import { flags } from '@/src/lib/secureStore';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const SecureStore = require('expo-secure-store');

describe('flags', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('pinSet()', () => {
    it('returns false when not set', async () => {
      SecureStore.getItemAsync.mockResolvedValue(null);
      const result = await flags.pinSet();
      expect(result).toBe(false);
    });
  });

  describe('onboardingDone()', () => {
    it('returns false when not set', async () => {
      SecureStore.getItemAsync.mockResolvedValue(null);
      const result = await flags.onboardingDone();
      expect(result).toBe(false);
    });
  });

  describe('fingerprintEnabled()', () => {
    it('returns false when not set', async () => {
      SecureStore.getItemAsync.mockResolvedValue(null);
      const result = await flags.fingerprintEnabled();
      expect(result).toBe(false);
    });
  });

  describe('setPin()', () => {
    it('sets all three keys with fingerprintEnabled=true', async () => {
      await flags.setPin('testhash', true);
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('flowe.pin_hash');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('flowe.fingerprint_enabled');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('flowe.pin_set');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('flowe.pin_hash', 'testhash');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('flowe.fingerprint_enabled', '1');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('flowe.pin_set', '1');
    });

    it('sets all three keys with fingerprintEnabled=false', async () => {
      await flags.setPin('testhash', false);
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('flowe.pin_hash', 'testhash');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('flowe.fingerprint_enabled', '0');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('flowe.pin_set', '1');
    });
  });

  describe('markOnboardingDone()', () => {
    it('sets onboardingDone to 1', async () => {
      await flags.markOnboardingDone();
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('flowe.onboarding_done', '1');
    });
  });

  describe('unsetPin()', () => {
    it('deletes all pin-related keys', async () => {
      await flags.unsetPin();
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('flowe.pin_hash');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('flowe.fingerprint_enabled');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('flowe.pin_set');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('flowe.onboarding_done');
    });
  });
});