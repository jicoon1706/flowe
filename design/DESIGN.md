---
version: alpha
name: flowe
description: Deep-navy fintech UI — midnight-to-cobalt gradient hero panels, frosted-glass chips and bubbles, crisp white sheets with pill controls and big tabular balances.
colors:
  # Source: pixel sampling of the supplied 3-screen mockup (1024x768 PNG, phones ~260px wide => ~1.5x to 390pt device).
  # The #BBBBBB presentation backdrop behind the phones is NOT a brand color and is excluded.
  primary: "#011A4D" # primary because it is the top stop of the hero gradient on all three screens (sampled #011A4D / #01174A / #01184C)
  on-primary: "#FFFFFF" # every label on the navy gradient (Balance, headline, bubble labels) renders white
  primary-container: "#1665B1" # bottom stop of the hero gradient (sampled #1665B1 hero, #216AB0 balance panel, #085399 analytics)
  on-primary-container: "#FFFFFF" # same white labels continue into the lighter end of the gradient
  secondary: "#020202" # secondary because it fills the active bottom-nav pill and the hero's black card (sampled #020202 / #131313)
  on-secondary: "#FFFFFF" # white icon inside the active nav pill
  tertiary: "#1665B1" # tertiary because it is the 2px frame stroke around the analytics screen and the cobalt in the bubble arcs
  on-tertiary: "#FFFFFF"
  surface: "#FFFFFF" # white bottom sheets, Learn More pill, arrow button (sampled #FFFFFF / #FEFEFD)
  on-surface: "#000000" # transaction names, amounts, section titles (darkest sampled pixel #000000)
  surface-container: "#F5F5F5" # expense stat tiles (sampled #F5F5F5 / #F9F9F9)
  surface-container-high: "#EFEFEF" # Deposit / Withdraw pills and the floating nav bar (sampled #EFEFEF / #ECECEC)
  on-surface-variant: "#737373" # tile labels, timestamps, faded decimals, View All (sampled #737373 / #767676)
  glass: "rgba(255, 255, 255, 0.16)" # uncertain — verify on live site; frosted chips/bubbles/icon buttons over navy (sampled blends #325E91, #293A5C, #2C4E81)
  on-primary-muted: "rgba(255, 255, 255, 0.55)" # uncertain — verify on live site; faded ".42" cents and "Balance" label on the navy panel
  outline: "#7B9DBC" # low-confidence — verify on live site; light-blue inner edge of the analytics phone frame, seen once
typography:
  display-lg:
    fontFamily: Inter # uncertain — neo-grotesk with tight tracking; Inter / Inter Display is the closest match
    fontSize: 56px
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: -0.03em
  display-md:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: 500
    lineHeight: 1.15
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.4
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.4
  label-lg:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: 600
    lineHeight: 1.2
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.3
  caption:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: 400
    lineHeight: 1.3
  numeric-lg:
    fontFamily: Inter
    fontSize: 56px
    fontWeight: 500
    lineHeight: 1
    letterSpacing: -0.03em
    fontFeature: '"tnum" 1'
rounded:
  sm: 12px
  md: 20px
  lg: 32px
  xl: 40px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
components:
  balance-panel:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.xl}"
    padding: 24px
  balance-panel-end:
    backgroundColor: "{colors.primary-container}"
    textColor: "{colors.on-primary-container}"
  balance-amount:
    textColor: "{colors.on-primary}"
    typography: "{typography.numeric-lg}"
  balance-cents:
    textColor: "{colors.on-primary-muted}"
    typography: "{typography.numeric-lg}"
  glass-chip:
    backgroundColor: "{colors.glass}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    padding: 8px
  icon-button-glass:
    backgroundColor: "{colors.glass}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.full}"
    size: 44px
  category-bubble:
    backgroundColor: "{colors.glass}"
    textColor: "{colors.on-primary}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
  button-primary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.full}"
    height: 52px
    padding: 24px
  button-icon-circle:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.full}"
    size: 52px
  button-action:
    backgroundColor: "{colors.surface-container-high}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.full}"
    height: 52px
    padding: 16px
  bottom-sheet:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.lg}"
    padding: 16px
  section-title:
    textColor: "{colors.on-surface}"
    typography: "{typography.headline-md}"
  list-item-transaction:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-lg}"
    padding: 8px
  list-item-meta:
    textColor: "{colors.on-surface-variant}"
    typography: "{typography.label-sm}"
  stat-tile:
    backgroundColor: "{colors.surface-container}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
    padding: 16px
  nav-bar:
    backgroundColor: "{colors.surface-container-high}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.full}"
    height: 52px
  nav-item-active:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.on-secondary}"
    rounded: "{rounded.full}"
    size: 52px
  screen-frame-accent:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.on-tertiary}"
    rounded: "{rounded.xl}"
  frame-inner-edge:
    backgroundColor: "{colors.outline}"
    textColor: "{colors.on-surface}"
