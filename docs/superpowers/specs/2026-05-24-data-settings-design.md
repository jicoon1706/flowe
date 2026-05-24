# Data Settings Screen — Design Spec

**Date:** 2026-05-24
**Status:** Approved
**File:** `app/(main)/settings/data.tsx`

---

## Overview

Redesign the Data Settings screen to match the prototype's richer functionality. The screen has three main sections: Storage Summary, Export Data, and Danger Zone. No backend integration — standalone UI.

---

## Layout Structure

```
SafeAreaView (bg-background)
├── ScreenHeader ("Data & Storage" + back)
└── ScrollView
    ├── Storage Summary Card
    ├── Export Data Card
    └── Danger Zone Card
```

---

## Section 1 — Storage Summary

**Container:**
- `bg-card border border-border rounded-2xl p-4 mb-6`
- Flex row with icon + title: `Database` icon (lime) + "Storage Summary" text

**3-column grid:**
- `grid grid-cols-3 gap-3`
- Each cell: `bg-muted rounded-xl py-3 text-center`
  - Number: `text-lg font-bold text-primary`
  - Label: `text-xs text-muted-foreground`

**Data (static counts — no backend yet):**
| Metric | Value |
|---|---|
| Transactions | 248 |
| Categories | 12 |
| Recurring | 5 |

---

## Section 2 — Export Data

**Section header:** `text-sm font-medium text-muted-foreground mb-3 px-2` → "Export Data"

**Card:** `bg-card border border-border rounded-2xl p-4 mb-6`

### Format Selector
- Label: `text-sm font-medium mb-2` → "Format"
- Two buttons side-by-side: `flex gap-2`
  - CSV button: `flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border font-semibold text-sm`
  - Active: `bg-primary text-black border-primary`
  - Inactive: `bg-muted border-border text-muted-foreground`
  - Icon: `FileText` (lucide), `w-4 h-4`

### Date Range Selector
- Label: `text-sm font-medium mb-2` → "Date Range"
- `grid grid-cols-2 gap-2`
- Options:
  | Value | Label |
  |---|---|
  | `1m` | This Month |
  | `3m` | Last 3 Months |
  | `1y` | Last Year |
  | `all` | All Time |
- Active: `bg-primary/20 border-primary text-primary`
- Inactive: `bg-muted border-border text-muted-foreground`

### Export Button
- Full-width: `w-full py-3.5 bg-primary text-black rounded-xl font-semibold flex items-center justify-center gap-2`
- States:
  - Default: `Download` icon + "Export {format}"
  - Loading: `border-2 border-black/40 border-t-black rounded-full animate-spin` + "Exporting..."
  - Success: `Check` icon + "Exported!" (auto-clears after 3s)
- `disabled={exporting}` during loading

---

## Section 3 — Danger Zone

**Section header:** `text-sm font-medium text-red-400 mb-3 px-2` → "Danger Zone"

**Card:** `bg-red-500/10 border border-red-500/30 rounded-2xl p-4`

### Content Layout
- Flex row, `items-start gap-3`, with `AlertTriangle` icon (red, `flex-shrink-0`)
- Text block:
  - Title: `font-semibold text-red-400` → "Reset App"
  - Description: `text-xs text-muted-foreground mt-1` → full warning text

### Reset Button
- Full-width: `w-full py-3 bg-red-500/20 text-red-400 border border-red-500/40 rounded-xl font-semibold text-sm`
- Opens confirmation modal on press

---

## Reset Confirmation Modal

**Trigger:** Reset button press
**Backdrop:** `fixed inset-0 bg-black/80 z-50`
**Center align:** `flex items-center justify-center p-6`

**Modal card:**
- `bg-background border border-border rounded-3xl p-6 w-full max-w-sm`

### Content
- Centered layout:
  - Icon container: `w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4`
  - Icon: `AlertTriangle w-8 h-8 text-red-400`
  - Title: `text-lg font-bold mb-2` → "Reset App?"
  - Description: `text-sm text-muted-foreground` → instruction text with `"reset"` in `text-red-400 font-mono font-bold`

### Text Input
- `w-full bg-card border border-border rounded-xl px-4 py-3 text-center text-foreground focus:outline-none focus:border-red-500 mb-4 font-mono`
- Placeholder: `Type "reset" to confirm`
- `textAlign: center`

### Buttons
- Flex row, `flex gap-3`
- Cancel: `flex-1 py-3 bg-card border border-border rounded-xl font-semibold text-sm`
- Reset: `flex-1 py-3 bg-red-500 text-white rounded-xl font-semibold text-sm disabled:opacity-40`
- Reset disabled until `resetInput.toLowerCase() === 'reset'`

### Dismiss
- Backdrop press: `setShowResetConfirm(false); setResetInput('')`
- Cancel button: same

---

## State

| State | Type | Default |
|---|---|---|
| `exportFormat` | `'csv' \| 'pdf'` | `'csv'` |
| `dateRange` | `'1m' \| '3m' \| '1y' \| 'all'` | `'1m'` |
| `exporting` | `boolean` | `false` |
| `exported` | `boolean` | `false` |
| `showResetConfirm` | `boolean` | `false` |
| `resetInput` | `string` | `''` |

---

## Export Flow

```
handleExport():
  setExporting(true)
  setTimeout(1500ms):
    setExporting(false)
    setExported(true)
    setTimeout(3000ms):
      setExported(false)
```

---

## Dependencies

- `lucide-react-native` — icons only
- No additional libraries needed
- All animations via `react-native` built-in + Tailwind classes

---

## Notes

- Storage counts are static (hardcoded) — no backend integration yet
- Export button is UI-only — no actual file generation
- Reset dispatches `RESET_ALL` to SettingsContext and navigates to `/`
- Follow existing Flowe theme tokens from `docs/Flowe_Theme.md`