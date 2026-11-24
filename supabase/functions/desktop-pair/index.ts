import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// desktop-pair — signs Flowe Desktop in as the phone's user.
//
//   Phone (signed in):   POST { action: 'create' }
//                        → { code: 'K7Q2-M9XD', expiresAt }
//   Desktop (no session): POST { action: 'redeem', code, pin }
//                        → { ok: true, session: { access_token, refresh_token }, displayName }
//                        | { ok: false, reason: 'code' }                       (unknown / expired / used)
//                        | { ok: false, reason: 'pin', attemptsLeft, lockedUntil }
//
// Deployed with verify_jwt = false because the desktop has no session yet;
// 'create' checks the caller's token itself.
//
// Codes: 8 characters from a 32-letter alphabet (40 bits), stored only as
// SHA-256, valid 5 minutes, single use, voided after 5 wrong PINs. Wrong PINs
// also count against the user's PIN lock (pin_attempts, shared with verify-pin).
//
// Session: Supabase can't issue a session for an anonymous user from the
// server. The first pairing gives the account a placeholder address
// (<user id>@desktop.flowe.invalid, confirmed, never mailed); the session then
// comes from a server-side magic-link exchange. The phone's own session is
// unaffected.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const CODE_TTL_MS = 5 * 60 * 1000;
const MAX_FAILED = 5;
const LOCK_MS = 15 * 60 * 1000;
const PIN_RE = /^\d{6}$/;
const PLACEHOLDER_DOMAIN = 'desktop.flowe.invalid';

type Admin = ReturnType<typeof createClient>;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

// ── PIN hashing (copied from verify-pin; keep them equal) ───────────────────

const toHex = (buf: ArrayBuffer) => Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
const fromB64 = (text: string) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0));

async function sha256Hex(text: string): Promise<string> {
  return toHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)));
}

async function pbkdf2Hex(pin: string, salt: Uint8Array, iterations: number): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']);
  return toHex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256));
}

function sameText(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Whether `pin` matches a stored hash: pbkdf2$iter$salt$hex, or a legacy bare SHA-256 hex. */
async function pinMatches(pin: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length === 4 && parts[0] === 'pbkdf2') {
    const iterations = Number(parts[1]);
    if (!Number.isInteger(iterations) || iterations < 1) return false;
    return sameText(await pbkdf2Hex(pin, fromB64(parts[2]), iterations), parts[3]);
  }
  return sameText(await sha256Hex(pin), stored);
}

function newCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (b) => ALPHABET[b & 31]).join('');
}

/** Accepts "k7q2-m9xd", "K7Q2 M9XD", and reads O as 0 and I/L as 1. */
function normaliseCode(raw: string): string {
  return raw.toUpperCase().replace(/[\s-]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1');
}

async function createCode(req: Request, url: string, admin: Admin): Promise<Response> {
  const caller = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } });
  const { data, error } = await caller.auth.getUser();
  if (error || !data.user) return json({ error: 'Not signed in' }, 401);
  const userId = data.user.id;

  const { data: config } = await admin.from('auth_config').select('pin_hash').eq('user_id', userId).maybeSingle();
  if (!(config as { pin_hash: string | null } | null)?.pin_hash) return json({ error: 'Set a PIN first' }, 409);

  // One live code per user: a new one replaces any unused one.
  await admin.from('desktop_pairings').delete().eq('user_id', userId).is('used_at', null);

  const code = newCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MS).toISOString();
  const { error: insertError } = await admin.from('desktop_pairings').insert({ user_id: userId, code_hash: await sha256Hex(code), expires_at: expiresAt });
  if (insertError) return json({ error: 'Could not create a code' }, 500);
  return json({ code: `${code.slice(0, 4)}-${code.slice(4)}`, expiresAt });
}

interface Pairing { id: string; user_id: string; failed: number }
interface Attempts { failed: number; locked_until: string | null }

