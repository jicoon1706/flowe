# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Flowe** is a personal finance tracker mobile app for iOS/Android, built with Expo (React Native). It uses Supabase as backend (PostgreSQL, Auth, Storage, Edge Functions).

## Tech Stack

- **Framework:** Expo SDK 54 (React Native 0.81, React 19)
- **Routing:** expo-router (file-based, app directory)
- **Styling:** NativeWind (Tailwind CSS) + custom CSS
- **Animation:** react-native-reanimated 4 + react-native-worklets
- **Backend:** Supabase (auth, database, storage, Edge Functions)
- **Icons:** lucide-react-native
- **State:** React Context (LearnContext)

## Commands

```bash
npm run start       # Start Expo dev server
npm run lint        # Run ESLint (expo lint)
npm run android     # Build/run Android app
npm run ios         # Build/run iOS app
npm run web         # Start web app
npm run reset-project  # Reset starter code
```

**Important:** Before writing any code, read the exact versioned Expo docs at https://docs.expo.dev/versions/v54.0.0/

## Architecture

### File-based Routing
Routes live in `app/` directory. Root layout at `app/_layout.tsx`. Main app routes are in `app/(main)/` (protected by auth). Public routes like onboarding are at `app/(public)/`.

### Core Directories
- `app/` — Screen routes (expo-router file-based routing)
- `components/` — Shared UI components (ui/, home/)
- `hooks/` — Custom React hooks
- `context/` — React Context providers
- `constants/` — Categories, theme tokens, design constants
- `src/components/ui/` — Additional UI components (PinPad, Toggle)
- `docs/` — API docs, design specs, superpowers plans

### Key Files
- `app.json` — Expo config (slug: "floweakmal", scheme: "floweakmal")
- `tailwind.config.js` — Custom theme extending Tailwind with design tokens
- `constants/theme.ts` — Theme constants
- `constants/categories.ts` — Transaction categories

## Design System

**Dark mode only.** Brand accent: `#C5FF00` (lime-green).

| Token | Hex | Usage |
|---|---|---|
| `--background` | `#1a1a1a` | App background |
| `--card` | `#2a2a2a` | Cards, surfaces |
| `--primary` | `#C5FF00` | CTAs, active states |
| `--primary-foreground` | `#000000` | Text on primary |
| `--destructive` | `#ff4444` | Delete/error |

Chart colors: `#C5FF00` (lime), `#00d4ff` (cyan), `#ff6b6b` (coral), `#ffd93d` (yellow), `#6bcf7f` (green).

**Radius:** `rounded-2xl` (16px) for cards/buttons, `rounded-xl` (14px) for inputs.

## API & Backend

All Supabase calls use Row Level Security (RLS) — queries are automatically scoped to `auth.uid()`.

### Edge Functions
- `cashflow-summary` — Returns net worth, financial class, income statement for a month
- `analysis-monthly` — Returns chart data and category breakdown

Called via:
```typescript
supabase.functions.invoke('cashflow-summary', { body: { month: '2026-05' } })
```

### Storage Buckets (private, RLS-protected)
- `avatars/` — User profile images
- `receipts/` — Transaction receipts
- `learn-images/` — Learn project entry images

## Theme Reference

The `tailwind.config.js` extends Tailwind with custom colors and border radius. The theme file at `constants/theme.ts` mirrors the design tokens from `docs/Flowe_Theme.md`.

When adding new UI components, follow the established patterns:
- Primary CTA: `bg-primary text-primary-foreground rounded-2xl`
- Card: `bg-card border border-border rounded-2xl p-5`
- Input: `bg-background border border-border rounded-xl px-4 py-3 focus:border-primary`