# MyWallet — Full User Journey

**Personal Finance App — React + Tailwind (Mobile-first, max-width 448px)**
**Inspired by *Rich Dad Poor Dad*** • Dark theme • Yellow-green accent `#C5FF00`

> This document reflects the **actual implemented flow** in the codebase (`src/app/`).
> Last updated: 2026-05-19 (added transaction detail popup on Home recent transactions)

---

## 🗺️ App Stage Machine

The app is gated through three stages controlled by `localStorage`:

```
┌──────────────┐   PIN set    ┌────────────────┐   onboarding done   ┌──────────┐
│  Auth Setup  │ ───────────► │   Onboarding   │ ──────────────────► │ Main App │
└──────────────┘              └────────────────┘                     └──────────┘
   key: mywallet_pin            key: mywallet_onboarding_done
```

Keys persisted: `mywallet_pin`, `mywallet_fingerprint`, `mywallet_user_name`, `mywallet_onboarding_done`, `mywallet_accounts`.

Entrypoint: `src/app/App.tsx` (renders `AuthSetup` → `Onboarding` → main shell with `BottomNav` + page switcher).

---

## Phase 1 — Authentication Setup (First Time Only)

**File:** `src/app/components/AuthSetup.tsx`
4 sub-screens with a 3-dot progress indicator.

### 1.1 Welcome
- Animated `AppLogo` (lime gradient wallet icon)
- Title **"MyWallet"** + 3 feature pills:
  - "Track income & expenses effortlessly"
  - "Build assets like the rich do"
  - "Achieve financial freedom"
- Attribution: *"Inspired by Rich Dad Poor Dad"*
- **[Get Started]** → 1.2

### 1.2a Create Your PIN
- ShieldCheck badge, 6-dot indicator
- 3×4 numpad (1–9, blank, 0, delete)
- Auto-advance to 1.2b after 6 digits (250 ms delay)

### 1.2b Confirm Your PIN
- Same numpad UI
- **Match** → auto-advance to 1.2c
- **Mismatch** → shake + red error *"PINs don't match. Try again."* (clears after 700 ms)
- **[← Choose a different PIN]** → resets back to 1.2a

### 1.2c Enable Fingerprint Login
- Pulsing fingerprint icon
- Security note: *"Biometric data never leaves your device. Your PIN always works as backup."*
- **[Enable Fingerprint]** → 1800 ms simulated scan → success state → 1.3
- **[Skip for now]** → 1.3 (fingerprint disabled)

### 1.3 Success
- Animated check + glow rings
- *"Your wallet is secured!"*
- Summary card: ✓ 6-digit PIN | ✓ / — Fingerprint
- **[Continue to App]** → persists `mywallet_pin` + `mywallet_fingerprint` → Phase 2

---

## Phase 2 — Onboarding (One Time)

**File:** `src/app/components/Onboarding.tsx`
2-step indicator + celebration screen.

### 2.1 Name
- 👋 + 😊 illustration
- *"What should we call you?"*
- Name input (max 30 chars) with clear (X) button
- Privacy note: *"This is stored only on your device"*
- **[Next]** (disabled until non-empty)

### 2.2 Set Up Your Accounts
Type selector chips: **🏦 Bank | 🐷 Tabung | 👛 Wallet**

**🏦 Bank form:**
- Bank dropdown (12 preset Malaysian banks + "Other Bank")
- Custom bank name (if Other)
- Opening Balance (RM)
- Color indicator per bank

**🐷 Tabung form:**
- Icon picker (🐷 ✈️ 🏠 🎓 💍 🌙 🎄 🏥 🚗 🎯)
- Name | Target (RM) | From date | To date (min = from)
- Linked bank (optional, button list)

**👛 Wallet form:**
- Name | Opening Balance (RM)

**Added accounts** appear as chips (type badge + balance/target + remove ×).
Inline validation errors per form.

