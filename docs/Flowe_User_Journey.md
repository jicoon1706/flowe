# Flowe — Full User Journey

**Personal finance app · Expo SDK 54 (React Native) + expo-router 6 + Supabase · Android-first**
**Design system v2: light, navy→cobalt gradient, black `#020202` primary, white sheets (32 px top radius)**

> Rebuilt from the source code in `app/` on **2026-11-17**. Every route file under `app/` has its own section below.
> Where the code is ambiguous or unfinished, the text is marked **[unclear]** or **[stub]**.
> The previous version of this document (2026-05-22) described the old dark/lime build and is superseded. See §7 for what changed.

**Conventions used in every screen section**

- **Route** is the expo-router pathname with groups removed (e.g. `app/(main)/home/accounts.tsx` → `/home/accounts`).
- **Locked?** says whether the route opens while the app is still PIN-locked. Only `/` and `/add-transaction` do (`src/utils/lockRoutes.ts`); every other `(main)` route raises the PIN overlay when it opens.
- **Nav** says whether the floating bottom nav is visible (`src/utils/navRoutes.ts` hides it on full-screen flows).
- Feedback always comes from the same three primitives: `ConfirmSheet` (destructive confirm), `InlineError` (validation), `useToast()` (success, or failure with Retry/Undo). The code has no `Alert.alert` calls.

---

## 1. App map

```mermaid
flowchart TD
  ROOT["app/_layout.tsx<br/>gate: loading → auth | onboarding | main"]

  subgraph AUTH["(auth) — PIN setup"]
    W["/welcome"] --> CP["/create-pin"] --> CF["/confirm-pin"] --> FP["/fingerprint"] --> SU["/success"]
    CF -. back .-> CP
  end

  subgraph ONB["(onboarding)"]
    N["/name"] --> AC["/accounts"]
    AC -- "Android, auto-detect available" --> NA["/notification-access"]
  end

  subgraph MAIN["(main) — tabs, custom FloatingNav"]
    H["/ (Home)"]
    ADD["/add-transaction"]
    CAL["/calendar"]
    CFI["/cashflow"]
    SET["/settings"]
    TX["/transactions"]
    CINFO["/cashflow/info"]
    NOTI["/home/notifications"]
    ANA["/home/analysis"]
    ACCS["/home/accounts"]
    BANK["/home/account/[id]"]
    WAL["/home/wallet/[id]"]
    TAB["/home/tabung/[id]"]
    LRN["/home/learn"]
    PRJ["/home/learn/[projectId]"]
    ENT["/home/learn/[projectId]/entry"]
    AE["/home/learn/[projectId]/add-entry"]
    TN["/tabung/new"]
    TNF["/tabung/new/form"]

    subgraph SETS["settings/ (Stack)"]
      S_ACC["/settings/account"]
      S_SEC["/settings/security"]
      S_PIN["/settings/change-pin"]
      S_AD["/settings/auto-detect"]
      S_CAT["/settings/categories"]
      S_BUD["/settings/budget"]
      S_REC["/settings/recurring"]
      S_NOT["/settings/notifications"]
      S_AFF["/settings/affirmations"]
      S_DAT["/settings/data"]
      S_MER["/settings/merchant-request"]
    end
  end

  ROOT --> W
  ROOT --> N
  ROOT --> H
  SU --> N
  AC --> H
  NA --> H

  H --> ADD
  H --> TX
  H --> NOTI
  H --> ANA
  H --> ACCS
  H --> LRN
  H --> SET
  H --> S_BUD
  CAL --> ADD
  CFI --> CINFO
  CFI --> TX
  CFI --> ADD
  TX --> S_AD
  TX --> ADD
  ACCS --> BANK
  ACCS --> WAL
  ACCS --> TAB
  BANK --> ADD
  BANK --> S_AD
  WAL --> ADD
  WAL --> S_AD
  ADD --> ACCS
  LRN --> PRJ
  PRJ --> ENT
  PRJ --> AE
  ENT --> AE
  TN --> TNF
  TNF --> ACCS
  NOTI --> TX
  NOTI --> S_REC
  NOTI --> S_BUD
  NOTI --> TAB
  NOTI --> CINFO
  NOTI --> LRN
  NOTI --> S_AFF
  SET --> S_ACC
  SET --> S_SEC
  SET --> S_AD
  SET --> S_CAT
  SET --> S_BUD
  SET --> S_REC
  SET --> S_NOT
  SET --> S_AFF
  SET --> S_DAT
  SET --> S_MER
  S_SEC --> S_PIN
  S_AD --> ACCS
  S_DAT -- "reset" --> W
  S_ACC -- "sign out (locks)" --> H
```

> `/tabung/new` and `/tabung/new/form` are drawn on their own because **nothing in the app navigates to `/tabung/new`** (see §5.4).

**Floating nav (5 items):** Home `/` · Cashflow `/cashflow` · **+** `/add-transaction` · Calendar `/calendar` · Settings `/settings`.

---

## 2. Startup and routing

### Root layout — `app/_layout.tsx`
- **Route:** wraps everything; no screen of its own.
- **Purpose:** decides which route group the user lands in, and mounts the global providers.
- **Providers (outer → inner):** `SafeAreaProvider` → `AuthProvider` → `OnboardingProvider` → `ToastProvider` → `Stack` (`(auth)`, `(onboarding)`, `(main)`, no headers).
- **On mount:** runs `resolve()`, `setupNotifications()` (local notifications) and `loadMerchantLogos()` (background refresh of the merchant-logo list; the bundled list is already in use).
- **Gate logic (`resolve`):**
  1. State becomes `loading` and `LaunchScreen` covers the app (it also stays up until the Inter fonts have loaded).
  2. Reads `flags.pinSet()` and `flags.onboardingDone()` from secure-store.
  3. `authRepository.getSession()`. If there's no session, it calls `signInAnonymously()`. A failure is logged and the app **continues offline**; there is no error state.
  4. No PIN → `auth`. PIN but onboarding not done → `onboarding`. Both done → `main`.
- **Redirects:** `auth` → `replace('/(auth)/welcome')`, `onboarding` → `replace('/(onboarding)/name')`, `main` → `replace('/(main)')`. Each fires only when the current top segment doesn't already match.
- **`refreshGate()`** (exported): re-runs `resolve()`. Called from `success`, `accounts`, `notification-access` and `settings/data` (reset).
- **Data:** `authRepository`, `flags` (`src/lib/secureStore`).

---

## 3. Onboarding journey

The **(auth)** group runs first (PIN), then **(onboarding)** (name + accounts).

### 3.0 Auth stack — `app/(auth)/_layout.tsx`
- `Stack` with no header, **swipe-back disabled** (`gestureEnabled: false`), fade animation. Screens: welcome, create-pin, confirm-pin, fingerprint, success.

### 3.1 Welcome — `app/(auth)/welcome.tsx`
- **Route:** `/welcome`
- **Entry points:** root gate (no PIN set); `settings/data` after a full reset.
- **Purpose:** brand intro and the single "Get Started" call to action.
- **What's on screen:** full gradient; `BrandMark` with wordmark; headline "Know where every ringgit flows"; hero photo (`PhotoSlot welcomeHero`).
- **User actions:** **Get Started** (white pill) or the **→** icon button → `push('/(auth)/create-pin')`.
- **Sub-flows:** none.
- **Data:** none.
- **Exits:** create-pin.

### 3.2 Create PIN — `app/(auth)/create-pin.tsx`
- **Route:** `/create-pin`
- **Entry points:** welcome; confirm-pin (its back button `replace`s here).
- **Purpose:** enter a new 6-digit PIN.
- **What's on screen:** `PinEntryScreen`: gradient, title "Create your PIN", subtitle "6 digits. You'll use it every time you open Flowe.", 6 `PinDots`, glass `PinPad`.
- **User actions:** keypad digits and delete; back arrow (only if `router.canGoBack()`).
- **Behaviour:** on the 6th digit, after 200 ms → `push('/(auth)/confirm-pin', { firstPin })`, then the field clears.
- **Data:** local state only. The PIN is passed as a route param.
- **Exits:** confirm-pin; back.

### 3.3 Confirm PIN — `app/(auth)/confirm-pin.tsx`
- **Route:** `/confirm-pin?firstPin=`
- **Entry points:** create-pin.
- **Purpose:** re-enter the PIN.
- **What's on screen:** `PinEntryScreen` titled "Confirm your PIN", subtitle "Enter the same 6 digits again."
- **User actions:** keypad; back → `replace('/(auth)/create-pin')`.
- **Behaviour:** on the 6th digit:
  - **Match:** `dispatch(SET_PIN)` into `OnboardingContext` → `replace('/(auth)/fingerprint')`.
  - **Mismatch:** glass chip "PINs don't match. Try again.", the dots shake (`errorKey`), and the field clears after 260 ms. Typing clears the error.
- **Data:** `useOnboarding()`.
- **Exits:** fingerprint; create-pin.

### 3.4 Fingerprint — `app/(auth)/fingerprint.tsx`
- **Route:** `/fingerprint`
- **Entry points:** confirm-pin.
- **Purpose:** optionally enable biometric unlock.
- **What's on screen:** gradient; `TopBar` with back; fingerprint icon in two glass rings; "Unlock with fingerprint" / "Open Flowe with a touch. Your PIN still works as a backup."; optional glass chip note.
- **User actions:**
  - **Enable** (white, shows a loader): checks `hasHardwareAsync` + `isEnrolledAsync`.
    - Not enrolled → note "No fingerprint set up on this phone. Your PIN will do." (stays on the screen).
    - System prompt "Enable fingerprint" succeeds → `SET_FINGERPRINT true` → `replace('/(auth)/success')`.
    - Prompt fails or is cancelled → note "Fingerprint not confirmed. Try again or skip."
  - **Skip** (text button) → `SET_FINGERPRINT false` → success.
  - **Back** → `router.back()`.
