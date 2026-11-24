// AUDIT #1: a correct PIN must unlock offline and without a signed-in user,
// and a PIN changed on the server before the fix must keep working.
// security-audit/run-1: the server's stored hash is never read; the server copy
// is checked by the verify-pin edge function instead.

jest.mock('../src/lib/pinCrypto', () => ({ hashPin: async (pin: string) => `h:${pin}` }));
jest.mock('../src/lib/secureStore', () => ({
  flags: { pinHash: jest.fn(), storePinHash: jest.fn() },
}));
jest.mock('../src/services/edgeFunctions', () => ({
  edgeFunctionsService: { checkPin: jest.fn() },
}));

import { verifyPin } from '../src/lib/pinVerify';
const { flags } = require('../src/lib/secureStore');
const { edgeFunctionsService } = require('../src/services/edgeFunctions');

const offline = { ok: false, error: { message: 'offline' } };
const server = (ok: boolean) => ({ ok: true, data: { ok } });

beforeEach(() => {
  jest.clearAllMocks();
  edgeFunctionsService.checkPin.mockResolvedValue(offline);
});

it('accepts the right PIN from the device copy while offline', async () => {
  flags.pinHash.mockResolvedValue('h:123456');
  await expect(verifyPin('123456', 'user-1')).resolves.toBe(true);
  expect(edgeFunctionsService.checkPin).not.toHaveBeenCalled();
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
  edgeFunctionsService.checkPin.mockResolvedValue(server(true));
  await expect(verifyPin('222222', 'user-1')).resolves.toBe(true);
  expect(edgeFunctionsService.checkPin).toHaveBeenCalledWith('222222');
  expect(flags.storePinHash).toHaveBeenCalledWith('h:222222');
});

it('falls back to the server when the device has no copy', async () => {
  flags.pinHash.mockResolvedValue(null);
  edgeFunctionsService.checkPin.mockResolvedValue(server(true));
  await expect(verifyPin('123456', 'user-1')).resolves.toBe(true);
});

it('rejects when neither copy matches', async () => {
  flags.pinHash.mockResolvedValue('h:111111');
  edgeFunctionsService.checkPin.mockResolvedValue(server(false));
  await expect(verifyPin('333333', 'user-1')).resolves.toBe(false);
  expect(flags.storePinHash).not.toHaveBeenCalled();
});

it('never reads the stored PIN hash from the database', () => {
  // Regression for security-audit/run-1 (owner-readable pin_hash): no client
  // code may select or write auth_config.pin_hash; verify-pin owns it.
  const fs = require('fs');
  const path = require('path');
  const root = path.join(__dirname, '..');
  const files = ['src/lib/pinVerify.ts', 'src/repositories/authConfig.repository.ts', 'app/(auth)/success.tsx', 'app/(main)/settings/change-pin.tsx'];
  for (const f of files) {
    // A column reference, not the migration name (…_pin_hash_server_only) in a comment.
    expect(fs.readFileSync(path.join(root, f), 'utf8')).not.toMatch(/(^|[^_\w])pin_hash\b/m);
  }
});
