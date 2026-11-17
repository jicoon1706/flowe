import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// verify-pin — the server-side PIN check Flowe Desktop uses for its lock screen
// and for Settings › Change PIN.
//
//   POST { pin }                         → { ok: true } | { ok: false, attemptsLeft, lockedUntil }
//   POST { action: 'change', pin, newPin } → same, and on success the PIN becomes newPin
//
// The caller is identified only by the session token (verify_jwt = true). The
// stored hash is read with the service role and never returned. Five wrong
// PINs lock PIN entry for 15 minutes (public.pin_attempts, service role only);
// desktop-pair counts against the same lock.
//
// Single file (no ../_shared import) so it can be pasted into the dashboard.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const MAX_FAILED = 5;
const LOCK_MS = 15 * 60 * 1000;
const PIN_RE = /^\d{6}$/;

type Admin = ReturnType<typeof createClient>;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Compares two strings without returning early on the first difference. */
function sameText(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

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

  let body: { action?: string; pin?: unknown; newPin?: unknown };
  try { body = await req.json(); } catch { return json({ error: 'Invalid body' }, 400); }
  const pin = typeof body.pin === 'string' ? body.pin : '';
  const change = body.action === 'change';
  const newPin = typeof body.newPin === 'string' ? body.newPin : '';
  if (!PIN_RE.test(pin) || (change && !PIN_RE.test(newPin))) return json({ error: 'A PIN is 6 digits' }, 400);

  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

  const attempts = await readAttempts(admin, userId);
  if (attempts.locked_until && new Date(attempts.locked_until).getTime() > Date.now()) {
    return json({ ok: false, attemptsLeft: 0, lockedUntil: attempts.locked_until });
  }

  const { data: config, error: configError } = await admin.from('auth_config').select('pin_hash').eq('user_id', userId).maybeSingle();
  if (configError) return json({ error: 'Could not read PIN' }, 500);
  const stored = (config as { pin_hash: string | null } | null)?.pin_hash;
  if (!stored) return json({ error: 'No PIN set' }, 409);

  if (!sameText(await sha256Hex(pin), stored)) return json(await recordFailure(admin, userId, attempts));

  await admin.from('pin_attempts').upsert({ user_id: userId, failed: 0, locked_until: null, updated_at: new Date().toISOString() });

  if (change) {
    const { error } = await admin
      .from('auth_config')
      .update({ pin_hash: await sha256Hex(newPin), updated_at: new Date().toISOString() })
      .eq('user_id', userId);
    if (error) return json({ error: 'Could not change PIN' }, 500);
  }
  return json({ ok: true });
});