- **Data:** `expo-local-authentication`, `useOnboarding()`.
- **Exits:** success; back.

### 3.5 Success — `app/(auth)/success.tsx`
- **Route:** `/success`
- **Entry points:** fingerprint.
- **Purpose:** persist the PIN, then move on to accounts.
- **What's on screen:** `ProgressRing` (sweeps to 100% once saved) around a check; "You're all set"; "Your PIN and fingerprint are ready." or "Your PIN is ready.".
- **Behaviour on mount (`persist`):** status `saving` → hashes the PIN (`hashPin`) → if there's a Supabase user, `authConfigRepository.upsert({ pinHash, fingerprintEnabled })` (a failure is only logged) → `flags.setPin(hash, fingerprint)` locally.
  - Local save fails → status `error` and toast "Couldn't save your PIN" with **Retry**.
  - Success → `CLEAR_PIN` from context → status `ready`.
- **User actions:** primary button **Set up my accounts** (shows a loader while saving; becomes **Try again** on error) → `refreshGate()` + `replace('/(onboarding)/name')`. The **→** icon button does the same and is enabled only when `ready`.
- **Data:** `authRepository`, `authConfigRepository`, `pinCrypto`, `flags`, `useOnboarding`.
- **Exits:** onboarding/name.

### 3.6 Onboarding stack — `app/(onboarding)/_layout.tsx`
- `Stack`, no header, swipe-back disabled, fade, white content background. Screens: name, accounts, notification-access.

### 3.7 Name — `app/(onboarding)/name.tsx`
- **Route:** `/name`
- **Entry points:** success; the root gate (PIN set but onboarding unfinished).
- **Purpose:** capture the display name. This is **Step 1 of 2**.
- **What's on screen:** `HeroScreen` with `OnboardingHero` (back if possible, glass progress pill "Step 1 of 2", title "What should we call you?"); a large name input (auto-focused, 30-char max, words capitalised); helper "We'll use it on your home screen. Nothing else."; **Continue** (black).
- **User actions:** type a name; keyboard *done* or **Continue** → trims it. Empty → `InlineError` "Enter a name" (red outline). Otherwise `SET_NAME` → `push('/(onboarding)/accounts')`.
- **Data:** `useOnboarding()`. Nothing is written to Supabase yet.
- **Exits:** accounts; back.

### 3.8 Accounts — `app/(onboarding)/accounts.tsx`
- **Route:** `/accounts`
- **Entry points:** name.
- **Purpose:** add draft bank / e-wallet / Tabung accounts. This is **Step 2 of 2**.
- **Two modes:**
  - **Adding** (the default when there are no drafts). Title "Add your first account" or "Add another account". Shows `AccountDraftForm`:
    - `SegmentedToggle` **Bank | E-wallet | Tabung** (switching resets the form).
    - Four tiles:
      - Bank: Maybank, CIMB and one more popular bank, plus **More banks** (opens the `BankDropdown` sheet; a bank picked there replaces the 4th tile).
      - E-wallet: TNG eWallet, GrabPay, ShopeePay.
      - Tabung: Emergency, Travel, Raya, Home.
    - **Account name** (auto-filled from the tile until the user edits it) and **Starting balance** (`AmountField`).
    - **Continue** validates. Missing tile → "Choose your bank / e-wallet / a goal type". Missing name → "Give this account a name" (focuses the field). Missing amount → "Enter a starting balance (0 is fine)" (focuses the field).
    - On success: success haptic, `ADD_DRAFT`, and the form switches to the list.
    - A Tabung draft gets `target: 0`, runs from today to one year out, and its starting amount equals the entered balance.
  - **List.** Title "Your accounts". Header "N account(s) added". Each `DraftAccountCard` shows logo, name, type and balance, with **×** to remove (`REMOVE_DRAFT`). Below: a dashed **Add another** button (back to adding mode), then the primary button: **Continue** when there's at least one draft, otherwise **Skip for now**.
- **Back:** in adding mode with existing drafts, back returns to the list; otherwise `router.back()`.
- **Finish (`finish`):**
  - Native auto-detect available (Android dev build) → `push('/(onboarding)/notification-access')`.
  - Otherwise → `completeOnboarding(name, drafts)`. This updates `profiles.display_name`, creates each account, then sets `flags.markOnboardingDone()`.
    - Failure → toast "Something went wrong" with Retry.
    - Partial failure → toast "Couldn't add N account(s)".
    - Then `refreshGate()` + `replace('/(main)')`.
- **Sub-flows:** `BankDropdown` sheet (full bank list).
- **Data:** `useOnboarding`, `useCompleteOnboarding` → `src/services/onboarding.ts` → `accountsRepository.create*Account`, `profilesRepository.update`.
- **Exits:** notification-access; `/(main)`; back to name.

### 3.9 Notification access — `app/(onboarding)/notification-access.tsx`
- **Route:** `/notification-access`
- **Entry points:** accounts (only when `FloweNotifications.isAvailable`).
- **Purpose:** ask for Android notification-listener access so auto-detect can work.
- **What's on screen:** hero with an illustration: a fake Maybank alert "You spent RM 12.50 with your card." → arrow → "RM 12.50 · one tap to log [Confirm]". Title "Let Flowe read bank alerts". Three points: only reads alerts from the banks and wallets you added; parsed on the phone and nothing is sent; you confirm each one and can turn it off in Settings.
- **User actions:**
  - **Allow** → `FloweNotifications.openSettings()` (the system listener settings page). When the app comes back to the foreground **with permission granted**, it calls `setEnabled(true)` and runs `finish()` automatically.
  - **Later** (text button) → `finish()` without turning auto-detect on.
- **`finish()`:** same as accounts: `completeOnboarding` → toasts on failure → `refreshGate()` → `replace('/(main)')`.
- **Conditional:** coming back from settings **without** granting access does nothing; the user stays here. **[unclear]** There's no on-screen hint that access is still off.
- **Data:** `FloweNotifications` native module, `useCompleteOnboarding`.
- **Exits:** `/(main)`.

---

## 4. Auth, PIN and biometric journey inside the app

Initial PIN setup is covered in §3.1–3.5. This section covers locking once the user is inside `(main)`.

### 4.1 Deferred lock (`context/LockContext.tsx`)
- A cold start begins **locked**. Locked is a "not yet verified" flag, not a wall:
  - **Home** (`/`) works with every money figure **masked** (`RM •••••`), and its balance shows a "Locked · tap to show" chip.
  - **Add transaction** works fully. In the account picker, balances are masked.
  - **Any other route** → `LockedRouteGuard` (in `(main)/_layout.tsx`) calls `requireUnlock()`, which shows the overlay. Backing out of the overlay → `router.back()`, or `replace('/(main)')` if there's nowhere to go back to.
- Tapping a transaction on Home, or the masked balance, also calls `requireUnlock()`.
- **Auto-lock:** when the app goes to the background, the time is recorded. On return it re-locks if the Settings → Security "Lock after" time has passed (1 / 5 / 15 min, or never). The value is re-read from `auth_config` on each background event.
- `suspend()` skips the next re-lock check. It's used before opening the camera, image or document picker, system settings, the share sheet or a PDF link, so coming back from those never asks for the PIN.
- **Lock manually:** Settings → Account → "Sign out of this device" calls `lock()` (see 5.6.2). Home has no padlock button. **[unclear]** `LockContext` still describes "the padlock on the home screen", but no such button is rendered.

### 4.2 Lock overlay (`components/home/LockOverlay.tsx`)
- Full-screen gradient on top of everything (z-index 200): BrandMark; "Welcome back, {name}"; "Enter your PIN or use fingerprint" (or "Enter your PIN"); 6 dots; glass numpad with a fingerprint key when biometrics are on.
- If fingerprint is enabled, enrolled and supported, the system prompt "Unlock Flowe" (fallback "Use PIN") opens **automatically**.
- The PIN auto-submits on the 6th digit through `verifyPin`. Wrong → dots shake, glass chip "Wrong PIN. Try again.", and the field clears. Right → unlocked, and the pending `requireUnlock()` resolves `true`.
- Android **back** → cancel; `requireUnlock()` resolves `false`.

### 4.3 Launch sync (`components/home/LaunchSync.tsx`)
- Over `(main)` on launch: the splash shows a thin progress bar, "Syncing…" → "Syncing N accounts…" (from `fetchAllActive`). It's capped at **1.5 s**, then fades. Home shows cached figures with "Updating…" until live data arrives.

---

## 5. Main app

### 5.0 Main layout — `app/(main)/_layout.tsx`
- **Navigator:** `Tabs` with `tabBar={() => null}`. All 19 non-settings routes plus the `settings` stack are registered as **hidden** tabs (`href: null`), so navigation happens only through the custom `FloatingNav` and `router` calls.
- **Mounted on top of every (main) screen:**
  - `FloatingNav`: a pill inset 24 px from the edges, with a white fade under it. The active item is a black circle. Items: **Home, Cashflow, + (Add transaction), Calendar, Settings** → `router.navigate(...)`. The active item comes from `navKeyFor(pathname)`: `/cashflow*` → Cashflow, `/calendar*` → Calendar, `/settings*` → Settings, everything else → Home. **The + item is never shown as active.** [unclear] On add-transaction itself the nav is hidden anyway.
  - The nav is **hidden** on `/add-transaction`, `/settings/change-pin`, `/settings/merchant-request`, `/tabung/new`, `/tabung/new/form`, `/home/learn/[id]/add-entry` and `/home/learn/[id]/entry`.
  - `DetectedTransactionOverlay`: the auto-detect **island** (§6.1).
  - `LockedRouteGuard` (§4.1).
  - `LaunchSync` (§4.3).
