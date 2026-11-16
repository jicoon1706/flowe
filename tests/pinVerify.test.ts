// AUDIT #1: a correct PIN must unlock offline and without a signed-in user,
// and a PIN changed on the server before the fix must keep working.

jest.mock('../src/lib/pinCrypto', () => ({ hashPin: async (pin: string) => `h:${pin}` }));
jest.mock('../src/lib/secureStore', () => ({
  flags: { pinHash: jest.fn(), storePinHash: jest.fn() },
}));
jest.mock('../src/repositories/authConfig.repository', () => ({
  authConfigRepository: { fetch: jest.fn() },
}));

import { verifyPin } from '../src/lib/pinVerify';
const { flags } = require('../src/lib/secureStore');
const { authConfigRepository } = require('../src/repositories/authConfig.repository');

const offline = { ok: false, error: { code: 'NETWORK', message: 'offline' } };
const server = (pin_hash: string) => ({ ok: true, data: { pin_hash, fingerprint_enabled: false, auto_lock_minutes: 5 } });

beforeEach(() => {
  jest.clearAllMocks();
  authConfigRepository.fetch.mockResolvedValue(offline);
});

it('accepts the right PIN from the device copy while offline', async () => {
  flags.pinHash.mockResolvedValue('h:123456');
  await expect(verifyPin('123456', 'user-1')).resolves.toBe(true);
  expect(authConfigRepository.fetch).not.toHaveBeenCalled();
});

it('accepts the right PIN with no signed-in user (PIN saved locally only)', async () => {
  flags.pinHash.mockResolvedValue('h:123456');
  await expect(verifyPin('123456', null)).resolves.toBe(true);
});

it('rejects a wrong PIN offline', async () => {
  flags.pinHash.mockResolvedValue('h:123456');
  await expect(verifyPin('000000', 'user-1')).resolves.toBe(false);
});

it('accepts a PIN only the server knows, and refreshes the device copy', async () => {
  flags.pinHash.mockResolvedValue('h:111111');
  authConfigRepository.fetch.mockResolvedValue(server('h:222222'));
  await expect(verifyPin('222222', 'user-1')).resolves.toBe(true);
  expect(flags.storePinHash).toHaveBeenCalledWith('h:222222');
});

it('falls back to the server when the device has no copy', async () => {
  flags.pinHash.mockResolvedValue(null);
  authConfigRepository.fetch.mockResolvedValue(server('h:123456'));
  await expect(verifyPin('123456', 'user-1')).resolves.toBe(true);
});

it('rejects when neither copy matches', async () => {
  flags.pinHash.mockResolvedValue('h:111111');
  authConfigRepository.fetch.mockResolvedValue(server('h:222222'));
  await expect(verifyPin('333333', 'user-1')).resolves.toBe(false);
  expect(flags.storePinHash).not.toHaveBeenCalled();
});