- **[Cancel]** (if any added) | **[Add Account]**
- **[Add Another Account]** (dashed button after first add)
- Footer: **[Skip for now]** (no accounts) / **[Done, Let's Go!]** → 1800 ms → 2.3

### 2.3 Done (Celebration)
- 🎉 in glowing lime circle
- *"Welcome aboard, {name}!"*
- "What's next" card: ➕ first transaction · 💰 check Cash Flow · 📚 learn Rich Dad lessons
- Auto-advances to Main App

---

## Phase 3 — Main App Shell

**File:** `src/app/App.tsx`
Fixed-height column, scrollable content, persistent `BottomNav`.

### Bottom Navigation
**File:** `src/app/components/BottomNav.tsx`

```
🏠 Home | 📅 Calendar | ➕ (elevated, lime) | 💰 Cash Flow | ⚙️ Settings
```

The center **➕** is a floating elevated lime button (`-mt-8`) that opens the **Add Transaction** modal from any page.

---

## Phase 4 — Home Dashboard

**File:** `src/app/components/Home.tsx`

### Top Bar
- Dynamic greeting: *"Good morning/afternoon/evening, Ahmad 👋"* (by hour)
- 🔔 Bell (with blue unread dot) → **Notifications** subscreen
- 🔒 Lock icon

### 💬 Daily Affirmation Card
**File:** `src/app/components/AffirmationCard.tsx`
- Lime gradient card, category badge + emoji (`💰 Saving | 📈 Investing | 🧠 Mindset | ⚠️ Awareness`)
- Italic quote text
- ❤️ favourite toggle (red fill) | 📤 share
- ‹ › chevrons + 6 progress dots to cycle through affirmations

### Balance Banner
- *"Total Balance"* + 👁️ toggle
- Visible: `RM 4,250.00` | Hidden: `RM ••••••`
- Secondary gradient card

### Account Cards (horizontal carousel)
**File:** `src/app/components/AccountCards.tsx`
- 🏦 Bank — name, balance, last 4 digits → tap → **AccountDetail**
- 🐷 Tabung — name, progress bar, RM saved/target, days left → tap → **TabungDetail**
- 👛 Wallet — name, balance, color

### Shortcuts (4-button grid)
- 📊 Analysis · 📚 Learn · 🐷 New Tabung · 🏦 Accounts

### Recent Transactions
**File:** `src/app/components/RecentTransactions.tsx`
- Last 5 entries: icon | name (+ 🔁 if recurring, 📎 if photo attached) | date | ± RM (green if income)
- Tap any row → **Transaction Detail popup**:
  - Type badge (Expense/Income/Transfer) · category chip with icon · account (from/to) · amount
  - Recurring details when applicable: frequency · start/end dates · reminder state
  - Note text · attached receipt photo preview
  - ✕ close
- **[See All]** → Calendar page

---

## Phase 4.1 — Home Subscreens

### 4.1.1 AccountDetail
**File:** `src/app/components/home/AccountDetail.tsx`
- Header: ‹ back | Account name | ⋮ more
- Balance card with 👁️ toggle + account number with **copy** button (shows "Copied!" 2 s)
- Monthly Income / Expenses 2-col summary
- **[Add Transaction]** (opens modal) | **[Transfer]** (placeholder)
- Transaction history list

### 4.1.2 TabungDetail
**File:** `src/app/components/home/TabungDetail.tsx`
- Header: ‹ back | Name | ✏️ edit
- Animated SVG progress circle (emoji + %)
- Stats: remaining · days left · RM/week needed
- **[Top Up Tabung]** → modal:
  - Amount input + quick chips (10/20/50/100), optional note
  - **[Confirm Top Up]** → success "Your tabung is growing 🌱" (1500 ms)
- **[Withdraw]** → modal:
  - Amount input + quick chips, optional note
  - Validation: cannot exceed current saved amount
  - **[Confirm Withdraw]** → success state
- **Edit Goal modal:** rename + change target
- Transaction history list — top-ups shown as green **+** and withdrawals as red **−**

### 4.1.3 NewTabung
**File:** `src/app/components/home/NewTabung.tsx`
3-step flow.

**Step 1 — Templates:**
Tabung Raya 🌙 · Emergency Fund 🛡️ · Holiday ✈️ · New Gadget 📱 · Down Payment 🏠 · **[Start from Scratch]**

**Step 2 — Form:**
Live preview card · Name · Target · Target date (shows weekly save needed) · Icon picker (12) · Color theme (8) · **Auto-save toggle** → monthly amount.
**[Create Tabung]**

**Step 3 — Success:**
"Tabung Created! 🎉" + weekly save tip + **[Back to Home]**

### 4.1.4 Analysis
**File:** `src/app/components/home/Analysis.tsx`
- Header + Sparkles icon
- Month selector (Jan–May 2026, horizontal scroll)
- **Net Savings hero** with conic-gradient donut + Rich Dad commentary (*"🔥 On Rich Dad track"* / *"⚠️ Below 20% target"*)
- Income / Expenses 2-col summary with trend
- 5-month income vs expense bar chart (click to select month)
- **Category breakdown** with Expense/Income toggle, donut chart, list with progress bars & %
- Rich Dad insight card (dynamic copy by savings rate)

### 4.1.5 Learn — Financial Tasks
**File:** `src/app/components/home/Learn.tsx`
Bilingual (BM/EN) project + entries system.

**Projects List:**
- Hero "Nota Kewangan Peribadi" with counts (projects · entries · images)
- **[+ Project]** → modal (name → **[Buat Projek]**)
- Project cards: 📁 name · entries · last updated · latest entry preview · `X teks` / `Y gambar` badges
- Empty state: *"Belum ada projek"*

**Project Detail:**
- Header with ⋮ more (Rename | 🗑️ Delete)
- Entries reverse-chronological: time-ago · text preview (2-line clamp) · up to 3 thumbnails (+N more)
- **[+ Tambah Entri]**

**Add / Edit Entry:**
- Textarea (Nota) + image grid (multi-upload, remove per image)
- Save disabled if both empty

**Entry Detail:**
- Full text + 2-col image grid (tap → lightbox, tap again → close)
- ✏️ Edit | 🗑️ Delete (confirm modal)

### 4.1.6 AccountsPage
**File:** `src/app/components/home/AccountsPage.tsx`
- Header + **[+ Add account]**
- Net Worth hero with 3-stat split (Bank · Tabung · Invest)
- Filter tabs: All | Bank | Tabung | Investment
- **Bank & Wallets** list → tap → AccountDetail
- **Tabungs** list with progress + **[+ New]** → NewTabung
- **Investments** list (read-only)
- **Add Account modal:** Bank/Wallet toggle + name + balance → **[Add Account]**

### 4.1.7 Notifications
**File:** `src/app/components/Notifications.tsx`
- Header + unread count + **[Mark all read]**
- Grouped sections: **Today · Yesterday · Earlier**
- 15 seeded notifications across 12 types (color-coded):
  expense (red) · income (green) · transfer (blue) · recurring (blue) · alert (yellow) · tabung (pink) · milestone (primary) · asset (primary) · cashflow (primary) · note (purple) · affirmation (indigo) · project (orange)
- Each item: emoji icon · message · sub-text · "8 min lalu" · unread dot · trash on hover
- Empty state: 🔔 *"All caught up!"*

---

## Phase 5 — Add Transaction Modal

**File:** `src/app/components/AddTransaction.tsx`
Opened from center ➕ nav, Home quick action, or Calendar / AccountDetail.

- Header: title + ✕ close
- **[📷 Scan Receipt]** full-width lime button (placeholder)

### Tabs: `[Expense] [Income] [Transfer]`

**Expense fields:** Name · Amount (large numpad-style input) · Category chips (🍔 🚗 🧾 🛍️ 💊 🎬 📦 Others) · From Account · Date.
**Income fields:** Name · Amount · Category chips (💼 💻 🎁 💰 📈 🏠 📦 Others) · To Account · Date.
**Transfer fields:** From Account · To Account · Amount · Date.

> No category selected → auto-fills *"Others"*.

### 🔁 Recurring (toggle card)
- Frequency: `Monthly | Weekly | Yearly`
- Start Date · End Date (optional — *"Until I stop it"*)
- Reminder toggle

### Extras
- Note textarea (3 rows)
- **[Attach Image]** (placeholder)
- **[Submit]** / **[Transfer]**

---

## Phase 6 — Calendar

**File:** `src/app/components/Calendar.tsx`
- Header: title + `‹ May 2025 ›` navigator
- 3-card month summary: Income (green) · Expense (red) · Net (lime)
- 7×N day grid with dots: 🔴 expense · 🟢 income · 🔵 transfer (max 3 dots/day, today highlighted, selected day = lime)
- Legend strip
- Day list: tapping a day filters list; **[Add]** opens AddTransaction
- Items show 🔁 badge when recurring

---

## Phase 7 — Cash Flow 💰

**Files:** `CashFlow.tsx`, `CashFlowDiagram.tsx`, `CashFlowInfo.tsx`

### Header
- Title + ℹ️ info button (→ **Cash Flow Guide** subscreen)
- Month navigator (Jan–Jun 2026)

### Financial Class Badge (dynamic)
| Emoji | Class | Trigger |
|---|---|---|
| 😰 | Poor Pattern | no/low assets, no passive income |
| 😐 | Middle Class | liabilities drain income |
| 💎 | Rich Pattern | passive income > expenses |

Card shows mono flow string (`Income → Expenses` / `Income → Liabilities → Expenses` / `Assets → Income → More Assets`) + 4-stat grid (Assets · Liabilities · Passive Income · Net Worth).

### Income Statement
- Mono-styled list of Income lines + Expense lines + totals
- 📈 Passive (Assets) line when applicable
- Color-coded **Net Cash Flow** (✅ / ⚠️)

### Balance Sheet (2-col)
- **Assets** (lime) and **Liabilities** (red) columns
- Each item shows value + monthly income/payment + interest rate
- **[+ Add Asset]** / **[+ Add Liability]** open bottom-sheet modals
- Totals + **Net Worth** (color by sign)

### Animated Cash Flow Diagram
**File:** `src/app/components/CashFlowDiagram.tsx`
- SVG with animated money dots, cycle 2.8–3.5 s
- 3 variants:
  - **Poor:** Job → Income → Expenses → 💸 gone
  - **Middle:** Job → Income → Liabilities (treadmill loop)
  - **Rich:** Assets → Income → Expenses + reinvest loop
- ℹ️ toggle reveals description + tip

### Monthly Trend
- 6-month paired bar chart (Assets vs Liabilities)
- Insight line: *"Net worth grew RM X this month"*
- Per-month net worth summary grid

### Manage Assets & Liabilities (tabs)
- Edit / delete each row (delete = inline ✓/✕ confirm)
- Type chips per modal:
  - **Asset:** 🏠 Real Estate · 📈 Stocks · 💰 Unit Trust · 🏦 Fixed Deposit · 🐷 ASB · 💎 Gold · 🚗 Vehicle · 💼 Business · 📦 Others
  - **Liability:** 🏦 Mortgage · 🚗 Car Loan · 💳 Credit Card · 🎓 Study Loan · 🏥 Medical Loan · 💼 Business Loan · 📦 Others

### Cash Flow Guide (subscreen)
**File:** `src/app/components/CashFlowInfo.tsx`
- Pattern tabs: 😰 Poor | 😐 Middle | 💎 Rich
- Per-pattern: animated diagram · key facts list · 💬 *"Rich Dad Says"* quote · actionable tip (badge: First Step / Key Rule / Start Here)
- Comparison table of all 3 patterns

---

## Phase 8 — Settings ⚙️

**File:** `src/app/components/Settings.tsx`

### Profile Card
- Lime User-icon avatar → opens **AccountSettings**
- Name "Ahmad" + *"Tap to edit profile →"*

### Groups
**Account** — Display Name
**Security** — Change PIN · Fingerprint (Enabled) · Auto-lock Timer (5 minutes)
**App Settings** — Currency (RM, locked) · Notifications · Manage Categories · Recurring Payments · Balance Visibility
**Affirmations** — Show on Home · Daily Reminder (8:00 AM) · Category Preference
**Data** — Export Data · **Reset App** ⚠️ (red)

Footer: *"MyWallet v1.0.0 — Personal Finance Tracker"*

### Subscreens (`src/app/components/settings/`)

| Screen | File | Purpose |
|---|---|---|
| AccountSettings | `AccountSettings.tsx` | Avatar (camera overlay) · Display Name · read-only username & member-since · Financial Identity (Rich Dad / Middle Class / Building Wealth) · **[Save]** with 2 s success state |
| ChangePIN | `ChangePIN.tsx` | Current PIN → New PIN → Confirm via numpad |
| SecuritySettings | `SecuritySettings.tsx` | Fingerprint toggle · Auto-lock timer · Change PIN link |
| NotificationsSettings | `NotificationsSettings.tsx` | Per-type toggles |
| CategoriesSettings | `CategoriesSettings.tsx` | Manage expense/income categories |
| RecurringPaymentsSettings | `RecurringPaymentsSettings.tsx` | Recurring list with edit/pause/delete |
| AffirmationsSettings | `AffirmationsSettings.tsx` | Show on home · daily reminder time · category preference |
| DataSettings | `DataSettings.tsx` | Export · Reset App (with confirm) |

---

## 🔔 Notifications Catalogue (15 seeded types)

| Type | Example |
|---|---|
| cashflow | 💎 You've reached Rich pattern this month! |
| alert | ⏰ Unifi bill due tomorrow — RM 89 |
| expense | ✅ RM 24.50 — Food & Drink saved |
| income | 💚 RM 3,500 Salary → Maybank |
| recurring | 🔁 RM 89 Unifi recorded automatically |
| milestone | 🎉 Tabung Raya complete! |
| transfer | 🔁 RM 200 Maybank → Tabung Raya |
| tabung | 🐷 Tabung Raya — Goal RM 500 |
| asset | 📈 ASB added — RM 10,000 |
| affirmation | 💬 *"Spend with intention."* |
| project | 📁 "Investing Notes" project created |
| note | 📝 "Bajet Raya" saved |

---

## 🔄 Key Daily Flows

**First launch:**
```
Welcome → Set PIN → Confirm PIN → Fingerprint (or Skip)
→ Success → Name → Accounts → Done 🎉 → Home
```

**Morning routine:**
```
Open app → Home → read 💬 affirmation → check balance
→ glance recent transactions → tap 🔔 if dot is showing
```

**Add a recurring bill:**
```
➕ → Expense → "Unifi" → RM 89 → Bills → From: Maybank
→ 🔁 ON → Monthly → Start: 1 Jun → Reminder ON → Submit ✅
```

**Top up a tabung:**
```
Home → Tabung card → [Top Up Tabung] → 50 → Confirm
→ 🌱 success
```

**Withdraw from a tabung:**
```
Home → Tabung card → [Withdraw] → 20 → Confirm
→ history shows red − entry
```

**Track financial class:**
```
Bottom nav 💰 → see class badge → scroll Balance Sheet
→ [+ Add Asset] → "ASB" → RM 10,000 → monthly RM 50
→ class re-evaluates ✅
```

**Capture a financial lesson:**
```
Home → 📚 Learn → [+ Project] → "S&P 500"
→ [+ Tambah Entri] → text + image → Save ✅
```

**Monthly review:**
```
Home → 📊 Analysis → pick month → see donut + insight
→ 💰 Cash Flow → check Monthly Trend + Net Worth
```

---

## 📦 Implementation Data Model (in-memory / localStorage)

| Entity | Where stored | Shape (summary) |
|---|---|---|
| Auth | `localStorage` | `mywallet_pin`, `mywallet_fingerprint` |
| User | `localStorage` | `mywallet_user_name` |
| Onboarding accounts | `localStorage` | `mywallet_accounts` (array) |
| OnboardingAccount | state | `id, type(bank/tabung/wallet), name, balance, target?, fromDate?, toDate?, linkedBankId?, icon, color` |
| Transaction (Calendar mock) | component state | `type, amount, name, category, time, icon, recurring?` |
| Asset (CashFlow) | component state | `id, name, type, icon, value, monthlyIncome, dateAcquired, note` |
| Liability (CashFlow) | component state | `id, name, type, icon, amountOwed, monthlyPayment, interestRate, note` |
| Project (Learn) | component state | `id, name, entries[], createdAt, updatedAt` |
| ProjectEntry | component state | `id, text, images[](data URIs), createdAt` |
| Notification | component state | `id, emoji, message, sub?, type, timestamp, read` |
| TabungData | component state | `id, name, saved, target, daysLeft, icon, description?, deadline?, color?` |

> All persistence today is `localStorage` + component state; nothing is wired to a backend.

---

## 🗺️ Navigation Summary

```
Bottom Nav:
🏠 Home | 📅 Calendar | ➕ (modal) | 💰 Cash Flow | ⚙️ Settings

Home → AccountDetail · TabungDetail · NewTabung · Analysis · Learn · AccountsPage · Notifications
Cash Flow → CashFlowInfo (guide) + Add/Edit Asset & Liability modals
Settings → AccountSettings · ChangePIN · SecuritySettings · NotificationsSettings
          · CategoriesSettings · RecurringPaymentsSettings · AffirmationsSettings · DataSettings
```

---

## ✅ Implementation Status

- [x] Phase 1 — Auth Setup (Welcome → PIN → Confirm → Fingerprint → Success)
- [x] Phase 2 — Onboarding (Name → Accounts → Done)
- [x] Phase 3 — App shell + Bottom Nav
- [x] Phase 4 — Home dashboard (affirmations, balance, accounts, quick actions, shortcuts, recents)
- [x] Phase 4.1 — All 7 Home subscreens
- [x] Phase 5 — Add Transaction (Expense/Income/Transfer + recurring)
- [x] Phase 6 — Calendar (monthly grid + day filter)
- [x] Phase 7 — Cash Flow (badge, statement, balance sheet, animated diagrams, guide)
- [x] Phase 8 — Settings (main + 8 subscreens)
- [ ] AI receipt scanning (button stub only)
- [ ] Notes blocks system (replaced by Learn → Projects)
- [ ] Affirmations standalone page (currently inline card only)
- [ ] Backend persistence (localStorage only)

---

*App: MyWallet — Personal Finance, React + Tailwind v4, dark theme + lime `#C5FF00`.*
