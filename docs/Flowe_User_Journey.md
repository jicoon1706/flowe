# Flowe -- Full User Journey

**Personal Finance App -- React Native (Expo) + Supabase**
**Inspired by *Rich Dad Poor Dad* -- Dark theme -- Yellow-green accent `#C5FF00`**

> This document reflects the **actual implemented flow** in the codebase (`app/` with Expo Router).
> Last updated: 2026-05-22 (converted from web React to React Native)

---

## App Stage Machine

The app is gated through three stages. Supabase Auth handles identity; PIN/biometric are a local security layer.

```
Auth Setup --> Onboarding --> Main App
```

Authentication flow:
- Supabase Auth (email/password or anonymous) issues JWT
- PIN + biometric stored locally via `expo-secure-store` + `expo-local-authentication`
- Server stores only SHA-256 hash of PIN in `auth_config` table

Entrypoint: `app/_layout.tsx` (Expo Router, renders session gate -> auth -> main)

---

## Phase 1 -- Authentication Setup (First Time Only)

**File:** `app/(auth)/setup.tsx`
4 sub-screens with a 3-dot progress indicator.

### 1.1 Welcome
- Animated AppLogo (lime gradient wallet icon)
- Title **"Flowe"** + 3 feature pills:
  - "Track income & expenses effortlessly"
  - "Build assets like the rich do"
  - "Achieve financial freedom"
- Attribution: *"Inspired by Rich Dad Poor Dad"*
- **[Get Started]** -> 1.2

### 1.2a Create Your PIN
- ShieldCheck badge, 6-dot indicator
- 3x4 numpad (1-9, blank, 0, delete)
- Auto-advance to 1.2b after 6 digits (250 ms delay)

### 1.2b Confirm Your PIN
- Same numpad UI
- **Match** -> auto-advance to 1.2c
- **Mismatch** -> shake + red error *"PINs don't match. Try again."* (clears after 700 ms)
- **[<- Choose a different PIN]** -> resets back to 1.2a

### 1.2c Enable Fingerprint Login
- Pulsing fingerprint icon
- Security note: *"Biometric data never leaves your device. Your PIN always works as backup."*
- **[Enable Fingerprint]** -> 1800 ms simulated scan -> success state -> 1.3
- **[Skip for now]** -> 1.3 (fingerprint disabled)

### 1.3 Success
- Animated check + glow rings
- *"Your wallet is secured!"*
- Summary card: 6-digit PIN configured | Fingerprint enabled/disabled
- **[Continue to App]** -> persists to `expo-secure-store` -> Phase 2

---

## Phase 2 -- Onboarding (One Time)

**File:** `app/(onboarding)/index.tsx`
2-step indicator + celebration screen.

### 2.1 Name
- Wave + smile illustration
- *"What should we call you?"*
- Name input (max 30 chars) with clear (X) button
- Privacy note: *"This is stored on your device and in Supabase"*
- **[Next]** (disabled until non-empty)

### 2.2 Set Up Your Accounts
Type selector chips: **Bank | Tabung | Wallet**

**Bank form:**
- Bank dropdown (12 preset Malaysian banks + "Other Bank")
- Custom bank name (if Other)
- Account number (last 4 digits only)
- Opening Balance (RM)
- Color indicator per bank

**Tabung form:**
- Icon picker (piggy | coin | home | gift | car | rocket | palm | building | train | target)
- Name | Target (RM) | From date | To date (min = from)
- Linked bank (optional, button list)

**Wallet form:**
- Name | Opening Balance (RM)

**Added accounts** appear as chips (type badge + balance/target + remove x).
Inline validation errors per form.