- **Providers:** `LockProvider` → `DetectedTransactionsProvider`.
- **Side effect:** `startDailyBudgetSync()`. Every transaction write redraws the budget widgets and the live budget notification.

---

### 5.1 Home group

#### 5.1.1 Home dashboard — `app/(main)/index.tsx`
- **Route:** `/` · **Locked?** open (figures masked) · **Nav:** yes (Home active)
- **Entry points:** root gate; FloatingNav Home; onboarding finish; LockedRouteGuard fallback; add-transaction "Done" (via back); Settings → Account sign-out.
- **Purpose:** balance, today's spend, items waiting for review, recent activity.
- **What's on screen (top → bottom, phone):**
  1. **Hero (gradient, `HomeHero`):**
     - Avatar circle with the user's initial → `/settings`. Bell (with a dot when there are unread notifications) → `/home/notifications`.
     - "Balance" (or "Balance · last synced {time}" when showing saved data), then the total of spendable accounts. The figure counts down to new values.
     - Status chip, in priority order: "Locked · tap to show" (taps to unlock) → "Updated just now" (for 2 s after any transaction write) → "Updating…" (cached figures) → "Showing saved data" (fetch error) → "No accounts yet" → "±x.xx% this month" (net income vs the balance at the start of the month). Nothing shows if none apply.
     - Stacked glass account cards: the lead account (first bank, else first wallet) with its logo, name and mask, plus up to 2 more logos and "+N". The whole stack → `/home/accounts`.
  2. **Action row:**
     - **Add** → `/add-transaction?nonce`.
     - **⇅** (Transfer) → `/add-transaction?type=transfer&nonce`.
     - **Scan** → `/add-transaction?scan=1&nonce` (opens the camera straight away).
  3. **Pending detections card** (`PendingEntriesCard`), only when the auto-detect queue has unfiled items (§6.1).
  4. **Stat tiles:** "Spent today" and "Left today". With no daily budget, the second tile reads "Set a budget" and taps → `/settings/budget`.
  5. **Recent Transactions** (5 most recent expense / income / transfer rows this month). Header action → `/transactions`. Tapping a row → `requireUnlock()` → `TransactionDetail` sheet.
  6. **Today's affirmation** gradient card (the user's active affirmations first, then the stock ones). Tapping shows the next one (only if there's more than one).
  7. **Links:** chips **Analysis** → `/home/analysis` and **Learn** → `/home/learn`.
- **Tablet:** items 3, 4, 6 and 7 sit in the left column and Recent Transactions in the right.
- **Loading state:** skeleton pills, card and tiles (first load with no cache).
- **Empty state (no accounts):** photo + "Add your first account" / "Connect a bank, e-wallet or Tabung and Flowe starts counting from today." → **Add account** → `/home/accounts?add=1` (opens the add sheet).
- **Error states:**
  - Balances fail with no accounts loaded → "Couldn't refresh balances" (shows the saved time if cached) → **Try again**.
  - Transactions fail → "Couldn't load transactions" → **Try again**.
  - No transactions → "No transactions yet / Add one, or turn on auto-detect…" → **Add transaction**.
- **Pull to refresh:** reloads everything and refreshes today's spend.
- **Sub-flows:**
  - **TransactionDetail sheet** (shared component, used on 5 screens):
    - Merchant logo, name, signed amount; rows for Category, Account (or "From → To" for transfers), Date · time, Note; receipt photo (signed URL) if there is one.
    - **Edit** → closes, then `/add-transaction` with `editParams(tx)` (`editId`, type, name, amount, category, accounts, asset, date, note).
    - **Delete** (text button) → `ConfirmSheet` "Delete this transaction?" ("RM x at {name} will be removed. {balance effect}") → deletes → local notification plus an in-app notification row "Transaction deleted" → toast "Transaction deleted" with **Undo** (re-creates the row; toast "Transaction restored"). A failed delete → toast with Retry.
  - **PendingRecurringModal** (opens **automatically once** per Home mount when the app is unlocked and recurring bills are due):
    - Header "N recurring bill(s) due · Today · from {account}". Every bill is pre-ticked, with a signed total.
    - **Confirm all** / **Confirm N** → approves each ticked bill, creating its transaction. The sheet closes if all were ticked.
    - **Review one by one** → one bill at a time with **Confirm** or **Skip this one** (skips this period).
    - It can't be dismissed while it's working.
- **Background work on Home:**
  - Reads and writes a home cache of the last balance.
  - Pushes budget limits to native (`syncBudgetLimits`).
  - Schedules recurring reminders once per session.
  - Live update on `changedAt` from `useTodaySpend`.
- **Data:** `useAccounts`, `useTransactions(year, month)`, `useBudgetSettings`, `useTodaySpend`, `usePendingRecurring`, `useAffirmations`, `useCustomCategories`, `useProfile`, `useDetected`, `notificationsRepository.getUnreadCount`.
- **Exits:** every link above; FloatingNav.

#### 5.1.2 Accounts list — `app/(main)/home/accounts.tsx`
- **Route:** `/home/accounts?add=1` (optional) · **Locked?** PIN required · **Nav:** yes
- **Entry points:** the Home hero account stack; Home empty state (`add=1`); the AccountSelector "Add account" button in add-transaction; Settings → Auto-detect "Add an account first" (`add=1`); `tabung/new/form` (`dismissTo`); notifications for tabung/milestone items with no related id.
- **Purpose:** all accounts, grouped by type, plus adding new ones.
- **What's on screen:**
  - Hero: back; **+** (add account); "Net worth in accounts" (sum of all balances, masked when locked); chip "N accounts · M Tabung".
  - Groups **Banks / E-wallets / Tabung** with group totals.
  - Each row: logo or icon, name, meta, balance. Meta is the account mask plus "auto-detect on" if a detection source is pinned to it; for a Tabung it's "Target RM x". Tapping a row → bank `/home/account/[id]`, wallet `/home/wallet/[id]`, Tabung `/home/tabung/[id]`.
- **Loading / empty / error:** grouped skeletons. Empty: "No accounts yet" → **Add account**. Error: "Couldn't load accounts" → **Try again**.
- **Sub-flows:** **Add account sheet** with the same `AccountDraftForm` as onboarding (Bank / E-wallet / Tabung; the submit label is "Add account" or "Adding…"). It runs `createAccountFromDraft` → toast "Account added" or "Tabung created · {name}" → reloads the list. A failure → toast with Retry. The sheet can't be dismissed while saving.
- **Conditional:** a Tabung created here gets **target 0** and a one-year date range. Its detail screen then offers "Set a target".
- **Data:** `useAccounts`, `createAccountFromDraft`, `sourceAccounts.all()` (auto-detect pins), `FloweNotifications`.
- **Exits:** detail screens; back.

#### 5.1.3 Bank account detail — `app/(main)/home/account/[id].tsx`
#### 5.1.4 E-wallet detail — `app/(main)/home/wallet/[id].tsx`
Both are thin wrappers around `components/accounts/AccountDetailScreen.tsx`, with `kind="bank"` and `kind="wallet"` respectively.
- **Route:** `/home/account/[id]` and `/home/wallet/[id]` · **Locked?** PIN required · **Nav:** yes
- **Entry points:** the accounts list; add-transaction (`returnTo`) after saving from this screen; edits made from this screen's TransactionDetail.
- **Purpose:** one account's balance, this month's in/out, and its history.
- **What's on screen:**
  - Hero: back; **⋯** menu; logo; name; balance; chips: mask/"Bank" or "E-wallet", plus **Auto-detect** (taps → `/settings/auto-detect`).
  - Stat tiles: "In · {Mon}" and "Out · {Mon}" (this month, transfers included by direction).
  - **History** header, whose action button reads Filter / Money in / Money out. Rows are grouped by day ("Today", etc.) with category · time. Tapping a row → TransactionDetail.
- **Loading / empty / error:** skeleton rows. Empty: "Nothing here yet". Error: "Couldn't load history" → **Try again**.
- **Sub-flows:**
  - **⋯ menu sheet:**
    - **Edit details** (Name, balance, plus last 4 digits for banks) → Edit sheet.
    - **Add transaction** → `/add-transaction?presetAccountId=…&returnTo=/home/{account|wallet}/{id}`.
    - **Auto-detect** → `/settings/auto-detect`.
    - **Delete account** → PIN-confirm sheet.
  - **Edit account sheet:** Name, Balance (RM), and for banks "Last 4 digits (matches bank alerts)". Validation: "Name is required" / "Enter a valid balance". Save updates the name, the balance (`updateBankBalance` / `updateWalletBalance`, only if changed) and the last 4 digits → toast "Account updated".
  - **Delete ConfirmSheet:** "Delete {name}? It leaves your accounts and totals. Its N transactions stay in your history. Enter your PIN to confirm." It includes a 6-digit PIN field, and confirm stays disabled until 6 digits are in. Wrong PIN → "Wrong PIN. Try again." Right PIN → `softDeleteAccount` → toast "{name} deleted" → back.
  - **Filter sheet "Show":** All / Money in / Money out.
  - **TransactionDetail:** Edit → add-transaction with `returnTo` set to this screen.
- **Data:** `useAccounts`, `useAccountTransactions(accountId)`, `accountsRepository`, `verifyPin`.
- **Exits:** back; add-transaction; settings/auto-detect.

#### 5.1.5 Tabung detail — `app/(main)/home/tabung/[id].tsx`
- **Route:** `/home/tabung/[id]` · **Locked?** PIN required · **Nav:** yes
- **Entry points:** the accounts list (Tabung rows); notifications of type `tabung` / `milestone` that have a `related_entity_id`.
- **Purpose:** savings-goal progress, adding money, paying out.
- **What's on screen:**
  - Hero: back; title = Tabung name; **sliders** icon → Settings sheet.
  - `ProgressRing` with "Saved toward goal" or "In Tabung now" (depends on progress mode), the counted amount, and "of RM target · n%".
  - Status chip:
    - No target → "Set a target" (opens Settings with the target field focused).
    - Reached → "Goal reached · {Mon YYYY}".
    - Otherwise → "RM x/month · done by {Mon YYYY}" or "Target · {Mon YYYY}".
  - Card "Saved toward goal" (contributed total, plus "Every top-up counts. Pay-outs never move this back." or "Goal reached in N months.").
  - Stat tiles "In Tabung now" and "Paid out".
  - "This goal by month" with a **Breakdown** action; `TabungMonthStrip`, including a projected month when the goal isn't reached and months remain. With no top-ups: "Your first top-up starts the month strip."
  - Buttons **Add money** and **Pay out** (disabled when the balance is 0).
- **Loading / error:** skeletons; "Couldn't load this Tabung" → **Try again**.
- **Sub-flows:**
  - **TabungMoneySheet** (full-screen modal, `mode` in/out):
    - Title "Add to {name}" or "Pay out of {name}"; numpad amount.
    - Chips: "Progress a% → b%" for top-ups; for pay-outs, "Progress stays at a%" plus "Balance x → y".
    - From/To account pill (opens an AccountSelector titled "Add from" / "Pay out to"). The default account is the last one used for this Tabung, otherwise the most-used funding account, otherwise the first spendable account.
    - Quick-amount chips: the usual amount, plus the on-track monthly figure for top-ups.
    - Pay-out note: "Paying out lowers the balance only…"
    - Submit creates a `tabung_topup` or `tabung_withdraw` transaction → in-app notification "Tabung top-up" / "Tabung pay-out" → toast "Added RM x to {name}" or "Paid out RM x". A failure → toast "…failed · nothing was moved" with Retry.
  - **TabungBreakdownSheet** "{name} by month": per-month amounts toward the goal.
  - **TabungSettingsSheet** "Count progress by":
    - Two radio cards: **Total saved in (default)** or **Current balance**, each showing "Now: RM x · n%".
    - Name; Target. Validation: "Give this Tabung a name" / "Set a target above RM 0.00".
    - **Save** → `updateTabungGoal` → toast "Tabung updated".
    - **Delete Tabung** → delete confirm.
    - When opened from "Raise the target", shows the hint "Raise the target to keep this goal going."
  - **Delete ConfirmSheet** "Delete {name}?":
    - If there's money in it: "RM x saved moves back to {account}…" with an account pill (opens AccountSelector "Move the money to"). Confirm is disabled until an account is chosen.
    - On confirm: creates a `tabung_withdraw` "Closed · {name}" for the saved amount → `softDeleteAccount` → clears the Tabung widget → toast "{name} deleted" → back.
  - **Goal reached sheet** (opens automatically when `progress.reached`): a summary of contributed and paid-out amounts → **Raise the target** (Settings with target focus) or **Keep it as is**.
- **Side effects:** pushes this Tabung to the Android home-screen Tabung widget (`setTabungWidget`) on every progress change.
- **Data:** `useTabungProgress(id)`, `useAccounts`, `transactionsRepository`, `accountsRepository`, `readLastUsed` / `writeLastUsed`, `notify`.
- **Exits:** back.

#### 5.1.6 Analysis — `app/(main)/home/analysis.tsx`
- **Route:** `/home/analysis` · **Locked?** PIN required · **Nav:** yes
- **Entry points:** the Home "Analysis" chip.
- **Purpose:** monthly spend trend and income vs expense.
- **What's on screen:**
  - Hero: back; "Spent in {Month}" plus the amount; chip "x.x% less / more than {previous month}".
  - **Monthly trend:** a bar chart of expenses. The header action cycles **6M → 12M → 3M**. The current month is the solid bar.
  - **Income vs expense:** two bars, plus "You kept n% of income this month." or "You spent n% more than you earned this month."
- **Loading / empty / error:** skeleton bars. With no data: "Your first month of spending starts the trend." Error: "Couldn't load analysis" → **Try again**.
- **Sub-flows:** none.
- **Data:** `useAnalysis(ym)` → `analysis-monthly` Edge Function.
- **Exits:** back.

#### 5.1.7 Notifications inbox — `app/(main)/home/notifications.tsx`
- **Route:** `/home/notifications` · **Locked?** PIN required · **Nav:** yes
- **Entry points:** the Home bell.
- **Purpose:** the in-app notification feed.
- **What's on screen:**
  - Hero: back; **✓** "Mark all read" (disabled when nothing is unread).
  - Groups **Today / Earlier**. Each row: type icon, message (bold if unread), sub-text, relative time (now / Nm / HH:MM / weekday / d Mon), and an unread dot.
- **User actions:** tapping a row marks it read and opens its source:
  - expense / income / transfer → `/transactions`
  - recurring → `/settings/recurring`
  - alert → `/settings/budget`
  - tabung / milestone → `/home/tabung/[related id]`, or `/home/accounts` if there's no id
  - asset / liability / cashflow → `/cashflow/info`
  - note / project → `/home/learn`
  - affirmation → `/settings/affirmations`
- **Loading / empty / error:** skeletons. Empty: "You're all caught up". Error: "Couldn't load notifications" → **Try again**. A failed mark-all → toast with Retry.
- **Data:** `useNotifications` (`fetchNotifications`, `markAsRead`, `markAllRead`).
- **Exits:** the routes above; back.

---

### 5.2 Transactions group

#### 5.2.1 Add / edit transaction — `app/(main)/add-transaction.tsx`
- **Route:** `/add-transaction` with optional params: `editId`, `type` (expense|income|transfer), `name`, `amount`, `category`, `fromAccountId`, `toAccountId`, `assetId`, `date`, `note`, `nonce`, `presetAccountId`, `returnTo`, `scan=1`. · **Locked?** open · **Nav:** hidden
- **Entry points:**
  - FloatingNav **+** and the Home **Add** button.
  - Home **⇅** (`type=transfer`) and **Scan** (`scan=1`).
  - Home and Transactions empty states; Cashflow empty state.
  - Calendar day sheet "Add to this day" (`date`).
  - Account detail menu (`presetAccountId`, `returnTo`).
  - **Edit** in any TransactionDetail (`editId` + fields).
  - The form resets whenever `nonce` or `editId` changes.
- **Purpose:** record an expense, income or transfer (including transfers into an asset, i.e. investments).
- **Defaults:** Expense; the last-used account (or the last transfer from/to pair); Today. Edit mode pre-fills everything from the params.
- **What's on screen:**
  - **Hero:** close (×); title "Add transaction" or "Edit transaction"; `SegmentedToggle` **Expense | Income | Transfer** (switching clears the category, and clears the destination unless switching to Transfer); a big amount display; an amount error; chip "Reading receipt…" or "Receipt attached".
  - **Sheet:**
    - Expense/Income: a horizontal row of the 6 most-used category chips (plus the selected one if it isn't among them) and **More** (opens the "All categories" sheet).
    - Transfer: **From pill → To pill**.
    - Account pill (expense/income); date pill (Today / Yesterday / d Mon); **+ Note** (reveals a 200-char note field).
    - `Numpad` and the **Save** button.
- **Smart behaviour:**
  - Expense with no category chosen + a typed name → the category is guessed from the merchant.
  - The Save label changes with validation state: "Enter an amount", "Amount too large", "Choose an account", "Choose a destination", "Choose a different account", "Not enough balance", "Choose a category", or "Save".
  - Validation messages: "Enter an amount above RM 0.00"; "Amounts go up to RM …"; "Add an account first, then save."; "Choose where the money goes."; "Pick two different accounts."; "{account} has RM x available." (when locked: "…doesn't have enough for this.").
- **Receipt scan:** asks for camera permission (denied → toast "Camera access is off" with Try again) → `suspend()` → camera → the `receipt-ocr` Edge Function. It fills the total, the merchant (and resets the category) and the date (only if not in the future), and forces Expense. An unreadable receipt → toast "Couldn't read that receipt. The photo is attached."
- **Save:**
  - Builds the payload and runs `create` or `update`. If the save takes longer than 4 s, it shows toast "Save failed. Your entry is kept." with Retry.
  - Transfer to an asset: sets `asset_id` and calls `assetsRepository.adjustValue`. Editing an old investment moves the value off the old asset.
  - Uploads the receipt to `receipts/{user}/{tx}.jpg` and sets `receipt_url`.
  - Remembers the last-used account(s); sends a local + in-app notification ("Expense added", "Transfer completed", …); plays a success haptic.
  - Then shows the **AddSuccess** screen.
- **Sub-flows:**
  - **AccountSelector sheet:**
    - Title "Pay from", "Pay into" or "Send to". Accounts are grouped; the "Send to" list also shows **Assets**. The other side of a transfer is excluded. Balances are masked when locked.
    - **Add account** → `/home/accounts`.
  - **All categories sheet:** every expense or income category, including custom ones.
  - **Date picker:** native, with a maximum of today.
  - **AddSuccess** (replaces the form):
    - Ring with a check and "Saved"; a transaction row; "Spent today" / "Left today" tiles (when a budget is set).
    - **Done** (it also **auto-closes after 1.2 s**) → toast "Saved · RM x to {category}" with **Undo** (deletes the row). In edit mode the toast is "Transaction updated" instead. Then it closes: `replace(returnTo)` or `back()`.
    - **Add another** resets the amount, name, category, note and receipt, and stays on the form.
- **Data:** `useAccounts`, `useTransactions`, `useCustomCategories`, `useAssets`, `useReceiptScan`, `storageService`, `assetsRepository`, `readLastUsed` / `writeLastUsed`, `notify`, `useLock`.
- **Exits:** close → `returnTo` or back; AccountSelector → `/home/accounts`.

#### 5.2.2 Calendar — `app/(main)/calendar.tsx`
- **Route:** `/calendar` · **Locked?** PIN required · **Nav:** yes (Calendar active)
- **Entry points:** FloatingNav.
- **Purpose:** spending by day for a month.
- **What's on screen:**
  - Hero: ‹ › month buttons, "{Month YYYY}", "Spent this month" plus the total.
  - A 7-column grid (S M T W T F S). Each day shows 0–3 dots for its spend level. Today is a black circle; future days are muted.
  - Legend: "Dots = spend level (1–3) · Today = black".
- **User actions:** change month; tap any day → day sheet; pull to refresh.
- **Loading / error:** skeleton cells; "Couldn't load this month" → **Try again**.
- **Sub-flows:**
  - **Day sheet:** the date, the day's spend, that day's transactions (tap → closes the sheet and opens TransactionDetail) or "Nothing on this day.", and **Add to this day** → `/add-transaction?date=YYYY-MM-DD`.
  - **TransactionDetail** (Edit → add-transaction).
- **Data:** `useTransactions(month)`, `useAccounts`, `useCustomCategories`.
- **Exits:** add-transaction; FloatingNav.

#### 5.2.3 Transactions list — `app/(main)/transactions.tsx`
- **Route:** `/transactions?category=&month=YYYY-MM` · **Locked?** PIN required · **Nav:** yes
- **Entry points:** Home "Recent Transactions" header; Cashflow "Expenses" header; Cashflow bubbles and tiles (`category` + `month`); notifications for expense, income and transfer items.
- **Purpose:** the full month list, optionally filtered by expense category and searchable.
- **What's on screen:** hero titled "Recent Transactions" (or the category label), back, a **search** toggle (🔍/×); the search field "Search name, category or note"; the transaction list.
- **Loading / empty / error:**
  - "Couldn't load transactions" → **Try again**.
  - No transactions → "No transactions yet / Turn on auto-detect…" → **Turn on auto-detect** → `/settings/auto-detect`.
  - Nothing matches the search → "Nothing matches".
- **Sub-flows:** TransactionDetail (Edit → add-transaction; delete with Undo).
- **Data:** `useTransactions(year, month)`, `useAccounts`, `useCustomCategories`.
- **Exits:** back; add-transaction; settings/auto-detect.

---

### 5.3 Cashflow group

#### 5.3.1 Cashflow — `app/(main)/cashflow/index.tsx`
- **Route:** `/cashflow` · **Locked?** PIN required · **Nav:** yes (Cashflow active)
- **Entry points:** FloatingNav.
- **Purpose:** this month's spending by category, drawn as bubbles.
- **What's on screen:**
  - Hero: back (or `navigate('/(main)')` if there's no history); a month button "{Month YYYY} ▾" (opens MonthPickerSheet); **ⓘ** → `/cashflow/info`.
  - Up to 6 category bubbles, sized by share. Tapping a bubble → `/transactions?category&month`.
  - Below: **Expenses** header (action → `/transactions`), the month total, and a 2-column grid of category stat tiles (tap → filtered transactions).
- **Loading / empty / error:** glass placeholder bubbles. Empty: 4 ghost "+" bubbles, "Your spending shows up here as bubbles.", and the empty state "No spending yet this month" → **Add transaction**. Error: "Couldn't load cashflow" → **Try again**.
- **Sub-flows:** **MonthPickerSheet** "Choose month" (the last 12 months).
- **Data:** `useTransactions(month)`, `useCustomCategories`, `spendByCategory`.
- **Exits:** cashflow/info; transactions; add-transaction.

#### 5.3.2 Cashflow info — `app/(main)/cashflow/info.tsx`
- **Route:** `/cashflow/info` · **Locked?** PIN required · **Nav:** yes
- **Entry points:** the Cashflow ⓘ button; notifications for asset, liability and cashflow items.
- **Purpose:** net worth, income statement, balance sheet, assets and liabilities.
- **What's on screen:**
  - Hero: back; "Net worth" (accounts + assets − liabilities). The chip "{Poor | Middle class | Rich} · assets cover N× debts" opens the patterns modal.
  - **Income statement · {Mon}:** Income, Expenses, Net cashflow.
  - **Balance sheet:** Assets (labelled "cash + first 2 assets"), Liabilities, and the buttons **Add asset** and **Add liability**.
  - A list of assets (type · RM/mo income) and liabilities (type · RM/mo payment). Tapping a row opens its edit sheet.
  - A row **Cash flow diagram** ("How money moves between the four boxes").
- **Loading / error:** skeleton hero; "Couldn't load your balance sheet" → **Try again**.
- **Sub-flows:**
  - **AssetSheet** (Add / Edit asset):
    - Name; Type chips; Value (or "Value now" when editing); "Top up (optional)" when editing; amount held, for unit-based types; "Monthly income from it (optional)".
    - Toggle **Paid from one of my accounts** + an account pill (AccountSelector "Paid from").
    - Validation: "Give the asset a name", "Enter a value above RM 0.00", "Choose the account it comes from".
    - Save → create or update. When funded from an account, it also creates a transfer "Into {name}" or "Top-up {name}" from that account (a failure → toast "Asset saved, but the account wasn't charged").
    - **Delete asset** → confirm.
  - **LiabilitySheet** (Add / Edit liability):
    - Name; Type chips; Amount owed; Monthly payment (optional); Interest % (optional).
    - Toggle **Add the monthly payment as a recurring bill**. On save this creates a monthly recurring expense in "bills" starting on the 1st of next month.
    - **Delete liability** → confirm.
  - **ConfirmSheet** "Remove {name}?": "It leaves your balance sheet and net worth. Transactions you made into it stay in your history." → toast "{name} removed".
  - **FullScreenModal "Cash flow diagram"** (`CashFlowDiagram`): Income, Expenses, Assets and Liabilities boxes, with asset-income and liability-payment flows.
  - **FullScreenModal "Cash flow patterns"** (`CashFlowPatternDiagram`): Poor (Job → Expenses), Middle class (Job → Liabilities → Assets), Rich (Assets → Income → Expenses). The user's own pattern is outlined.
- **Data:** `useTransactions` (current month), `useAssets`, `useLiabilities`, `useAccounts`, `useRecurring`, `transactionsRepository`, `financialClass` / `coverRatio` (`src/lib/cashflow`).
- **Exits:** back.

---

### 5.4 Tabung creation group

#### 5.4.1 New Tabung · goal — `app/(main)/tabung/new/index.tsx`
- **Route:** `/tabung/new` · **Locked?** PIN required · **Nav:** hidden
- **Entry points:** **none found. [unclear] The route is registered and fully built, but no screen, notification or link calls `/tabung/new`.** Tabung are currently created through the Bank / E-wallet / **Tabung** tab of `AccountDraftForm` (onboarding, or the Accounts → Add account sheet).
- **Purpose:** step 1, picking a goal type.
- **What's on screen:** close (×); "What are you saving for?"; radio cards for **Emergency** (3–6 months of spend), **Travel** (Trips and holidays), **Raya & festive** (Duit raya, balik kampung), **Education** (Fees, courses), **Home** (Deposit, renovation), **Custom** (Anything else). The default is Emergency.
- **User actions:** pick a card; **Continue** → `/tabung/new/form?goal=<key>`.
- **Data:** `TABUNG_GOALS` constant.
- **Exits:** form; close.

#### 5.4.2 New Tabung · details — `app/(main)/tabung/new/form.tsx`
- **Route:** `/tabung/new/form?goal=` · **Locked?** PIN required · **Nav:** hidden
- **Entry points:** `/tabung/new`.
- **Purpose:** step 2: name, target and target date.
- **What's on screen:** back; title = the typed name (or the goal label); Name (pre-filled from the goal's default name); Target (`AmountField`); a target-date pill (default 31 Dec of next year; native date picker with a minimum of today); **Create Tabung**.
- **Validation:** "Give this Tabung a name"; "Set a target above RM 0.00".
- **Save:** `createTabungAccount` (from today to the chosen date, icon and template = goal) → toast "Tabung created · {name}" → `router.dismissTo('/home/accounts')`. A failure → toast with Retry.
- **Data:** `useAccounts().createTabungAccount`.
- **Exits:** accounts list; back.

---

### 5.5 Learn group

#### 5.5.1 Learn · projects — `app/(main)/home/learn/index.tsx`
- **Route:** `/home/learn` · **Locked?** PIN required · **Nav:** yes
- **Entry points:** the Home "Learn" chip; project screen back / after delete (`replace`); notifications for note and project items.
- **Purpose:** a list of the user's learning-note projects.
- **What's on screen:** hero with back, **+** (new project), "N projects", and "N entries · last on {weekday}"; a grid of project cards (the first 3 get cover photos) showing name and entry count.
- **Loading / empty / error:** skeleton cards. Empty: "Start a learning project / Keep notes on what you learn about money…" → **New project**. Error: "Couldn't load your projects" → **Try again**.
- **Sub-flows:** **New project sheet:** "Project name" (placeholder "e.g. Budgeting 101") → **Create project** → navigates straight into the new project. A failure → toast with Retry.
- **Data:** `useLearn` (`fetchProjects`, `createProject`).
- **Exits:** `/home/learn/[projectId]`; back.

#### 5.5.2 Learn · project — `app/(main)/home/learn/[projectId].tsx`
- **Route:** `/home/learn/[projectId]` · **Locked?** PIN required · **Nav:** yes
- **Entry points:** the Learn list; creating a project; entry screen back / after delete (`replace`); add-entry after saving a **new** entry (`replace`).
- **Purpose:** a project's entries.
- **What's on screen:** a cover-photo hero; back (→ `replace('/home/learn')`); **⋯**; the project name; chip "N entries". **Entries** are listed (title or "Untitled", created date, an icon for photo vs PDF). **Add entry** button.
- **User actions:** tap an entry → `/home/learn/[projectId]/entry?entryId=`; **Add entry** → `/home/learn/[projectId]/add-entry?entryId=` (empty).
- **Loading / empty / error:** skeletons. Empty: "No entries yet. Add your first note below." Error: "Couldn't load entries" → **Try again**.
- **Sub-flows:**
  - **⋯ menu:** **Rename project** / **Delete project**.
  - **Rename sheet:** project name → **Save**. A failure → toast with Retry.
  - **Delete ConfirmSheet:** "Its N entries are deleted with it. This can't be undone." → toast "{name} deleted" → `replace('/home/learn')`.
- **Data:** `useLearnProject(projectId)` (`rename`, `remove`, `refresh`).
- **Exits:** entry; add-entry; Learn list.

#### 5.5.3 Learn · new / edit entry — `app/(main)/home/learn/[projectId]/add-entry.tsx`
- **Route:** `/home/learn/[projectId]/add-entry?entryId=` (an empty `entryId` means new) · **Locked?** PIN required · **Nav:** hidden
- **Entry points:** the project's **Add entry** button; the entry screen's **Edit** button or menu item.
- **Purpose:** write a note with photo and PDF attachments.
- **What's on screen:** close (×); title "New entry" or "Edit entry"; **Title**; read-only pills for the date (Today, or the created date) and the project name; **Notes** (multi-line); attachment thumbnails (up to **10**) with a remove **×** on each; buttons **Photo** and **PDF**; **Save entry**.
- **User actions:**
  - **Photo:** asks for media-library permission (denied → toast "Photo access is off" with Try again) → multi-select picker.
  - **PDF:** document picker. Files over **10 MB** are rejected (toast "File too large · max 10 MB" with Pick another); an unreadable file → toast "Couldn't read that file".
  - Remove an attachment (existing ones are queued for deletion).
- **Validation:** no title, notes or files → "Add a title or a note".
- **Save:** create or update the entry body (title + notes joined) → delete removed attachments (row + storage) → upload new ones to `learn-images/{user}/{entry}/{uuid}.jpg|pdf` and attach them.
  - Toasts: "Entry saved" / "Entry updated", or "Some attachments couldn't be removed", or "N attachment(s) didn't upload".
  - Then `replace` → the entry screen (when editing) or the project screen (when new).
- **Data:** `learnRepository`, `storageService`, `expo-image-picker`, `expo-document-picker`, `useLock().suspend`.
- **Exits:** entry or project (`replace`); back.

#### 5.5.4 Learn · entry — `app/(main)/home/learn/[projectId]/entry.tsx`
- **Route:** `/home/learn/[projectId]/entry?entryId=` · **Locked?** PIN required · **Nav:** hidden
- **Entry points:** the project entry list; add-entry after saving an edit.
- **Purpose:** read one entry.
- **What's on screen:** back (→ `replace` the project); **⋯**; "{Project} · {date}"; the title; notes split into paragraphs; a photo grid; PDF rows (tap → opens the signed URL in an external app); **Edit**; **Delete** (text button).
- **User actions:** **Edit** → add-entry with this `entryId`. Opening a PDF calls `suspend()` first. Errors: "Couldn't open the file" / "No app on this phone can open the PDF".
- **Sub-flows:**
  - **⋯ menu:** **Edit entry** / **Delete entry**.
  - **Delete ConfirmSheet:** "'{title}' and its attachments are removed from {project}." → toast "Entry deleted" → back to the project.
- **Empty:** "This entry no longer exists."
- **Data:** `useLearnProject` (`entries`, `imageUrls`, `deleteEntry`).
- **Exits:** project; add-entry.

---

### 5.6 Settings group

#### 5.6.0 Settings stack — `app/(main)/settings/_layout.tsx`
- A plain `Stack` (no header, white background) holding the 12 settings screens. The whole stack counts as the "settings" tab. Every route needs the PIN.
- Most sub-screens use `components/settings/SettingsScreen` (short gradient hero, back button, display title, white sheet).

#### 5.6.1 Settings home — `app/(main)/settings/index.tsx`
- **Route:** `/settings` · **Nav:** yes (Settings active)
- **Entry points:** FloatingNav; the Home avatar.
- **What's on screen:**
  - Hero: initial avatar, name, "N accounts · since {Mon YYYY}", chip "PIN + fingerprint on" or "PIN on".
  - **You:** Account; Security ("PIN, fingerprint"); Auto-detect ("Android only", "N banks & wallets on", or "Off").
  - **Money:** Categories; Budget ("RM x a day" or "Not set"); Recurring ("N bills").
  - **App:** Notifications; Affirmations; Data ("Export, import, reset"); Request a merchant.
- **User actions:** each row → its `/settings/*` route.
- **Data:** `useProfile`, `useAccounts`, `useDailyBudget`, `useRecurring`, `flags.fingerprintEnabled`, `FloweNotifications`.

#### 5.6.2 Account — `app/(main)/settings/account.tsx`
- **Route:** `/settings/account` · **Entry points:** Settings home.
- **What's on screen:** Name (30-char max); Currency (read-only, "Malaysian ringgit (RM)"); **Save**; **Sign out of this device** (text button).
- **User actions:** **Save** → validates ("Enter a name") → `updateProfile` → toast "Saved".
- **Sub-flows:** **ConfirmSheet** "Sign out of Flowe? Your data stays on this phone. You'll need your PIN to get back in." → `lock()` + `replace('/(main)')`.
- **[unclear]** "Sign out" only **locks** the app. It doesn't call `authRepository.signOut()` or clear any flags.
- **Data:** `useProfile`, `useSettings`, `useLock`.

#### 5.6.3 Security — `app/(main)/settings/security.tsx`
- **Route:** `/settings/security` · **Entry points:** Settings home.
- **What's on screen:**
  - App PIN ("Required to open Flowe"; informational, no action).
  - **Fingerprint** toggle.
  - **Lock after** pill (1 minute / 5 minutes / 15 minutes / Never).
  - **Change PIN** → `/settings/change-pin`.
  - **Use Flowe on desktop** ("Get a one-time code").
- **User actions:**
  - Fingerprint ON → checks hardware and enrolment (missing → toast "No fingerprint set up on this phone") → system prompt "Turn on fingerprint unlock" → saves locally (`flags`) and to `auth_config`. A failure rolls back with a toast.
  - Lock after → picker sheet → saves `auto_lock_minutes`. A failure rolls back.
- **Sub-flows:**
  - **"Lock after" sheet** (radio list).
  - **DesktopPairingSheet** "Use Flowe on desktop": fetches a one-time code from an Edge Function and shows it with a live "Expires in m:ss" countdown. **Get a code** / **New code**. "The code works once, for 5 minutes. Fingerprint unlock stays on this phone." Errors: "Couldn't get a code…"; "This code has expired."
- **Data:** `authConfigRepository`, `flags`, `expo-local-authentication`, `edgeFunctionsService.createDesktopPairingCode`.

#### 5.6.4 Change PIN — `app/(main)/settings/change-pin.tsx`
- **Route:** `/settings/change-pin` · **Nav:** hidden · **Entry points:** Security.
- **Flow (`PinEntryScreen`, "Step n of 3"):**
  1. **Enter current PIN** → `verifyPin`. Wrong → "Wrong PIN. Try again." (shake).
  2. **Choose a new PIN.**
  3. **Confirm new PIN.** Mismatch → "PINs don't match. Try again." On match: hash → `authConfigRepository.upsert` (failure → "Couldn't save your new PIN. Check your connection.") → `flags.setPin` → toast "PIN changed" → back.
- **Back:** goes to the previous step, or leaves the screen from step 1.
- **Data:** `verifyPin`, `hashPin`, `authConfigRepository`, `flags`.

#### 5.6.5 Auto-detect — `app/(main)/settings/auto-detect.tsx`
- **Route:** `/settings/auto-detect`
- **Entry points:** Settings home; the account-detail chip and menu; the Transactions empty state.
- **Not available** (iOS, or no native module): the empty state "Not available on this device", explaining either that iOS can't read other apps' notifications or that Auto-detect needs a development build.
- **What's on screen (Android):**
  - Master card **Read bank alerts** with a toggle and a status line: "Notification access not granted" (tapping opens the permission sheet), "Access granted · reconnecting", or "Notification access granted".
  - "Supported banks & wallets": one row per source in `NOTIFICATION_SOURCES` (sources with a matching account first). Each row has a logo, a toggle and a description:
    - "Bank · no account yet"
    - "Always {account}" (when a default is pinned)
    - "{name} ••1234" or "{name} · add last 4 digits"
    - "N accounts · add last 4 digits" or "N accounts matched by last 4 digits"
    - For wallets: the wallet name, or "N wallets · tap to pick a default"
  - The rows are disabled while the master toggle is off.
- **Behaviour:**
  - On focus, it re-binds the listener and re-syncs state on every foreground (plus once more after 2 s).
  - The first time, the watched list is seeded with every usable source. Sources without accounts are pruned. If there are no usable sources, auto-detect is switched off.
  - Master ON with no usable accounts → "Add an account first" sheet. Master ON without permission → the permission sheet.
  - Tapping a source row:
    - No account → "Add an account first".
    - Bank → the last-4-digits sheet.
    - Wallet with more than one account → the default-account sheet. Wallet with one account → toggles it.
- **Sub-flows:**
  - **Permission sheet** "Allow notification access" (3 points, listing which banks it reads from) → **Allow** (`suspend()` + system settings) / **Later**.
  - **"{Bank} accounts" sheet:** a last-4-digits field per matching account → **Save** → `updateBankAccountNumber` → toast "Saved".
  - **"{Wallet} pays from" sheet:** a radio list of accounts plus **Ask me every time**. This sets or clears `sourceAccounts`, and picking an account also turns the source on.
  - **"Add an account first" sheet:** explains why an account is needed → **Add account** (`/home/accounts?add=1`) / **Not now**.
- **Data:** `FloweNotifications` (permission, listener, enabled, watched packages), `sourceAccounts`, `useAccounts`, `accountsRepository`, `NOTIFICATION_SOURCES`.

#### 5.6.6 Categories — `app/(main)/settings/categories.tsx`
- **Route:** `/settings/categories` · **Entry points:** Settings home.
- **What's on screen:** an **Expense | Income** toggle; every category (built-in + custom) sorted by use, with "N this month". Custom categories show a pen icon and can be tapped. **Add category** button.
- **Sub-flows:**
  - **New / Edit category sheet:** Name; an icon grid; an Expense/Income toggle (new categories only); **Save category**; **Delete category** (custom, edit only).
    - Validation: "Give the category a name"; "You already have a category with that name".
    - Toasts: "Category added · {name}" / "Category updated".
  - **Delete ConfirmSheet:** "N transactions this month keep the label '{name}'. It won't be offered for new ones." (or a shorter message when it's unused) → toast "{name} deleted".
- **Built-in categories** can't be edited (they have no tap action).
- **Data:** `useCustomCategories`, `useTransactions` (usage counts).

#### 5.6.7 Budget — `app/(main)/settings/budget.tsx`
- **Route:** `/settings/budget`
- **Entry points:** Settings home; the Home "Set a budget" tile; notifications of type alert.
- **What's on screen:**
  - Hero: back; a ring showing "% of today" used; "Left today" plus the amount (or "No daily limit"); "Month: RM spent of RM limit" (when a monthly limit is set).
  - Fields: **Monthly limit** and **Daily limit** ("Not set" placeholders).
  - **Add the budget widget** (Android, when the widget can be pinned and isn't yet) → the system pin-widget prompt.
  - **Save limits**; **Turn off daily budget** (text button, only when a daily limit exists).
- **Behaviour:**
  - Typing a monthly limit auto-fills the daily limit (`dailyFromMonthly`) until the user edits the daily field.
  - Saving keeps the live-notification mode: it's derived from the monthly limit the first time, and stays off if it was off. Toast "Budget saved".
- **Sub-flows:** **ConfirmSheet** "Turn off daily budget? 'Left today' and limit alerts will stop. Your RM x monthly limit stays." → **Turn off** / **Keep it on** (Keep restores the previous value). It also appears when saving with the daily field cleared.
- **Data:** `useBudgetSettings`, `useTodaySpend`, `useTransactions`, `FloweNotifications` (widget).

#### 5.6.8 Recurring — `app/(main)/settings/recurring.tsx`
- **Route:** `/settings/recurring` · **Entry points:** Settings home; notifications of type recurring.
- **What's on screen:** tiles "Monthly total" (active expenses normalised to a month) and "Next due"; a list of non-ended rules ("Monthly · 5th · {account} · paused"); **Add recurring**.
- **Empty:** "No recurring bills yet / Add the bills you pay every month and Flowe asks you to confirm each one on its day."
- **Sub-flows:**
  - **Add / Edit recurring sheet:**
    - Type toggle **Expense | Income | Transfer** (new rules only); Name; Amount; frequency **Weekly | Monthly | Yearly**.
    - Pills: Account (AccountSelector "Pay from" / "Pay into"), "Next: d Mon" (date picker), Category (a nested **Category** sheet), and "No end date" / "Ends d Mon YYYY" (date picker).
    - **Remove end date** (text button, shown when an end date is set).
    - **Save recurring**; when editing, also **Pause** / **Resume** and **Delete**.
    - Validation: "Give the bill a name", "Enter an amount above RM 0.00", "The end date must be on or after the next date."
    - **[stub]** Choosing **Transfer** shows "Recurring transfers aren't supported yet. Use Tabung auto-save for savings." and disables Save.
    - Every save, pause or delete reschedules the 5 am reminders.
  - **Delete ConfirmSheet:** "It stops appearing in the due-today list and its reminders stop. Payments already logged stay."
- **[unclear]** The Transfer message mentions "Tabung auto-save", but no such feature appears in any screen.
- **Data:** `useRecurring`, `useAccounts`, `useCustomCategories`, `scheduleRecurringReminders`, `readLastUsed`.

#### 5.6.9 Notifications (preferences) — `app/(main)/settings/notifications.tsx`
- **Route:** `/settings/notifications` · **Entry points:** Settings home.
- **What's on screen:**
  - (Android, budget loaded) **Live budget updates** toggle ("Pinned notification you can glance at"). When on, a **Daily | Monthly | Both** selector, with hints if the matching limit is missing.
  - Toggles: Detected transactions (Ask me to confirm), Budget alerts (At 80% and 100% of daily limit), Recurring reminders (Day before and on the day), Tabung milestones (Every 20% saved toward a goal), Monthly summary (On the 1st), Affirmations (Once a day).
- **Behaviour:** optimistic toggles saved to `settings.notif_*` (rolled back on failure, with Retry). The live mode is saved through `useBudgetSettings`.
- **[unclear]** No client code reads the `notif_*` flags. `notify()` and the native capture notifications send regardless, and nothing in the client produces 80% / 100% budget alerts, milestone alerts or monthly summaries. Recurring reminders are scheduled only at 5 am on the due day, not the day before.
- **Data:** `useSettings`, `useBudgetSettings`.

#### 5.6.10 Affirmations — `app/(main)/settings/affirmations.tsx`
- **Route:** `/settings/affirmations` · **Entry points:** Settings home; notifications of type affirmation.
- **What's on screen:** a **Daily affirmation** toggle; a **Time** pill (native time picker); a preview `AffirmationCard` "Preview · {time}"; the user's own affirmations (tap → remove); **Write my own**.
- **Sub-flows:**
  - **"Write my own" sheet:** a 140-char text field plus Saving / Investing / Mindset / Awareness chips → **Add affirmation** → toast "Affirmation added".
  - **Remove ConfirmSheet:** "'{text}' won't be shown again."
- **[unclear]** `show_affirmations` and `daily_reminder_time` are saved, but nothing on the client schedules a daily affirmation notification, and the Home card ignores `show_affirmations`.
- **Data:** `useSettings`, `useAffirmations`, `affirmationsRepository`.

#### 5.6.11 Data — `app/(main)/settings/data.tsx`
- **Route:** `/settings/data` · **Entry points:** Settings home.
- **What's on screen:** rows **Export** (CSV of all transactions), **Import** (From a Flowe CSV), **Recalculate balances**, **Reset all data**; footnote "Your data is stored in your Flowe account…".
- **User actions:**
  - **Export** → builds a CSV → `suspend()` → system Share sheet → toast "Exported N transactions".
  - **Import** → document picker (5 MB maximum) → parse and insert → toast "Imported N · M skipped". Failure → "Couldn't read that file" with Pick another.
  - **Recalculate** → `recalculateBalances()` → toast "Balances rebuilt for N accounts".
- **Sub-flows:** **Reset ConfirmSheet** "Reset all data?" shows counts of accounts, transactions and Tabung. It has two fields: **Type RESET to confirm** and **PIN**; confirm stays disabled until both are valid. The cancel button is labelled **Export first** and closes the sheet and starts an export.
  - Confirm → `verifyPin` (wrong → "Wrong PIN. Try again.") → soft-deletes all accounts, assets and liabilities → `authRepository.signOut()` → `flags.unsetPin()` → `refreshGate()` → `replace('/(auth)/welcome')`.
- **[unclear]** Reset soft-deletes accounts, assets and liabilities but doesn't delete transactions. It also doesn't clear `onboardingDone`, so after setting a new PIN the gate skips onboarding.
- **Data:** `dataTransfer` service, `transactionsRepository`, `accountsRepository`, `assetsRepository`, `liabilitiesRepository`, `authRepository`, `flags`.

#### 5.6.12 Request a merchant — `app/(main)/settings/merchant-request.tsx`
- **Route:** `/settings/merchant-request` · **Nav:** hidden · **Entry points:** Settings home.
- **What's on screen:**
  - A live preview card showing the logo or a store icon, and either "Flowe already knows this one" or "No logo yet — shown with a line icon".
  - Fields: **Merchant name**, **How it shows on your statement (optional)**; **Usual category** chips (Food & Drink, Shopping, Transport, Bills, Other).
  - **Send request**; a list "Your requests" with each status: Waiting to be added / Added / Not added.
- **Behaviour:** an already-known merchant → InlineError "{name} is already recognised. Nothing to request." and Send is disabled (the name also needs at least 2 characters). A duplicate request → toast "You've already asked for {name}". Success → toast "Request sent" and the list refreshes.
- **Data:** `merchantLogoRequestsRepository`, `matchMerchant`.

---

## 6. Flows that span several screens

### 6.1 Auto-detect: bank alert → transaction (Android only)
1. **Capture (native).** `modules/flowe-notifications` listens to the notifications of watched packages (Settings → Auto-detect), drops duplicates (`CaptureStore`) and queues the capture on the device. It posts a **quick-capture notification** in the shade with **Expense / Income / Ignore** actions.
2. **Filing.** `src/services/autoFile.ts` (`processQueue`, `decide`) runs in two places: inside the app (`useDetectedTransactions`, on every foreground and the first time accounts load) and in a headless task (`autoFileTask.ts`) when a capture is answered from the shade or arrives while Flowe is closed.
   - **Filed automatically** when the user already answered from the shade and the account is known, or when `shouldAutoSave` finds every field read from the alert rather than guessed.
   - Account matching uses `resolveDetectedAccount` (the last 4 digits, or the wallet's pinned default from Auto-detect).
3. **Whatever can't be filed** becomes `pending` in `DetectedTransactionsProvider` (mounted in `(main)/_layout`).
4. **Island** (`DetectedTransactionIsland`, over every main screen):
   - A gradient capsule drops down: "RM x · {merchant}", "Detected from {source} · now", **Confirm**.
   - It auto-snoozes after **6 s**, or with a swipe up. Snoozed items stay in `pending`, and snoozes clear the next time the app returns to the foreground.
   - **Tap** → expanded modal: merchant, amount, chips (suggested category, account or "Choose account", date), **Confirm**, **Edit**, **Dismiss**.
   - **Confirm** saves with the suggested values (category guessed from the merchant, otherwise `food`; income → `salary`). With no account it opens Edit instead. Toast "Saved · RM x to {category}"; a failure → "Save failed. Your entry is kept." with Retry.
5. **Home pending card** (`PendingEntriesCard`): one card, a ghost card behind for 2, a deck plus **Confirm all** for 3 or more. Swipe sideways to move between cards. **Confirm**, **Edit**, **Dismiss**, and a suggested-category chip that opens Edit.
6. **Edit detected sheet** (`DetectedTransactionForm`): amount, an **Expense | Income** toggle, Merchant, category chips, account pill (AccountSelector), date pill (read-only). Validation: "Add a merchant name" / "Choose the account this came from". **Confirm** / **Dismiss**.
7. **Save** writes the transaction (balance through `adjust_account_balance`), retires the capture, refreshes accounts and fires `onTransactionsChanged`, which updates the budget widget and Home's "Updated just now".
- **Settings that affect it:** Settings → Auto-detect (master switch, sources, last-4 digits, wallet defaults); Account detail → Edit (last 4); onboarding notification-access.

### 6.2 Recurring bills
1. A rule is created in **Settings → Recurring**, or from **Cashflow info → Add liability** with "Add as recurring bill" on.
2. `scheduleRecurringReminders()` rebuilds a local **5 am** reminder for each active rule's next occurrence. It runs on Home (once per session) and after every save, pause or delete in Recurring.
3. A rule is due once its date is reached (`dueThroughYMD`, cut off at 5 am local). `usePendingRecurring` lists the due rules.
4. **Home** opens `PendingRecurringModal` automatically, once per mount, when the app is unlocked. **Confirm** → `approveRecurring` creates the transaction and moves `next_date` forward. **Skip** → `skipRecurring` skips this period.
5. Paused rules aren't due; ended rules disappear from the Recurring list.

### 6.3 Daily budget, widget and live notification
1. Limits are set in **Settings → Budget** (monthly limit → suggested daily limit).
2. **Home** pushes the limits to native (`syncBudgetLimits`). The main layout's `startDailyBudgetSync()` re-reads today's spend after **every** transaction write (`refreshSpentToday`) and pushes it to the 2×2 widget and the pinned **live budget notification**.
3. The **Home** "Left today" tile and the **AddSuccess** tiles show the same figures. **Settings → Notifications → Live budget updates** picks Daily / Monthly / Both, or off.
4. **[unclear]** Settings → Notifications promises budget alerts at 80% and 100%, but no client code sends them (see 5.6.9).

### 6.4 Lock and unlock across screens
See §4. In short: a cold start is locked → Home is masked and add-transaction is open → any other route or a masked figure asks for the PIN or fingerprint → the "Lock after" timer re-locks after time in the background → `suspend()` protects trips out to the camera, pickers, share sheet and system settings.

### 6.5 Tabung lifecycle
Create: onboarding or the Accounts **Add account** sheet, Tabung tab (target 0); **or** `/tabung/new` → `/tabung/new/form` (**unreachable**, see 5.4). Then, on the Tabung detail screen: set a target (Settings sheet) → Add money / Pay out → when progress reaches 100%, the Goal reached sheet offers **Raise the target** → Delete moves the remaining balance back to a chosen account. The Android Tabung widget follows the last Tabung that was opened.

### 6.6 Data reset
Settings → Data → Reset (type RESET + PIN) → soft-delete accounts, assets and liabilities → sign out of Supabase → clear the PIN → back to `/welcome` → set up a PIN again → straight to `/(main)`, because `onboardingDone` was never cleared (**[unclear]**, see 5.6.11).

---

## 7. Changes since the previous version (2026-05-22)

**Structure and visual design**
- Dark theme with the lime `#C5FF00` accent → **light v2 design**: navy→cobalt gradient heroes, white sheets, black primary, pill controls, masked amounts.
- The single `app/(auth)/setup.tsx` with sub-screens → **five routes**: `welcome`, `create-pin`, `confirm-pin`, `fingerprint`, `success`. The fingerprint step now uses the real system prompt instead of an 1800 ms simulated scan.
- The single `app/(onboarding)/index.tsx` with a celebration step → **`name` + `accounts` + `notification-access`**. The "Welcome aboard" celebration screen is **gone**; onboarding goes straight to Home.
- The PIN lock is now **deferred**: Home (masked) and Add transaction work while locked, and other routes ask for the PIN when opened. The old Home lock icon is removed.
- Bottom nav order changed from Home | Calendar | + | Cash Flow | Settings to **Home | Cashflow | + | Calendar | Settings**, as a floating pill hidden on full-screen flows.

**Routes moved or added**
- `account/[id]` → `home/account/[id]`; a **new** `home/wallet/[id]`; `tabung/[id]` → `home/tabung/[id]`; `analysis` → `home/analysis`; `accounts` → `home/accounts`; `notifications` → `home/notifications`.
- `learn.tsx` (financial tasks) → a **Learn projects** system: `home/learn`, `home/learn/[projectId]`, `…/add-entry`, `…/entry`, with photo and PDF attachments.
- `tabung/new.tsx` → a two-step `tabung/new` + `tabung/new/form` (now unreachable from the UI).
- **New:** `transactions` (full list with search and category filter).
- `cashflow.tsx` is split into `cashflow/index` (category bubbles + month picker) and `cashflow/info` (net worth, statements, assets and liabilities, diagrams).
- `settings.tsx` → a **settings stack** with 12 sub-screens. New ones: `auto-detect`, `budget`, `recurring`, `categories`, `affirmations`, `data`, `merchant-request`, `change-pin`, `security`, `notifications`, `account`.

**Home**
- Gone: the eye toggle on the balance, the horizontal account-card scroll and the 4-button shortcut grid.
- Now: a stacked account card → Accounts; **Add / Transfer / Scan**; "Spent today" / "Left today"; the auto-detect **pending card**; a simplified affirmation card (tap for next; the heart, share and category badge are gone); Analysis and Learn chips; a live "Updated just now" chip; cached figures with "Updating…" or "Showing saved data".

**Add transaction**
- The modal is now a full screen with a numpad. Gone: the recurring toggle card. New: receipt scan through OCR, transfers into assets (investments), the AddSuccess screen with auto-close and Undo, smart Save labels, a balance check, and returning to the screen it came from.

**New cross-cutting features**
- Auto-detect from bank and e-wallet notifications (island, pending card, edit sheet, headless filing).
- Recurring bills with a due-today modal and 5 am reminders.
- Daily and monthly budget with an Android home-screen widget and a live notification.
- Tabung progress modes, a month strip, pay-outs, a goal-reached sheet and a Tabung widget.
- Asset / liability sheets with funding from an account and auto-created recurring bills.
- Desktop pairing code, CSV export and import, balance recalculation, PIN-gated reset.
- Merchant logo requests.

**Things this rewrite flagged** (all detailed above): unreachable `/tabung/new`; "Sign out" only locks; `notif_*` preferences and the affirmation time are saved but not used on the client; budget alerts are promised but not sent; recurring Transfer is stubbed; Reset leaves transactions and `onboardingDone` in place; no on-screen feedback when notification access is still off after returning from system settings; a padlock is mentioned in `LockContext` but not rendered.
