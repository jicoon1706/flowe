import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// verify-pin — the only place a PIN is set, checked or changed. Flowe Desktop
// uses it for its lock screen and Settings › Change PIN; the phone uses it for
// first-time setup, Change PIN, and unlocking when its device copy is missing.
//
//   POST { pin }                                   → { ok: true } | { ok: false, attemptsLeft, lockedUntil }
//   POST { action: 'change', pin, newPin }         → same, and on success the PIN becomes newPin
//   POST { action: 'set', pin, fingerprintEnabled } → { ok: true } when the user has no PIN yet,
//                                                      409 { error: 'PIN already set' } otherwise
//
// The caller is identified only by the session token. auth_config.pin_hash is
// not readable or writable by clients (migration 20261126_pin_hash_server_only);
// it is read and written here with the service role and never returned. Five
// wrong PINs lock PIN entry for 15 minutes (public.pin_attempts, service role
// only); desktop-pair counts against the same lock.
//
// Stored format: pbkdf2$<iterations>$<salt base64>$<hash hex>. Older rows hold
// a bare SHA-256 hex digest; they still verify and are upgraded on success.
//
// Single file (no ../_shared import) so it can be pasted into the dashboard.
// The hashing helpers are duplicated in desktop-pair/index.ts; keep them equal.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const MAX_FAILED = 5;
const LOCK_MS = 15 * 60 * 1000;
const PIN_RE = /^\d{6}$/;
const PBKDF2_ITERATIONS = 100_000;

type Admin = ReturnType<typeof createClient>;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

// ── PIN hashing (keep in sync with desktop-pair) ────────────────────────────

const toHex = (buf: ArrayBuffer) => Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
const toB64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const fromB64 = (text: string) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0));

async function sha256Hex(text: string): Promise<string> {
  return toHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)));
}

async function pbkdf2Hex(pin: string, salt: Uint8Array, iterations: number): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']);
  return toHex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256));
}

/** A fresh salted, slow hash of the PIN, in the stored format. */
async function hashPinForStorage(pin: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2$${PBKDF2_ITERATIONS}$${toB64(salt)}$${await pbkdf2Hex(pin, salt, PBKDF2_ITERATIONS)}`;
}

/** Compares two strings without returning early on the first difference. */
function sameText(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Whether `pin` matches `stored`; `legacy` is true for a bare SHA-256 row that should be upgraded. */
async function pinMatches(pin: string, stored: string): Promise<{ ok: boolean; legacy: boolean }> {
  const parts = stored.split('$');
  if (parts.length === 4 && parts[0] === 'pbkdf2') {
    const iterations = Number(parts[1]);
    if (!Number.isInteger(iterations) || iterations < 1) return { ok: false, legacy: false };
    return { ok: sameText(await pbkdf2Hex(pin, fromB64(parts[2]), iterations), parts[3]), legacy: false };
  }
  return { ok: sameText(await sha256Hex(pin), stored), legacy: true };
}

// ── Lockout ──────────────────────────────────────────────────────────────────

interface Attempts { failed: number; locked_until: string | null }

async function readAttempts(admin: Admin, userId: string): Promise<Attempts> {
  const { data } = await admin.from('pin_attempts').select('failed, locked_until').eq('user_id', userId).maybeSingle();
  return (data as Attempts | null) ?? { failed: 0, locked_until: null };
}

/** Records a wrong PIN; returns what the client shows next. */
async function recordFailure(admin: Admin, userId: string, current: Attempts) {
  const failed = current.failed + 1;
  const lock = failed >= MAX_FAILED;
  const lockedUntil = lock ? new Date(Date.now() + LOCK_MS).toISOString() : null;
  await admin.from('pin_attempts').upsert({ user_id: userId, failed: lock ? 0 : failed, locked_until: lockedUntil, updated_at: new Date().toISOString() });
  return { ok: false, attemptsLeft: lock ? 0 : MAX_FAILED - failed, lockedUntil };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const url = Deno.env.get('SUPABASE_URL')!;
  const authHeader = req.headers.get('Authorization') ?? '';
  const caller = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
  const { data: userData, error: userError } = await caller.auth.getUser();
  if (userError || !userData.user) return json({ error: 'Not signed in' }, 401);
  const userId = userData.user.id;

  let body: { action?: string; pin?: unknown; newPin?: unknown; fingerprintEnabled?: unknown };
  try { body = await req.json(); } catch { return json({ error: 'Invalid body' }, 400); }
  const pin = typeof body.pin === 'string' ? body.pin : '';
  const change = body.action === 'change';
  const set = body.action === 'set';
  const newPin = typeof body.newPin === 'string' ? body.newPin : '';
  if (!PIN_RE.test(pin) || (change && !PIN_RE.test(newPin))) return json({ error: 'A PIN is 6 digits' }, 400);

  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

  const { data: config, error: configError } = await admin.from('auth_config').select('pin_hash').eq('user_id', userId).maybeSingle();
  if (configError) return json({ error: 'Could not read PIN' }, 500);
  const stored = (config as { pin_hash: string | null } | null)?.pin_hash;

  // First-time setup. Never replaces an existing PIN: that needs the old one ('change').
  if (set) {
    if (stored) return json({ error: 'PIN already set' }, 409);
    const { error } = await admin.from('auth_config').upsert(
      { user_id: userId, pin_hash: await hashPinForStorage(pin), fingerprint_enabled: body.fingerprintEnabled === true, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    );
    if (error) return json({ error: 'Could not save PIN' }, 500);
    return json({ ok: true });
  }

  const attempts = await readAttempts(admin, userId);
  if (attempts.locked_until && new Date(attempts.locked_until).getTime() > Date.now()) {
    return json({ ok: false, attemptsLeft: 0, lockedUntil: attempts.locked_until });
  }

  if (!stored) return json({ error: 'No PIN set' }, 409);

  const match = await pinMatches(pin, stored);
  if (!match.ok) return json(await recordFailure(admin, userId, attempts));

  await admin.from('pin_attempts').upsert({ user_id: userId, failed: 0, locked_until: null, updated_at: new Date().toISOString() });

  if (change || match.legacy) {
    const { error } = await admin
      .from('auth_config')
      .update({ pin_hash: await hashPinForStorage(change ? newPin : pin), updated_at: new Date().toISOString() })
      .eq('user_id', userId);
    if (error && change) return json({ error: 'Could not change PIN' }, 500);
  }
  return json({ ok: true });
});
