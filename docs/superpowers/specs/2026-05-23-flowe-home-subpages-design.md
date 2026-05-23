# Flowe Home Subpages — Design Spec

**Date:** 2026-05-23
**Status:** Approved

## Overview

Implement home section subpages: **Learn section** (projects + entries) and **New Tabung flow**, plus move existing Tabung detail to nested structure under `home/`.

---

## File Structure

```
app/(main)/
├── _layout.tsx                 # Tab navigator (update routes here)

├── home/
│   ├── tabung/
│   │   └── [id].tsx            # Tabung detail (MOVED from tabung/[id].tsx)
│   └── learn/
│       ├── index.tsx           # Projects list
│       ├── [projectId].tsx     # Project detail + entries list
│       └── [projectId]/
│           ├── add-entry.tsx   # Add new entry
│           └── entry.tsx       # Entry detail + edit/delete menu

└── tabung/
    └── new/
        ├── index.tsx           # Template selection (5 types + scratch)
        └── form.tsx            # Tabung form + success
```

---

## Learn Section

### 1. Projects List (`home/learn/index.tsx`)

**Purpose:** Show all Learn projects with create functionality.

**UI Elements:**
- ScreenHeader: "Nota Kewangan Peribadi" + back arrow (back goes to home)
- Stats card: total projects count, total entries count, total images
- `[+ Tambah Projek]` button → opens create modal
- Project cards list (scrollable):
  - Folder icon (emoji) + project name + entries count
  - Last updated date (time-ago format)
  - Latest entry preview text (2-line clamp)
  - Tap → navigate to `/home/learn/[projectId]`
- Empty state: "Belum ada projek" when no projects exist

**Interactions:**
- Tap `[+ Tambah Projek]` → modal with name input
- Confirm → creates project, navigates to detail
- Tap project card → `router.push('/home/learn/' + project.id)`

### 2. Project Detail (`home/learn/[projectId].tsx`)

**Purpose:** Show project with all its entries, allow adding new entries.

**UI Elements:**
- Header: back arrow + project name + more menu (3-dot icon)
  - More menu options: Rename | Delete
- Entries list (reverse-chronological):
  - Time-ago label + entry text preview (2-line clamp)
  - Up to 3 thumbnail images (+N badge if more)
  - Tap → navigate to `/home/learn/[projectId]/entry?entryId=X`
- `[+ Tambah Entri]` floating button at bottom
- Empty state: "Belum ada entri" when no entries

**Interactions:**
- Tap more menu → show Rename/Delete options
- Rename → modal with text input (prefilled), "Simpan" save button
- Delete → confirmation modal, then remove
- Tap `[+ Tambah Entri]` → `router.push('/home/learn/' + projectId + '/add-entry')`
- Tap entry card → `router.push('/home/learn/' + projectId + '/entry?entryId=' + entry.id)`

### 3. Add Entry (`home/learn/[projectId]/add-entry.tsx`)

**Purpose:** Add new text note and/or images to a project.

**UI Elements:**
- Header: back arrow + "Tambah Entri" title
- Textarea for entry note (multiline, flexible height)
- Image grid: up to 4 images shown, `[+ Tambah Foto]` button to add more
  - Each image shows thumbnail with X remove button
- `[Simpan]` button (disabled when both textarea and images empty)

**Interactions:**
- Tap `[+ Tambah Foto]` → image picker placeholder
- Tap X on image → remove from list
- Tap `[Simpan]` → create entry, navigate back to project detail

### 4. Entry Detail (`home/learn/[projectId]/entry.tsx`)

**Query params:** `entryId` passed via URL query

**Purpose:** Full view of a single entry with edit/delete capabilities.

**UI Elements:**
- Header: back arrow + "Entri" label + edit icon
- Full entry text (no clamping)
- Image grid (2 columns): tap image → fullscreen lightbox overlay, tap again → close
- Edit/Delete options (via edit icon menu)
  - Delete → confirmation modal

**Interactions:**
- Tap edit icon → navigate to add-entry with existing data (edit mode) using query params
- Tap delete → show confirm modal, then remove
- Tap image → lightbox overlay
- Back navigation → return to project detail

---

## Tabung Detail (Moved)

### `home/tabung/[id].tsx`

Existing implementation from `app/(main)/tabung/[id].tsx` moves here.

**No functional changes** — just file relocation.

**Update required:**
- `app/(main)/_layout.tsx` → update route from `tabung/[id]` to `home/tabung/[id]`
- `AccountCards.tsx` → update navigation links to `/home/tabung/` prefix

---

## New Tabung Flow

### 1. Template Selection (`tabung/new/index.tsx`)

**Purpose:** Let user choose from 5 preset tabung types or start from scratch.

