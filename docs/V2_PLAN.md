# Flowe v2 — mobile plan (branch `flowe-app-v2`)

Source of truth: Claude Design canvas **"Flowe — Full App Redesign"** (page *Mobile*, sections A–Q,
143 frames) plus `design/DESIGN.md` and `design/tailwind.theme.json` (read-only). Where the
prompt's design rules and DESIGN.md disagree, the design rules win (AA tokens, chart colours,
no red/green).

## 1. Architecture: what stays, what changes

Layering is unchanged: `Screen → Hook → Repository / Service → src/lib/supabase.ts`.
Only the UI layer is rewritten.

| Layer | Status | Notes |
|---|---|---|
| `src/repositories/*` | **Kept**, extended | `Result<T, SupabaseError>` pattern kept. New: `tabung.repository.ts` (monthly flows via the new view), `settings` gains `monthly_budget`, `live_budget_mode`; `accountsRepository.updateTabungGoal` gains `progress_mode`. |
| `src/hooks/*` | **Kept**, extended | New: `useTabungProgress`, `useBudgetSettings`, `useCountDown`, `useRefresh`. |
| `src/services/*` | **Kept**, extended | `dailyBudget.ts` also pushes monthly figures + live-update mode to the native side. |
| `src/lib/*` | **Kept** | PIN crypto / secure store untouched. New pure modules: `src/lib/money.ts` (formatter), `src/lib/tabungProgress.ts`, `src/lib/budget.ts`, `src/lib/toastMessages.ts`. |
| `src/utils/*` | **Kept** | |
| `context/*` | **Kept** | `ToastProvider` added in `components/ui/ToastProvider.tsx`. |
| `modules/flowe-notifications` | **Kept**, extended (scope: step 6 only) | `BudgetStore` gains monthly figures + mode; new `LiveBudgetNotifier` (ongoing notification, `ProgressStyle` on API 36+), restyled `BudgetWidgetProvider` (2×2), new `MonthBudgetWidgetProvider` (4×2) and `TabungWidgetProvider` (4×2) + `TabungStore`. Colours come from generated `res/values/flowe_tokens.xml`. |
| `app/**` screens | **Rewritten UI** | Same routes. One new route: `(onboarding)/notification-access` (frame C6). |
| `components/**` | **Rewritten UI** | New design-system layer in `components/ui/`; old dark-theme primitives removed. |
| `tailwind.config.js`, `constants/theme.ts` | **Replaced** | Both read the one token module `theme/tokens.js`. |

### Token module

`theme/tokens.js` (CommonJS so `tailwind.config.js` can `require` it) loads
`design/tailwind.theme.json`, adds the two AA tokens that override the file:

- `on-surface-variant-aa` `#666666` — meta text on `#F5F5F5` / `#EFEFEF`
- `on-primary-soft` `rgba(255,255,255,0.8)` — small labels on the gradient

and exports `colors`, `radius`, `spacing`, `fontSize`, `gradient`, `chart`
(`#011A4D / #1665B1 / #7B9DBC`). `theme/tokens.d.ts` types it. Components import from
`theme/tokens` or use the NativeWind classes; no hex literals in components.
`scripts/generate-native-tokens.js` writes the same values to
`modules/flowe-notifications/android/src/main/res/values/flowe_tokens.xml`; a Jest test fails if
the XML drifts from the token module.

### Feedback patterns (replaces all 47 `Alert.alert`)

| Pattern | Use | Component |
|---|---|---|
| ConfirmSheet | destructive confirmation (section J) | `components/ui/ConfirmSheet.tsx` |
| InlineError | validation next to the field (section K, k-add-*, k-transfer-*, k-recurring-*, k-onb-*) | `components/ui/InlineError.tsx` |
| Toast | success / failure with Retry or Undo (k-toast-*) | `components/ui/Toast.tsx` + `ToastProvider.tsx` |

## 2. Design-system layer (`components/ui/`)

Button (white / black / action / icon pill, loading), GlassChip, GlassIconButton, Hero, Sheet,
StatTile, TransactionRow, LogoWell, SectionHeader, FloatingNav, Numpad (glass & white),
PinDots, SegmentedToggle, Toggle, TextInput, ProgressRing, CategoryBubble, Toast +
ToastProvider, ConfirmSheet, InlineError, Skeleton, EmptyState, Money (integer + muted cents),
plus helpers used by several screens: ScreenHeader, AccountPill, SettingsRow/SettingsGroup,
PhotoSlot, ErrorState.

