# Settings Sub-pages Implementation Design

**Date:** 2026-05-23
**Status:** Approved
**Project:** Flowe - Personal Finance App

---

## Overview

Implement 8 settings sub-screens for the Flowe React Native app. Follow the existing navigation pattern used in `app/(tabs)/learn/` — a Stack navigator with shared header styling, dark theme cards, and modal presentations for forms.

**Dark theme:** `#0D0D0D` background, `#1A1A1A` card, `#C5FF00` lime accent throughout.

---

## Navigation Structure

```
app/(tabs)/settings/
├── _layout.tsx          # Stack with shared dark header styling
├── account.tsx           # Avatar + Display Name + Financial Identity
├── change-pin.tsx        # Current PIN → New PIN → Confirm (numpad reuse)
├── security.tsx          # Fingerprint toggle + Auto-lock timer
├── notifications.tsx     # Per-type notification toggles
├── categories.tsx        # Tabbed: Expense | Income | Transfer
├── recurring.tsx         # List of recurring → bottom sheet modal edit
├── affirmations.tsx      # Show on home + Daily reminder + Category
└── data.tsx              # Export Data + Reset App (confirm)
```

**Update `app/(tabs)/settings.tsx`** to push to `/settings/account` instead of using inline rows.

---

## Shared Styles

