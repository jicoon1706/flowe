# Frontend → API → DB Wiring — Design

**Date:** 2026-05-26
**Status:** Draft for review
**Author:** Planning session

## Context

The Flowe mobile app has three layers already built independently:

- **Frontend** — Expo Router screens under `app/`, NativeWind styling, mock/static data in most screens.
- **API layer** — Typed Supabase repositories under `src/repositories/` and hooks under `src/hooks/` (accounts, transactions, cashflow, analysis, assets, liabilities, affirmations, recurring, notifications, settings, learn, auth, authConfig, customCategories). Edge function client at `src/services/edgeFunctions.ts`. Storage helper at `src/services/storage.ts`.
- **Database** — Supabase Postgres with schema, RLS policies, storage buckets, and seed data in `docs/sql/001–004`. Edge Functions `cashflow-summary` and `analysis-monthly` are deployed.

What works end-to-end today: **auth + onboarding only**. Confirmed DB writes against `auth.users`, `auth_config`, `profiles`, `accounts`. Every other screen still renders mock data.

This spec defines the work to connect the remaining screens to the existing API/DB layers.

## Goals

- Every screen reads/writes real Supabase data via existing repositories/hooks.
- A user can complete the full app journey (home → transactions → cashflow → analysis → settings → learn) against live data.
- UX for loading/error/empty states is consistent across the app.
- No new runtime dependencies; existing `useState`-based hook pattern stays.

## Non-Goals

- No refactor to TanStack Query or any client-cache library (deferred — see "Future considerations").
- No new screens or design changes; visual layout stays as-is.
- No new repositories or edge functions; everything we need exists.
- No CI/test-harness changes.

## Strategy

Single phased rollout in **user-journey order**: one short foundation phase, then screen-group phases in the order a real user touches them. Each phase ships a usable slice and is verified end-to-end before the next phase starts.

Each phase follows the same internal shape:

1. Identify screens, hook(s), tables/edge functions.
2. Replace mock data with hook calls.
3. Wrap async UI in the shared `<LoadingView>` / `<ErrorView>` / `<EmptyState>` primitives.
4. Manual verification against Supabase (insert a row, see it appear; trigger an error, retry works).
5. Commit.

Existing `useState`-based hooks are kept; every wired screen uses `useFocusEffect` so navigating back re-fetches without needing a cache layer.

## Phase 0 — Foundation

Build three small pieces every later phase depends on. No screens wired yet.

### AuthContext

- File: `context/AuthContext.tsx`
- Wraps the app at `app/_layout.tsx`.
- State: `{ user, session, loading }`.
- Subscribes once to `supabase.auth.onAuthStateChange`.
- Exposes `useAuth()` returning `{ user, session, signOut }`.
- Replaces inline `supabase.auth.getUser()` calls (currently in `app/(onboarding)/accounts.tsx` and `app/(auth)/success.tsx`).

### UX primitives (`components/ui/`)

- `LoadingView.tsx` — centered `ActivityIndicator` using brand accent `#C5FF00`, optional `label` prop.
- `ErrorView.tsx` — props `{ error, onRetry }`. Error message + retry button (`bg-primary rounded-2xl`).
- `EmptyState.tsx` — props `{ icon, title, description, action? }`. Used for "no transactions yet" etc.

Each component ~30 lines, NativeWind classes per the design system.

### Refetch pattern

Every wired screen uses:

```ts
useFocusEffect(useCallback(() => { fetchX(); }, [fetchX]));
```

instead of `useEffect`, so returning from another screen refreshes data.

### Edge function smoke test

A temporary screen button (removed in Phase 11) that invokes `cashflow-summary` and `analysis-monthly` once and logs the result. Confirms both deployments are reachable with the current user's session before Phases 4–5 depend on them.

**Tables touched:** none.

## Phases 1–11

### Phase 1 — Home dashboard
- Screens: `app/(main)/index.tsx`
- Hooks: `useAuth`, `useAccounts`, `useTransactions` (recent N), `useCashflow` (header summary)
- Tables/fns: `profiles`, `accounts`, `transactions`, edge fn `cashflow-summary`
- Replaces all mock balances and recent-transaction blocks. First real end-to-end visible to the user.

### Phase 2 — Add transaction
- Screens: `app/(main)/add-transaction.tsx`
- Hooks: `useTransactions.create`, `useAccounts` (account picker), `useCustomCategories`
- Tables: `transactions`, `custom_categories`, `accounts` (read-only — balances are derived)
- Includes receipt upload to `receipts/` bucket via `src/services/storage.ts` if that field is in the screen.

