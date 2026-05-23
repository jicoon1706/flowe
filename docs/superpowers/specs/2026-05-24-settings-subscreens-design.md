# Settings Subscreens — Implementation Design

**Date:** 2026-05-24
**Status:** Approved

---

## Overview

Implement 8 settings subscreens for the Flowe personal finance app as pure UI stubs with mock state via `SettingsContext`. All screens use NativeWind (Tailwind classes), Expo Router for navigation, and follow the dark theme (`#C5FF00` lime accent, `#1a1a1a` background).

---

## File Structure

```
app/(main)/settings/
├── _layout.tsx           # Provides SettingsContext to all subscreens
├── account.tsx           # Display name edit
├── change-pin.tsx        # Change PIN (3-step numpad)
├── security.tsx          # Fingerprint toggle + Auto-lock timer
├── notifications.tsx     # Per-type notification toggles
├── categories.tsx        # Expense/Income category tabs
├── recurring.tsx         # Recurring payments list
├── data.tsx              # Export + Reset App
└── affirmations.tsx      # Show on Home + Daily Reminder + Category Preference

context/
└── SettingsContext.tsx   # Shared in-memory state for all settings
```

---

## SettingsContext Shape

```typescript
interface UserProfile {
  displayName: string;
  avatar: string | null;
}

interface SettingsState {
  profile: UserProfile;
  security: {
    fingerprintEnabled: boolean;
    autoLockTimer: '1 min' | '5 min' | '15 min' | 'Never';
  };
  notifications: {
    cashflow: boolean;
    alert: boolean;
    expense: boolean;
    income: boolean;
    recurring: boolean;
    milestone: boolean;
    tabung: boolean;
    affirmation: boolean;
  };
  affirmations: {
    showOnHome: boolean;
    dailyReminder: string; // "08:00"
    categoryPreference: 'All' | 'Saving' | 'Investing' | 'Mindset' | 'Awareness';
  };
  balanceVisible: boolean;
}

interface SettingsContextValue {
  state: SettingsState;
  updateProfile: (profile: Partial<UserProfile>) => void;
  updateSecurity: (security: Partial<SettingsState['security']>) => void;
  updateNotifications: (notifications: Partial<SettingsState['notifications']>) => void;
  updateAffirmations: (affirmations: Partial<SettingsState['affirmations']>) => void;
  setBalanceVisible: (visible: boolean) => void;
}
```

**Initial mock state:**
- Display name: "Ahmad"
- Fingerprint: enabled
- Auto-lock: "5 min"
- All notifications: true
- Affirmations: showOnHome=true, dailyReminder="08:00", categoryPreference="All"
- Balance visible: true

---

## Screen Specifications

### 1. account.tsx
- Header with back arrow → title "Account"
- Large avatar circle (lime bg, user icon) — no tap action (placeholder)
- TextInput for Display Name (max 30 chars)
- Save button (primary CTA) → updates `updateProfile`
- Form card style: `bg-card border border-border rounded-2xl p-5`

### 2. change-pin.tsx
- 3-step flow managed by local `step` state (0 | 1 | 2)
- Steps: **Current PIN** → **New PIN** → **Confirm New PIN**
- Uses existing `Numpad` component
- 6-dot PIN indicator
- Step 0: validates against mock "123456" — wrong shows error + shake
- Step 1 & 2: auto-advance after 6 digits, step 2 matches step 1
- Mismatch: shake + "PINs don't match" error
- Success: show success state for 1500ms → `router.back()`
- Back arrow returns to previous step (or Settings if step 0)

### 3. security.tsx
- Fingerprint enable toggle (uses `Toggle` component)
- Auto-lock timer: chip selector for `1 min | 5 min | 15 min | Never`
- Updates `updateSecurity`

### 4. notifications.tsx
- 8 toggle rows in 3 groups: **Alerts** | **Activity** | **Reminders**
  - Alerts: cashflow, alert, milestone
  - Activity: expense, income, recurring, transfer
  - Reminders: tabung, affirmation
- Uses `Toggle` component per row
- Updates `updateNotifications`

### 5. categories.tsx
- Tab bar: Expense | Income (2 tabs)
- List per tab: category icon + name + color dot
- Categories sourced from `constants/categories.ts`
- No edit/delete — pure display list

### 6. recurring.tsx
- Mock list of 3 recurring items (e.g., "Unifi RM 89", "Netflix RM 53", "Axiata RM 30")
- Each row: name + amount + frequency badge + pause/play icon button
- Tap row → placeholder (no action)
- Updates `updateRecurring` (mock, no-op)

### 7. data.tsx
- "Export Data" button → shows "Exporting..." toast/alert then "Data exported!" (mock)
- "Reset App" red button → shows confirmation alert:
  - "Are you sure? This will delete all your data."
  - Cancel / Confirm (Confirm triggers app state reset + navigates to root)
- Updates via SettingsContext reset

### 8. affirmations.tsx
- "Show on Home" toggle
- Time display + edit button → native time picker or simple TextInput "HH:MM"
- Category chips: All | Saving | Investing | Mindset | Awareness (single select)
- Updates `updateAffirmations`

---

## Reusable Components (Existing)

| Component | Path | Usage |
|---|---|---|
| `SettingsRow` | `components/ui/SettingsRow.tsx` | List items |
| `SettingsGroup` | `components/ui/SettingsGroup.tsx` | Grouped sections |
| `ScreenHeader` | `components/ui/ScreenHeader.tsx` | Screen headers |
| `Toggle` | `components/ui/Toggle.tsx` | Toggle switches |
| `Numpad` | `components/ui/Numpad.tsx` | PIN entry |
| `Input` | `components/ui/Input.tsx` | Text inputs |
| `Chip` | `components/ui/Chip.tsx` | Chip selectors |

---

## Theme Tokens

| Token | Value |
|---|---|
| `bg-background` | `#1a1a1a` |
| `bg-card` | `#2a2a2a` |
| `text-foreground` | `#ffffff` |
| `text-muted-foreground` | `#a0a0a0` |
| `border-border` | `rgba(255,255,255,0.1)` |
| `bg-primary` | `#C5FF00` |
| `text-primary-foreground` | `#000000` |
| `text-destructive` | `#ff4444` |

---

## Navigation

- All subscreens use `expo-router` with `useRouter` + `router.back()`
- Back arrow on ScreenHeader calls `router.back()`
- No deep linking required — all routes are internal

---

## Scope

**In scope:**
- All 8 settings subscreens
- SettingsContext with full state shape
- All screens functional with mock state

**Out of scope:**
- Actual PIN storage (uses mock "123456")
- Actual biometric enrollment (stub only)
- Backend persistence
- Category CRUD operations