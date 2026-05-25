# Flowe — Auth Setup + Onboarding Flow (Frontend)

**Status:** Approved 2026-05-25
**Scope:** Phase 1 (Auth Setup) + Phase 2 (Onboarding) screens with real persistence via Supabase + `expo-secure-store`.
**Out of scope:** Lock/unlock re-entry gate, onboarding reset from Settings, email/password migration.

---

## 1. Goal

Replace the current placeholder `app/index.tsx` (black background, white "Flowe", purple FAB) with the production auth-setup + onboarding flow from the prototype screens `01_welcome` → `08e_onboarding_accounts`. The flow must:

- Match the prototype visually (dark theme, lime `#C5FF00` accent, see `docs/Flowe_Theme.md`).
- Use only React Native primitives: `View`, `Text`, `Pressable`, `ScrollView`, `TextInput`, `FlatList`, `Image` + `@expo/vector-icons` + NativeWind classes.
- Persist real data via Supabase + `expo-secure-store` (no in-memory-only stubs).
- Resume cleanly if the app is killed mid-flow.

---

## 2. Architecture & Routing

Three Expo Router groups, gated by a single root layout:

```
app/
  _layout.tsx                  # session/onboarding gate (rewritten)
  (auth)/
    _layout.tsx                # Stack, no header, gestureEnabled: false
    welcome.tsx                # 01
    create-pin.tsx             # 02
    confirm-pin.tsx            # 03
    fingerprint.tsx            # 04
    success.tsx                # 05
  (onboarding)/
    _layout.tsx
    name.tsx                   # 06 + 07
    accounts.tsx               # 08 + 08a/b/c/e
  (main)/                      # already exists
```

The existing placeholder `app/index.tsx` is **deleted**; routing is owned by `_layout.tsx`.

### 2.1 Root gate logic (`app/_layout.tsx`)

On mount:

1. Read `flowe.pin_set` and `flowe.onboarding_done` from `expo-secure-store`.
2. Call `supabase.auth.getSession()`. If null → `authRepository.signInAnonymously()`. Session is persisted via Supabase's AsyncStorage adapter (already configured in `src/lib/supabase.ts`).
3. Route:
   - `!session` after retry → full-screen retry view.
   - `!pin_set` → redirect to `/(auth)/welcome`.
   - `pin_set && !onboarding_done` → redirect to `/(onboarding)/name`.
   - else → `/(main)`.
4. Stack registers `(auth)`, `(onboarding)`, and `(main)` groups.

### 2.2 Onboarding state

A single `OnboardingContext` provider wraps `(auth)` + `(onboarding)`:

```ts
type OnboardingState = {
  pin: string | null;            // plaintext, in-memory only, cleared after screen 05
  fingerprintEnabled: boolean;
  name: string;
  draftAccounts: DraftAccount[];
};
type DraftAccount =
  | { kind: 'bank'; bankId: string; customName?: string; accountLast4?: string; openingBalance: number }
  | { kind: 'tabung'; name: string; icon: string; target: number; fromDate: string; toDate: string; linkedBankId?: string }
  | { kind: 'wallet'; name: string; openingBalance: number };
```

PIN plaintext lives in memory only — never written to disk. Only the SHA-256 hash (via `expo-crypto`) is persisted to `auth_config` + secure-store.

---

## 3. Shared Components

Built in `components/ui/` (extending existing `PinPad`, `Toggle` in `src/components/ui/`).

| Component | Spec |
|---|---|
| `ScreenContainer` | SafeAreaView + `bg-background` + `max-w-md mx-auto` + horizontal padding (`px-6`) |
| `PrimaryButton` | `bg-primary rounded-2xl py-4`, black text, `active:opacity-90`; disabled = `bg-muted text-muted-foreground` |
| `GhostButton` | `text-muted-foreground py-3 text-sm`, centered |
| `ProgressDots` | 3-dot (auth, lime active) or 2-step pill+line (onboarding, screens 06/08) |
| `PinPad` | 3×4 grid (1–9, blank, 0, backspace), `rounded-2xl` keys, `Haptics.impactAsync` on press |
| `PinDots` | 6 circles; filled = `bg-primary scale-110`, empty = `border-muted-foreground/50` |
| `TypeChip` | Bank / Tabung / Wallet chip; active = `border-primary bg-primary/10`, inactive = `border-border bg-card` |
| `BankDropdown` | Pressable field + inline-expanding list of banks (color dot + icon + name + ✓) |
| `AccountChip` | Row: icon + name + balance/target + type pill + trash button |

**Icons:** `@expo/vector-icons` (Feather + MaterialCommunityIcons). Map Lucide names from `Flowe_Theme.md` to closest vector-icon equivalents in a single `components/ui/Icon.tsx` to keep call sites clean.

