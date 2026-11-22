# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Flowe** is a personal finance tracker mobile app for Android/iOS, built with Expo (React Native), backed by Supabase (Auth, PostgreSQL + RLS, Storage, Edge Functions). Malaysian context: bank presets, e-wallets, and *tabung* (savings jar) accounts.

**Important:** Expo has changed a lot. Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.

## Tech Stack

- **Framework:** Expo SDK 54 (React Native 0.81, React 19, new architecture, React Compiler enabled)
- **Routing:** expo-router 6 (file-based, `app/`, typed routes)
- **Styling:** NativeWind 4 (Tailwind 3) + `app/global.css`
- **Animation:** react-native-reanimated 4 + react-native-worklets
- **Backend:** Supabase (`@supabase/supabase-js`, patched via patch-package)
- **State:** React Context + zustand; data fetching through custom hooks
- **Icons:** lucide-react-native, @expo/vector-icons
- **Charts:** react-native-svg (custom `DonutChart`, `MonthlyTrendChart`)
- **Native:** local Expo module `modules/flowe-notifications` (Kotlin, Android-only)
- **Tests:** Jest + jest-expo + @testing-library/react-native

## Commands

```bash
npm run start       # Expo dev server (dev client — this app needs a dev build, not Expo Go)
npm run android     # Build/run Android app
npm run ios         # Build/run iOS app
npm run web         # Start web app
npm run lint        # ESLint (expo lint)
npm test            # Jest
npm run reset-project
```

Env vars live in `.env.local`: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
EAS builds are configured in `eas.json` (project id in `app.json` → `extra.eas`).

## Architecture

### Strict layering

```
Screen → Hook → Repository / Service → src/lib/supabase.ts → Supabase
```

Components and screens **never** call Supabase directly. Repositories and services return a
`Result<T, E>` (`src/utils/result.ts`) instead of throwing; hooks unwrap that into
`{ data, loading, error }`. Follow this when adding anything new.

### Route groups (`app/`)

`app/_layout.tsx` is the auth gate. It resolves three states from secure-store flags and the
Supabase session (anonymous sign-in is the default), then redirects:

- `(auth)` — PIN setup: welcome → create-pin → confirm-pin → fingerprint → success
- `(onboarding)` — name → accounts (bank / wallet / tabung)
- `(main)` — protected app: home, add-transaction, calendar, cashflow, analysis, accounts,
  tabung, learn, notifications, settings

`refreshGate()` exported from `app/_layout.tsx` re-runs the gate after PIN/onboarding changes.

Inside `(main)`, the PIN lock is **deferred**: `LockProvider` (`context/LockContext.tsx`)
starts `locked` but Home (figures masked) and `add-transaction` stay usable; any other
route triggers the overlay via `LockedRouteGuard` (allowlist in `src/utils/lockRoutes.ts`).
Gate an action with `await requireUnlock()`; read `locked` to decide what to mask.

### Directories

- `app/` — screens (expo-router)
- `components/` — feature UI (`home/`, `cashflow/`, `onboarding/`, `ui/`)
- `src/hooks/` — data hooks (`useTransactions`, `useCashflow`, `useAccounts`, `useDetectedTransactions`, …)
- `src/repositories/` — one file per table, exported from `src/repositories/index.ts`
- `src/services/` — `edgeFunctions`, `storage`, `notifications`, `recurring`, `merchantLogos`
- `src/lib/` — `supabase.ts`, `secureStore.ts` (PIN hash + flags), `pinCrypto.ts`
- `src/types/` — `database.types.ts` (row types + enums), cashflow/receipt/onboarding types
- `src/utils/` — parsing/matching helpers, `result.ts`
- `context/` — Auth, Onboarding, Settings, Learn, Lock, TabBar providers
- `constants/` — `categories.ts`, `banks.ts`, `notificationSources.ts`, `theme.ts`
- `modules/flowe-notifications/` — Android notification-listener native module
- `supabase/functions/`, `supabase/migrations/` — Edge Functions and SQL
- `docs/` — architecture, API, DB, theme, user journey, auto-detect flow
- `__tests__/`, `tests/` — Jest specs

## Backend

All table access is Row Level Security-scoped to `auth.uid()`, so queries need no manual user filter.

