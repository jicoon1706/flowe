# Cash Flow Page Visual Polish — Design Spec

**Date:** 2026-05-24
**Goal:** Improve visual refinement of `app/(main)/cashflow/index.tsx` and its 6 child components — cleaner hierarchy, better breathing room, softer but intentional color use. No structural changes, no new features.

---

## 1. Overall Layout & Visual Hierarchy

- Reduce visual monotony — each card should feel distinct from its neighbors
- Section labels (`INCOME STATEMENT`, `BALANCE SHEET`) remain uppercase tracking labels styled as financial statement headers
- Consistent spacing rhythm: `px-4` outer padding on the page

---

## 2. FinancialClassBadge — Hero Card

**File:** `components/cashflow/FinancialClassBadge.tsx`

- Keep outer gradient glow (hero badge, correct to stand out)
- **StatCard inner cards:** Replace plain `bg-black/20` with a colored left-border accent matching the financial class color. Style: `border-l-2` with the class color + `bg-black/20` background
- **Emoji circle:** Add a subtle glow ring using `shadow` with the class color + low opacity (e.g., `shadow-color: config.color, shadow-opacity: 0.3, shadow-radius: 8`)
- **Animated pulse on emoji circle:** Small `Animated.loop` scale pulse (1.0 → 1.05 → 1.0, 2000ms) on the emoji circle to draw attention to the class badge

---

## 3. IncomeStatementCard & BalanceSheetCard — Breathe & Refine

**Files:**
- `components/cashflow/IncomeStatementCard.tsx`
- `components/cashflow/BalanceSheetCard.tsx`

### Income Statement Card
- **Section labels (Income/Expenses):** Replace solid `text-green-400` / `text-red-400` colored text with a small colored `●` dot prefix + the label text in `text-muted-foreground`. Color comes from the dot only. Makes the hierarchy softer and more refined.
- **Line items:** Right-aligned amounts use `text-muted-foreground` (not `text-foreground`). Only the `Total Income` / `Total Expenses` / `Net Cash Flow` rows are bold.
- **Net Cash Flow row:** Keep bold, but increase size to `text-xl` for visual anchor at card bottom

### Balance Sheet Card
- **Active tab:** Replace full `bg-primary text-primary-foreground` with softer `bg-primary/20 text-primary font-semibold` — distinction is clear but less jarring
- **Totals footer:** `Net Worth` row upgraded from `text-xl` to `text-2xl font-bold` as the visual anchor
- **Item rows:** Add colored left border per row: `border-l-2` with lime (`#C5FF00`) for assets, coral (`#ff6b6b`) for liabilities — creates natural color-coding without bold fills

---

## 4. CashFlowDiagram & MonthlyTrendChart

**Files:**
- `components/cashflow/CashFlowDiagram.tsx`
- `components/cashflow/MonthlyTrendChart.tsx`

### CashFlowDiagram
- **Diagram header dot:** Add a `Animated.loop` scale pulse (1.0 → 1.2 → 1.0, 1500ms) to the small colored pulsing dot — suggests "live" data
- **Flow strip:** Ensure emoji and text are centered with consistent spacing — `gap-2` throughout
- All colors use `config.color + 'XX'` alpha consistently (no hardcoded hex+alpha strings)

### MonthlyTrendChart
- **Insight text conditional:** If `netWorthChange >= 0` → show `TrendingUp` icon + green text. If negative → show `TrendingDown` icon + red text + "(negative change)" label. Use `Text` conditionally based on sign.
- **Bar value labels:** Add small `text-xs` labels above the assets bar (tallest per month) showing the RM value in `text-muted-foreground/60` opacity — makes chart self-explanatory without needing to calculate mentally

---

## 5. ManageAssetsLiabilitiesCard

**File:** `components/cashflow/ManageAssetsLiabilitiesCard.tsx`

- **Item rows:** Add `border-l-2` per row — lime for asset rows, coral for liability rows. Background stays `bg-background`. Creates natural color-coding without filled backgrounds.
- **Add button:** Replace dashed border + text with a filled `bg-primary/10` rounded-xl button with `Plus` icon + `text-primary font-semibold` text. More prominent but still subtle.
- **Delete confirmation:** When in delete-confirm state, the Check (confirm) button uses `bg-red-500` with white checkmark icon — clearly a destructive action. The Cancel (X) stays muted.
- **Edit button:** On press, briefly shows `bg-muted` background (native ` Pressable` ` Pressable` handles active state via `bg-muted` class)
- **Row hover/press state:** Add `active:bg-muted/50` or similar to item card `Pressable` for tactile feedback

---

## Implementation Notes

- All animations use React Native's built-in `Animated` API
- No new dependencies
- Colors from theme tokens where possible (`text-primary`, `text-muted-foreground`, etc.) with alpha appended via string concatenation
- `shadow` styles use `StyleSheet.create` or inline `style` object — not Tailwind classes