**Animations:** `react-native-reanimated` (already a dependency).
- PIN mismatch shake: `withSequence(translateX keyframes)` over 400 ms.
- Fingerprint pulse: `withRepeat(withTiming(scale, opacity))`.
- Auth success check: SVG `stroke-dashoffset` 0.45 s ease-out.
- Done celebration: 1800 ms overlay with glow ring.

---

## 4. Per-Screen Behavior

### 4.1 Welcome (`(auth)/welcome.tsx` — 01)
Static. AppLogo (lime gradient wallet icon) + title "Flowe" + tagline + 3 feature pills + "Inspired by Rich Dad Poor Dad" + `[Get Started] →`. Anonymous sign-in already completed in root gate. CTA → `router.push('/(auth)/create-pin')`.

### 4.2 Create PIN (`(auth)/create-pin.tsx` — 02)
3-dot progress (step 1 active) + ShieldCheck badge + title "Create Your PIN" + 6 `PinDots` + `PinPad`. Local `pin` state. On 6th digit: 250 ms delay → `router.push({ pathname: '/(auth)/confirm-pin', params: { firstPin: pin } })`.

### 4.3 Confirm PIN (`(auth)/confirm-pin.tsx` — 03)
Same UI as 4.2. On 6th digit, compare with `firstPin` param.
- **Match:** `ctx.setPin(value)` → `router.replace('/(auth)/fingerprint')`.
- **Mismatch:** shake animation, red error "PINs don't match. Try again." for 700 ms, clear input.
- Footer `[← Choose a different PIN]` → `router.back()`, both screens reset.

### 4.4 Fingerprint (`(auth)/fingerprint.tsx` — 04)
Pulsing fingerprint icon + security note.
- `[Enable Fingerprint]` → `LocalAuthentication.hasHardwareAsync()` → `authenticateAsync({ promptMessage: 'Enable fingerprint' })`. Success → 1800 ms simulated scan UI → `ctx.setFingerprintEnabled(true)` → `router.replace('/(auth)/success')`.
- `[Skip for now]` → `ctx.setFingerprintEnabled(false)` → success.
- No hardware → auto-skip with toast "Biometric not available on this device".

### 4.5 Success (`(auth)/success.tsx` — 05)
Animated check + glow rings + summary card (PIN configured ✓ | Fingerprint enabled/disabled).

**On mount, in parallel:**
1. `Crypto.digestStringAsync(SHA256, ctx.pin)` → `pinHash`.
2. Insert row into `auth_config` (user_id, pin_hash, fingerprint_enabled).
3. `SecureStore.setItemAsync('flowe.pin_hash', pinHash)`, `'flowe.fingerprint_enabled'`, `'flowe.pin_set' = '1'`.
4. Clear `ctx.pin` from memory.

On failure of (2): retry button overlay before allowing `[Continue to App]`. CTA → `router.replace('/(onboarding)/name')`.

### 4.6 Name (`(onboarding)/name.tsx` — 06/07)
2-step progress (step 1 active), wave illustration, single `TextInput` (max 30 chars, autoFocus, clear-X button), privacy note.
- Empty → `PrimaryButton` disabled.
- Has trimmed text → enabled. `[Next] →` sets `ctx.name` → `router.push('/(onboarding)/accounts')`.
- **No Supabase write yet** — atomic write on Done.

### 4.7 Accounts (`(onboarding)/accounts.tsx` — 08/08a/08b/08c/08e)
Single screen with internal state machine:

| Sub-state | Trigger | UI |
|---|---|---|
| `formBank` | initial / Bank chip | TypeChips (Bank active) + `BankDropdown` (collapsed) + Opening Balance + `[+ Add Account]` |
| `formTabung` | Tabung chip | Icon picker (10 icons) + Name + Target (RM) + From/To date pickers + Linked bank button list |
| `formWallet` | Wallet chip | Name + Opening Balance |
| `dropdownOpen` | tap Bank field | Inline list of 12 Malaysian banks + "Other Bank" (`BankDropdown` expanded) |
| `listView` | `draftAccounts.length ≥ 1` | `ADDED (n)` header + `AccountChip` rows + dashed `[+ Add Another Account]` |

Footer button:
- `draftAccounts.length === 0` → `[Skip for now] →` (lime).
- `draftAccounts.length ≥ 1` → `[Done, Let's Go!] →` (lime).

**Validation (inline red text under field):**
- Bank: bank selected required; if "Other Bank" → custom name required; account last-4 = 4 digits if provided; opening balance ≥ 0.
- Tabung: name non-empty; target > 0; `fromDate ≤ toDate`.
- Wallet: name non-empty; balance ≥ 0.