**UI Elements:**
- Header: back arrow + "New Tabung"
- 5 preset template cards in 2-column grid:
  - Tabung Raya (🎉) — "Hari Raya, weddings, big celebrations"
  - Emergency Fund (🛡️) — "6 months expenses safety net"
  - Holiday (✈️) — "Travel and vacation fund"
  - New Gadget (📱) — "Electronics, gadgets, equipment"
  - Down Payment (🏠) — "Car, house, or big ticket items"
- `[Start from Scratch]` button (dashed border, full width)
- Each card: icon + name + description + tap to select

**Interactions:**
- Tap template card → `router.push('/tabung/new/form?template=' + templateType)`
- Tap `[Start from Scratch]` → `router.push('/tabung/new/form?template=custom')`

### 2. Tabung Form (`tabung/new/form.tsx`)

**Query params:** `template` passed via URL query

**Purpose:** Create a new tabung with name, target, date, icon, color, auto-save.

**UI Elements:**
- Header: back arrow + "New Tabung"
- Live preview card (shows name, icon, color, progress placeholder)
- Form fields:
  - Name text input
  - Target amount input (RM)
  - Target date picker
  - Weekly save needed display (calculated: remaining weeks)
  - Icon picker (12 icons: piggy, coin, home, gift, car, rocket, palm, building, train, target + 2 more)
  - Color theme picker (8 colors)
  - Auto-save toggle (on/off for monthly auto-save)
- `[Create Tabung]` primary button

**Interactions:**
- Real-time preview updates as user fills form
- Date picker shows week count and weekly needed
- Icon/color selection updates preview immediately
- Auto-save toggle affects form behavior
- Submit → success state → navigate to `/home/tabung/[newId]`

**Success Screen (inline in form):**
- Checkmark animation + "Tabung Created!" message
- Weekly save tip
- `[Back to Home]` button

---

## Navigation Updates

**Updated routes in `_layout.tsx`:**
```typescript
// Remove:
{ name: 'tabung/[id]', href: null }

// Add:
{ name: 'home/tabung/[id]', href: null }
{ name: 'home/learn/index', href: null }
{ name: 'home/learn/[projectId]', href: null }
{ name: 'home/learn/[projectId]/add-entry', href: null }
{ name: 'home/learn/[projectId]/entry', href: null }
{ name: 'tabung/new/index', href: null }
{ name: 'tabung/new/form', href: null }
```

**Updated navigation calls:**
- `Shortcuts.tsx`: case `'learn'` → `router.push('/home/learn')`
- `Shortcuts.tsx`: case `'newTabung'` → `router.push('/tabung/new')`
- `AccountCards.tsx`: tabung cards → `router.push('/home/tabung/' + id)`
- `AccountsScreen.tsx`: tabung cards → `router.push('/home/tabung/' + id)`

---

## Theme Reference

All components follow `docs/Flowe_Theme.md`:
- Background: `#1a1a1a`
- Cards: `#2a2a2a`
- Primary: `#C5FF00`
- Border radius: `rounded-2xl` (16px) for cards, `rounded-xl` (14px) for inputs
- Icons: Lucide React (`lucide-react-native`)
- Button press: `active:scale-[0.98] transition-transform`

---

## Component Inventory

| Screen | File | Key Components |
|---|---|---|
| Projects List | `home/learn/index.tsx` | ScreenHeader, ProjectCard, CreateProjectModal |
| Project Detail | `home/learn/[projectId].tsx` | ScreenHeader, EntryCard, MoreMenu, AddEntryFAB |
| Add Entry | `home/learn/[projectId]/add-entry.tsx` | ScreenHeader, TextArea, ImageGrid |
| Entry Detail | `home/learn/[projectId]/entry.tsx` | ScreenHeader, ImageLightbox, EditDeleteMenu |
| Tabung Detail | `home/tabung/[id].tsx` | (existing, moved) ProgressCircle, StatsGrid, TopUpModal, WithdrawModal |
| Template Select | `tabung/new/index.tsx` | ScreenHeader, TemplateCard, StartScratchButton |
| Tabung Form | `tabung/new/form.tsx` | ScreenHeader, LivePreview, IconPicker, ColorPicker, DatePicker, AutoSaveToggle |

---

## Order of Implementation

1. Move `tabung/[id].tsx` → `home/tabung/[id].tsx` + update _layout.tsx + update nav references
2. Create `home/learn/index.tsx` (projects list)
3. Create `home/learn/[projectId].tsx` (project detail)
4. Create `home/learn/[projectId]/add-entry.tsx`
5. Create `home/learn/[projectId]/entry.tsx`
6. Move `tabung/new.tsx` → `tabung/new/index.tsx` (template selection)
7. Create `tabung/new/form.tsx` (tabung form + success)