## 3. New data (one migration: `supabase/migrations/20261117_v2_tabung_budget.sql`)

- `settings.monthly_budget numeric null`
- `settings.live_budget_mode text default 'daily'` (`daily | monthly | both`)
- `tabung_accounts.progress_mode text default 'contributed'` (`contributed | balance`)
- `tabung_monthly_flows` view (`security_invoker = true`, so RLS on `transactions` applies):
  per tabung account and month, `topped_up` and `paid_out`
- `tabung_contributed(p_account_id uuid, p_since date)` SQL function (`security invoker`)

Tabung progress rule (section N): `progress = Σ tabung_topup since from_date ÷ target_amount`.
Pay-outs never reduce it. Balance (`saved_amount`) and paid-out total are shown separately.
`progress_mode = 'balance'` switches the ring to `saved_amount ÷ target_amount`.

## 4. Frame → route → component → data

| § | Frame | Canvas title | Route | Component(s) | Data source |
|---|---|---|---|---|---|
| A | `Main` | brand/logo | (asset) | assets/images/icon.png + components/ui/BrandMark | — |
| A | `brand-icon-1024` | brand/app-icon-1024 | (asset) | app.json icon/adaptiveIcon assets | — |
| A | `brand-icon-sizes` | brand/app-icon-sizes | (asset) | app.json adaptiveIcon foreground/background | — |
| A | `brand-splash` | splash | app/_layout.tsx (gate overlay) | components/ui/LaunchScreen | secureStore flags |
| A | `brand-design-system` | brand/design-system | — | theme/tokens.js + components/ui/* | design/tailwind.theme.json |
| A | `brand-credits` | brand/credits | settings/data (Credits row) | components/ui/PhotoCredit | constants/photos.ts |
| B | `auth-welcome` | (auth)/welcome | (auth)/welcome | Hero, Button | — |
| B | `auth-create-pin` | (auth)/create-pin | (auth)/create-pin | PinDots, Numpad(glass) | OnboardingContext |
| B | `auth-confirm-pin` | (auth)/confirm-pin | (auth)/confirm-pin | PinDots, Numpad(glass) | OnboardingContext |
| B | `auth-confirm-pin-error` | (auth)/confirm-pin · mismatch | (auth)/confirm-pin | PinDots(shake), GlassChip | OnboardingContext |
| B | `auth-fingerprint` | (auth)/fingerprint | (auth)/fingerprint | Button, GlassIconButton | expo-local-authentication |
| B | `auth-success` | (auth)/success | (auth)/success | ProgressRing, Button | authRepository, authConfigRepository |
| C | `onb-name` | (onboarding)/name | (onboarding)/name | TextInput, Button | OnboardingContext |
| C | `onb-accounts-bank` | (onboarding)/accounts · Bank | (onboarding)/accounts | SegmentedToggle, BankPicker, LogoWell, TextInput | useBankPresets, accountsRepository |
| C | `onb-accounts-ewallet` | (onboarding)/accounts · E-wallet | (onboarding)/accounts | SegmentedToggle, WalletForm | accountsRepository |
| C | `onb-accounts-tabung` | (onboarding)/accounts · Tabung | (onboarding)/accounts | SegmentedToggle, TabungForm | accountsRepository |
| C | `onb-accounts-list` | (onboarding)/accounts · list | (onboarding)/accounts | AccountChip, Button | OnboardingContext |
| C | `onb-notification-access` | (onboarding)/notification-access | (onboarding)/notification-access (new screen) | Hero, Button | FloweNotifications.openSettings |
| D | `core-add-1-amount` | add-transaction · 1 amount | add-transaction | SegmentedToggle, Money, Numpad(white), AccountPill | useAccounts, useCustomCategories |
| D | `core-add-2-category` | add-transaction · 2 category | add-transaction | CategoryChips, Button | useCustomCategories |
| D | `core-add-2b-note` | add-transaction · optional note | add-transaction | TextInput (inline note) | — |
| D | `core-add-3-transfer` | add-transaction · transfer | add-transaction | AccountPill From → To | useAccounts |
| D | `core-add-4-success` | add-transaction · 4 success | add-transaction | ProgressRing(check), Button | transactionsRepository.create |
| D | `core-home` | home | (main)/index | Hero, FloatingNav, PendingEntriesCard, StatTile | useAccounts, useTransactions, useDailyBudget, useDetected |
| D | `core-home-pending-stack` | home · 3+ pending | (main)/index | PendingEntriesCard (deck) | useDetected |
| D | `core-home-scrolled` | home · scrolled | (main)/index | RecentTransactions, TransactionRow, AffirmationCard | useTransactions, useAffirmations |
| D | `core-transaction-detail` | transaction/[id] · sheet | TransactionDetail sheet | Sheet, Money, Button, ConfirmSheet, Toast(Undo) | transactionsRepository.fetchDetail/delete |
| D | `core-lock` | lock · re-open | LockOverlay | PinDots, Numpad(glass+fingerprint) | LockContext, pinVerify |
| D | `core-recurring-modal` | modal · recurring due | PendingRecurringModal | Sheet, checklist rows, Button | usePendingRecurring |
| E | `acc-accounts` | home/accounts | home/accounts | Hero, SectionHeader, TransactionRow-style account rows | useAccounts |
| E | `acc-account-id` | home/account/[id] | home/account/[id] | Hero, LogoWell, StatTile, TransactionRow | useAccounts, useAccountTransactions |
| E | `acc-wallet-id` | home/wallet/[id] | home/wallet/[id] | Hero, LogoWell, StatTile, TransactionRow | useAccounts, useAccountTransactions |
| E | `acc-tabung-id` | tabung/[id] | home/tabung/[id] | superseded by n-tabung-detail | useTabungProgress |
| E | `acc-tabung-add-money` | tabung/[id] · add money | home/tabung/[id] (sheet) | superseded by n-tabung-add-money | transactionsRepository.create |
| E | `acc-tabung-new` | tabung/new | tabung/new | goal-type grid, Button | — |
| E | `acc-tabung-new-form` | tabung/new/form | tabung/new/form | TextInput, Money, Button | accountsRepository.createTabungAccount |
| F | `ins-cashflow` | cashflow | cashflow | Hero, CategoryBubble, MonthPicker | useCashflow, useTransactions |
| F | `ins-cashflow-info` | cashflow/info | cashflow/info | IncomeStatementCard, BalanceSheetCard, FinancialClassBadge | useCashflow, useAssets, useLiabilities |
| F | `ins-add-asset` | cashflow/info · add asset | cashflow/info (sheet) | AddAssetModal → Sheet | useAssets |
| F | `ins-add-liability` | cashflow/info · add liability | cashflow/info (sheet) | AddLiabilityModal → Sheet | useLiabilities, recurringRepository |
| F | `ins-analysis` | home/analysis | home/analysis | Hero, MonthlyTrendChart, SegmentedToggle | useAnalysis |
| F | `ins-calendar` | calendar | calendar | Hero, calendar grid | useTransactions |
| F | `ins-calendar-day` | calendar · day sheet | calendar (day sheet) | Sheet, TransactionRow | useTransactions |
| F | `ins-notifications` | home/notifications | home/notifications | NotificationRow | useNotifications |
| F | `ins-learn` | home/learn | home/learn | LearnProjectCard, PhotoSlot | useLearn |
| F | `ins-learn-project` | home/learn/[projectId] | home/learn/[projectId] | Hero, entry list, Button | useLearn, learnRepository |
| F | `ins-add-entry` | learn/[projectId]/add-entry | home/learn/[projectId]/add-entry | TextInput, Button | learnRepository, storage |
| F | `ins-entry` | learn/[projectId]/entry | home/learn/[projectId]/entry | Read view, Button, ConfirmSheet | learnRepository |
| G | `set-settings` | settings | settings | SettingsGroup, SettingsRow, LogoWell | useSettings, useAuth |
| G | `set-account` | settings/account | settings/account | TextInput, Button, ConfirmSheet(sign out) | useAuth, settingsRepository |
| G | `set-security` | settings/security | settings/security | Toggle rows | authConfigRepository |
| G | `set-change-pin` | settings/change-pin | settings/change-pin | PinDots, Numpad(glass) | authConfigRepository |
| G | `set-auto-detect` | settings/auto-detect | settings/auto-detect | Toggle rows, LogoWell | FloweNotifications, useAccounts |
| G | `set-categories` | settings/categories | settings/categories | category rows | useCustomCategories |
| G | `set-category-edit` | settings/categories · add/edit | settings/categories (sheet) | Sheet, SegmentedToggle, icon grid, TextInput | useCustomCategories |
| G | `set-budget` | settings/budget | settings/budget | Hero ProgressRing, Money inputs, Button | useDailyBudget, useBudgetSettings |
| G | `set-recurring` | settings/recurring | settings/recurring | recurring rows | useRecurring |
| G | `set-recurring-add` | settings/recurring · add sheet | settings/recurring (sheet) | Sheet, SegmentedToggle, AccountPill, Button | useRecurring, useAccounts |
| G | `set-notifications` | settings/notifications | settings/notifications | Toggle rows | settingsRepository |
| G | `set-affirmations` | settings/affirmations | settings/affirmations | gradient preview card, Toggle, Button | useAffirmations |
| G | `set-data` | settings/data | settings/data | rows → sheets | transactionsRepository, assets/liabilities |
| G | `set-data-reset` | settings/data · reset confirm | settings/data (reset sheet) | ConfirmSheet typed RESET + PIN | accountsRepository.softDeleteAllAccounts |
| G | `set-merchant-request` | settings/merchant-request | settings/merchant-request | TextInput, Button | merchantLogoRequestsRepository |
| H | `st-home-empty` | home · empty | (main)/index | EmptyState + PhotoSlot | useAccounts |
| H | `st-home-loading` | home · loading | (main)/index | Skeleton | useAccounts |
| H | `st-home-error` | home · error | (main)/index | GlassChip(stale), Button | useAccounts |
| H | `st-cashflow-empty` | cashflow · empty | cashflow | EmptyState (ghost bubbles) | useCashflow |
| H | `st-cashflow-loading` | cashflow · loading | cashflow | Skeleton glass discs | useCashflow |
| H | `st-cashflow-error` | cashflow · error | cashflow | ErrorState | useCashflow |
| H | `st-recent-empty` | transactions · empty | (main)/index RecentTransactions | EmptyState | useTransactions |
| H | `st-recent-loading` | transactions · loading | (main)/index RecentTransactions | Skeleton rows | useTransactions |
| H | `st-recent-error` | transactions · error | (main)/index RecentTransactions | ErrorState | useTransactions |
| I | `m-island-collapsed` | DetectedTransactionIsland · collapsed | (main)/_layout overlay | DetectedTransactionIsland | useDetected |
| I | `m-island-expanded` | DetectedTransactionIsland · expanded | (main)/_layout overlay | DetectedTransactionIsland (expanded) | useDetected |
| I | `m-detected-form` | DetectedTransactionForm · edit | (main)/_layout overlay | DetectedTransactionForm | useDetected |
| I | `m-account-selector` | AccountSelector · sheet | shared sheet | AccountSelector | useAccounts |
| I | `m-bank-dropdown` | BankDropdown · searchable sheet | shared sheet | BankDropdown | useBankPresets |
| I | `m-pending-2` | PendingEntriesCard · 2 pending | (main)/index | PendingEntriesCard (2) | useDetected |
| I | `m-cashflow-diagram` | CashFlowDiagram · restyled | cashflow/info | CashFlowDiagram | useCashflow |
| I | `m-cashflow-pattern` | CashFlowPatternDiagram · restyled | cashflow/info | CashFlowPatternDiagram | useCashflow |
| J | `c-budget-off` | settings/budget · turn off daily budget | settings/budget | ConfirmSheet | useDailyBudget |
| J | `c-delete-transaction` | transaction · delete | TransactionDetail | ConfirmSheet + Toast(Undo) | transactionsRepository |
| J | `c-delete-account` | account/[id] · delete | home/account/[id] | ConfirmSheet + PIN | accountsRepository.softDeleteAccount |
| J | `c-delete-wallet` | wallet/[id] · delete | home/wallet/[id] | ConfirmSheet + PIN | accountsRepository.softDeleteAccount |
| J | `c-delete-tabung` | tabung/[id] · delete | home/tabung/[id] | ConfirmSheet + return account | accountsRepository, transactionsRepository |
| J | `c-delete-category` | settings/categories · delete | settings/categories | ConfirmSheet | useCustomCategories |
| J | `c-delete-recurring` | settings/recurring · delete | settings/recurring | ConfirmSheet | useRecurring |
| J | `c-delete-project` | learn/[projectId] · delete | home/learn/[projectId] | ConfirmSheet | learnRepository |
| J | `c-delete-entry` | learn/[projectId]/entry · delete | home/learn/[projectId]/entry | ConfirmSheet | learnRepository |
| J | `c-sign-out` | settings/account · sign out | settings/account | ConfirmSheet | authRepository |
| K | `k-add-invalid-amount` | add-transaction · invalid amount | add-transaction | InlineError (glass chip) | — |
| K | `k-add-missing-account` | add-transaction · missing account | add-transaction | InlineError | — |
| K | `k-transfer-same-account` | add-transaction · transfer same account | add-transaction | InlineError | — |
| K | `k-transfer-missing-destination` | add-transaction · transfer missing destination | add-transaction | InlineError | — |
| K | `k-recurring-invalid-end` | settings/recurring · invalid end date | settings/recurring (sheet) | InlineError | — |
| K | `k-recurring-transfer-unsupported` | settings/recurring · transfers not supported | settings/recurring (sheet) | InlineError | — |
| K | `k-onb-missing-fields` | (onboarding)/accounts · missing fields | (onboarding)/accounts | InlineError + focus outline | — |
| K | `k-toast-catalogue` | toast · catalogue | global | ToastProvider, Toast | src/lib/toastMessages.ts |
| K | `k-toast-saved` | home · toast saved | (main)/index | Toast(Undo) | transactionsRepository.delete (undo) |
| K | `k-toast-save-failed` | add-transaction · save failed | add-transaction | Toast(Retry) | transactionsRepository.create |
| K | `k-toast-topup-failed` | wallet/[id] · top up failed | home/wallet/[id] | Toast(Retry) | transactionsRepository.create |
| K | `k-toast-file-too-large` | settings/data · file too large | settings/data | Toast(Pick another) | expo-document-picker |
| K | `k-toast-pin-changed` | settings/security · PIN changed | settings/security | Toast | authConfigRepository |
| K | `k-permission-notifications` | permission · notification access | settings/auto-detect | PermissionSheet | FloweNotifications.openSettings |
| K | `k-permission-files` | permission · file access | settings/data | PermissionSheet | expo-document-picker |
| L | `l-inapp-unread` | home/notifications · unread | home/notifications | NotificationRow (unread) | useNotifications |
| L | `l-inapp-all-read` | home/notifications · all read | home/notifications | NotificationRow (read) | useNotifications |
| L | `l-island-inapp` | in-app banner · DetectedTransactionIsland | (main)/_layout overlay | DetectedTransactionIsland | useDetected |
| L | `l-android-headsup` | push · Android heads-up | native (QuickCaptureNotifier) | existing heads-up notification | CaptureStore |
| L | `l-push-android` | push · android · all 8 types | src/services/notifications.ts | expo-notifications content (title/body) | notificationsRepository |
| L | `l-ios-lockscreen` | push · iOS lock screen | — | DEFERRED (iOS native) | — |
| L | `l-push-ios` | push · ios · all 8 types | src/services/notifications.ts | same content as Android | notificationsRepository |
| N | `n-tabung-detail` | tabung/[id] · progress keeps moving | home/tabung/[id] | Hero, ProgressRing, TabungMonthStrip, StatTile | useTabungProgress (tabung_monthly_flows) |
| N | `n-tabung-breakdown` | tabung/[id] · monthly breakdown sheet | home/tabung/[id] (sheet) | TabungBreakdownSheet | useTabungProgress |
| N | `n-tabung-goal-reached` | tabung/[id] · goal reached | home/tabung/[id] | Hero (reached), Button | accountsRepository.updateTabungGoal |
| N | `n-tabung-progress-setting` | tabung/[id] · progress setting | home/tabung/[id] (sheet) | TabungSettingsSheet | accountsRepository.updateTabungGoal(progress_mode) |
| N | `n-tabung-add-money` | tabung/[id] · add money | home/tabung/[id] (sheet) | AmountSheet (glass numpad) | transactionsRepository.create tabung_topup |
| N | `n-tabung-pay-out` | tabung/[id] · pay out | home/tabung/[id] (sheet) | AmountSheet (glass numpad) | transactionsRepository.create tabung_withdraw |
| O | `o-android-live-update` | Android Live Update · 3 states | native LiveBudgetNotifier | ongoing notification (ProgressStyle 36+) | BudgetStore |
| O | `o-ios-live-activity-lock` | iOS Live Activity · lock screen | — | DEFERRED (iOS ActivityKit) | — |
| O | `o-ios-dynamic-island` | iOS Dynamic Island · compact + expanded | — | DEFERRED (iOS ActivityKit) | — |
| O | `o-home-live-before` | home · live · before confirm | (main)/index | Hero + PendingEntriesCard | useDetected |
| O | `o-home-live-after` | home · live · after confirm | (main)/index | useCountDown + GlassChip "Updated just now" | onTransactionsChanged |
| O | `o-settings-live-updates` | settings/notifications · live budget updates | settings/notifications | Toggle + SegmentedToggle Daily/Monthly/Both | settings.live_budget_mode |
| P | `p-android-light` | widgets · Android home · light wallpaper | native widgets | BudgetWidgetProvider, MonthBudgetWidgetProvider, TabungWidgetProvider | BudgetStore, TabungStore |
| P | `p-android-dark` | widgets · Android home · dark wallpaper | native widgets | same three providers | BudgetStore, TabungStore |
| P | `p-ios-light` | widgets · iOS home · light wallpaper | — | DEFERRED (WidgetKit) | — |
| P | `p-ios-dark` | widgets · iOS home · dark wallpaper | — | DEFERRED (WidgetKit) | — |
| P | `p-widget-states-budget` | widgets · Left today + Budget · normal / empty / stale | native widgets | empty / stale / normal states | BudgetStore |
| P | `p-widget-states-tabung` | widgets · Tabung · normal / empty / stale | native widgets | empty / stale / normal states | TabungStore |
| Q | `q-launch-1` | launch · after unlock · syncing | app/(main)/_layout | LaunchScreen (glass progress bar) | useAccounts |
| Q | `q-launch-2` | launch · cached data → live | (main)/index | Hero dimmed 55% + "Updating…" chip | useAccounts (cached) |
| Q | `q-skel-tabung` | tabung/[id] · loading | home/tabung/[id] | Skeleton | useTabungProgress |
| Q | `q-skel-accounts` | home/accounts · loading | home/accounts | Skeleton | useAccounts |
| Q | `q-skel-account-id` | account/[id] · loading | home/account/[id] | Skeleton | useAccountTransactions |
| Q | `q-skel-analysis` | home/analysis · loading | home/analysis | Skeleton | useAnalysis |
| Q | `q-skel-calendar` | calendar · loading | calendar | Skeleton | useTransactions |
| Q | `q-skel-learn` | home/learn · loading | home/learn | Skeleton | useLearn |
| Q | `q-pull-to-refresh` | home · pull to refresh | (main)/index | RefreshControl + glass spinner | fetchAccounts + refreshSpentToday |
| Q | `q-button-save-loading` | add-transaction · Save loading | add-transaction | Button loading | — |
| Q | `q-button-confirm-loading` | island · Confirm loading | DetectedTransactionIsland | Button loading (ink spinner) | — |
| Q | `q-widget-loading` | widgets · loading | native widgets | loading layout | BudgetStore (no value yet) |
| Q | `q-live-update-syncing` | Live Update · Syncing… | native LiveBudgetNotifier | "Syncing…" state | BudgetStore.syncing |

Notes on the mapping:

- **E4/E5 vs N1/N5:** `acc-tabung-id` and `acc-tabung-add-money` are the pre-N versions of
  `tabung/[id]`; section N supersedes them (same route, new progress rule).
- **H7–H9 "transactions":** there is no separate transactions route in `app/`; these are the
  states of the Recent Transactions section on Home. "View All" opens `calendar`, the existing
  full-history screen.
- **M:** the canvas's own note confirms no missing screens; every existing route has a frame.
- **L4 / L5:** the Android heads-up and push cards restyle notification *content* only;
  system chrome is drawn by Android.

## 5. Deferred (not built)

- iOS Live Activity / Dynamic Island (O2, O3) — needs a new ActivityKit extension; no iOS native
  code exists.
- iOS widgets (P3, P4) — needs a WidgetKit extension + App Group store.
- iOS lock-screen grouping (L6) — system behaviour; no app code.

## 6. Order of work

1. Tokens + design-system layer (commit 1)
2. Screens A–M + Alert.alert removal (commit 2..n)
3. Features N–Q incl. native module changes (commit)
4. Migration + types (commit)
5. Tests, then `tsc`, `lint`, `jest`, `expo export --platform android`
