# Flowe v2 — gap audit (Phase 0)

**Date:** 2026-11-17 · **Branches:** flowe-akmal `flowe-app-v2` (from c97d36f) · flowe-desktop `flowe-desktop-v1` (from 50eac5f)

**Sources compared:**
- `docs/flowe-user-journey-v2.md`
- `design/DESIGN.md` and `design/tailwind.theme.json`. These are byte-identical in both repos.
- Canvas "Flowe — Full App Redesign" (`project/canvas.json`): 176 Mobile, 171 Tablet and 69 Desktop artboards, plus 453 sticky notes.
- The code in both repos.
- The live Supabase project `flowe` (ref `txylaohgzlvhoqdyqmhy`). It was read only, with no writes.

**How status was judged.** **built**: the route or component exists and implements the behaviour and copy in the frame's sticky note and the journey. **partial**: it exists, but the frame, the journey or the prompt asks for something the code doesn't do; the gap is named. **missing**: there is no implementation. **deferred**: out of scope (iOS). In this phase, status comes from reading the code against the notes and the journey; it was not pixel-checked on a device. Device screenshots come in Phase 2 (tablet) and Phase 3 (phone).

## Summary

| Page | Artboards | Built | Partial | Missing | Deferred |
|---|---|---|---|---|---|
| Mobile | 176 | 160 | 10 | 0 | 6 |
| Tablet | 171 | 151 | 14 | 0 | 6 |
| Desktop | 69 | 63 | 5 | 1 | 0 |

Most of v2 is already in code: the earlier commits on `flowe-app-v2` and `flowe-desktop-v1` rebuilt the screens, the native widgets and live update, the tablet primitives, and desktop pairing. The work left:
1. **Cross-cutting.** Bottom-nav order (§7.1); `notif_*` and `show_affirmations` are not honoured; five server-promised notification types are not sent.
2. **Journey [unclear]/[stub] fixes.** Tabung entry point, notification-access "still off", the padlock comment, the recurring-transfer copy, and the affirmation card.
3. **Tablet.** A 2-column Settings layout, and 2-column loading skeletons for Accounts and Learn (both screens already use `ResponsiveGrid`).
4. **Desktop.** The recurring-due dialog, the cash-flow patterns dialog, and the masked locked Overview (a [TBD] on the canvas).
5. **Backend hygiene.** `analysis-monthly` source isn't in the repo, and its trend is calendar-year, not trailing. Skip-recurring has no race guard.
6. **Two semantics decisions** that need your call: Q1 (sign out) and Q2 (reset).

Tables a–d are the **Phase 0 snapshot**. What Phase 1 changed is listed under "Phase 1 results" at the end.

## a. Artboards → route / component → status

### a.Mobile — 176 artboards · built 160 · partial 10 · missing 0 · deferred 6

