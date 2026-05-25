import { hashPin } from '../src/lib/pinCrypto';

jest.mock('expo-crypto', () => ({
  digestStringAsync: jest.fn(async (_alg: string, value: string) =>
    `hashed:${value}`
  ),
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
}));

describe('hashPin', () => {
  it('hashes the pin via SHA-256', async () => {
    const h = await hashPin('123456');
    expect(h).toBe('hashed:123456');
  });

  it('uses SHA-256 algorithm', async () => {
    const CryptoDigestAlgorithm = require('expo-crypto').CryptoDigestAlgorithm;
    const digestStringAsync = require('expo-crypto').digestStringAsync;
    await hashPin('123456');
    expect(digestStringAsync).toHaveBeenCalledWith(CryptoDigestAlgorithm.SHA256, '123456');
  });
});