---

# flowe — DESIGN.md

## Brand & Style

flowe is a personal-finance app: savings, spending and balances. This visual system pitches it as a premium banking product rather than a utility. Two layers do all the work. The top layer is an immersive **midnight-to-cobalt gradient** that holds the hero number: balance, total, or category breakdown. Under it sits a clean **white working sheet** that holds lists, actions and tiles. Between the two, frosted-glass elements (chips, round icon buttons, translucent category bubbles) make the navy feel deep and lit from below. Photography appears only on the marketing/onboarding screen, as a figure cut out against the same blue. The tone is calm, confident and editorial. Copy stays short ("Modern Tools for Modern Finance"), and the numbers are the heroes.

## Colors

- **Primary — `#011A4D` (midnight navy):** top stop of every hero gradient. It is never used as a flat button fill. It is always a field.
- **Primary container — `#1665B1` (cobalt):** bottom stop of the gradient, which runs vertically from navy at the top to cobalt at the bottom. The same value shows up as the thin frame stroke on the analytics screen (tertiary).
- **Secondary — `#020202` (ink):** used sparingly for the active bottom-nav pill and for the physical black card in the hero image. Black is the only "selected" color.
- **Surfaces:** pure white `#FFFFFF` sheets, `#F5F5F5` stat tiles, and `#EFEFEF` pills and the nav bar. There are no tinted greys. Neutrals are true neutrals.
- **Text:** `#000000` on white. Use `#737373` for meta (timestamps, tile labels, *View All*) and for the **cents half of every amount** ($1,842**.56**, $604**.36**).
- **Glass:** white at roughly 16% over navy for chips, icon buttons and bubbles. White at roughly 55% for muted labels and cents on the gradient. Both are *uncertain* because they are inferred from blended pixels.
- **Status colors:** none are present in the mockup. The "+2.46% this month" chip is white-on-glass, and debits ("-$59.99") are plain black. `success` / `error` tokens are intentionally **not** defined. Add them once the real app specifies them.

## Typography

There is one family: a neo-grotesk with tight negative tracking at display sizes. It reads as **Inter / Inter Display** (*uncertain*; it could also be SF Pro or Geist). Weights stay in the 400–600 band, and nothing is bold-black.

| Token | Size | Use |
|---|---|---|
| `display-lg` / `numeric-lg` | 56px, -0.03em | Hero headline, balance amount (tabular figures) |
| `display-md` | 32px | Secondary totals ("$1,842.56") |
| `headline-md` | 20px | Section titles ("Recent Transactions", "Expenses") |
| `body-lg` | 16px | List-item names, "Balance" label |
| `body-md` | 14px | Tile amounts |
| `label-lg` | 15px / 600 | Button labels |
| `label-sm` | 12px | Chips, timestamps, tile labels |
| `caption` | 11px | Bubble category labels |

Sizes are estimated from a ~1.5× scale between mockup pixels and a 390pt device. Treat them as a starting scale, not measured CSS.

**Signature detail:** every currency amount is split into a full-strength integer and a muted decimal part.

## Layout & Spacing

- Spacing follows an 8px rhythm with a 4px half-step: 4 / 8 / 16 / 24 / 32 / 48.
- Screen gutters are about 16px. The hero panel's inner padding is about 24px.
- Each screen splits vertically: the gradient takes about 50–60% of the viewport on dashboard screens and the full screen on marketing screens, and a white sheet overlaps the rest.
- Action rows use **two flexible pills plus one square icon pill** between them (Deposit · ⇅ · Withdraw).
- Stat tiles sit in a 2-up grid with an 8px gap.
- The bottom nav is a **floating pill** inset from the screen edges, not a full-width bar.