**Tables:** `profiles`, `auth_config`, `accounts` (+ `bank_accounts`, `wallet_accounts`,
`tabung_accounts`), `transactions`, `recurring_rules`, `assets`, `liabilities`,
`learn_projects` / `learn_entries` / `learn_entry_images`, `notifications`, `affirmations` /
`user_affirmations` / `affirmation_favourites`, `settings`, `custom_categories`,
`bank_presets`, `merchant_logos`, `merchant_logo_requests`.

**Edge Functions** (called via `src/services/edgeFunctions.ts`):

- `cashflow-summary` — net worth, financial class, income statement for a month
- `analysis-monthly` — chart data and category breakdown (deployed; source not in repo)
- `receipt-ocr` — OpenAI-vision receipt extraction; the client sends the device's local date so dates aren't hallucinated

```typescript
supabase.functions.invoke('cashflow-summary', { body: { month: '2026-05' } })
```

**Storage buckets** (private, RLS; accessed with time-limited signed URLs via `src/services/storage.ts`):
`avatars/`, `receipts/`, `learn-images/`, `tabung-covers/`.

## Auto-detect (Android only)

Bank / e-wallet notifications are captured by the native listener service in
`modules/flowe-notifications`, queued on-device, surfaced as a quick-capture notification
(Expense / Income / Ignore), then parsed (`src/utils/parseTransactionNotification.ts`),
matched to an account (`resolveDetectedAccount.ts`) and confirmed in
`components/home/DetectedTransactionIsland.tsx` before becoming a transaction row.
iOS cannot read other apps' notifications, so `FloweNotifications.isAvailable` is `false`
there and the flow is inert. Detections that can't file themselves are listed on Home
(`PendingEntriesCard`) from the shared `DetectedTransactionsProvider`. A daily budget
(`settings.daily_budget`, Settings → Daily Budget) drives a 2×2 home-screen widget
(`BudgetWidgetProvider.kt` + `BudgetStore.kt` + `BudgetRing.kt`), redrawn on every
transaction write — `transactionsRepository` emits `onTransactionsChanged`, and
`services/dailyBudget.ts` re-reads today's total and pushes it. Full walkthrough:
`docs/Flowe_AutoDetect_Flow.md`.

## Design System (v2)

Light, navy→cobalt. Source files are read-only: `design/DESIGN.md` and `design/tailwind.theme.json`.
`theme/tokens.js` is the one token module (it reads the JSON and adds the AA tokens
`on-surface-variant-aa` #666666 and `on-primary-soft` 80% white). It feeds `tailwind.config.js`,
TypeScript (`theme/tokens.d.ts`), `app.config.js` (splash / icon colours) and the Android widget
colours (`node scripts/generate-native-tokens.js` → `res/values/flowe_tokens.xml`;
`tests/nativeTokens.test.ts` fails on drift). Never hard-code a hex value in a component.

Rules: the gradient (`GradientFill`, `Hero`) only as a field holding one key metric; white sheets with a
32 px top radius; glass (white 16%) only on the gradient; `#F5F5F5` stat tiles (12 radius), `#EFEFEF`
pills; black `#020202` is the only selected / primary colour, one primary per region; every control a pill
or circle; no shadows; Inter 400–600 with tabular figures via `components/ui/Text`; amounts via
`components/ui/Money` (muted cents, sign + arrow, never red/green); charts use `tokens.chart` only.

Feedback: `ConfirmSheet` (destructive), `InlineError` (validation), `useToast()` (success / failure with
Retry or Undo). There are no `Alert.alert` calls; keep it that way. The plan and frame map: `docs/V2_PLAN.md`.

## Conventions

- New data access = repository method returning `Result<T>` + a hook that unwraps it; never fetch in a component.
- Account balances are only ever moved by the `adjust_account_balance` Postgres function
  (`applyBalanceEffect` in `transactions.repository.ts`). Never read a balance, add to it in
  JS and write it back: auto-detect files from several runtimes at once, and that pattern
  loses adjustments. `recalculate_account_balances` (Settings → Data) is the repair.
- Reuse `components/ui/` primitives (`Text`, `Money`, `Button`, `HeroScreen`, `Sheet`, `ConfirmSheet`, `TextInput`, `SettingsRow`, `EmptyState`, `Skeleton`, …) rather than restyling from scratch.
- Row/enum types come from `src/types/database.types.ts` — extend there when the schema changes, and add a matching SQL file under `supabase/migrations/`.
- Tests cover pure logic (parsing, matching, crypto, recurring); add specs alongside the existing ones in `tests/`.