**On `[Done, Let's Go!]`:**
1. `supabase.from('profiles').update({ display_name: ctx.name }).eq('id', userId)`.
2. For each draft, call the matching `accountsRepository.createBank/Tabung/Wallet`.
3. On any failure: toast + keep failed drafts in context, drop successful ones. Stay on screen.
4. All succeed → `SecureStore.setItemAsync('flowe.onboarding_done', '1')` → 1800 ms celebration overlay → `router.replace('/(main)')`.

**On `[Skip for now]`:** write name only + onboarding_done, navigate.

### 4.8 Banks constant (`constants/banks.ts`)
```ts
export const MALAYSIAN_BANKS = [
  { id: 'maybank',      name: 'Maybank',         color: '#ffd93d' },
  { id: 'cimb',         name: 'CIMB Bank',       color: '#ff6b6b' },
  { id: 'public',       name: 'Public Bank',     color: '#00d4ff' },
  { id: 'rhb',          name: 'RHB Bank',        color: '#6bcf7f' },
  { id: 'hong-leong',   name: 'Hong Leong Bank', color: '#C5FF00' },
  { id: 'ambank',       name: 'AmBank',          color: '#a78bfa' },
  { id: 'bank-islam',   name: 'Bank Islam',      color: '#34d399' },
  { id: 'bank-rakyat',  name: 'Bank Rakyat',     color: '#f472b6' },
  { id: 'bsn',          name: 'BSN',             color: '#60a5fa' },
  { id: 'affin',        name: 'Affin Bank',      color: '#fb923c' },
  { id: 'alliance',     name: 'Alliance Bank',   color: '#c084fc' },
  { id: 'other',        name: 'Other Bank',      color: '#94a3b8' },
];
```

---

## 5. Error Handling

| Failure | Behavior |
|---|---|
| Anonymous sign-in fails in root gate | Full-screen retry view; app cannot enter onboarding without a session |
| PIN mismatch | Shake + clear + red error 700 ms; no lockout (first-time setup) |
| `auth_config` insert fails (screen 05) | PIN stays in secure-store; retry overlay before Continue is allowed |
| `LocalAuthentication` unavailable | Auto-skip fingerprint with toast |
| Account create fails on Done | Toast + drop successful drafts, keep failed; stay on screen with retry |
| `profiles.update` fails | Toast + retry; do not set `onboarding_done` |

---

## 6. Edge Cases & Resume Behavior

- App killed mid-flow → root gate re-reads secure-store flags and lands on the right screen:
  - `pin_set=0` → Welcome.
  - `pin_set=1, onboarding_done=0` → Name (PIN persisted; name + drafts lost from in-memory context — acceptable).
- User backgrounds during fingerprint prompt → `LocalAuthentication` rejects → treat as Skip.
- Numeric inputs: Opening Balance uses `keyboardType="decimal-pad"`, max 12 chars; account number `numeric`, `maxLength={4}`.
- Tabung dates: `toDate` picker has `minimumDate = fromDate`; button disabled until both set.
- Name TextInput: `maxLength={30}`, `autoCapitalize="words"`, trim on submit.

---

## 7. Testing Strategy

Jest + `@testing-library/react-native`.

**Unit:**
- `PinPad` — digit append, backspace, max-6 enforcement.
- `PinDots` — fill state per length.
- `BankDropdown` — open/close, selection, "Other Bank" reveals custom-name field upstream.
- Account-draft reducer — add/remove drafts, validation predicates.

**Integration:**
- PIN match → fingerprint screen.
- PIN mismatch → shake + clear + stays on confirm.
- Accounts screen — switch chips clears irrelevant fields; add → list view; Done writes all drafts.
- Root gate — given combinations of `(session, pin_set, onboarding_done)`, asserts the right redirect.

**Mocks:**
- `expo-secure-store`, `expo-local-authentication`, `expo-crypto` — module mocks.
- `@supabase/supabase-js` — mock at the repository layer (do not mock the client itself).

**Manual smoke:**
- `npm run ios` and `npm run android` — full happy path Welcome → Done → `(main)` loads.
- Kill app at each phase, relaunch, verify resume.

E2E (Detox/Maestro) deferred.

---

## 8. Implementation Order (suggested)

1. Root gate + delete `app/index.tsx` + anonymous sign-in wiring.
2. Shared components: `ScreenContainer`, `PrimaryButton`, `GhostButton`, `ProgressDots`.
3. Auth flow: Welcome → Create PIN → Confirm PIN (with `PinPad`/`PinDots`).
4. Fingerprint + Success (with `expo-local-authentication`, `expo-crypto`, secure-store write).
5. Onboarding Name.
6. Onboarding Accounts (Bank form → dropdown → list view).
7. Tabung + Wallet forms.
8. Done → atomic Supabase writes + celebration → `(main)`.
9. Tests.