## Elevation & Depth

Depth comes from **light and translucency, not shadows**:
- Stacked translucent card silhouettes behind the balance (VISA ••••9286) suggest a wallet of cards.
- Category bubbles are translucent discs with a brighter arc segment that encodes their percentage, like a ring chart drawn on glass.
- The white sheets have no visible drop shadow. Their separation comes from the color jump.
- The only shadows in the image belong to the phone mockups on the presentation backdrop, not to the UI.

## Shapes

The shape language is generous and soft:
- `xl` 40px: hero panels and screen-level containers
- `lg` 32px: bottom sheets
- `sm` 12px: stat tiles
- `full`: every button, chip, icon button, nav bar and bubble

There are no sharp corners anywhere in the UI.

## Components

### Hero & Glass
- **balance-panel:** navy→cobalt vertical gradient, xl radius, white text. It contains the label, the `numeric-lg` amount with muted cents, a glass trend chip, and stacked card silhouettes.
- **glass-chip / icon-button-glass:** about 16% white fill. Icon buttons are 44px circles (notifications, back, calendar). The notification button carries a small green presence dot. That dot is seen once and is not tokenized.
- **category-bubble:** circular glass disc sized by share of spend. It holds a line icon, a caption label and a percentage, plus a highlighted arc for the value.

### Action Elements
- **button-primary:** white pill, 52px, black `label-lg` text ("Learn More"). It is paired with **button-icon-circle**, a 52px white circle with an arrow.
- **button-action:** `#EFEFEF` pill with a leading diagonal-arrow icon (Deposit / Withdraw), plus a square-ish icon-only pill between the two.
- **nav-bar / nav-item-active:** floating `#EFEFEF` pill with 5 line icons. The active item is a black circle with a white icon.

### Lists & Data
- **list-item-transaction:** 40px circular neutral icon/logo well, name (`body-lg`), timestamp (`label-sm`, muted), and a right-aligned amount. The list fades out under the floating nav.
- **stat-tile:** `#F5F5F5`, 12px radius. Muted label with a trailing line icon on top, and an amount with muted cents below.
- **Section header:** `headline-md` title on the left, muted "View All" on the right.

## Do's and Don'ts

**Do**
- Keep the navy→cobalt gradient vertical, with navy at the top.
- Split every amount into a strong integer and muted cents.
- Use pills and circles for every interactive control.
- Use glass (translucent white) for anything that sits on the gradient.
- Reserve black for the single active or selected state.

**Don't**
- Don't put flat navy buttons on white sheets. Navy is a field, not a fill.
- Don't add drop shadows to cards. Separate them with color and translucency.
- Don't introduce accent hues (purple, teal, orange) for categories. The bubbles stay monochrome blue.
- Don't use heavy weights. Stay at or below 600.
- Don't invent red/green status colors without a spec. The mockup shows none.

## Agent Prompt Guide

When generating flowe screens: start with a full-bleed vertical gradient from `#011A4D` to `#1665B1` holding a single hero metric in 56px Inter (medium weight, -0.03em, tabular numerals), with the cents in 55% white. Place frosted-glass (white 16%) pill chips and 44px circular icon buttons on the gradient. Overlap a white sheet with a 32px top radius containing a 20px section title with a grey "View All", transaction rows with circular icon wells, and `#F5F5F5` stat tiles with 12px radius. All buttons are 52px pills (white on blue, `#EFEFEF` on white). Navigation is a floating `#EFEFEF` pill whose active item is a black circle. No shadows, no accent colors.

## Notes on Provenance

This file was extracted from a **static mockup image**, not a live site, so the browser-inspection, motion and catalog drift-check steps of the workflow did not apply:
- No computed styles, CSS variables, OpenType settings or motion were observable. The `## Motion` section and a `motion:` block are omitted rather than invented.
- No getdesign.md catalog entry exists for flowe, so there is no drift to report.
- Colors come from averaged pixel samples. Sizes and radii are scaled estimates (~1.5×).
