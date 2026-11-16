# Flowe audit — 2026-11-16

Branch: `fix/audit-2026-11-16` (cut from `main` @ `54a0393`, tree was clean).

## Baseline (before any change)

| Check | Result |
|---|---|
| `npx tsc --noEmit` | **exit 2, 159 errors.** 107 in `prototype/`, 11 in `supabase/functions/` (Deno globals, expected under the app tsconfig), **41 in app code**: `src/services/storage.ts` (12), `src/components/ui/PinPad.tsx` (9), `src/repositories/auth.repository.ts` (7), `app/(main)/add-transaction.tsx` (3), `hooks/use-theme-color.ts` (3), `app/(main)/home/learn/*` (4), `components/ui/collapsible.tsx` (2), `app/(auth)/fingerprint.tsx` (1) |
| `npm run lint` | exit 0 — 0 errors, 48 warnings |
| `npm test` | exit 0 — 19 suites, 176 tests, all passing (one suite is `_to_delete/__real.test.ts`) |

This is the bar: nothing that passes now may fail, and the error/warning counts may only go down.

## After fixes

| Check | Baseline | Now |
|---|---|---|
| `npx tsc --noEmit` | 159 errors (41 in app code) | **118 errors, 0 in app code.** All 118 are in `prototype/` (107) and the Deno Edge Functions (11), which the app's tsconfig isn't set up for. Still exit 2 because of those. |
| `npm run lint` | 0 errors, 48 warnings | 0 errors, 46 warnings |
| `npm test` | 19 suites / 176 tests passing | **26 suites / 219 tests passing** (new: `updateWithBalance`, `shiftMonth`, `parserAuditCases`, `pinVerify`, `ruleFromTransaction`, `accountHistory`, `autoLock`) |

No fix regressed the baseline, so none were reverted. Each fix ran tsc and Jest before it was committed.

**Summary:** 23 findings fixed, and #10 fixed on Home only. 3 deferred (#21, #28, and #10's Calendar part). 4 need your decision (#18, #20, #29, #30).

**Critical and High status:** all fixed — #1 (Critical), #2, #3, #4, #5, #6 and #7.