async function redeemCode(body: { code?: unknown; pin?: unknown }, url: string, admin: Admin): Promise<Response> {
  const code = typeof body.code === 'string' ? normaliseCode(body.code) : '';
  const pin = typeof body.pin === 'string' ? body.pin : '';
  if (code.length !== 8 || !PIN_RE.test(pin)) return json({ error: 'Enter the 8-character code and your 6-digit PIN' }, 400);

  const { data: row } = await admin
    .from('desktop_pairings')
    .select('id, user_id, failed')
    .eq('code_hash', await sha256Hex(code))
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();
  const pairing = row as Pairing | null;
  if (!pairing) return json({ ok: false, reason: 'code' });

  const { data: attemptsRow } = await admin.from('pin_attempts').select('failed, locked_until').eq('user_id', pairing.user_id).maybeSingle();
  const attempts = (attemptsRow as Attempts | null) ?? { failed: 0, locked_until: null };
  if (attempts.locked_until && new Date(attempts.locked_until).getTime() > Date.now()) {
    return json({ ok: false, reason: 'pin', attemptsLeft: 0, lockedUntil: attempts.locked_until });
  }

  const { data: config } = await admin.from('auth_config').select('pin_hash').eq('user_id', pairing.user_id).maybeSingle();
  const stored = (config as { pin_hash: string | null } | null)?.pin_hash ?? '';
  const now = new Date().toISOString();

  if (!stored || !(await pinMatches(pin, stored))) {
    const pairingFailed = pairing.failed + 1;
    await admin.from('desktop_pairings').update({ failed: pairingFailed, used_at: pairingFailed >= MAX_FAILED ? now : null }).eq('id', pairing.id);
    const failed = attempts.failed + 1;
    const lock = failed >= MAX_FAILED;
    const lockedUntil = lock ? new Date(Date.now() + LOCK_MS).toISOString() : null;
    await admin.from('pin_attempts').upsert({ user_id: pairing.user_id, failed: lock ? 0 : failed, locked_until: lockedUntil, updated_at: now });
    return json({ ok: false, reason: 'pin', attemptsLeft: lock ? 0 : Math.min(MAX_FAILED - failed, MAX_FAILED - pairingFailed), lockedUntil });
  }

  // Single use, claimed before the session is issued.
  const { data: claimed } = await admin.from('desktop_pairings').update({ used_at: now }).eq('id', pairing.id).is('used_at', null).select('id');
  if (!claimed || claimed.length === 0) return json({ ok: false, reason: 'code' });
  await admin.from('pin_attempts').upsert({ user_id: pairing.user_id, failed: 0, locked_until: null, updated_at: now });

  const { data: userData, error: userError } = await admin.auth.admin.getUserById(pairing.user_id);
  if (userError || !userData.user) return json({ error: 'Account not found' }, 404);
  let email = userData.user.email ?? '';
  if (!email) {
    email = `${pairing.user_id}@${PLACEHOLDER_DOMAIN}`;
    const { error } = await admin.auth.admin.updateUserById(pairing.user_id, { email, email_confirm: true });
    if (error) return json({ error: 'Could not prepare the account for desktop' }, 500);
  }

  const { data: link, error: linkError } = await admin.auth.admin.generateLink({ type: 'magiclink', email });
  const tokenHash = link?.properties?.hashed_token;
  if (linkError || !tokenHash) return json({ error: 'Could not start a desktop session' }, 500);

  const anon = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { auth: { persistSession: false } });
  const { data: verified, error: verifyError } = await anon.auth.verifyOtp({ token_hash: tokenHash, type: 'magiclink' });
  if (verifyError || !verified.session) return json({ error: 'Could not start a desktop session' }, 500);

  const { data: profile } = await admin.from('profiles').select('display_name').eq('id', pairing.user_id).maybeSingle();
  return json({
    ok: true,
    session: { access_token: verified.session.access_token, refresh_token: verified.session.refresh_token },
    displayName: (profile as { display_name: string | null } | null)?.display_name ?? null,
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let body: { action?: unknown; code?: unknown; pin?: unknown };
  try { body = await req.json(); } catch { return json({ error: 'Invalid body' }, 400); }

  const url = Deno.env.get('SUPABASE_URL')!;
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

  if (body.action === 'create') return createCode(req, url, admin);
  if (body.action === 'redeem') return redeemCode(body, url, admin);
  return json({ error: 'Unknown action' }, 400);
});