| Artboard | Title | Route | Component(s) | Status | Gap |
|---|---|---|---|---|---|
| `Main` | brand/logo | (asset) | assets/images, components/ui/BrandMark.tsx | **built** |  |
| `brand-icon-1024` | brand/app-icon-1024 | (asset) | app.config.js icon | **built** |  |
| `brand-icon-sizes` | brand/app-icon-sizes | (asset) | app.config.js adaptiveIcon | **built** |  |
| `brand-design-system` | brand/design-system | — | theme/tokens.js, components/ui/* | **built** |  |
| `brand-credits` | brand/credits | — | constants/photos.ts, components/ui/PhotoSlot.tsx | **built** |  |
| `brand-splash` | splash | root gate | components/ui/LaunchScreen.tsx | **built** |  |
| `q-launch-1` | launch · after unlock · syncing | (main) overlay | components/home/LaunchSync.tsx | **built** |  |
| `q-launch-2` | launch · cached data → live | (main) overlay | components/home/LaunchSync.tsx | **built** |  |
| `core-lock` | lock · re-open | (main) overlay | components/home/LockOverlay.tsx | **built** |  |
| `r-lock-wrong-pin` | lock · wrong PIN | (main) overlay | components/home/LockOverlay.tsx | **built** |  |
| `auth-welcome` | (auth)/welcome | /welcome | app/(auth)/welcome.tsx | **built** |  |
| `auth-create-pin` | (auth)/create-pin | /create-pin | app/(auth)/create-pin.tsx, components/auth/PinEntryScreen.tsx | **built** |  |
| `auth-confirm-pin` | (auth)/confirm-pin | /confirm-pin | app/(auth)/confirm-pin.tsx | **built** |  |
| `auth-confirm-pin-error` | (auth)/confirm-pin · mismatch | /confirm-pin | app/(auth)/confirm-pin.tsx | **built** |  |
| `auth-fingerprint` | (auth)/fingerprint | /fingerprint | app/(auth)/fingerprint.tsx | **built** |  |
| `r-auth-fingerprint-not-enrolled` | (auth)/fingerprint · not set up | /fingerprint | app/(auth)/fingerprint.tsx | **built** |  |
| `auth-success` | (auth)/success | /success | app/(auth)/success.tsx | **built** |  |
| `onb-name` | (onboarding)/name | /name | app/(onboarding)/name.tsx | **built** |  |
| `onb-accounts-bank` | (onboarding)/accounts · Bank | /accounts | app/(onboarding)/accounts.tsx, components/onboarding/AccountDraftForm.tsx | **built** |  |
| `onb-accounts-ewallet` | (onboarding)/accounts · E-wallet | /accounts | app/(onboarding)/accounts.tsx, components/onboarding/AccountDraftForm.tsx | **built** |  |
| `onb-accounts-tabung` | (onboarding)/accounts · Tabung | /accounts | app/(onboarding)/accounts.tsx, components/onboarding/AccountDraftForm.tsx | **built** |  |
| `m-bank-dropdown` | BankDropdown · searchable sheet | /accounts, /home/accounts | components/onboarding/BankDropdown.tsx | **built** |  |
| `k-onb-missing-fields` | (onboarding)/accounts · missing fields | /accounts | app/(onboarding)/accounts.tsx, components/onboarding/AccountDraftForm.tsx | **built** |  |
| `onb-accounts-list` | (onboarding)/accounts · list | /accounts | app/(onboarding)/accounts.tsx, components/onboarding/AccountDraftForm.tsx | **built** |  |
| `onb-notification-access` | (onboarding)/notification-access | /notification-access | app/(onboarding)/notification-access.tsx | **partial** | No "Access is still off" state after returning from system settings without access (§3.9). |
| `core-home` | home | / | app/(main)/index.tsx, components/home/HomeHero.tsx | **partial** | Bottom nav order is Home · Cashflow · + · Calendar · Settings; must be Home · Calendar · + · Cashflow · Settings (§7.1). Applies to every frame showing the nav. |
| `r-home-locked` | home · locked | / | app/(main)/index.tsx, components/home/HomeHero.tsx | **built** |  |
| `core-home-scrolled` | home · scrolled | / | app/(main)/index.tsx, components/home/HomeHero.tsx | **partial** | Affirmation card shows even when settings.show_affirmations is off (§5.5.10). |
| `core-home-pending-stack` | home · 3+ pending | / | app/(main)/index.tsx, components/home/HomeHero.tsx | **built** |  |
| `core-recurring-modal` | modal · recurring due | / | components/home/PendingRecurringModal.tsx | **built** |  |
| `r-modal-recurring-one-by-one` | modal · recurring · one by one | / | components/home/PendingRecurringModal.tsx | **built** |  |
| `r-transactions` | transactions | /transactions | app/(main)/transactions.tsx | **built** |  |
| `r-transactions-search` | transactions · search | /transactions | app/(main)/transactions.tsx | **built** |  |
| `r-transactions-category` | transactions · category filter | /transactions | app/(main)/transactions.tsx | **built** |  |
| `core-transaction-detail` | transaction/[id] · sheet | sheet | components/home/TransactionDetail.tsx | **built** |  |
| `acc-accounts` | home/accounts | /home/accounts | app/(main)/home/accounts.tsx | **built** |  |
| `r-accounts-add-sheet` | home/accounts · add account | /home/accounts | app/(main)/home/accounts.tsx | **built** |  |
| `acc-account-id` | home/account/[id] | /home/account/[id] | components/accounts/AccountDetailScreen.tsx | **built** |  |
| `r-account-menu` | account/[id] · ⋯ menu | /home/account/[id] | components/accounts/AccountDetailScreen.tsx | **built** |  |
| `r-account-edit` | account/[id] · edit details | /home/account/[id] | components/accounts/AccountDetailScreen.tsx | **built** |  |
| `r-account-filter` | account/[id] · filter | /home/account/[id] | components/accounts/AccountDetailScreen.tsx | **built** |  |
| `acc-wallet-id` | home/wallet/[id] | /home/wallet/[id] | components/accounts/AccountDetailScreen.tsx | **built** |  |
| `acc-tabung-id` | tabung/[id] | /home/tabung/[id] | app/(main)/home/tabung/[id].tsx, components/tabung/* | **built** |  |
| `r-tabung-no-target` | tabung/[id] · no target yet | /home/tabung/[id] | app/(main)/home/tabung/[id].tsx, components/tabung/* | **built** |  |
| `acc-tabung-add-money` | tabung/[id] · add money | /home/tabung/[id] | app/(main)/home/tabung/[id].tsx, components/tabung/* | **built** |  |
| `n-tabung-detail` | tabung/[id] · progress keeps moving | /home/tabung/[id] | app/(main)/home/tabung/[id].tsx, components/tabung/* | **built** |  |
| `n-tabung-breakdown` | tabung/[id] · monthly breakdown sheet | /home/tabung/[id] | app/(main)/home/tabung/[id].tsx, components/tabung/* | **built** |  |
| `n-tabung-progress-setting` | tabung/[id] · progress setting | /home/tabung/[id] | app/(main)/home/tabung/[id].tsx, components/tabung/* | **built** |  |
| `n-tabung-add-money` | tabung/[id] · add money | /home/tabung/[id] | app/(main)/home/tabung/[id].tsx, components/tabung/* | **built** |  |
| `n-tabung-pay-out` | tabung/[id] · pay out | /home/tabung/[id] | app/(main)/home/tabung/[id].tsx, components/tabung/* | **built** |  |
| `n-tabung-goal-reached` | tabung/[id] · goal reached | /home/tabung/[id] | app/(main)/home/tabung/[id].tsx, components/tabung/* | **built** |  |
| `acc-tabung-new` | tabung/new | /tabung/new | app/(main)/tabung/new/index.tsx | **partial** | Built but unreachable: no "New Tabung" entry on Accounts (§5.1.7). |
| `acc-tabung-new-form` | tabung/new/form | /tabung/new/form | app/(main)/tabung/new/form.tsx | **partial** | Built but unreachable (see tabung/new). |
| `ins-notifications` | home/notifications | /home/notifications | app/(main)/home/notifications.tsx | **built** |  |
| `l-inapp-unread` | home/notifications · unread | /home/notifications | app/(main)/home/notifications.tsx | **built** |  |
| `l-inapp-all-read` | home/notifications · all read | /home/notifications | app/(main)/home/notifications.tsx | **built** |  |
| `ins-analysis` | home/analysis | /home/analysis | app/(main)/home/analysis.tsx | **built** |  |
| `ins-learn` | home/learn | /home/learn | app/(main)/home/learn/index.tsx | **built** |  |
| `r-learn-new-project` | home/learn · new project | /home/learn | app/(main)/home/learn/index.tsx | **built** |  |
| `ins-learn-project` | home/learn/[projectId] | /home/learn/[projectId] | app/(main)/home/learn/[projectId].tsx | **built** |  |
| `r-learn-project-rename` | learn/[projectId] · rename | /home/learn/[projectId] | app/(main)/home/learn/[projectId].tsx | **built** |  |
| `ins-add-entry` | learn/[projectId]/add-entry | /home/learn/[projectId]/add-entry | app/(main)/home/learn/[projectId]/add-entry.tsx | **built** |  |
| `ins-entry` | learn/[projectId]/entry | /home/learn/[projectId]/entry | app/(main)/home/learn/[projectId]/entry.tsx | **built** |  |
| `ins-calendar` | calendar | /calendar | app/(main)/calendar.tsx | **built** |  |
| `ins-calendar-day` | calendar · day sheet | /calendar | app/(main)/calendar.tsx | **built** |  |
| `core-add-1-amount` | add-transaction · 1 amount | /add-transaction | app/(main)/add-transaction.tsx, components/add/AddSuccess.tsx | **built** |  |
| `core-add-2-category` | add-transaction · 2 category | /add-transaction | app/(main)/add-transaction.tsx, components/add/AddSuccess.tsx | **built** |  |
| `r-add-transaction-all-categories` | add-transaction · all categories | /add-transaction | app/(main)/add-transaction.tsx, components/add/AddSuccess.tsx | **built** |  |
| `core-add-2b-note` | add-transaction · optional note | /add-transaction | app/(main)/add-transaction.tsx, components/add/AddSuccess.tsx | **built** |  |
| `core-add-3-transfer` | add-transaction · transfer | /add-transaction | app/(main)/add-transaction.tsx, components/add/AddSuccess.tsx | **built** |  |
| `m-account-selector` | AccountSelector · sheet | sheet | components/ui/AccountSelector.tsx | **built** |  |
| `r-add-transaction-reading-receipt` | add-transaction · reading receipt | /add-transaction | app/(main)/add-transaction.tsx, components/add/AddSuccess.tsx | **built** |  |
| `r-add-transaction-edit` | add-transaction · edit | /add-transaction | app/(main)/add-transaction.tsx, components/add/AddSuccess.tsx | **built** |  |
| `core-add-4-success` | add-transaction · 4 success | /add-transaction | app/(main)/add-transaction.tsx, components/add/AddSuccess.tsx | **built** |  |
| `ins-cashflow` | cashflow | /cashflow | app/(main)/cashflow/index.tsx, components/ui/MonthPickerSheet.tsx | **built** |  |
| `r-cashflow-month-picker` | cashflow · month picker | /cashflow | app/(main)/cashflow/index.tsx, components/ui/MonthPickerSheet.tsx | **built** |  |
| `ins-cashflow-info` | cashflow/info | /cashflow/info | app/(main)/cashflow/info.tsx, components/cashflow/* | **built** |  |
| `ins-add-asset` | cashflow/info · add asset | /cashflow/info | app/(main)/cashflow/info.tsx, components/cashflow/* | **built** |  |
| `r-cashflow-info-edit-asset` | cashflow/info · edit asset | /cashflow/info | app/(main)/cashflow/info.tsx, components/cashflow/* | **built** |  |
| `ins-add-liability` | cashflow/info · add liability | /cashflow/info | app/(main)/cashflow/info.tsx, components/cashflow/* | **built** |  |
| `m-cashflow-diagram` | CashFlowDiagram · restyled | /cashflow/info (modal) | components/cashflow/CashFlowDiagram.tsx | **built** |  |
| `m-cashflow-pattern` | CashFlowPatternDiagram · restyled | /cashflow/info (modal) | components/cashflow/CashFlowPatternDiagram.tsx | **built** |  |
| `set-settings` | settings | /settings | app/(main)/settings/index.tsx | **built** |  |
| `set-account` | settings/account | /settings/account | app/(main)/settings/account.tsx | **built** |  |
| `set-security` | settings/security | /settings/security | app/(main)/settings/security.tsx, components/settings/DesktopPairingSheet.tsx | **built** |  |
| `r-security-lock-after` | settings/security · lock after | /settings/security | app/(main)/settings/security.tsx, components/settings/DesktopPairingSheet.tsx | **built** |  |
| `r-security-desktop-code` | settings/security · desktop code | /settings/security | app/(main)/settings/security.tsx, components/settings/DesktopPairingSheet.tsx | **built** |  |
| `set-change-pin` | settings/change-pin | /settings/change-pin | app/(main)/settings/change-pin.tsx | **built** |  |
| `r-change-pin-step-3` | settings/change-pin · step 3 | /settings/change-pin | app/(main)/settings/change-pin.tsx | **built** |  |
| `set-auto-detect` | settings/auto-detect | /settings/auto-detect | app/(main)/settings/auto-detect.tsx | **built** |  |
| `r-autodetect-last4` | settings/auto-detect · last 4 digits | /settings/auto-detect | app/(main)/settings/auto-detect.tsx | **built** |  |
| `r-autodetect-wallet-default` | settings/auto-detect · wallet pays from | /settings/auto-detect | app/(main)/settings/auto-detect.tsx | **built** |  |
| `r-autodetect-add-account-first` | settings/auto-detect · add an account first | /settings/auto-detect | app/(main)/settings/auto-detect.tsx | **built** |  |
| `r-autodetect-not-available` | settings/auto-detect · not available | /settings/auto-detect | app/(main)/settings/auto-detect.tsx | **built** |  |
| `set-categories` | settings/categories | /settings/categories | app/(main)/settings/categories.tsx | **built** |  |
| `set-category-edit` | settings/categories · add/edit | /settings/categories | app/(main)/settings/categories.tsx | **built** |  |
| `set-budget` | settings/budget | /settings/budget | app/(main)/settings/budget.tsx | **built** |  |
| `set-recurring` | settings/recurring | /settings/recurring | app/(main)/settings/recurring.tsx | **built** |  |
| `set-recurring-add` | settings/recurring · add sheet | /settings/recurring | app/(main)/settings/recurring.tsx | **built** |  |
| `set-notifications` | settings/notifications | /settings/notifications | app/(main)/settings/notifications.tsx | **partial** | notif_* flags are saved but nothing reads them; 80/100 % alerts, milestones, monthly summary, day-before reminder and daily affirmation are not sent (§5.5.9). |
| `set-affirmations` | settings/affirmations | /settings/affirmations | app/(main)/settings/affirmations.tsx | **built** |  |
| `r-affirmations-write` | settings/affirmations · write my own | /settings/affirmations | app/(main)/settings/affirmations.tsx | **built** |  |
| `set-data` | settings/data | /settings/data | app/(main)/settings/data.tsx | **built** |  |
| `set-merchant-request` | settings/merchant-request | /settings/merchant-request | app/(main)/settings/merchant-request.tsx | **built** |  |
| `k-permission-notifications` | permission · notification access | sheet | app/(main)/settings/auto-detect.tsx (permission sheet), settings/data (picker) | **built** |  |
| `m-island-collapsed` | DetectedTransactionIsland · collapsed | (main) overlay | components/home/DetectedTransactionIsland.tsx | **built** |  |
| `m-island-expanded` | DetectedTransactionIsland · expanded | (main) overlay | components/home/DetectedTransactionIsland.tsx | **built** |  |
| `l-island-inapp` | in-app banner · DetectedTransactionIsland | (main) overlay | components/home/DetectedTransactionIsland.tsx | **built** |  |
| `m-detected-form` | DetectedTransactionForm · edit | sheet | components/home/DetectedTransactionForm.tsx | **built** |  |
| `m-pending-2` | PendingEntriesCard · 2 pending | / | components/home/PendingEntriesCard.tsx | **built** |  |
| `l-android-headsup` | push · Android heads-up | Android notification | modules/flowe-notifications (QuickCaptureNotifier.kt), src/services/notifications.ts | **built** |  |
| `l-push-android` | push · android · all 8 types | Android notification | modules/flowe-notifications (QuickCaptureNotifier.kt), src/services/notifications.ts | **partial** | Only write-time notifications (expense/income/transfer/tabung/asset…) and the quick-capture push exist. Budget alert, milestone, monthly summary, day-before recurring and affirmation pushes are missing (Phase 1 step 3, Phase 3 step 3). |
| `l-ios-lockscreen` | push · iOS lock screen | Android notification | modules/flowe-notifications (QuickCaptureNotifier.kt), src/services/notifications.ts | **deferred** | iOS out of scope (Android-first). |
| `l-push-ios` | push · ios · all 8 types | Android notification | modules/flowe-notifications (QuickCaptureNotifier.kt), src/services/notifications.ts | **deferred** | iOS out of scope (Android-first). |
| `o-android-live-update` | Android Live Update · 3 states | Android notification | modules/flowe-notifications (LiveBudgetNotifier.kt) | **built** |  |
| `o-ios-live-activity-lock` | iOS Live Activity · lock screen | — (iOS) | — | **deferred** | iOS out of scope (Android-first). |
| `o-ios-dynamic-island` | iOS Dynamic Island · compact + expanded | — (iOS) | — | **deferred** | iOS out of scope (Android-first). |
| `o-home-live-before` | home · live · before confirm | / | app/(main)/index.tsx, components/home/HomeHero.tsx | **built** |  |
| `o-home-live-after` | home · live · after confirm | / | app/(main)/index.tsx, components/home/HomeHero.tsx | **built** |  |
| `o-settings-live-updates` | settings/notifications · live budget updates | /settings/notifications | app/(main)/settings/notifications.tsx | **built** |  |
| `p-android-light` | widgets · Android home · light wallpaper | Android widget | modules/flowe-notifications (BudgetWidgetProvider, MonthBudgetWidgetProvider, TabungWidgetProvider) | **built** |  |
| `p-android-dark` | widgets · Android home · dark wallpaper | Android widget | modules/flowe-notifications (BudgetWidgetProvider, MonthBudgetWidgetProvider, TabungWidgetProvider) | **built** |  |
| `p-ios-light` | widgets · iOS home · light wallpaper | Android widget | modules/flowe-notifications (BudgetWidgetProvider, MonthBudgetWidgetProvider, TabungWidgetProvider) | **deferred** | iOS out of scope (Android-first). |
| `p-ios-dark` | widgets · iOS home · dark wallpaper | Android widget | modules/flowe-notifications (BudgetWidgetProvider, MonthBudgetWidgetProvider, TabungWidgetProvider) | **deferred** | iOS out of scope (Android-first). |
| `p-widget-states-budget` | widgets · Left today + Budget · normal / empty / stale | Android widget | modules/flowe-notifications (BudgetWidgetProvider, MonthBudgetWidgetProvider, TabungWidgetProvider) | **built** |  |
| `p-widget-states-tabung` | widgets · Tabung · normal / empty / stale | Android widget | modules/flowe-notifications (BudgetWidgetProvider, MonthBudgetWidgetProvider, TabungWidgetProvider) | **built** |  |
| `c-delete-transaction` | transaction · delete | sheet | components/home/TransactionDetail.tsx, components/ui/ConfirmSheet.tsx | **built** |  |
| `c-delete-account` | account/[id] · delete | /home/account/[id] | components/accounts/AccountDetailScreen.tsx | **built** |  |
| `c-delete-wallet` | wallet/[id] · delete | /home/wallet/[id] | components/accounts/AccountDetailScreen.tsx | **built** |  |
| `c-delete-tabung` | tabung/[id] · delete | /home/tabung/[id] | app/(main)/home/tabung/[id].tsx, components/tabung/* | **built** |  |
| `r-cashflow-info-remove-asset` | cashflow/info · remove asset | /cashflow/info | app/(main)/cashflow/info.tsx, components/cashflow/* | **built** |  |
| `c-delete-category` | settings/categories · delete | /settings/categories | app/(main)/settings/categories.tsx | **built** |  |
| `c-delete-recurring` | settings/recurring · delete | /settings/recurring | app/(main)/settings/recurring.tsx | **built** |  |
| `c-budget-off` | settings/budget · turn off daily budget | /settings/budget | app/(main)/settings/budget.tsx | **built** |  |
| `c-delete-project` | learn/[projectId] · delete | /home/learn/[projectId] | app/(main)/home/learn/[projectId].tsx | **built** |  |
| `c-delete-entry` | learn/[projectId]/entry · delete | /home/learn/[projectId]/entry | app/(main)/home/learn/[projectId]/entry.tsx | **built** |  |
| `r-affirmations-remove` | settings/affirmations · remove | /settings/affirmations | app/(main)/settings/affirmations.tsx | **built** |  |
| `set-data-reset` | settings/data · reset confirm | /settings/data | app/(main)/settings/data.tsx | **partial** | Reset keeps transactions and onboardingDone. Semantics change is a STOP item (open question Q2). |
| `c-sign-out` | settings/account · sign out | /settings/account | app/(main)/settings/account.tsx | **partial** | Sign out only locks. Semantics change is a STOP item (open question Q1). |
| `k-toast-catalogue` | toast · catalogue | global | components/ui/Toast.tsx, ToastProvider.tsx | **built** |  |
| `k-toast-saved` | home · toast saved | / | app/(main)/index.tsx, components/home/HomeHero.tsx | **built** |  |
| `k-toast-save-failed` | add-transaction · save failed | /add-transaction | app/(main)/add-transaction.tsx, components/add/AddSuccess.tsx | **built** |  |
| `k-toast-topup-failed` | wallet/[id] · top up failed | /home/wallet/[id] | components/accounts/AccountDetailScreen.tsx | **built** |  |
| `k-toast-file-too-large` | settings/data · file too large | /settings/data | app/(main)/settings/data.tsx | **built** |  |
| `k-toast-pin-changed` | settings/security · PIN changed | /settings/security | app/(main)/settings/security.tsx, components/settings/DesktopPairingSheet.tsx | **built** |  |
| `k-add-invalid-amount` | add-transaction · invalid amount | /add-transaction | app/(main)/add-transaction.tsx, components/add/AddSuccess.tsx | **built** |  |
| `k-add-missing-account` | add-transaction · missing account | /add-transaction | app/(main)/add-transaction.tsx, components/add/AddSuccess.tsx | **built** |  |
| `r-add-transaction-not-enough-balance` | add-transaction · not enough balance | /add-transaction | app/(main)/add-transaction.tsx, components/add/AddSuccess.tsx | **built** |  |
| `k-transfer-same-account` | add-transaction · transfer same account | /add-transaction | app/(main)/add-transaction.tsx, components/add/AddSuccess.tsx | **built** |  |
| `k-transfer-missing-destination` | add-transaction · transfer missing destination | /add-transaction | app/(main)/add-transaction.tsx, components/add/AddSuccess.tsx | **built** |  |
| `k-recurring-invalid-end` | settings/recurring · invalid end date | /settings/recurring | app/(main)/settings/recurring.tsx | **built** |  |
| `k-recurring-transfer-unsupported` | settings/recurring · transfers not supported | /settings/recurring | app/(main)/settings/recurring.tsx | **partial** | Copy still mentions "Tabung auto-save"; must read "Recurring transfers aren't supported yet." |
| `k-permission-files` | permission · file access | sheet | app/(main)/settings/auto-detect.tsx (permission sheet), settings/data (picker) | **built** |  |
| `st-home-empty` | home · empty | / | app/(main)/index.tsx, components/home/HomeHero.tsx | **built** |  |
| `st-home-loading` | home · loading | / | app/(main)/index.tsx, components/home/HomeHero.tsx | **built** |  |
| `st-home-error` | home · error | / | app/(main)/index.tsx, components/home/HomeHero.tsx | **built** |  |
| `q-pull-to-refresh` | home · pull to refresh | / | app/(main)/index.tsx, components/home/HomeHero.tsx | **built** |  |
| `st-recent-empty` | transactions · empty | /transactions | app/(main)/transactions.tsx | **built** |  |
| `st-recent-loading` | transactions · loading | /transactions | app/(main)/transactions.tsx | **built** |  |
| `st-recent-error` | transactions · error | /transactions | app/(main)/transactions.tsx | **built** |  |
| `q-skel-accounts` | home/accounts · loading | /home/accounts | app/(main)/home/accounts.tsx | **built** |  |
| `q-skel-account-id` | account/[id] · loading | /home/account/[id] | components/accounts/AccountDetailScreen.tsx | **built** |  |
| `q-skel-tabung` | tabung/[id] · loading | /home/tabung/[id] | app/(main)/home/tabung/[id].tsx, components/tabung/* | **built** |  |
| `r-notifications-empty` | home/notifications · all caught up | /home/notifications | app/(main)/home/notifications.tsx | **built** |  |
| `r-analysis-empty` | home/analysis · empty | /home/analysis | app/(main)/home/analysis.tsx | **built** |  |
| `q-skel-analysis` | home/analysis · loading | /home/analysis | app/(main)/home/analysis.tsx | **built** |  |
| `r-learn-empty` | home/learn · empty | /home/learn | app/(main)/home/learn/index.tsx | **built** |  |
| `q-skel-learn` | home/learn · loading | /home/learn | app/(main)/home/learn/index.tsx | **built** |  |
| `q-skel-calendar` | calendar · loading | /calendar | app/(main)/calendar.tsx | **built** |  |
| `st-cashflow-empty` | cashflow · empty | /cashflow | app/(main)/cashflow/index.tsx, components/ui/MonthPickerSheet.tsx | **built** |  |
| `st-cashflow-loading` | cashflow · loading | /cashflow | app/(main)/cashflow/index.tsx, components/ui/MonthPickerSheet.tsx | **built** |  |
| `st-cashflow-error` | cashflow · error | /cashflow | app/(main)/cashflow/index.tsx, components/ui/MonthPickerSheet.tsx | **built** |  |
| `q-button-save-loading` | add-transaction · Save loading | /add-transaction | app/(main)/add-transaction.tsx, components/add/AddSuccess.tsx | **built** |  |
| `q-button-confirm-loading` | island · Confirm loading | (main) overlay | components/home/DetectedTransactionIsland.tsx | **built** |  |
| `q-widget-loading` | widgets · loading | Android widget | modules/flowe-notifications (BudgetWidgetProvider, MonthBudgetWidgetProvider, TabungWidgetProvider) | **built** |  |
| `q-live-update-syncing` | Live Update · Syncing… | Android notification | modules/flowe-notifications (LiveBudgetNotifier.kt) | **built** |  |

### a.Tablet — 171 artboards · built 151 · partial 14 · missing 0 · deferred 6

| Artboard | Title | Route | Component(s) | Status | Gap |
|---|---|---|---|---|---|
| `t-brand-splash` | splash · tablet | root gate | components/ui/LaunchScreen.tsx | **built** |  |
| `t-q-launch-1` | launch · after unlock · syncing · tablet | (main) overlay | components/home/LaunchSync.tsx | **built** |  |
| `t-q-launch-2` | launch · cached data → live · tablet | (main) overlay | components/home/LaunchSync.tsx | **built** |  |
| `t-core-lock` | lock · re-open · tablet | (main) overlay | components/home/LockOverlay.tsx | **built** |  |
| `t-r-lock-wrong-pin` | lock · wrong PIN · tablet | (main) overlay | components/home/LockOverlay.tsx | **built** |  |
| `t-auth-welcome` | (auth)/welcome · tablet | /welcome | app/(auth)/welcome.tsx | **built** |  |
| `t-auth-create-pin` | (auth)/create-pin · tablet | /create-pin | app/(auth)/create-pin.tsx, components/auth/PinEntryScreen.tsx | **built** |  |
| `t-auth-confirm-pin` | (auth)/confirm-pin · tablet | /confirm-pin | app/(auth)/confirm-pin.tsx | **built** |  |
| `t-auth-confirm-pin-error` | (auth)/confirm-pin · mismatch · tablet | /confirm-pin | app/(auth)/confirm-pin.tsx | **built** |  |
| `t-auth-fingerprint` | (auth)/fingerprint · tablet | /fingerprint | app/(auth)/fingerprint.tsx | **built** |  |
| `t-r-auth-fingerprint-not-enrolled` | (auth)/fingerprint · not set up · tablet | /fingerprint | app/(auth)/fingerprint.tsx | **built** |  |
| `t-auth-success` | (auth)/success · tablet | /success | app/(auth)/success.tsx | **built** |  |
| `t-onb-name` | (onboarding)/name · tablet | /name | app/(onboarding)/name.tsx | **partial** | Tablet sticky says "Step 1 of 3"; the journey and code say "Step 1 of 2" (open question Q4). |
| `t-onb-accounts-bank` | (onboarding)/accounts · Bank · tablet | /accounts | app/(onboarding)/accounts.tsx, components/onboarding/AccountDraftForm.tsx | **built** |  |
| `t-onb-accounts-ewallet` | (onboarding)/accounts · E-wallet · tablet | /accounts | app/(onboarding)/accounts.tsx, components/onboarding/AccountDraftForm.tsx | **built** |  |
| `t-onb-accounts-tabung` | (onboarding)/accounts · Tabung · tablet | /accounts | app/(onboarding)/accounts.tsx, components/onboarding/AccountDraftForm.tsx | **built** |  |
| `t-m-bank-dropdown` | BankDropdown · searchable sheet · tablet | /accounts, /home/accounts | components/onboarding/BankDropdown.tsx | **built** |  |
| `t-k-onb-missing-fields` | (onboarding)/accounts · missing fields · tablet | /accounts | app/(onboarding)/accounts.tsx, components/onboarding/AccountDraftForm.tsx | **built** |  |
| `t-onb-accounts-list` | (onboarding)/accounts · list · tablet | /accounts | app/(onboarding)/accounts.tsx, components/onboarding/AccountDraftForm.tsx | **built** |  |
| `t-onb-notification-access` | (onboarding)/notification-access · tablet | /notification-access | app/(onboarding)/notification-access.tsx | **partial** | No "Access is still off" state after returning from system settings without access (§3.9). |
| `t-core-home` | home · tablet | / | app/(main)/index.tsx, components/home/HomeHero.tsx | **partial** | Bottom nav order is Home · Cashflow · + · Calendar · Settings; must be Home · Calendar · + · Cashflow · Settings (§7.1). Applies to every frame showing the nav. |
| `t-r-home-locked` | home · locked · tablet | / | app/(main)/index.tsx, components/home/HomeHero.tsx | **built** |  |
| `t-core-home-scrolled` | home · scrolled · tablet | / | app/(main)/index.tsx, components/home/HomeHero.tsx | **partial** | Affirmation card shows even when settings.show_affirmations is off (§5.5.10). |
| `t-core-home-pending-stack` | home · 3+ pending · tablet | / | app/(main)/index.tsx, components/home/HomeHero.tsx | **built** |  |
| `t-core-recurring-modal` | modal · recurring due · tablet | / | components/home/PendingRecurringModal.tsx | **built** |  |
| `t-r-modal-recurring-one-by-one` | modal · recurring · one by one · tablet | / | components/home/PendingRecurringModal.tsx | **built** |  |
| `t-r-transactions` | transactions · tablet | /transactions | app/(main)/transactions.tsx | **built** |  |
| `t-r-transactions-search` | transactions · search · tablet | /transactions | app/(main)/transactions.tsx | **built** |  |
| `t-r-transactions-category` | transactions · category filter · tablet | /transactions | app/(main)/transactions.tsx | **built** |  |
| `t-core-transaction-detail` | transaction/[id] · sheet · tablet | sheet | components/home/TransactionDetail.tsx | **built** |  |
| `t-acc-accounts` | home/accounts · tablet | /home/accounts | app/(main)/home/accounts.tsx | **built** |  |
| `t-r-accounts-add-sheet` | home/accounts · add account · tablet | /home/accounts | app/(main)/home/accounts.tsx | **built** |  |
| `t-acc-account-id` | home/account/[id] · tablet | /home/account/[id] | components/accounts/AccountDetailScreen.tsx | **built** |  |
| `t-r-account-menu` | account/[id] · ⋯ menu · tablet | /home/account/[id] | components/accounts/AccountDetailScreen.tsx | **built** |  |
| `t-r-account-edit` | account/[id] · edit details · tablet | /home/account/[id] | components/accounts/AccountDetailScreen.tsx | **built** |  |
| `t-r-account-filter` | account/[id] · filter · tablet | /home/account/[id] | components/accounts/AccountDetailScreen.tsx | **built** |  |
| `t-acc-wallet-id` | home/wallet/[id] · tablet | /home/wallet/[id] | components/accounts/AccountDetailScreen.tsx | **built** |  |
| `t-acc-tabung-id` | tabung/[id] · tablet | /home/tabung/[id] | app/(main)/home/tabung/[id].tsx, components/tabung/* | **built** |  |
| `t-r-tabung-no-target` | tabung/[id] · no target yet · tablet | /home/tabung/[id] | app/(main)/home/tabung/[id].tsx, components/tabung/* | **built** |  |
| `t-acc-tabung-add-money` | tabung/[id] · add money · tablet | /home/tabung/[id] | app/(main)/home/tabung/[id].tsx, components/tabung/* | **built** |  |
| `t-n-tabung-detail` | tabung/[id] · progress keeps moving · tablet | /home/tabung/[id] | app/(main)/home/tabung/[id].tsx, components/tabung/* | **built** |  |
| `t-n-tabung-breakdown` | tabung/[id] · monthly breakdown sheet · tablet | /home/tabung/[id] | app/(main)/home/tabung/[id].tsx, components/tabung/* | **built** |  |
| `t-n-tabung-progress-setting` | tabung/[id] · progress setting · tablet | /home/tabung/[id] | app/(main)/home/tabung/[id].tsx, components/tabung/* | **built** |  |
| `t-n-tabung-add-money` | tabung/[id] · add money · tablet | /home/tabung/[id] | app/(main)/home/tabung/[id].tsx, components/tabung/* | **built** |  |
| `t-n-tabung-pay-out` | tabung/[id] · pay out · tablet | /home/tabung/[id] | app/(main)/home/tabung/[id].tsx, components/tabung/* | **built** |  |
| `t-n-tabung-goal-reached` | tabung/[id] · goal reached · tablet | /home/tabung/[id] | app/(main)/home/tabung/[id].tsx, components/tabung/* | **built** |  |
| `t-acc-tabung-new` | tabung/new · tablet | /tabung/new | app/(main)/tabung/new/index.tsx | **partial** | Built but unreachable: no "New Tabung" entry on Accounts (§5.1.7). |
| `t-acc-tabung-new-form` | tabung/new/form · tablet | /tabung/new/form | app/(main)/tabung/new/form.tsx | **partial** | Built but unreachable (see tabung/new). |
| `t-ins-notifications` | home/notifications · tablet | /home/notifications | app/(main)/home/notifications.tsx | **built** |  |
| `t-l-inapp-unread` | home/notifications · unread · tablet | /home/notifications | app/(main)/home/notifications.tsx | **built** |  |
| `t-l-inapp-all-read` | home/notifications · all read · tablet | /home/notifications | app/(main)/home/notifications.tsx | **built** |  |
| `t-ins-analysis` | home/analysis · tablet | /home/analysis | app/(main)/home/analysis.tsx | **built** |  |
| `t-ins-learn` | home/learn · tablet | /home/learn | app/(main)/home/learn/index.tsx | **built** |  |
| `t-r-learn-new-project` | home/learn · new project · tablet | /home/learn | app/(main)/home/learn/index.tsx | **built** |  |
| `t-ins-learn-project` | home/learn/[projectId] · tablet | /home/learn/[projectId] | app/(main)/home/learn/[projectId].tsx | **built** |  |
| `t-r-learn-project-rename` | learn/[projectId] · rename · tablet | /home/learn/[projectId] | app/(main)/home/learn/[projectId].tsx | **built** |  |
| `t-ins-add-entry` | learn/[projectId]/add-entry · tablet | /home/learn/[projectId]/add-entry | app/(main)/home/learn/[projectId]/add-entry.tsx | **built** |  |
| `t-ins-entry` | learn/[projectId]/entry · tablet | /home/learn/[projectId]/entry | app/(main)/home/learn/[projectId]/entry.tsx | **built** |  |
| `t-ins-calendar` | calendar · tablet | /calendar | app/(main)/calendar.tsx | **built** |  |
| `t-ins-calendar-day` | calendar · day sheet · tablet | /calendar | app/(main)/calendar.tsx | **built** |  |
| `t-core-add-1-amount` | add-transaction · 1 amount · tablet | /add-transaction | app/(main)/add-transaction.tsx, components/add/AddSuccess.tsx | **built** |  |
| `t-core-add-2-category` | add-transaction · 2 category · tablet | /add-transaction | app/(main)/add-transaction.tsx, components/add/AddSuccess.tsx | **built** |  |
| `t-r-add-transaction-all-categories` | add-transaction · all categories · tablet | /add-transaction | app/(main)/add-transaction.tsx, components/add/AddSuccess.tsx | **built** |  |
| `t-core-add-2b-note` | add-transaction · optional note · tablet | /add-transaction | app/(main)/add-transaction.tsx, components/add/AddSuccess.tsx | **built** |  |
| `t-core-add-3-transfer` | add-transaction · transfer · tablet | /add-transaction | app/(main)/add-transaction.tsx, components/add/AddSuccess.tsx | **built** |  |
| `t-m-account-selector` | AccountSelector · sheet · tablet | sheet | components/ui/AccountSelector.tsx | **built** |  |
| `t-r-add-transaction-reading-receipt` | add-transaction · reading receipt · tablet | /add-transaction | app/(main)/add-transaction.tsx, components/add/AddSuccess.tsx | **built** |  |
| `t-r-add-transaction-edit` | add-transaction · edit · tablet | /add-transaction | app/(main)/add-transaction.tsx, components/add/AddSuccess.tsx | **built** |  |
| `t-core-add-4-success` | add-transaction · 4 success · tablet | /add-transaction | app/(main)/add-transaction.tsx, components/add/AddSuccess.tsx | **built** |  |
| `t-ins-cashflow` | cashflow · tablet | /cashflow | app/(main)/cashflow/index.tsx, components/ui/MonthPickerSheet.tsx | **built** |  |
| `t-r-cashflow-month-picker` | cashflow · month picker · tablet | /cashflow | app/(main)/cashflow/index.tsx, components/ui/MonthPickerSheet.tsx | **built** |  |
| `t-ins-cashflow-info` | cashflow/info · tablet | /cashflow/info | app/(main)/cashflow/info.tsx, components/cashflow/* | **built** |  |
| `t-ins-add-asset` | cashflow/info · add asset · tablet | /cashflow/info | app/(main)/cashflow/info.tsx, components/cashflow/* | **built** |  |
| `t-r-cashflow-info-edit-asset` | cashflow/info · edit asset · tablet | /cashflow/info | app/(main)/cashflow/info.tsx, components/cashflow/* | **built** |  |
| `t-ins-add-liability` | cashflow/info · add liability · tablet | /cashflow/info | app/(main)/cashflow/info.tsx, components/cashflow/* | **built** |  |
| `t-m-cashflow-diagram` | CashFlowDiagram · restyled · tablet | /cashflow/info (modal) | components/cashflow/CashFlowDiagram.tsx | **built** |  |
| `t-m-cashflow-pattern` | CashFlowPatternDiagram · restyled · tablet | /cashflow/info (modal) | components/cashflow/CashFlowPatternDiagram.tsx | **built** |  |
| `t-set-settings` | settings · tablet | /settings | app/(main)/settings/index.tsx | **partial** | Tablet frame shows grouped rows in 2 columns; code uses the 640 px column. |
| `t-set-account` | settings/account · tablet | /settings/account | app/(main)/settings/account.tsx | **built** |  |
| `t-set-security` | settings/security · tablet | /settings/security | app/(main)/settings/security.tsx, components/settings/DesktopPairingSheet.tsx | **built** |  |
| `t-r-security-lock-after` | settings/security · lock after · tablet | /settings/security | app/(main)/settings/security.tsx, components/settings/DesktopPairingSheet.tsx | **built** |  |
| `t-r-security-desktop-code` | settings/security · desktop code · tablet | /settings/security | app/(main)/settings/security.tsx, components/settings/DesktopPairingSheet.tsx | **built** |  |
| `t-set-change-pin` | settings/change-pin · tablet | /settings/change-pin | app/(main)/settings/change-pin.tsx | **built** |  |
| `t-r-change-pin-step-3` | settings/change-pin · step 3 · tablet | /settings/change-pin | app/(main)/settings/change-pin.tsx | **built** |  |
| `t-set-auto-detect` | settings/auto-detect · tablet | /settings/auto-detect | app/(main)/settings/auto-detect.tsx | **built** |  |
| `t-r-autodetect-last4` | settings/auto-detect · last 4 digits · tablet | /settings/auto-detect | app/(main)/settings/auto-detect.tsx | **built** |  |
| `t-r-autodetect-wallet-default` | settings/auto-detect · wallet pays from · tablet | /settings/auto-detect | app/(main)/settings/auto-detect.tsx | **built** |  |
| `t-r-autodetect-add-account-first` | settings/auto-detect · add an account first · tablet | /settings/auto-detect | app/(main)/settings/auto-detect.tsx | **built** |  |
| `t-r-autodetect-not-available` | settings/auto-detect · not available · tablet | /settings/auto-detect | app/(main)/settings/auto-detect.tsx | **built** |  |
| `t-set-categories` | settings/categories · tablet | /settings/categories | app/(main)/settings/categories.tsx | **built** |  |
| `t-set-category-edit` | settings/categories · add/edit · tablet | /settings/categories | app/(main)/settings/categories.tsx | **built** |  |
| `t-set-budget` | settings/budget · tablet | /settings/budget | app/(main)/settings/budget.tsx | **built** |  |
| `t-set-recurring` | settings/recurring · tablet | /settings/recurring | app/(main)/settings/recurring.tsx | **built** |  |
| `t-set-recurring-add` | settings/recurring · add sheet · tablet | /settings/recurring | app/(main)/settings/recurring.tsx | **built** |  |
| `t-set-notifications` | settings/notifications · tablet | /settings/notifications | app/(main)/settings/notifications.tsx | **partial** | notif_* flags are saved but nothing reads them; 80/100 % alerts, milestones, monthly summary, day-before reminder and daily affirmation are not sent (§5.5.9). |
| `t-set-affirmations` | settings/affirmations · tablet | /settings/affirmations | app/(main)/settings/affirmations.tsx | **built** |  |
| `t-r-affirmations-write` | settings/affirmations · write my own · tablet | /settings/affirmations | app/(main)/settings/affirmations.tsx | **built** |  |
| `t-set-data` | settings/data · tablet | /settings/data | app/(main)/settings/data.tsx | **built** |  |
| `t-set-merchant-request` | settings/merchant-request · tablet | /settings/merchant-request | app/(main)/settings/merchant-request.tsx | **built** |  |
| `t-k-permission-notifications` | permission · notification access · tablet | sheet | app/(main)/settings/auto-detect.tsx (permission sheet), settings/data (picker) | **built** |  |
| `t-m-island-collapsed` | DetectedTransactionIsland · collapsed · tablet | (main) overlay | components/home/DetectedTransactionIsland.tsx | **built** |  |
| `t-m-island-expanded` | DetectedTransactionIsland · expanded · tablet | (main) overlay | components/home/DetectedTransactionIsland.tsx | **built** |  |
| `t-l-island-inapp` | in-app banner · DetectedTransactionIsland · tablet | (main) overlay | components/home/DetectedTransactionIsland.tsx | **built** |  |
| `t-m-detected-form` | DetectedTransactionForm · edit · tablet | sheet | components/home/DetectedTransactionForm.tsx | **built** |  |
| `t-m-pending-2` | PendingEntriesCard · 2 pending · tablet | / | components/home/PendingEntriesCard.tsx | **built** |  |
| `t-l-android-headsup` | push · Android heads-up · tablet | Android notification | modules/flowe-notifications (QuickCaptureNotifier.kt), src/services/notifications.ts | **built** |  |
| `t-l-push-android` | push · android · all 8 types · tablet | Android notification | modules/flowe-notifications (QuickCaptureNotifier.kt), src/services/notifications.ts | **partial** | Only write-time notifications (expense/income/transfer/tabung/asset…) and the quick-capture push exist. Budget alert, milestone, monthly summary, day-before recurring and affirmation pushes are missing (Phase 1 step 3, Phase 3 step 3). |
| `t-l-ios-lockscreen` | push · iOS lock screen · tablet | Android notification | modules/flowe-notifications (QuickCaptureNotifier.kt), src/services/notifications.ts | **deferred** | iOS out of scope (Android-first). |
| `t-l-push-ios` | push · ios · all 8 types · tablet | Android notification | modules/flowe-notifications (QuickCaptureNotifier.kt), src/services/notifications.ts | **deferred** | iOS out of scope (Android-first). |
| `t-o-android-live-update` | Android Live Update · 3 states · tablet | Android notification | modules/flowe-notifications (LiveBudgetNotifier.kt) | **built** |  |
| `t-o-ios-live-activity-lock` | iOS Live Activity · lock screen · tablet | — (iOS) | — | **deferred** | iOS out of scope (Android-first). |
| `t-o-ios-dynamic-island` | iOS Dynamic Island · compact + expanded · tablet | — (iOS) | — | **deferred** | iOS out of scope (Android-first). |
| `t-o-home-live-before` | home · live · before confirm · tablet | / | app/(main)/index.tsx, components/home/HomeHero.tsx | **built** |  |
| `t-o-home-live-after` | home · live · after confirm · tablet | / | app/(main)/index.tsx, components/home/HomeHero.tsx | **built** |  |
| `t-o-settings-live-updates` | settings/notifications · live budget updates · tablet | /settings/notifications | app/(main)/settings/notifications.tsx | **built** |  |
| `t-p-android-light` | widgets · Android home · light wallpaper · tablet | Android widget | modules/flowe-notifications (BudgetWidgetProvider, MonthBudgetWidgetProvider, TabungWidgetProvider) | **built** |  |
| `t-p-android-dark` | widgets · Android home · dark wallpaper · tablet | Android widget | modules/flowe-notifications (BudgetWidgetProvider, MonthBudgetWidgetProvider, TabungWidgetProvider) | **built** |  |
| `t-p-ios-light` | widgets · iOS home · light wallpaper · tablet | Android widget | modules/flowe-notifications (BudgetWidgetProvider, MonthBudgetWidgetProvider, TabungWidgetProvider) | **deferred** | iOS out of scope (Android-first). |
| `t-p-ios-dark` | widgets · iOS home · dark wallpaper · tablet | Android widget | modules/flowe-notifications (BudgetWidgetProvider, MonthBudgetWidgetProvider, TabungWidgetProvider) | **deferred** | iOS out of scope (Android-first). |
| `t-p-widget-states-budget` | widgets · Left today + Budget · normal / empty / stale · tablet | Android widget | modules/flowe-notifications (BudgetWidgetProvider, MonthBudgetWidgetProvider, TabungWidgetProvider) | **built** |  |
| `t-p-widget-states-tabung` | widgets · Tabung · normal / empty / stale · tablet | Android widget | modules/flowe-notifications (BudgetWidgetProvider, MonthBudgetWidgetProvider, TabungWidgetProvider) | **built** |  |
| `t-c-delete-transaction` | transaction · delete · tablet | sheet | components/home/TransactionDetail.tsx, components/ui/ConfirmSheet.tsx | **built** |  |
| `t-c-delete-account` | account/[id] · delete · tablet | /home/account/[id] | components/accounts/AccountDetailScreen.tsx | **built** |  |
| `t-c-delete-wallet` | wallet/[id] · delete · tablet | /home/wallet/[id] | components/accounts/AccountDetailScreen.tsx | **built** |  |
| `t-c-delete-tabung` | tabung/[id] · delete · tablet | /home/tabung/[id] | app/(main)/home/tabung/[id].tsx, components/tabung/* | **built** |  |
| `t-r-cashflow-info-remove-asset` | cashflow/info · remove asset · tablet | /cashflow/info | app/(main)/cashflow/info.tsx, components/cashflow/* | **built** |  |
| `t-c-delete-category` | settings/categories · delete · tablet | /settings/categories | app/(main)/settings/categories.tsx | **built** |  |
| `t-c-delete-recurring` | settings/recurring · delete · tablet | /settings/recurring | app/(main)/settings/recurring.tsx | **built** |  |
| `t-c-budget-off` | settings/budget · turn off daily budget · tablet | /settings/budget | app/(main)/settings/budget.tsx | **built** |  |
| `t-c-delete-project` | learn/[projectId] · delete · tablet | /home/learn/[projectId] | app/(main)/home/learn/[projectId].tsx | **built** |  |
| `t-c-delete-entry` | learn/[projectId]/entry · delete · tablet | /home/learn/[projectId]/entry | app/(main)/home/learn/[projectId]/entry.tsx | **built** |  |
| `t-r-affirmations-remove` | settings/affirmations · remove · tablet | /settings/affirmations | app/(main)/settings/affirmations.tsx | **built** |  |
| `t-set-data-reset` | settings/data · reset confirm · tablet | /settings/data | app/(main)/settings/data.tsx | **partial** | Reset keeps transactions and onboardingDone. Semantics change is a STOP item (open question Q2). |
| `t-c-sign-out` | settings/account · sign out · tablet | /settings/account | app/(main)/settings/account.tsx | **partial** | Sign out only locks. Semantics change is a STOP item (open question Q1). |
| `t-k-toast-catalogue` | toast · catalogue · tablet | global | components/ui/Toast.tsx, ToastProvider.tsx | **built** |  |
| `t-k-toast-saved` | home · toast saved · tablet | / | app/(main)/index.tsx, components/home/HomeHero.tsx | **built** |  |
| `t-k-toast-save-failed` | add-transaction · save failed · tablet | /add-transaction | app/(main)/add-transaction.tsx, components/add/AddSuccess.tsx | **built** |  |
| `t-k-toast-topup-failed` | wallet/[id] · top up failed · tablet | /home/wallet/[id] | components/accounts/AccountDetailScreen.tsx | **built** |  |
| `t-k-toast-file-too-large` | settings/data · file too large · tablet | /settings/data | app/(main)/settings/data.tsx | **built** |  |
| `t-k-toast-pin-changed` | settings/security · PIN changed · tablet | /settings/security | app/(main)/settings/security.tsx, components/settings/DesktopPairingSheet.tsx | **built** |  |
| `t-k-add-invalid-amount` | add-transaction · invalid amount · tablet | /add-transaction | app/(main)/add-transaction.tsx, components/add/AddSuccess.tsx | **built** |  |
| `t-k-add-missing-account` | add-transaction · missing account · tablet | /add-transaction | app/(main)/add-transaction.tsx, components/add/AddSuccess.tsx | **built** |  |
| `t-r-add-transaction-not-enough-balance` | add-transaction · not enough balance · tablet | /add-transaction | app/(main)/add-transaction.tsx, components/add/AddSuccess.tsx | **built** |  |
| `t-k-transfer-same-account` | add-transaction · transfer same account · tablet | /add-transaction | app/(main)/add-transaction.tsx, components/add/AddSuccess.tsx | **built** |  |
| `t-k-transfer-missing-destination` | add-transaction · transfer missing destination · tablet | /add-transaction | app/(main)/add-transaction.tsx, components/add/AddSuccess.tsx | **built** |  |
| `t-k-recurring-invalid-end` | settings/recurring · invalid end date · tablet | /settings/recurring | app/(main)/settings/recurring.tsx | **built** |  |
| `t-k-recurring-transfer-unsupported` | settings/recurring · transfers not supported · tablet | /settings/recurring | app/(main)/settings/recurring.tsx | **partial** | Copy still mentions "Tabung auto-save"; must read "Recurring transfers aren't supported yet." |
| `t-k-permission-files` | permission · file access · tablet | sheet | app/(main)/settings/auto-detect.tsx (permission sheet), settings/data (picker) | **built** |  |
| `t-st-home-empty` | home · empty · tablet | / | app/(main)/index.tsx, components/home/HomeHero.tsx | **built** |  |
| `t-st-home-loading` | home · loading · tablet | / | app/(main)/index.tsx, components/home/HomeHero.tsx | **built** |  |
| `t-st-home-error` | home · error · tablet | / | app/(main)/index.tsx, components/home/HomeHero.tsx | **built** |  |
| `t-q-pull-to-refresh` | home · pull to refresh · tablet | / | app/(main)/index.tsx, components/home/HomeHero.tsx | **built** |  |
| `t-st-recent-empty` | transactions · empty · tablet | /transactions | app/(main)/transactions.tsx | **built** |  |
| `t-st-recent-loading` | transactions · loading · tablet | /transactions | app/(main)/transactions.tsx | **built** |  |
| `t-st-recent-error` | transactions · error · tablet | /transactions | app/(main)/transactions.tsx | **built** |  |
| `t-q-skel-accounts` | home/accounts · loading · tablet | /home/accounts | app/(main)/home/accounts.tsx | **partial** | Skeleton is single-column; the screen itself uses the 2-column ResponsiveGrid. |
| `t-q-skel-account-id` | account/[id] · loading · tablet | /home/account/[id] | components/accounts/AccountDetailScreen.tsx | **built** |  |
| `t-q-skel-tabung` | tabung/[id] · loading · tablet | /home/tabung/[id] | app/(main)/home/tabung/[id].tsx, components/tabung/* | **built** |  |
| `t-r-notifications-empty` | home/notifications · all caught up · tablet | /home/notifications | app/(main)/home/notifications.tsx | **built** |  |
| `t-r-analysis-empty` | home/analysis · empty · tablet | /home/analysis | app/(main)/home/analysis.tsx | **built** |  |
| `t-q-skel-analysis` | home/analysis · loading · tablet | /home/analysis | app/(main)/home/analysis.tsx | **built** |  |
| `t-r-learn-empty` | home/learn · empty · tablet | /home/learn | app/(main)/home/learn/index.tsx | **built** |  |
| `t-q-skel-learn` | home/learn · loading · tablet | /home/learn | app/(main)/home/learn/index.tsx | **partial** | Skeleton must follow the 2-column tablet layout. |
| `t-q-skel-calendar` | calendar · loading · tablet | /calendar | app/(main)/calendar.tsx | **built** |  |
| `t-st-cashflow-empty` | cashflow · empty · tablet | /cashflow | app/(main)/cashflow/index.tsx, components/ui/MonthPickerSheet.tsx | **built** |  |
| `t-st-cashflow-loading` | cashflow · loading · tablet | /cashflow | app/(main)/cashflow/index.tsx, components/ui/MonthPickerSheet.tsx | **built** |  |
| `t-st-cashflow-error` | cashflow · error · tablet | /cashflow | app/(main)/cashflow/index.tsx, components/ui/MonthPickerSheet.tsx | **built** |  |
| `t-q-button-save-loading` | add-transaction · Save loading · tablet | /add-transaction | app/(main)/add-transaction.tsx, components/add/AddSuccess.tsx | **built** |  |
| `t-q-button-confirm-loading` | island · Confirm loading · tablet | (main) overlay | components/home/DetectedTransactionIsland.tsx | **built** |  |
| `t-q-widget-loading` | widgets · loading · tablet | Android widget | modules/flowe-notifications (BudgetWidgetProvider, MonthBudgetWidgetProvider, TabungWidgetProvider) | **built** |  |
| `t-q-live-update-syncing` | Live Update · Syncing… · tablet | Android notification | modules/flowe-notifications (LiveBudgetNotifier.kt) | **built** |  |

### a.Desktop — 69 artboards · built 63 · partial 5 · missing 1 · deferred 0

| Artboard | Title | Route | Component(s) | Status | Gap |
|---|---|---|---|---|---|
| `dd-pair` | desktop/pair · enter code | / (unpaired) | src/screens/PairScreen.tsx | **built** |  |
| `dd-pair-expired` | desktop/pair · code expired | / (unpaired) | src/screens/PairScreen.tsx | **built** |  |
| `d-lock` | desktop/lock | / (locked) | src/screens/LockScreen.tsx, src/app/LockProvider.tsx | **built** |  |
| `dd-lock-wrong-pin` | desktop/lock · wrong PIN | / (locked) | src/screens/LockScreen.tsx | **built** |  |
| `d-overview` | desktop/overview · 1440 | / | src/pages/OverviewPage.tsx, src/components/overview/* | **built** |  |
| `dd-overview-locked` | desktop/overview · locked | / | src/pages/OverviewPage.tsx | **partial** | Desktop goes straight to LockScreen; the masked Overview is not built. Canvas marks this [TBD] (open question Q5). |
| `dd-overview-recurring` | desktop/overview · recurring due | / | src/pages/OverviewPage.tsx | **missing** | Only an "Upcoming bills" card; no recurring-due dialog with Confirm all / Review one by one. |
| `d-overview-1024` | desktop/overview · 1024 (icon sidebar) | / | src/shell/Sidebar.tsx (icon rail at lg) | **built** |  |
| `d-overview-768` | desktop/overview · 768 (tablet) | / | src/shell/TabletBar.tsx | **built** |  |
| `d-transactions` | desktop/transactions · filtered + bulk select | /transactions | src/pages/TransactionsPage.tsx, TransactionFilters, BulkBar | **built** |  |
| `dd-transactions-search` | desktop/transactions · search | /transactions | src/pages/TransactionsPage.tsx | **built** |  |
| `d-transaction-detail` | desktop/transactions · detail drawer | /transactions | TransactionDetailDrawer.tsx | **built** |  |
| `d-accounts` | desktop/accounts | /accounts | src/pages/AccountsPage.tsx | **built** |  |
| `d-account-add` | desktop/accounts · add drawer | /accounts | AddAccountDrawer.tsx | **built** |  |
| `d-account-id` | desktop/accounts/[id] | /accounts/:id | src/pages/AccountDetailPage.tsx | **built** |  |
| `dd-account-edit` | desktop/accounts/[id] · edit drawer | /accounts/:id | AccountActions.tsx | **built** |  |
| `d-tabung` | desktop/tabung | /tabung | src/pages/TabungPage.tsx | **built** |  |
| `d-tabung-new` | desktop/tabung · new drawer | /tabung | NewTabungForm.tsx | **built** |  |
| `d-tabung-id` | desktop/tabung/[id] | /tabung/:id | src/pages/TabungDetailPage.tsx | **built** |  |
| `d-tabung-add` | desktop/tabung/[id] · add money drawer | /tabung/:id | TabungMoneyDrawer.tsx | **built** |  |
| `d-tabung-payout` | desktop/tabung/[id] · pay out drawer | /tabung/:id | TabungMoneyDrawer.tsx | **built** |  |
| `d-tabung-settings` | desktop/tabung/[id] · settings drawer | /tabung/:id | TabungSettingsDrawer.tsx | **built** |  |
| `d-tabung-reached` | desktop/tabung/[id] · goal reached | /tabung/:id | src/pages/TabungDetailPage.tsx | **built** |  |
| `d-notifications` | desktop/notifications | /notifications | src/pages/NotificationsPage.tsx | **built** |  |
| `d-analysis` | desktop/analysis | /analysis | src/pages/AnalysisPage.tsx | **built** |  |
| `d-learn` | desktop/learn | /learn | src/pages/LearnPage.tsx | **built** |  |
| `dd-learn-new-project` | desktop/learn · new project dialog | /learn | src/pages/LearnPage.tsx | **built** |  |
| `dd-learn-project` | desktop/learn/[projectId] | /learn/:projectId | src/pages/LearnProjectPage.tsx | **built** |  |
| `d-learn-project` | desktop/learn/[projectId] · entry view | /learn/:projectId | src/pages/LearnProjectPage.tsx | **built** |  |
| `d-learn-entry-edit` | desktop/learn/[projectId]/add-entry | /learn/:projectId/add-entry | src/pages/LearnEntryEditorPage.tsx | **built** |  |
| `dd-calendar` | desktop/calendar | /calendar | src/pages/CalendarPage.tsx, MonthGrid.tsx | **built** |  |
| `d-calendar` | desktop/calendar · day selected | /calendar | src/pages/CalendarPage.tsx | **built** |  |
| `d-transaction-add` | desktop/transactions · add drawer | drawer (N) | AddTransactionDrawer.tsx, src/app/QuickAddProvider.tsx | **built** |  |
| `dd-add-transfer` | desktop/add transaction · transfer | drawer | AddTransactionDrawer.tsx | **built** |  |
| `dd-add-edit` | desktop/add transaction · edit | drawer (E) | AddTransactionDrawer.tsx | **built** |  |
| `d-cashflow` | desktop/cashflow | /cashflow | src/pages/CashflowPage.tsx | **built** |  |
| `dd-cashflow-month-picker` | desktop/cashflow · month picker | /cashflow | src/shell/MonthPicker.tsx | **built** |  |
| `d-cashflow-info` | desktop/cashflow/info | /cashflow/info | src/pages/CashflowInfoPage.tsx | **built** |  |
| `d-add-asset` | desktop/cashflow/info · add asset drawer | /cashflow/info | BalanceItemDrawer.tsx | **built** |  |
| `dd-asset-edit` | desktop/cashflow/info · edit asset drawer | /cashflow/info | BalanceItemDrawer.tsx | **built** |  |
| `d-add-liability` | desktop/cashflow/info · add liability drawer | /cashflow/info | BalanceItemDrawer.tsx | **built** |  |
| `dd-cashflow-diagram` | desktop/cashflow/info · cash flow diagram | /cashflow/info | src/pages/CashflowInfoPage.tsx, DiagramBox.tsx | **partial** | Cash flow diagram exists; the Poor / Middle class / Rich patterns dialog that shares it is missing. |
| `dd-settings` | desktop/settings | /settings | src/pages/SettingsPage.tsx | **built** |  |
| `d-set-account` | desktop/settings/account | /settings/account | AccountSection.tsx | **partial** | Sign-out semantics depend on open question Q1. |
| `d-set-security` | desktop/settings/security | /settings/security | SecuritySection.tsx | **built** |  |
| `dd-lock-after` | desktop/settings/security · lock after | /settings/security | SecuritySection.tsx | **built** |  |
| `dd-change-pin` | desktop/settings/security · change PIN | /settings/security | SecuritySection.tsx, src/lib/services/desktopAuth.ts (verify-pin change) | **built** |  |
| `d-set-autodetect` | desktop/settings/auto-detect | /settings/auto-detect | AutoDetectSection.tsx (read-only card) | **built** |  |
| `d-set-categories` | desktop/settings/categories | /settings/categories | CategoriesSection.tsx | **built** |  |
| `dd-category-edit` | desktop/settings/categories · edit drawer | /settings/categories | CategoryDrawer.tsx | **built** |  |
| `d-set-budget` | desktop/settings/budget | /settings/budget | BudgetSection.tsx | **built** |  |
| `d-set-recurring` | desktop/settings/recurring | /settings/recurring | RecurringSection.tsx | **built** |  |
| `dd-recurring-add` | desktop/settings/recurring · add drawer | /settings/recurring | RecurringDrawer.tsx | **built** |  |
| `d-set-notifications` | desktop/settings/notifications | /settings/notifications | NotificationsSection.tsx | **built** |  |
| `d-set-affirmations` | desktop/settings/affirmations | /settings/affirmations | AffirmationsSection.tsx | **built** |  |
| `d-set-data` | desktop/settings/data | /settings/data | DataSection.tsx | **built** |  |
| `d-set-merchant` | desktop/settings/merchant-request | /settings/merchant-request | MerchantRequestSection.tsx | **built** |  |
| `d-toasts` | desktop/overview · toasts | global | src/components/ui/Toast.tsx, ToastProvider.tsx | **built** |  |
| `d-dialog-delete` | desktop/transactions · delete dialog | /transactions | ConfirmDialog.tsx | **built** |  |
| `dd-delete-account` | desktop/accounts/[id] · delete | /accounts/:id | AccountActions.tsx, ConfirmDialog.tsx | **built** |  |
| `dd-remove-asset` | desktop/cashflow/info · remove asset | /cashflow/info | BalanceItemDrawer.tsx, ConfirmDialog.tsx | **built** |  |
| `d-set-data-reset` | desktop/settings/data · reset dialog | /settings/data | DataSection.tsx | **partial** | Reset semantics depend on open question Q2. |
| `dd-sign-out` | desktop/settings/account · sign out | /settings/account | AccountSection.tsx | **partial** | Depends on open question Q1. |
| `d-overview-empty` | desktop/overview · empty | / | src/pages/OverviewPage.tsx (EmptyState) | **built** |  |
| `d-overview-loading` | desktop/overview · loading | / | src/pages/OverviewPage.tsx (Skeleton) | **built** |  |
| `d-overview-error` | desktop/overview · error | / | src/pages/OverviewPage.tsx (ErrorState) | **built** |  |
| `d-transactions-empty` | desktop/transactions · empty | /transactions | TransactionsPage.tsx (EmptyState) | **built** |  |
| `d-transactions-loading` | desktop/transactions · loading | /transactions | TransactionsPage.tsx (Skeleton) | **built** |  |
| `d-transactions-error` | desktop/transactions · error | /transactions | TransactionsPage.tsx (ErrorState) | **built** |  |

## b. Journey [unclear] / [stub] / [TBD] flags → proposed fix

| # | Where | Flag | Proposed fix | Phase |
|---|---|---|---|---|
| 1 | §1, §5.1.7, §6.5 | [unclear] `/tabung/new` is unreachable | Add a "New Tabung" row/button in the Tabung group on `/home/accounts` → `/tabung/new`, and have the Add account sheet's **Tabung** tab hand off to `/tabung/new` (goal → form), so a Tabung always gets a target and date. | 1 |
| 2 | §3.9 | [unclear] + [TBD] no hint when access is still off | On `AppState` → active after **Allow**, if permission is still not granted, show a glass chip **"Access is still off"** and keep Allow / Later. Uses the C · notification-access frame with the chip in its error slot. | 1 |
| 3 | §4.1 | [unclear] padlock comment in `LockContext` | Rewrite the doc comment on `lock()` to say it's called from Settings → Account → Sign out. Comment only. | 1 |
| 4 | §5.0 | [unclear] + is never active | Keep it: the nav is hidden on `/add-transaction`. Document it only. | — |
| 5 | §5.5.2 | [unclear] Sign out only locks | **STOP: Q1.** | after answer |
| 6 | §5.5.3 | [TBD] no "Use Flowe on desktop" row on the artboard | Already in code (`settings/security.tsx:113`). The artboard is behind the code; no code change. | — |
| 7 | §5.5.8 | [stub] recurring Transfer | Keep Save disabled; change the copy to "Recurring transfers aren't supported yet." | 1 |
| 8 | §5.5.8 | [unclear] "Tabung auto-save" doesn't exist | Fixed by #7. The unused `tabung_accounts.auto_save` column stays (no schema churn). | 1 |
| 9 | §5.5.9, §6.3 | [unclear] `notif_*` unread; no 80/100 %, milestone, summary or day-before alerts | Phase 1 step 3 (see "Notification delivery" below). Every `notify()` call and the native capture push check the matching `notif_*` flag. | 1 |
| 10 | §5.5.10 | [unclear] affirmation not scheduled; Home ignores `show_affirmations` | Home hides the card when `show_affirmations` is false. A daily local notification at `daily_reminder_time` is gated by `show_affirmations` and `notif_affirmation`. | 1 |
| 11 | §5.5.11 | [TBD] Data artboard lacks "Recalculate balances" and the new Import subtitle | Already in code (`settings/data.tsx:124-125`, "From a Flowe CSV"). The artboard is behind the code. | — |
| 12 | §5.5.11, §6.6 | [unclear] Reset keeps transactions and `onboardingDone` | **STOP: Q2.** | after answer |
| 13 | §6.7 widgets | [TBD] exact sizes and tap targets | Use the canvas frames: Left today 2×2, Budget 4×2, Tabung 4×2 (as already in `res/xml/*_info.xml`). Taps: Left today/Budget → `/`, Tabung → `/home/tabung/[id]`. | 3 |
| 14 | §6.7 pushes | [TBD] which of the 8 types to send | All 8, each gated by its `notif_*` flag (see "Notification delivery"). | 1 + 3 |
| 15 | canvas dd-pair | [TBD] desktop side of pairing | Built as drawn (`PairScreen`): 8-character code + PIN → `desktop-pair` redeem. | — |
| 16 | canvas dd-pair-expired | [TBD] retry limits | Already enforced server-side: 5 wrong PINs void the code and lock PIN entry for 15 min (`pin_attempts`, shared with `verify-pin`). | — |
| 17 | canvas dd-overview-locked | [TBD] masked Overview vs straight to lock | **Q5.** Recommendation: keep the current behaviour (straight to lock). A browser tab is easier to leave open than a phone, so masked figures would still show account names and the layout. | after answer |

### Options for the two STOP items

**Q1 — "Sign out of this device" only locks.**
- **A. Keep it as a lock and rename the copy** to "Lock Flowe now". No data change. Same behaviour as today.
- **B. Real sign-out.** `authRepository.signOut()` + `flags.unsetPin()` + `flags` onboarding cleared → `/welcome`. Because users are **anonymous**, signing out loses access to all their data unless they first pair a desktop or an email is attached. That needs a "This deletes your access" warning, and it changes data semantics.
- **C. Lock on the phone, end the session on desktop.** Phone = A. Desktop "Sign out" = `supabase.auth.signOut()` + forget pairing, which is safe because the phone still holds the account.
- *Recommendation:* **C.** Option B strands anonymous users' data.

**Q2 — Reset leaves transactions and `onboardingDone`.**
- **A. Full reset.** Also delete transactions, recurring rules, notifications, learn projects and custom categories (server-side `reset_user_data()` RPC, `security invoker`), and clear `onboardingDone`, so the user re-onboards.
- **B. Soft reset (today), plus clear `onboardingDone`.** Data stays, but the user goes through onboarding again.
- **C. Keep today's behaviour** and change the copy to say transactions are kept.
- *Recommendation:* **A.** The confirm sheet already shows counts and requires RESET + PIN, so a full wipe matches what it promises.

## c. §6.7 designed-not-coded → what to build

| Feature | Already in code | To build | Phase |
|---|---|---|---|
| Home-screen widgets | `BudgetWidgetProvider` (Left today 2×2), `MonthBudgetWidgetProvider` (Budget 4×2), `TabungWidgetProvider` (4×2), skeleton drawable, `WidgetText` states, colours from `flowe_tokens.xml` | Check normal / empty / stale / loading against the L frames on light and dark wallpaper; add any missing state and the tap targets from b#13; screenshots. | 3 |
| Live Update notification | `LiveBudgetNotifier` with `ProgressStyle` on API 36+, plain ongoing below, "Syncing…" from `BudgetStore.isSyncing` | Check the 3 states + Syncing against the L frames; gate it on `live_budget_mode` (already done) and the notification permission. | 3 |
| Tabung progress that keeps moving | Contributed-total progress, month strip, breakdown, settings, goal reached (`useTabungProgress`, `tabung_contributed`, `tabung_monthly_flows`) | Unit-test the SQL-backed maths (the RM 1,000 / RM 500 case). | 1 |
| Push notifications, 8 types | Write-time local notifications; native quick-capture push with Expense / Income / Ignore | Budget alert 80/100 %, Tabung milestone 20 % steps, monthly summary, recurring day-before + on-the-day, daily affirmation; all gated by flags. The detected-transaction push gains the designed **Confirm / Edit** actions. | 1 + 3 |
| iOS widgets, Live Activity, Dynamic Island, iOS pushes | — | **Deferred** (out of scope). | — |

### Notification delivery (Phase 1 step 3): client-local scheduling, per user

**Choice:** schedule and fire on the phone through `expo-notifications` and the native module. Don't use a scheduled Edge Function. Why:
- The project has **no push transport**: no device-token table, no FCM credentials, no `pg_cron`/`pg_net` extension (checked live). A server job would need all three, plus extensions enabled on the remote project.
- Every input is already on the device: settings, today's spend, budget limits, Tabung progress and recurring rules. The native module already owns the Android channel and the Live Update.
- It works offline, and it's naturally per user because each install is one user.

**How each type fires:**
- *Budget 80 % / 100 %*: after every `onTransactionsChanged` and foreground sync (which also catches desktop writes). Dedupe key `alert:{YYYY-MM-DD}:{80|100}`.
- *Tabung milestone*: after progress changes, at each 20 % step crossed. Dedupe `milestone:{tabungId}:{step}`.
- *Monthly summary*: a local notification at 09:00 on the 1st, plus the in-app row written on the first open on or after the 1st.
- *Recurring*: day before and on the day, at 09:00 and 05:00 (the existing 05:00 slot).
- *Affirmation*: daily at `daily_reminder_time`.

Every type also writes the in-app `notifications` row (inbox), so desktop sees it too. **Trade-off:** alerts caused by a desktop-only write reach the phone only when Flowe next runs on it (foreground or headless auto-file task).

## d. Supabase surface the clients call → exists?

Live: `flowe` (txylaohgzlvhoqdyqmhy). Local: `supabase/migrations`, `supabase/functions`.

| Kind | Name | Local file | Live | RLS / policy | Notes |
|---|---|---|---|---|---|
| table | profiles, auth_config, accounts, bank_accounts, wallet_accounts, tabung_accounts, transactions, recurring_rules, assets, asset_values, liabilities, liability_values, learn_projects, learn_entries, learn_entry_images, notifications, affirmations, user_affirmations, affirmation_favourites, settings, custom_categories, bank_presets, merchant_logos, merchant_logo_requests | base schema `docs/sql/001–005` + migrations | ✅ all | RLS on, all of them | `settings` has every `notif_*`, `show_affirmations`, `daily_reminder_time`, `daily_budget`, `monthly_budget`, `live_budget_mode`. `auth_config.auto_lock_minutes` ✅. `tabung_accounts.progress_mode` ✅ |
| table | pin_attempts, desktop_pairings | 20261118 | ✅ | RLS on, no policies (service role only) | |
| view | tabung_monthly_flows | 20261117 | ✅ | `security_invoker` → transactions RLS | Client doesn't call it yet; Tabung maths uses rows. Wire it up in Phase 1 for the tests. |
| rpc | adjust_account_balance | 20260925 | ✅ | security invoker, owner check | |
| rpc | adjust_asset_value | 20261116 | ✅ | | |
| rpc | approve_recurring_occurrence | 20261116 | ✅ | | Approve ✅ |
| rpc | *(skip recurring)* | — | — | table update under RLS | Skip is a plain `update`, with no "still pending" guard like approve has. Fix: make the update conditional on the pending date (client-side filter, no migration). |
| rpc | recalculate_account_balances | 20260925 | ✅ | | |
| rpc | tabung_contributed | 20261117 | ✅ | security invoker | |
| fn | cashflow-summary | ✅ | ✅ v1 | verify_jwt | |
| fn | analysis-monthly | ❌ **source not in repo** | ✅ v4 | verify_jwt | Pull the deployed source into `supabase/functions/analysis-monthly` (read-only fetch) so it's versioned. |
| fn | receipt-ocr | ✅ | ✅ v1 | verify_jwt | |
| fn | desktop-pair (create / redeem) | ✅ | ✅ v1 | verify_jwt=false; create checks the bearer | Redeem gives an anonymous user a placeholder email so a magic-link session can be minted for the same user id. |
| fn | verify-pin (check / change) | ✅ | ✅ v1 | verify_jwt | The hash never leaves the server. |
| bucket | receipts, learn-images, avatars | migrations | ✅ private | per-user folder policy `(foldername)[1] = auth.uid()` | ✅ |
| bucket | merchant-logos | 20260830 | ✅ public read | | |
| migration | 20261119_merchant_logos_verified_domains | ✅ | applied (rows match) | | Not in the live migration history: it was applied as plain SQL. |

Nothing the clients call is missing live. Phase 1 adds: the versioned `analysis-monthly` source, plus `reset_user_data` only if Q2 = A. Each is a **new local file**; applying anything remotely waits for your OK.

## Open questions

- **Q1.** Sign-out semantics: **answered, C** (phone locks, desktop signs out).
- **Q2.** Reset semantics: **answered, A** (full reset). Migration applied.
- **Q3.** Deploy `analysis-monthly`: **answered, yes**. v5 is live.
- **Q4.** Onboarding step count: **answered, keep "of 2"**.
- **Q5.** Desktop locked Overview: masked Overview or straight to lock? Default: straight to lock (as built).

## Phase 1 results (backend + journey fixes, flowe-app-v2)

| Item | Status | Where |
|---|---|---|
| Every client call resolves against a real table, RPC, function or bucket with RLS | ✅ Verified live (table d) | — |
| `analysis-monthly` source versioned | ✅ **Deployed as v5** (Q3 = yes; verify_jwt on). Also pages past the 1,000-row cap. It also fixes the trend: a trailing 12 months ending at the selected month (v4 returned Jan–Dec, so in November "6M" showed an empty December and compared November with itself). | `supabase/functions/analysis-monthly/index.ts` |
| Skip-recurring race guard | ✅ Conditional on the pending date; a no-op when another device moved the rule first. No migration needed. | `recurring.repository.ts` `skipOccurrence`, `services/recurring.ts` |
| Desktop pairing (5-min one-time code, redeem for the same user, server-side PIN check, hash never sent) | ✅ Already built and deployed (`desktop-pair` v1, `verify-pin` v1, `pin_attempts`, `desktop_pairings`) | — |
| Banners follow `settings.notif_*` | ✅ `notify()` checks the type's switch (inbox row still written) | `lib/notificationRules.ts`, `services/notificationPrefs.ts`, `services/notifications.ts` |
| Budget alerts 80 % / 100 % | ✅ After every write (coalesced) and on foreground; once per threshold per day | `services/alerts.ts` `checkBudgetAlerts` |
| Tabung milestones every 20 % | ✅ When a Tabung's progress changes (detail screen); first view primes, so old progress isn't announced | `checkTabungMilestone` |
| Monthly summary on the 1st | ✅ 09:00 reminder on the next 1st, plus the in-app summary on the first open after it | `runMonthlySummary` |
| Recurring day before + on the day | ✅ 09:00 the day before, 05:00 on the day; off with `notif_recurring` | `services/recurring.ts` |
| Daily affirmation at `daily_reminder_time` | ✅ Next 7 days scheduled, rebuilt on each foreground and on settings change; off with `show_affirmations` / `notif_affirmation` | `scheduleDailyAffirmations` |
| /tabung/new reachable | ✅ "New Tabung" on Accounts and in the Add account sheet's Tabung tab | `home/accounts.tsx`, `AccountDraftForm.tsx` |
| Notification access "Access is still off" | ✅ | `(onboarding)/notification-access.tsx` |
| LockContext padlock comment | ✅ | `context/LockContext.tsx` |
| Recurring Transfer copy | ✅ "Recurring transfers aren't supported yet." (still disabled) | `settings/recurring.tsx` |
| Home affirmation card respects `show_affirmations` | ✅ | `(main)/index.tsx` |
| Security "Use Flowe on desktop"; Data "Recalculate balances" + "From a Flowe CSV" | ✅ Already in code | — |
| Sign out (Q1 = phone locks, desktop signs out) | ✅ Phone: "Lock Flowe now" (lock only). Desktop sign-out comes in Phase 4. | `settings/account.tsx` |
| Reset (Q2 = full reset) | ✅ `reset_user_data()` deletes every row the caller owns in one transaction; the client then purges storage, widgets, reminders, caches, PIN and onboarding, and signs out. Migration **applied to `flowe` on 2026-11-17** with your OK. Checked: SECURITY DEFINER, `search_path=public`, execute for `authenticated` only (not `anon`/`public`); a call with no session is refused and deletes nothing. | `supabase/migrations/20261120_reset_user_data.sql`, `services/resetData.ts`, `repositories/userData.repository.ts` |
| `database.types.ts` | ✅ Compared with live generated types; no schema change this phase. `settings.daily_reminder_time` corrected to nullable. | `src/types/database.types.ts` |
| Unit tests | ✅ Tabung RM 1,000 / RM 500 → 80 % after 4 months, balance RM 2,000 (existing); daily/monthly budget (existing); new `cashflow.test.ts` (financialClass, coverRatio, spendByCategory); new `notificationRules.test.ts`; updated recurring and notification tests | `tests/` |
| Android channel light colour | ✅ Token (`primary-container`), was lime `#C5FF00` | `services/notifications.ts` |

**Known limit:** an alert caused only by a desktop write reaches the phone the next time Flowe runs there. Tabung milestones fire when that Tabung's screen is open on the phone.

**Verification:** `npx tsc --noEmit` 0 errors · `npm run lint` 0 errors, 12 warnings (same as baseline) · `npm test` 38 suites, 316 tests passed.

## Phase 2 results (tablet, flowe-app-v2)

**Device:** Samsung Galaxy Tab S6 Lite (SM-P610, Android 13, 800 × 1333 dp, font scale 1.1), on the dev build. **Phone:** Pixel 8 emulator (API 34).

**Correction to table a (Tablet).** Phase 0 judged the tablet frames from the code and called 149 of them "built". On the device most screens did not match their tablet family yet: a full-bleed hero instead of the inset card, the phone column on a blue page, and clipped labels. Phase 2 implements the families below. The status of individual tablet frames is now judged from the device screenshots.

| Item | Status | Where |
|---|---|---|
| Breakpoint: tablet when the window's **shorter** side ≥ 600 dp (a phone in landscape stays a phone) | ✅ + tests | `src/hooks/useBreakpoint.ts`, `tests/breakpoint.test.ts` |
| Tablet family **card**: inset gradient card (16 dp margin, r40), hero content in a 560 dp column, content across the screen (24 dp padding). Home, Accounts, Cashflow, Calendar, Learn, Settings. | ✅ | `components/ui/Hero.tsx`, `HeroScreen.tsx` (`tabletLayout`), `TABLET_LAYOUT` |
| Tablet family **panel**: blue page, hero in a 640 dp column, inset white card (16 dp, r32). Detail screens, forms, settings sub-screens, Analysis, Cashflow info, Tabung, Transactions, Add transaction. | ✅ | same, and `add-transaction.tsx` |
| Two-column Home (actions, pending, tiles, affirmation, links left; Recent Transactions right) | ✅ | `(main)/index.tsx` |
| Two-column Settings groups (You + Money · App) | ✅ | `settings/index.tsx` |
| Accounts / Learn loading skeletons on the tablet grid | ✅ | `home/accounts.tsx`, `home/learn/index.tsx` |
| **Clipped labels on Android** ("Balanc", "Locked · tap to", "Recent"). Inter was loaded only at runtime, so Android measured with the fallback face and drew with Inter. | ✅ Fonts embedded at build time (`expo-font` plugin, needs a native rebuild) | `app.config.js` |
| Big figures clipped top/bottom on Android | ✅ Line height ≥ 1.2 for text ≥ 32 px on Android; Money's "RM" span uses the figure's line height. Tested. | `components/ui/Text.tsx`, `Money.tsx`, `tests/lineHeight.test.ts` |
| Calendar dropped Saturday to the next row on the tablet width (Yoga rounding) | ✅ | `calendar.tsx` |
| Hero chips stuck to the left edge (phone and tablet) | ✅ `GlassChip align`; Home and Accounts chips centred | `GlassChip.tsx`, `HomeHero.tsx`, `home/accounts.tsx` |
| Status bar invisible on the white tablet page / under the PIN lock | ✅ Focus-scoped style; lock overlay forces light | `src/hooks/useFocusStatusBar.ts`, `LockOverlay.tsx` |
| Screenshots, tablet (10) | ✅ `docs/screenshots/tablet/01–10` | — |
| Screenshots, phone (10) | ✅ `docs/screenshots/phone/01–10` (Pixel 8 emulator, 411 × 731 dp; its account has no accounts, so several screens show their empty states) | — |
| Landscape on the device | ⏳ Not captured: rotating needs a system setting on your tablet. The layout code is width-driven (card/panel columns cap at 960/640 dp), and the breakpoint keeps the tablet family in both orientations. | — |
| Settings › Budget amount fields: very large "Not set", no grey tile (frame: 32 px figure in a #F5F5F5 r20 tile). Same on phone. | ⏸ Phase 3 (phone frame match) | `components/ui/AmountField.tsx` |
| Phone · Add transaction on a 731 dp tall screen: the account/date pills are cut at the bottom of their scroll area and "+ Note" is pushed out of view (the numpad takes the rest) | ⏸ Phase 3 | `add-transaction.tsx` |
| Tablet top bar: the frames put the back/action buttons outside the content column (±56/±88 dp); the code keeps them inside it | ⏸ Minor; Phase 3 | `Hero`/`TopBar` |

**Verification:** `npx tsc --noEmit` 0 errors · `npm run lint` 0 errors (12 baseline warnings) · `npm test` 39 suites, 319 tests passed.

## Phase 3 results (phone, flowe-app-v2)

| Item | Status | Where |
|---|---|---|
| Bottom nav Home · Calendar · + · Cashflow · Settings (§7.1); `navKeyFor` unchanged | ✅ Seen on the emulator | `components/ui/FloatingNav.tsx` |
| 8 Android push types with the frame copy and actions: detected (Confirm / Edit), budget 80 % and 100 % (View), recurring day before (Remind me later, +3 h), recurring due grouped per date (Confirm all → due sheet, every bill ticked), Tabung milestone (Open), monthly summary (Open → Analysis), affirmation | ✅ Code and tests; budget 80 % and milestone seen live in the shade | `src/lib/notificationRules.ts`, `src/services/{notifications,alerts,recurring}.ts`, `src/hooks/usePushResponses.ts` |
| Detected-transaction heads-up: Confirm / Edit, Flowe mark, token colour; off when Settings › Notifications › Detected transactions is off | ✅ Code + tests (`confirm` answer). **Difference from the frame:** the title is "RM 12.50 detected", not "RM 12.50 at Tealive · Confirm as Food & Drink?". The merchant and category are parsed in JS, which isn't running when the alert arrives. | `QuickCaptureNotifier.kt`, `CaptureStore.kt`, `autoFile.ts` |
| Widgets Left today 2×2 / Budget 4×2 / Tabung 4×2 with normal, empty, stale ("Updated 2h ago") and loading faces, frame tap targets, colours from `flowe_tokens.xml` | ✅ Already in code (checked against the L frames). Not pinned on the emulator, so not seen on a home screen. | `modules/flowe-notifications` widget providers |
| Live Update: 3 states + "Syncing…", ProgressStyle on Android 16+, plain ongoing below | ✅ Already in code; ongoing notification seen live ("RM 12.50 left today") on API 34 | `LiveBudgetNotifier.kt` |
| Settings › Budget limits as tiles; onboarding name + starting balance as side-by-side pills | ✅ Seen on the emulator | `AmountField.tsx` (`look`) |
| Add transaction on short phones: 48 dp keys under 780 dp tall | ✅ Account/date pills visible; "+ Note" still half-hidden on 731 dp (it scrolls) | `add-transaction.tsx` |
| **Bug found in the walk:** New Tabung form stayed open after a successful save (`router.dismissTo` has nothing to pop in the tab navigator), so each extra tap created another Tabung | ✅ Fixed (`router.navigate('/home/accounts')`). The 3 duplicates created during the walk were removed with the app's own Delete Tabung. | `tabung/new/form.tsx` |
| iOS widgets, Live Activity, Dynamic Island, iOS pushes | ⏭ Deferred (out of scope) | — |

**Verification:** `npx tsc --noEmit` 0 errors · `npm run lint` 0 errors (12 baseline warnings) · `npm test` 39 suites, 325 tests passed · `npx expo export --platform android` OK (7.44 MB Hermes bundle).

## Verification log (Phase 3)

Pixel 8 emulator (API 34), dev build 2026-11-17, live Supabase project `flowe`, fresh anonymous user onboarded by the owner.

| Step | Result | Evidence |
|---|---|---|
| onboarding | ✅ Pass | Done by the owner on the emulator; Home showed CIMB · RM 50,000.00 |
| add account | ✅ Pass | TNG eWallet RM 250 via Accounts › + ; list reloaded from Supabase: 2 accounts, RM 50,250.00 |
| add expense | ✅ Pass | RM 12.50 Food & Drink from TNG eWallet; toast "Saved · RM 12.50 to Food & Drink" with Undo; Spent today RM 12.50 (server sum) |
| detected-transaction island confirm | ⏭ Not run | No bank / e-wallet app on the emulator to raise an alert (owner's call: not testable here) |
| recurring due modal | ✅ Pass | Netflix RM 55 due today → sheet opened by itself on Home; Confirm all → balance −RM 55, Spent today RM 67.50 |
| Tabung add / pay out | ✅ Pass (after fix) | New Tabung (Emergency, RM 5,000) via Accounts › New Tabung; add RM 1,000 → 20 %; pay out RM 500 → progress stays 20 %, In Tabung RM 500, Paid out RM 500; milestone push "Emergency Fund passed 20%". Form bug found and fixed (see Phase 3 results). |
| budget widget update | ✅ Pass (live notification) | Monthly RM 3,000 → daily RM 100; live update "RM 32.50 left today" → after RM 20 expense "RM 12.50 left today"; 80 % push "80% of today's budget used / RM 12.50 left of RM 100.00 today." Home-screen widget not pinned on the emulator (same BudgetStore data). |
| export / import CSV | ✅ Pass | Export: share sheet with the CSV of all 5 rows; Import: picked flowe-import.csv from Downloads → "Import check" row in Transactions |
| desktop pairing code | ✅ Pass | Settings › Security › Use Flowe on desktop → one-time code from the live `desktop-pair` function with an "Expires in m:ss" countdown |

## Phase 4 results (desktop, flowe-desktop-v1)

| Item | Status | Where (flowe-desktop) |
|---|---|---|
| Recurring-due dialog on Overview (dd-overview-recurring): opens once per load when bills are due; Confirm all, or Review one by one with Confirm / Skip this one | ✅ Built (no bill was due during the check, so the dialog itself wasn't seen live) | `components/overview/RecurringDueDialog.tsx`, `pages/OverviewPage.tsx` |
| Recurring approve (one RPC) and skip (only while pending), ported from the phone with the same signatures | ✅ + Vitest | `lib/services/recurring.ts`, `lib/repositories/recurring.repository.ts` |
| Cash flow patterns dialog (Poor / Middle class / Rich, yours marked "You"), from the class chip and the "Pattern" label | ✅ Seen in the browser; Esc closes | `components/cashflow/PatternsDialog.tsx`, `components/ui/InfoDialog.tsx` |
| Sign out (Q1): desktop ends its session and returns to pairing | ✅ Already in code ("Sign out of this computer") | `components/settings/AccountSection.tsx` |
| Reset (Q2): full reset via `reset_user_data` + storage purge, then sign out | ✅ Code (not run: it would wipe the test account) | `components/settings/DataSection.tsx`, `lib/repositories/userData.repository.ts` |
| Overview locked (Q5): straight to the lock screen | ✅ As decided; lock seen on every reload | `screens/LockScreen.tsx` |
| Phone-only features absent: fingerprint ("phone-only" note), numpad, listener setup, detected review, widgets, live updates, camera; Auto-detect is a read-only card | ✅ Checked in Settings › Security and › Auto-detect | — |
| Shortcuts N (add), ⌘/Ctrl+↵ (save), Esc (close), ⌘/Ctrl+K (search) | ✅ N and Ctrl+↵ used in the check; Esc on dialogs | `app/useHotkey.ts` |

**Pairing, PIN and sync check (live `flowe`, 2026-11-17):** one-time code from the emulator (Settings › Security) → entered on desktop → PIN typed by the owner → Overview showed the phone's data (RM 49,655.50, CIMB + TNG eWallet, Emergency Fund 20 %). Desktop added "Desktop check" RM 3.00 (N, Ctrl+↵) → it appeared on the phone's Transactions; both showed RM 49,652.50. Desktop relocks on every launch and keeps the pairing.

**Phone fix found while pairing:** render error "Cannot read property 'split' of null" (React Native's processFontVariant when a text style drops fontVariant). `Text` now always passes an array (`[]` for no variant). `components/ui/Text.tsx` (flowe-app).

**Verification (desktop):** `npm run build` OK · `npm run lint` 0 errors (baseline warnings) · `npx vitest run` 8 files, 60 tests passed.