**Auto-lock Timer (#12), approved 2026-11-16.**
- **Choice:** I made the timer work rather than removing it. Before this, the app never re-locked after a return from the background, whatever was chosen.
- **What happens:** leaving the app for at least the chosen time (1 / 5 / 15 min) locks it again on return. Because the lock is deferred, that only masks figures on Home and asks for the PIN when a protected screen is open.
- **Settings:** "Never" turns it off. With nothing saved, the 5 min that Settings displays applies. A change in Settings takes effect the next time the user leaves the app.
- **What counts as leaving:** only `background`. `inactive` also fires for the fingerprint sheet, which isn't leaving.
- **Deliberate exits:** `suspend()` skips the check for the next return again. The receipt camera and Learn pickers already called it; opening a PDF and Android's notification-access settings now do too.
- **History:** an earlier version re-locked on *every* return, which was dropped in `e8c2aae`. This brings back time-based re-locking only.

**Account history (#8), approved 2026-11-16.**
- **List:** bank and wallet pages now list every transaction for the account, through a new `useAccountTransactions` hook over the existing `fetchByAccount`. This is the same source tabung pages already used.
- **Tiles:** the Income / Expense tiles still show this month's totals, so the figures users already see don't change.
- **Dates on rows:** rows from this year show "16 Nov"; rows from any other year show "16 Nov 2025" (`6277b94`, approved 2026-11-16). The date is read as a local day rather than parsed as UTC.

**Recurring from Add Transaction (#4), approved 2026-11-16.**
- **What happens:** switching Recurring on now saves a rule alongside the transaction.
- **When it starts:** the rule's next date is the first occurrence *after* the transaction being saved, so the same payment isn't offered for approval again. With a start date earlier than the transaction, the occurrences in between are skipped, not back-filled.
- **What's refused:** Recurring on a transfer, and an end date before the start date, are refused before anything is saved. `recurring_rules` only supports expenses and income.
- **If the rule fails:** when the transaction saves but the rule doesn't, the user gets an alert pointing them to Settings → Recurring.
- **Edits:** turning Recurring on while editing a transaction also creates a rule.

**PIN fixes (#1, #5, #11), approved 2026-11-16.**
- **New helpers:** `src/lib/pinVerify.ts` (`verifyPin`). On the secure-store side, `flags.pinHash`, `flags.storePinHash` and `flags.setFingerprintEnabled` use the existing keys, and **the stored format is unchanged**.
- **How a PIN is checked:** a PIN is accepted if it matches either the device copy or the server copy. When only the server matches, the device copy is refreshed. That's what keeps PINs changed before this fix working, since the old Change PIN flow only updated the server.
- **Side effect:** for those same users, the *old* PIN still unlocks offline until their first online unlock with the new PIN refreshes the device copy.

**Spec coverage:** the screen-level date fixes (#7, #19, #26) have no fail-before spec. Their logic is the existing, already-tested `localYMD`, and the bug was in the call sites, which Jest doesn't render.

**Cleanup done:**
- Removed the unused `processDueRecurring` and the duplicate `toYMD` helper.
- `receipt-ocr` now gets its date from `localYMD`.
- Unified the Toggle import path.
- Home shares one profile/affirmations loader between load and refresh.

- Deleted the 17 unused files listed below (`cb624fe`, approved 2026-11-16). Before deleting, I checked relative, `@/` alias and `require` imports across app code, tests, `index.js` and the config files. `context/LearnContext.tsx` exported a `useLearn` with the same name as the hook, but every `useLearn` import goes to `src/hooks/useLearn`.

**Cleanup not done:** `LockContext.suspend` is kept because removing it would change a public API.

## Findings

Every row below was verified by reading the code path end to end; the parser rows were also reproduced by running `parseTransactionNotification` on the quoted text. Rows marked **[unverified]** depend on server state I can't see from the repo.

“Needs decision” in the Status column = falls under your stop-and-ask list (auth/PIN, user-visible behaviour change, SQL, deleting files).

### Critical

| # | Severity | File:line | What breaks for the user | Root cause | Proposed fix | Status |
|---|---|---|---|---|---|---|
| 1 | Critical | `components/home/LockOverlay.tsx:76-92` | The correct PIN is rejected whenever the phone is offline, so every screen except Home and Add Transaction is unreachable. If anonymous sign-in failed during PIN setup, the PIN is **never** accepted and the user is locked out for good (only a reinstall helps). | `success.tsx:24-34` deliberately saves the PIN hash “locally only” when there is no auth user, but the lock screen only checks the hash stored in Supabase `auth_config`, and fails immediately if `user` is null or the fetch errors. The local copy (`flowe.pin_hash` in secure-store) is written but nothing ever reads it. | Add a read-only `flags.pinHash()` getter (same key, same format). Have the lock screen check the local hash first and only fall back to `auth_config` when there's no local hash. Move the server lookup into `authConfigRepository` so the component stops calling Supabase. | Fixed (`f06ae88`) |

### High

| # | Severity | File:line | What breaks for the user | Root cause | Proposed fix | Status |
|---|---|---|---|---|---|---|
| 2 | High | `app/(main)/add-transaction.tsx:1024-1030`, `:370` | Double-tapping Submit (easy on a slow network) saves the transaction twice and moves the balance twice. | `handleSubmit` awaits create → month refetch → notify before it navigates away, and nothing guards it: the `Button` is never disabled and `txLoading` is never used. | Add a `submitting` ref that returns early while a save is in flight, and pass `disabled`/`loading` to the Button. | Fixed (`4e097ba`) |
| 3 | High | `src/repositories/transactions.repository.ts:283-332` | Editing a transaction while the network drops can leave the account balance wrong: the old amount is reversed but the row keeps its old values. | `updateWithBalance` reverses the old balance effect **before** the row UPDATE. If the UPDATE then fails, it returns an error without re-applying the reversal. | Do the UPDATE first, then reverse the old effect and apply the new one. Add a Jest spec with a mocked Supabase client. | Fixed (`d3ea1e5`) |
| 4 | High | `app/(main)/add-transaction.tsx:112-118, 833-1000` vs `handleSubmit` `:370-520` | Turning on **Recurring** (frequency, start/end date, reminder) on the Add Transaction form does nothing. No rule is created and no error is shown. | The recurring state is collected in the UI, but `handleSubmit` never reads `recurring`, `recurringFreq`, `startDate`, `endDate` or `reminder`, and never calls `recurringRepository`. | After a successful create (not on edit), create a `recurring_rules` row through `useRecurring`, using the same shape as Settings → Recurring. Otherwise hide the toggle. | Fixed (`0547f06`) |
| 5 | High | `app/(main)/settings/security.tsx:60-63` vs `LockOverlay.tsx:20,40` | Settings → Security → Fingerprint has no effect. Switching it off doesn't stop fingerprint unlock; switching it on doesn't enable it. | The toggle writes only `auth_config.fingerprint_enabled` in Supabase. The lock screen reads only the secure-store flag `flowe.fingerprint_enabled`, which is set once at PIN setup and never again. | When the toggle changes, also write the secure-store flag (new `flags.setFingerprintEnabled`, same key and format), and initialise the toggle from that flag. Move the Supabase calls into `authConfigRepository`. | Fixed (`cce0f7b`) |
| 6 | High | `app/(main)/calendar.tsx:190-194`, `app/(main)/cashflow/index.tsx:166-172` | On the 29th, 30th or 31st, the month arrows skip short months: from Jan 31, “next” jumps to **March**; from Mar 31, “previous” stays on March. February can't be reached. | `date.setMonth(m ± 1)` on a day the target month doesn't have overflows into the following month. (`analysis.tsx:47-49` does this correctly by pinning the day to 1.) | Add a pure `shiftMonth(date, delta)` helper in `src/utils/date.ts` that pins the day to 1 (or clamps it), use it on both screens, and add a spec. | Fixed (`d796d1a`) |
| 7 | High | `app/(main)/home/tabung/[id].tsx:111, 142` | A tabung top-up or withdrawal made between 00:00 and 07:59 Malaysia time is dated the **previous day**. On the 1st of a month it lands in last month's totals. | The date is built with `new Date().toISOString().split('T')[0]`, which is UTC. `src/utils/date.ts` documents this exact pitfall. | Use `localYMD(new Date())`. | Fixed (`0d14f9b`) |

### Medium

| # | Severity | File:line | What breaks for the user | Root cause | Proposed fix | Status |
|---|---|---|---|---|---|---|
| 8 | Medium | `app/(main)/home/account/[id].tsx:32,48`, `app/(main)/home/wallet/[id].tsx:33` | A bank or wallet account's page lists only **this month's** transactions, so on the 1st it says “No transactions yet”. Tabung pages show the full history. | These pages filter `useTransactions(currentYear, currentMonth)` by account. `transactionsRepository.fetchByAccount` exists, but only the tabung screen uses it. | Add a `useAccountTransactions(accountId)` hook over `fetchByAccount` and use it on both pages. | Fixed (`6de24cc`) |
| 9 | Medium | `app/(main)/index.tsx:125, 196` | Home waits on a `cashflow-summary` Edge Function call for a hard-coded **May 2026** before it renders, which adds startup latency for data Home never shows. | Left over from development: the result (`cashflow`, `cfError`) is never read, only `cfLoading` gates the screen. | Remove the `useCashflow('2026-05')` call and the `cfLoading` gate. | Fixed (`96d0476`) |
| 10 | Medium | `app/(main)/index.tsx:196`, `src/hooks/useAccounts.ts:11-18`, `app/(main)/calendar.tsx:58` | Every time you come back to Home (or Calendar), the whole screen becomes a spinner and scroll position is lost. | `useFocusEffect` refetches, the hook sets `loading=true`, and the screen returns `<LoadingView/>` whenever `loading` is true, including refetches that already have data. | Show the full-screen loader only when there's no data yet (`loading && accounts.length === 0`). Same on Calendar. | Fixed on Home (`de0b4c2`); Calendar deferred: on a month change it needs the hook to report which month is loaded, or it shows the old month while loading |
| 11 | Medium | `app/(main)/settings/change-pin.tsx:44-50` | Changing your PIN silently turns fingerprint off on the server, and shows “PIN Changed” even if the save failed. It also verifies the old PIN against the server only (offline: “PIN not set up”). | Hard-coded `fingerprintEnabled: false`; the `upsert` result is ignored; the local secure-store hash isn't updated (see #1). | Keep the current fingerprint setting, check the upsert result, update the local hash with `flags.setPin`, and verify the old PIN through the same helper as #1. | Fixed (`c30a1ea`) |
| 12 | Medium | `app/(main)/settings/security.tsx:13-18, 65-68`, `app/(main)/settings/index.tsx:136` | The **Auto-lock Timer** (1 / 5 / 15 min / Never) can be set and is saved, but nothing ever reads it. The app never re-locks after any amount of time. | `LockContext` dropped background re-locking (`suspend` is now a no-op) but the setting stayed in the UI. | Either implement it (re-lock on returning from background after N minutes) or remove the row. | Fixed (`43045fa`) |
| 13 | Medium | `src/hooks/useDetectedTransactions.ts:213-270`, `context/DetectedTransactionsContext.tsx:128-131` | On a cold start, payments captured while Flowe was closed (that the headless task couldn't file) aren't auto-filed and show with no account pre-selected, until the next notification or the next time the app comes to the foreground. | The first `refresh()` runs while `accountsRef.current` is still `[]` (accounts are fetched in parallel), so nothing resolves to an account. `refresh` doesn't run again when accounts arrive. | Run `refresh()` again once `accounts` changes from empty to loaded. Re-running is safe: filing is guarded by `inFlight` and the capture check. | Fixed (`9f23aaf`) |
| 14 | Medium | `src/utils/parseTransactionNotification.ts:54-58, 216-239` | Credit-card alerts are never auto-filed and always ask the user. Reproduced: “Your **credit** card ending 1234 was charged RM 50.00 at ZUS COFFEE” → `typeConfident: false`. | Direction hints are plain substrings: `'credit'` matches “credit card”, so the alert counts as debit + credit and the direction is treated as a guess. “debit card” has the same problem. | Remove “credit card” / “debit card” / “kad kredit” / “kad debit” before testing the hints. Add spec cases. | Fixed (`c27a9f1`) |
| 15 | Medium | `src/utils/parseTransactionNotification.ts:172-183` | Auto-detected transactions get names like **“KFC successful”** or **“TNB successful”** (reproduced). That name is saved and used for merchant-logo and category matching. | The merchant lookahead only stops at `on/for/via/using/with` or punctuation, so a trailing status word is captured. | Also stop the lookahead at `successful|berjaya|completed|approved|is|was|has`. Add spec cases. | Fixed (`de68779`) |
| 16 | Medium | `app/(main)/home/tabung/[id].tsx:101-158` | Withdrawing with an empty amount tries to save `NaN`. If either top-up or withdrawal fails, the spinner just stops and no message is shown. | No `Number.isFinite(x) && x > 0` check on withdraw (`NaN > current` is false), and there's no `else` branch on `!result.ok`. | Validate the amount like top-up does, and set `withdrawError`/an Alert on failure. | Fixed (`d798221`) |
| 17 | Medium | `src/services/storage.ts:47-51`, `app/(main)/add-transaction.tsx:493-498` | Attaching a new receipt while **editing** a transaction that already has one fails silently. The old receipt stays. | `uploadReceipt` uploads to the same `userId/txId.jpg` path without `upsert: true`, so storage rejects it, and the caller ignores `!upload.ok`. | Pass `upsert: true`. | Fixed (`9355cc9`) |
| 18 | Medium | `src/repositories/transactions.repository.ts:140-160`, `add-transaction.tsx:476-490` | Deleting or editing an investment can leave the asset's value too high if two assets share a name, or if two writes overlap. | Assets are found by **name** with `.maybeSingle()`, which returns an error (ignored) when the name isn't unique. The value is also read, changed in JS and written back (the pattern CLAUDE.md bans for balances). | Short term: match on `id` where the screen has it, and surface the error. A proper fix needs an `adjust_asset_value` RPC (SQL). | Needs decision (SQL) |
| 19 | Medium | `app/(main)/tabung/new/form.tsx:84, 289`, `components/onboarding/TabungForm.tsx:54-55` | A tabung's start or target date can be saved one day early. | Same UTC `toISOString()` pattern as #7, applied to picker dates. It's off by one whenever the picked `Date` has a local time before 08:00. **[unverified on device]**: depends on the time the picker returns. | Use `localYMD`. | Fixed (`07ba7ce`) |
| 20 | Medium | `src/services/storage.ts:30-37` | **[unverified]** Profile avatars may not load. | CLAUDE.md says `avatars/` is a private bucket, but `uploadAvatar` returns `getPublicUrl`, which returns 400/403 on a private bucket. I can't see the bucket policy from the repo. | If the bucket is private, return a signed URL (like receipts). | Needs decision (check bucket) |

### Low

| # | Severity | File:line | What breaks for the user | Root cause | Proposed fix | Status |
|---|---|---|---|---|---|---|
| 21 | Low | `src/services/recurring.ts:217` | If rolling a rule forward fails after approving it, the same occurrence is offered again and can be approved twice. | The result of `recurringRepository.advance` is ignored. | Return/log the advance error so the UI refetches and doesn't re-offer. | Deferred: the safe order (advance, then create, as one step) needs a server-side function (SQL). An existing spec requires that a failed create never advances the rule |
| 22 | Low | `app/(auth)/fingerprint.tsx:59` | The fingerprint setup screen shows a missing-glyph icon. | Feather has no `fingerprint` icon (also a tsc error). | Use the lucide `Fingerprint` icon (lucide is already a dependency). | Fixed (`e246866`) |
| 23 | Low | `src/services/storage.ts` (12×), `src/repositories/auth.repository.ts` (7×) | Error `code` is `undefined` at runtime in these `Result`s (19 tsc errors). | `StorageError` has no `.code`, and `AuthError.code` is optional. | Use the existing `fromSupabaseError(error)`, which defaults the code to `'UNKNOWN'`. | Fixed (`5cad341`) |
| 24 | Low | `app/(main)/add-transaction.tsx:406-410` (+ `index.tsx`, account pages via `as any`) | None at runtime; 3 tsc errors. | The `Account` row type has no joined `bank_accounts` / `wallet_accounts` / `tabung_accounts`. | Add an `AccountWithDetails` type in `database.types.ts` and return it from `fetchAllActive`. | Fixed (`bb44996`) |
| 25 | Low | `app/(main)/home/learn/[projectId].tsx:188,198`, `…/entry.tsx:155,165` | None at runtime; 4 tsc errors. | `className` is passed to an icon component whose props don't accept it. | Remove the prop or wrap the icon in a `View`. | Fixed (`45f033c`) |
| 26 | Low | `app/(main)/calendar.tsx:75` | Transactions land on the wrong calendar day in negative-UTC-offset timezones. This doesn't happen in Malaysia. | `new Date('YYYY-MM-DD')` is parsed as UTC. | Split the string instead of parsing it into a `Date`. | Fixed (`ae3a2df`) |
| 27 | Low | `app/_layout.tsx:24, 74-83` | None. The “Could not connect / Retry” screen can never appear. | Nothing ever sets the `'error'` state. | Remove the dead branch (cleanup). | Fixed (`e4c606b`) |
| 28 | Low | `src/services/storage.ts`, `security.tsx`, `change-pin.tsx`, `settings/index.tsx`, `settings/account.tsx`, `settings/affirmations.tsx`, `settings/notifications.tsx`, `app/(main)/index.tsx`, `app/(onboarding)/accounts.tsx`, `LockOverlay.tsx`, `context/AuthContext.tsx`; screens calling repositories directly (e.g. `tabung/[id].tsx`) | None directly, but these bypass `Result` error handling (several ignore errors). | Layering violations of the CLAUDE.md rule “Screen → Hook → Repository”. | Fix only where another fix already touches the file (#1, #5, #11). A wholesale move is a refactor and out of scope for this pass. | Deferred: wholesale move is a refactor; handle alongside #1, #5 and #11 |
| 29 | Low | `app/(main)/index.tsx:198-205` | **[unverified intent]** The Home “total balance” leaves out tabung savings. | It sums only `bank_accounts` and `wallet_accounts`. | Your call: should tabung count towards the total? | Needs decision |
| 30 | Low | `supabase/migrations/20260925_atomic_balance.sql:113` vs `:52` | After “Recalculate balances”, a tabung that had gone negative jumps to 0. | The repair clamps the tabung at 0 (`greatest(0, …)`); the incremental RPC doesn't. | Leave as is, or align them (SQL). | Needs decision (SQL) |

## Cleanup candidates

All confirmed unused by searching static imports, `require`, directory-index imports, `index.js` (headless task registration) and expo-router file routes. Nothing here is under `app/`.

**Unused files (deleting them needs your OK):**
- Expo template leftovers that only import each other: `components/ui/collapsible.tsx`, `components/ui/icon-symbol.tsx`, `components/ui/icon-symbol.ios.tsx`, `components/themed-text.tsx`, `components/themed-view.tsx`, `components/parallax-scroll-view.tsx`, `components/hello-wave.tsx`, `components/external-link.tsx`, `components/haptic-tab.tsx`, `hooks/use-theme-color.ts`, `hooks/use-color-scheme.ts`, `hooks/use-color-scheme.web.ts`. They reference `Colors.light`/`Colors.dark`, which no longer exist, and account for 5 tsc errors.
- `src/components/ui/PinPad.tsx`: an older PIN pad. Everything imports `components/ui/PinPad.tsx`. It accounts for 9 tsc errors and would crash if rendered.
- `components/ui/Badge.tsx`, `components/ui/SectionHeader.tsx`, `components/cashflow/CashFlowStatsGrid.tsx`: never imported.
- `context/LearnContext.tsx`: a mock-data provider that's never mounted (Learn uses `useLearn` + `learnRepository`).

**Dead or duplicate code inside used files:**
- `src/services/recurring.ts`: `processDueRecurring` and its `running` flag are never called (rules now wait for approval). Its private `toYMD` duplicates `localYMD`.
- `src/services/edgeFunctions.ts:14-15`: inline today-string that duplicates `localYMD`.
- `app/(main)/index.tsx`: the affirmations and profile fetch is copy-pasted between the mount effects and `onRefresh`. The `__DEV__` smoke test hard-codes `2026-05`.
- `context/LockContext.tsx`: `suspend` is a documented no-op, still called from `add-transaction.tsx:320`.
- Two import paths for one Toggle: `components/ui/Toggle.tsx` re-exports `src/components/ui/Toggle.tsx`, and `settings/auto-detect.tsx` imports the `src/` path directly.

## Proposed fix order (once approved)

1. Open items I can do without a decision: #2, #3, #6, #7, #9, #10, #13, #14, #15, #16, #17, #19, then Low #21–#27.
2. The items marked “Needs decision”, after you answer.
3. Cleanup (file deletions only after your OK).

Each fix is one commit referencing its `#`. Pure-logic fixes (#3, #6, #14, #15, date helpers) get a failing-then-passing spec in `tests/`. After each commit I'll run tsc and the tests.

## Manual checks on a dev build (after fixes)

- **Auth flow:** fresh install → PIN → fingerprint → onboarding → Home. Kill the app, turn on airplane mode, open Settings → the PIN must unlock (#1). Toggle fingerprint off in Security → the lock screen must not offer it (#5).
- **Adding a transaction:** double-tap Submit → exactly one row and one balance change (#2). Edit an amount with the network off → balance unchanged once you reconnect (#3). Top up a tabung before 8am → dated today (#7).
- **Auto-detect (Android):** send a test credit-card alert → it files itself under the right account, with a clean merchant name (#14, #15). Kill the app, post an alert, cold-start → it auto-files or shows with the account pre-selected (#13).
- **Widget:** add, edit and delete an expense dated today → the 2×2 budget widget updates within about a second each time.