- **[Cancel]** (if any added) | **[Add Account]**
- **[Add Another Account]** (dashed button after first add)
- Footer: **[Skip for now]** (no accounts) / **[Done, Let's Go!]** -> 1800 ms -> 2.3

### 2.3 Done (Celebration)
- Celebration emoji in glowing lime circle
- *"Welcome aboard, {name}!"*
- "What's next" card: add first transaction | check Cash Flow | learn Rich Dad lessons
- Auto-advances to Main App

---

## Phase 3 -- Main App Shell

**File:** `app/(main)/_layout.tsx`
Tab navigator with persistent `BottomNav`.

### Bottom Navigation
**File:** `app/(main)/_layout.tsx`

```
Home | Calendar | + (elevated, lime) | Cash Flow | Settings
```

The center **+** is a floating elevated lime button that opens the **Add Transaction** modal from any page.

---

## Phase 4 -- Home Dashboard

**File:** `app/(main)/index.tsx`

### Top Bar
- Dynamic greeting: *"Good morning/afternoon/evening, {name}"* (by hour)
- Bell icon (with blue unread dot) -> **Notifications** screen
- Lock icon -> lock app

### Daily Affirmation Card
**File:** `app/components/AffirmationCard.tsx`
- Lime gradient card, category badge + emoji
- Categories: Saving | Investing | Mindset | Awareness
- Italic quote text
- Heart favourite toggle | Share icon
- Chevron navigation + progress dots to cycle through affirmations

### Balance Banner
- *"Total Balance"* + eye toggle
- Visible: `RM 4,250.00` | Hidden: `RM -----`
- Secondary gradient card

### Account Cards (horizontal scroll)
**File:** `app/components/AccountCards.tsx`
- **Bank** -- name, balance, last 4 digits -> tap -> **AccountDetail**
- **Tabung** -- name, progress bar, RM saved/target, days left -> tap -> **TabungDetail**
- **Wallet** -- name, balance, color

### Shortcuts (4-button grid)
- Analysis | Learn | New Tabung | Accounts

### Recent Transactions
**File:** `app/components/RecentTransactions.tsx`
- Last 5 entries: icon | name (with repeat icon if recurring, photo icon if receipt attached) | date | +/- RM (green if income)
- Tap any row -> **Transaction Detail popup**:
  - Type badge (Expense/Income/Transfer) + category chip with icon + account (from/to) + amount
  - Recurring details when applicable: frequency + start/end dates + reminder state
  - Note text + attached receipt photo preview
  - X close button
- **[See All]** -> Calendar page

---

## Phase 4.1 -- Home Subscreens

### 4.1.1 AccountDetail
**File:** `app/(main)/account/[id].tsx`
- Header: back arrow | Account name | more menu
- Balance card with eye toggle + account number with copy button (shows "Copied!" 2 s)
- Monthly Income / Expenses 2-col summary
- **[Add Transaction]** (opens modal) | **[Transfer]** (placeholder)
- Transaction history list

### 4.1.2 TabungDetail
**File:** `app/(main)/tabung/[id].tsx`
- Header: back arrow | Name | edit icon
- Animated progress circle (emoji + percentage)
- Stats: remaining + days left + RM/week needed
- **[Top Up Tabung]** -> modal:
  - Amount input + quick chips (10/20/50/100), optional note
  - **[Confirm Top Up]** -> success state (1500 ms)
- **[Withdraw]** -> modal:
  - Amount input + quick chips, optional note
  - Validation: cannot exceed current saved amount
  - **[Confirm Withdraw]** -> success state
- **Edit Goal modal:** rename + change target
- Transaction history list -- top-ups shown as green + and withdrawals as red -

### 4.1.3 NewTabung
**File:** `app/(main)/tabung/new.tsx`
3-step flow.

**Step 1 -- Templates:**
Tabung Raya | Emergency Fund | Holiday | New Gadget | Down Payment | **[Start from Scratch]**

**Step 2 -- Form:**
Live preview card + Name + Target + Target date (shows weekly save needed) + Icon picker (12) + Color theme (8) + **Auto-save toggle** -> monthly amount.
**[Create Tabung]**

**Step 3 -- Success:**
"Tabung Created!" + weekly save tip + **[Back to Home]**

### 4.1.4 Analysis
**File:** `app/(main)/analysis.tsx`
- Header + Sparkles icon
- Month selector (Jan-May 2026, horizontal scroll)
- **Net Savings hero** with donut chart + Rich Dad commentary
- Income / Expenses 2-col summary with trend
- 5-month income vs expense bar chart (click to select month)
- **Category breakdown** with Expense/Income toggle, donut chart, list with progress bars & %
- Rich Dad insight card (dynamic copy by savings rate)

### 4.1.5 Learn -- Financial Tasks
**File:** `app/(main)/learn.tsx`
Bilingual (BM/EN) project + entries system.

**Projects List:**
- Hero "Nota Kewangan Peribadi" with counts (projects + entries + images)
- **[+ Project]** -> modal (name -> **[Buat Projek]**)
- Project cards: folder icon + name + entries count + last updated + latest entry preview
- Empty state: *"Belum ada projek"*

**Project Detail:**
- Header with more menu (Rename | Delete)
- Entries reverse-chronological: time-ago + text preview (2-line clamp) + up to 3 thumbnails (+N more)
- **[+ Tambah Entri]**

**Add / Edit Entry:**
- Textarea (Nota) + image grid (multi-upload, remove per image)
- Save disabled if both empty

**Entry Detail:**
- Full text + 2-col image grid (tap -> lightbox, tap again -> close)
- Edit | Delete (confirm modal)

### 4.1.6 AccountsPage
**File:** `app/(main)/accounts.tsx`
- Header + **[+ Add account]**
- Net Worth hero with 3-stat split (Bank + Tabung + Invest)
- Filter tabs: All | Bank | Tabung | Investment
- **Bank & Wallets** list -> tap -> AccountDetail
- **Tabungs** list with progress + **[+ New]** -> NewTabung
- **Investments** list (read-only)
- **Add Account modal:** Bank/Wallet toggle + name + balance -> **[Add Account]**

### 4.1.7 Notifications
**File:** `app/(main)/notifications.tsx`
- Header + unread count + **[Mark all read]**
- Grouped sections: **Today | Yesterday | Earlier**
- 15 seeded notifications across 12 types (color-coded)
- Each item: emoji icon + message + sub-text + time ago + unread dot + delete on swipe
- Empty state: bell icon + *"All caught up!"*

---

## Phase 5 -- Add Transaction Modal

**File:** `app/(main)/_layout.tsx` (modal presentation)
Opened from center + nav, Home quick action, or Calendar / AccountDetail.

- Header: title + X close
- **[Scan Receipt]** full-width lime button (placeholder)

### Tabs: `[Expense] [Income] [Transfer]`

**Expense fields:** Name + Amount + Category chips + From Account + Date.
**Income fields:** Name + Amount + Category chips + To Account + Date.
**Transfer fields:** From Account + To Account + Amount + Date.

> No category selected -> auto-fills *"Others"*.

### Recurring toggle card
- Frequency: `Monthly | Weekly | Yearly`
- Start Date + End Date (optional -- *"Until I stop it"*)
- Reminder toggle

### Extras
- Note textarea (3 rows)
- **[Attach Image]** (placeholder)
- **[Submit]** / **[Transfer]**

---

## Phase 6 -- Calendar

**File:** `app/(main)/calendar.tsx`
- Header: title + month navigator
- 3-card month summary: Income (green) + Expense (red) + Net (lime)
- Day grid with dots: red = expense, green = income, blue = transfer (max 3 dots/day, today highlighted, selected day = lime)
- Legend strip
- Day list: tapping a day filters list; **[Add]** opens AddTransaction
- Items show repeat badge when recurring

---

## Phase 7 -- Cash Flow

**File:** `app/(main)/cashflow.tsx`

### Header
- Title + info button (-> **Cash Flow Guide** screen)
- Month navigator

### Financial Class Badge (dynamic)
| Emoji | Class | Trigger |
|---|---|---|
| Concerned | Poor Pattern | no/low assets, no passive income |
| Neutral | Middle Class | liabilities drain income |
| Diamond | Rich Pattern | passive income > expenses |

Card shows flow string + 4-stat grid (Assets + Liabilities + Passive Income + Net Worth).

### Income Statement
- List of Income lines + Expense lines + totals
- Passive (Assets) line when applicable
- Color-coded **Net Cash Flow**

### Balance Sheet (2-col)
- **Assets** (lime) and **Liabilities** (red) columns
- Each item shows value + monthly income/payment + interest rate
- **[+ Add Asset]** / **[+ Add Liability]** open bottom-sheet modals
- Totals + **Net Worth** (color by sign)

### Animated Cash Flow Diagram
**File:** `app/components/CashFlowDiagram.tsx`
- SVG with animated money dots
- 3 variants:
  - **Poor:** Job -> Income -> Expenses -> money gone
  - **Middle:** Job -> Income -> Liabilities (treadmill loop)
  - **Rich:** Assets -> Income -> Expenses + reinvest loop
- Info toggle reveals description + tip

### Monthly Trend
- 6-month paired bar chart (Assets vs Liabilities)
- Insight line: *"Net worth grew RM X this month"*

### Manage Assets & Liabilities (tabs)
- Edit / delete each row
- Type chips per modal

### Cash Flow Guide
**File:** `app/(main)/cashflow/info.tsx`
- Pattern tabs: Poor | Middle | Rich
- Per-pattern: animated diagram + key facts + Rich Dad quote + actionable tip
- Comparison table of all 3 patterns

---

## Phase 8 -- Settings

**File:** `app/(main)/settings.tsx`

### Profile Card
- Lime User-icon avatar -> opens **AccountSettings**
- Name + *"Tap to edit profile"*

### Groups
**Account** -- Display Name
**Security** -- Change PIN + Fingerprint + Auto-lock Timer
**App Settings** -- Currency (RM, locked) + Notifications + Manage Categories + Recurring Payments + Balance Visibility
**Affirmations** -- Show on Home + Daily Reminder + Category Preference
**Data** -- Export Data + **Reset App** (red)

Footer: *"Flowe v1.0.0 -- Personal Finance Tracker"*

### Settings Subscreens

| Screen | File | Purpose |
|---|---|---|
| AccountSettings | `app/(main)/settings/account.tsx` | Avatar + Display Name + Financial Identity + Save |
| ChangePIN | `app/(main)/settings/change-pin.tsx` | Current PIN -> New PIN -> Confirm via numpad |
| SecuritySettings | `app/(main)/settings/security.tsx` | Fingerprint toggle + Auto-lock timer + Change PIN |
| NotificationsSettings | `app/(main)/settings/notifications.tsx` | Per-type toggles |
| CategoriesSettings | `app/(main)/settings/categories.tsx` | Manage expense/income categories |
| RecurringPaymentsSettings | `app/(main)/settings/recurring.tsx` | Recurring list with edit/pause/delete |
| AffirmationsSettings | `app/(main)/settings/affirmations.tsx` | Show on home + daily reminder time + category |
| DataSettings | `app/(main)/settings/data.tsx` | Export + Reset App (with confirm) |

---

## Notifications Catalogue

| Type | Example |
|---|---|
| cashflow | You reached Rich pattern this month! |
| alert | Unifi bill due tomorrow -- RM 89 |
| expense | RM 24.50 -- Food & Drink saved |
| income | RM 3,500 Salary -> Maybank |
| recurring | RM 89 Unifi recorded automatically |
| milestone | Tabung Raya complete! |
| transfer | RM 200 Maybank -> Tabung Raya |
| tabung | Tabung Raya -- Goal RM 500 |
| asset | ASB added -- RM 10,000 |
| affirmation | "Spend with intention." |
| project | "Investing Notes" project created |
| note | "Bajet Raya" saved |

---

## Key Daily Flows

**First launch:**
```
Welcome -> Set PIN -> Confirm PIN -> Fingerprint (or Skip)
-> Success -> Name -> Accounts -> Done -> Home
```

**Morning routine:**
```
Open app -> Home -> read affirmation -> check balance
-> glance recent transactions -> tap bell if dot is showing
```

**Add a recurring bill:**
```
+ -> Expense -> "Unifi" -> RM 89 -> Bills -> From: Maybank
-> Recurring ON -> Monthly -> Start: 1 Jun -> Reminder ON -> Submit
```

**Top up a tabung:**
```
Home -> Tabung card -> [Top Up Tabung] -> 50 -> Confirm
-> success
```

**Withdraw from a tabung:**
```
Home -> Tabung card -> [Withdraw] -> 20 -> Confirm
-> history shows red - entry
```

**Track financial class:**
```
Bottom nav Cash Flow -> see class badge -> scroll Balance Sheet
-> [+ Add Asset] -> "ASB" -> RM 10,000 -> monthly RM 50
-> class re-evaluates
```

**Capture a financial lesson:**
```
Home -> Learn -> [+ Project] -> "S&P 500"
-> [+ Tambah Entri] -> text + image -> Save
```

**Monthly review:**
```
Home -> Analysis -> pick month -> see donut + insight
-> Cash Flow -> check Monthly Trend + Net Worth
```

---

## Data Model (Supabase Persistence)

All data persisted via Supabase with RLS. Repositories in `src/repositories/`.

| Entity | Supabase Table | Notes |
|---|---|---|
| User | `profiles` | Auto-created on sign-up via trigger |
| Auth Config | `auth_config` | PIN hash (SHA-256), fingerprint flag |
| Account | `accounts` + `bank_accounts`/`tabung_accounts`/`wallet_accounts` | Polymorphic via type column |
| Transaction | `transactions` | With recurring_id FK to `recurring_rules` |
| Recurring Rule | `recurring_rules` | frequency, start/end dates, status |
| Asset | `assets` | current_value, monthly_income |
| Liability | `liabilities` | amount_owed, monthly_payment, interest_rate |
| Learn Project | `learn_projects` + `learn_entries` + `learn_entry_images` | CASCADE delete |
| Notification | `notifications` | is_read, related_entity_id |
| Affirmation | `affirmations` | Public read (no user_id) |
| Affirmation Fave | `affirmation_favourites` | user_id + affirmation_id unique |
| Settings | `settings` | One row per user, all defaults |
| Custom Category | `custom_categories` | user-defined expense/income categories |

---

## Navigation Summary (Expo Router)

```
app/(main)/_layout.tsx
├── index.tsx                  # Home
├── calendar.tsx               # Calendar
├── cashflow.tsx               # Cash Flow
├── settings.tsx               # Settings
├── account/[id].tsx           # Account Detail
├── tabung/
│   ├── [id].tsx               # Tabung Detail
│   └── new.tsx                # New Tabung
├── learn/
│   ├── index.tsx              # Learn Projects List
│   └── [projectId].tsx        # Project Detail + Entries
├── notifications.tsx          # Notifications
└── settings/
    ├── account.tsx            # Account Settings
    ├── change-pin.tsx         # Change PIN
    ├── security.tsx           # Security Settings
    ├── notifications.tsx      # Notification Settings
    ├── categories.tsx         # Category Management
    ├── recurring.tsx          # Recurring Payments
    ├── affirmations.tsx       # Affirmation Settings
    └── data.tsx               # Data Management
```

---

## Implementation Status

- [x] Phase 1 -- Auth Setup (Welcome -> PIN -> Confirm -> Fingerprint -> Success)
- [x] Phase 2 -- Onboarding (Name -> Accounts -> Done)
- [x] Phase 3 -- App shell + Bottom Nav (Expo Router tabs)
- [x] Phase 4 -- Home dashboard (affirmations, balance, accounts, quick actions, shortcuts, recents)
- [x] Phase 4.1 -- All Home subscreens
- [x] Phase 5 -- Add Transaction (Expense/Income/Transfer + recurring)
- [x] Phase 6 -- Calendar (monthly grid + day filter)
- [x] Phase 7 -- Cash Flow (badge, statement, balance sheet, diagrams, guide)
- [x] Phase 8 -- Settings (main + 8 subscreens)
- [ ] AI receipt scanning (button stub only)
- [ ] Notes blocks system (replaced by Learn -> Projects)
- [ ] Affirmations standalone page (currently inline card only)
- [ ] Backend persistence (Supabase - in progress)

---

*App: Flowe -- Personal Finance, React Native (Expo) + Supabase, dark theme + lime `#C5FF00`.*