### Phase 3 — Account detail + list
- Screens: `app/(main)/home/accounts.tsx`, `home/account/[id].tsx`, `home/wallet/[id].tsx`, `home/tabung/[id].tsx`
- Hooks: `useAccounts`, `useTransactions` (filtered by `account_id`)
- Tables: `accounts`, `transactions`

### Phase 4 — Cashflow
- Screens: `app/(main)/cashflow/index.tsx`, `cashflow/info.tsx`
- Hooks: `useCashflow` with month selector
- Edge fn: `cashflow-summary` (net worth, financial class, income statement)

### Phase 5 — Analysis
- Screens: `app/(main)/home/analysis.tsx`
- Hooks: `useAnalysis`
- Edge fn: `analysis-monthly` (chart series + category breakdown)

### Phase 6 — Calendar
- Screens: `app/(main)/calendar.tsx`
- Hooks: `useTransactions` (date-range query — add `fetchByMonth` if missing)
- Tables: `transactions`

### Phase 7 — Tabung create
- Screens: `app/(main)/tabung/new/index.tsx`, `tabung/new/form.tsx`
- Hook: `useAccounts.createTabungAccount` (already exercised in onboarding — straight reuse)
- Tables: `accounts`

### Phase 8 — Settings (multi-screen)
- Screens: `settings/index`, `account`, `security`, `change-pin`, `categories`, `recurring`, `affirmations`, `data`, `notifications`
- Hooks: `useAuth.signOut`, `useSettings`, `useCustomCategories`, `useRecurring`, `useAffirmations`, `useNotifications`, `authConfigRepository` (PIN change), `useAssets`, `useLiabilities` (data screen)
- Tables: `profiles`, `auth_config`, `settings`, `custom_categories`, `recurring_transactions`, `affirmations`, `notifications`, `assets`, `liabilities`
- Storage: `avatars/` (account screen profile image)
- Large phase — commit per screen.

### Phase 9 — Notifications inbox
- Screens: `app/(main)/home/notifications.tsx`
- Hooks: `useNotifications` (list + markRead)
- Tables: `notifications`

### Phase 10 — Learn
- Screens: `home/learn/index.tsx`, `[projectId].tsx`, `[projectId]/entry.tsx`, `[projectId]/add-entry.tsx`
- Hooks: `useLearn` (projects, entries, image upload)
- Tables: `learn_projects`, `learn_entries`
- Storage: `learn-images/`

### Phase 11 — Cleanup
- Remove mock-data constants left in `constants/` or component files.
- Delete the Phase 0 smoke-test button.
- Final `npm run lint` + manual run-through of the whole journey on device.

## Coverage at completion

**Tables wired:** `auth.users`, `auth_config`, `profiles`, `accounts`, `transactions`, `custom_categories`, `recurring_transactions`, `affirmations`, `notifications`, `settings`, `assets`, `liabilities`, `learn_projects`, `learn_entries`.

**Storage buckets wired:** `avatars`, `receipts`, `learn-images`.

**Edge functions wired:** `cashflow-summary`, `analysis-monthly`.

## Verification (per phase)

Before marking a phase complete:

1. Run `npm run lint` — clean.
2. Launch app on device or simulator.
3. For each screen in the phase: trigger the happy path against a real Supabase project; confirm data appears in the Supabase dashboard (or already-seeded data appears in the screen).
4. Force an error (e.g., disable network) and confirm `<ErrorView>` shows with a working retry button.
5. If the phase has an empty state (e.g., no transactions), confirm `<EmptyState>` renders.

## Risks and mitigations

- **RLS policy gaps.** A query might silently return `[]` because RLS blocks the row. Mitigation: every phase's verification step requires confirming data round-trips both directions (read after write).
- **Edge function auth.** `cashflow-summary` and `analysis-monthly` require the user's JWT. Phase 0 smoke-test verifies this before Phases 4–5 depend on it.
- **Re-fetch storms.** `useFocusEffect` re-fetches on every navigation. Acceptable for now given no cache layer; if it becomes a perf problem, revisit in "Future considerations".
- **Settings phase scope creep.** Nine sub-screens with seven distinct repositories. Mitigation: commit per screen, allow this phase to span multiple PRs.

## Future considerations (out of scope)

- TanStack Query adoption — once the app is fully wired, evaluate whether re-fetch overhead justifies a cache layer.
- Optimistic updates — currently every mutation waits for the round-trip.
- Background sync / offline support — not addressed.
- Push notifications — `notifications` table is wired but device push delivery is separate work.

## Open questions

None at spec time. To be revisited per phase if hook signatures don't match screen needs (in which case, extend the hook rather than bypass it).