All sub-screens use:
- Header: `backgroundColor: Colors.dark.cardBg`, `headerTintColor: Colors.dark.text`
- Content: `backgroundColor: Colors.dark.darkBg`
- Cards: `backgroundColor: Colors.dark.cardBg`, `borderRadius: 16`, `padding: 16`
- Tint accent: `Colors.dark.tint` (#C5FF00)
- Destructive: `Colors.dark.destructive` (#EF4444)
- Row height: 56px, icons 20px, chevron 18px

---

## Screen Specifications

### 1. account.tsx — Account Settings

**Header:** "Account Settings"

**Components:**
- Avatar: 80x80 circle, lime background, emoji centered (tap → emoji picker modal)
- Display Name: TextInput, max 30 chars, "Name" label
- Financial Identity: Dropdown with options (Student / Employee / Business Owner / Investor)

**Mock data:** Avatar "👤", Name "Akmal", Identity "Employee"

**Save button:** Full-width lime button "Simpan" — disabled until changes made.

---

### 2. change-pin.tsx — Change PIN

**Header:** "Change PIN"

**Flow (3 steps):**
1. **Enter Current PIN** — numpad with 6-dot indicator, auto-submit at 6 digits
2. **Enter New PIN** — numpad with 6-dot indicator
3. **Confirm New PIN** — numpad with 6-dot indicator

**Validation:**
- Current PIN mismatch → shake + "PIN is incorrect"
- New PIN match fail → shake + "PINs don't match"
- Same as current PIN → shake + "New PIN cannot be same as current"

**Reuse:** PIN numpad component from `app/(auth)/setup.tsx` — extract to `src/components/ui/PinPad.tsx`.

**Mock:** Any 6-digit PIN works (no real auth check in this implementation).

---

### 3. security.tsx — Security Settings

**Header:** "Security"

**Components:**
- Fingerprint Login: Toggle row with fingerprint icon, description text "Use fingerprint to unlock app"
- Auto-lock Timer: Row with chevron, current value "Immediately" → opens picker (Immediately / 1 min / 5 min / 15 min)
- Change PIN: Row linking to `/settings/change-pin`

**Mock data:** Fingerprint ON, Auto-lock "Immediately"

---

### 4. notifications.tsx — Notification Settings

**Header:** "Notifications" + "Mark all read" link (right side)

**Sections (grouped rows):**
- **Transactions:** Expense alerts, Income alerts, Transfer alerts
- **Reminders:** Recurring payment reminders, Tabung milestone reminders
- **System:** Cash flow pattern alerts, Affirmation daily reminders

**Row format:** Icon + Label + Toggle

**Mock data:** All toggles ON

---

### 5. categories.tsx — Manage Categories

**Header:** "Categories" + "Add" button (right side)

**Tab bar:** Expense | Income | Transfer

**Each tab:**
- FlatList of categories: icon + name + color dot
- Swipe left to delete (with confirm)
- "Add Category" row at bottom → inline TextInput

**Expense categories:** Food, Transport, Bills, Entertainment, Shopping, Health, Others
**Income categories:** Salary, Freelance, Investment, Gift, Others
**Transfer categories:** Bank Transfer, Wallet Transfer, Tabung Transfer

**Mock data:** Pre-populated lists as above, all enabled.

---

### 6. recurring.tsx — Recurring Payments

**Header:** "Recurring Payments" + "+" button (right side)

**Content:**
- FlatList of recurring payments: name, amount, frequency badge, next date, active/paused indicator
- Tap item → bottom sheet modal with:
  - Name (TextInput)
  - Amount (NumericInput)
  - Frequency (Monthly / Weekly / Yearly chips)
  - Start date (DatePicker)
  - End date (DatePicker, optional)
  - Active toggle
  - Save / Delete buttons
- Swipe to delete with confirm

**Mock data:** 3 items (Unifi RM89 monthly, Netflix RM53 monthly, ASB contribution RM200 monthly)

---

### 7. affirmations.tsx — Affirmation Settings

**Header:** "Affirmations"

**Components:**
- Show on Home: Toggle row
- Daily Reminder: Toggle + time picker row (shows when reminder ON)
- Category Preference: Row with chevron → shows selected category (All / Saving / Investing / Mindset / Awareness)

**Mock data:** Show on Home ON, Daily Reminder ON at 9:00 AM, Category "All"

---

### 8. data.tsx — Data Management

**Header:** "Data"

**Components:**
- Export Data: Row with download icon → "Export as JSON" button (shows success toast)
- Reset App: Danger row with warning icon → confirm modal ("This will delete all your data. Are you sure?")

**Reset flow:**
- Tap "Reset App" → show confirm modal
- Confirm → clear all local storage + Supabase data + return to welcome screen

**Mock data:** No pre-population needed.

---

## Implementation Order

1. Create `app/(tabs)/settings/_layout.tsx` (Stack wrapper)
2. Create `src/components/ui/PinPad.tsx` (reusable from setup)
3. Build `account.tsx`, `change-pin.tsx`, `security.tsx`
4. Build `notifications.tsx`, `categories.tsx`
5. Build `recurring.tsx`, `affirmations.tsx`
6. Build `data.tsx`
7. Update main `settings.tsx` to use proper navigation
8. Add mock data to all screens

---

## Component Inventory

| Component | Purpose | File |
|---|---|---|
| PinPad | 6-digit numpad with dots | `src/components/ui/PinPad.tsx` |
| Toggle | Custom toggle switch | Inline (reuse from settings.tsx) |
| SectionRow | Icon + label + value/toggle/chevron | Inline per screen |
| BottomSheet | Modal for edit forms | Inline (reuse from recurring) |
| ConfirmModal | Danger confirm dialog | Inline (reuse pattern) |

---

## Mock Data Summary

| Screen | Mock Data |
|---|---|
| account | Avatar: 👤, Name: Akmal, Identity: Employee |
| change-pin | Any 6-digit PIN accepted |
| security | Fingerprint: ON, Auto-lock: Immediately |
| notifications | All toggles ON |
| categories | Default expense/income/transfer lists |
| recurring | 3 items (Unifi, Netflix, ASB) |
| affirmations | Show: ON, Reminder: ON 9:00 AM, Category: All |
| data | Empty (action-based) |

---

## Notes

- All screens use `useRouter` from `expo-router` for navigation
- State managed with `useState` locally (no global state needed)
- Dark theme colors from `src/constants/theme.ts` or inline
- No backend integration (mock data only)
- Follow existing patterns from Learn subscreens exactly