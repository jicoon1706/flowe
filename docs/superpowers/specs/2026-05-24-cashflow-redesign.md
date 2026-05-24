# Cash Flow Page Redesign — Design Spec

**Date:** 2026-05-24
**Scope:** Redesign `app/(main)/cashflow/index.tsx` + its component tree to match the prototype's richer structure.

---

## 1. Page Structure

Single-screen cash flow dashboard rendered inside `SafeAreaView` + `ScrollView`.

**Layout order (top → bottom):**

1. **Header row** — `ScreenHeader` with title "Cash Flow" + right action Info button (navigates to `/cashflow/info`)
2. **Month navigator** — `← May 2026 →` chevron buttons, state: `monthIndex` (0–5), months array: `['Jan 2026'...'Jun 2026']`
3. **Financial Class Badge** — gradient card with emoji, class name, flow tagline, description, 4-stat grid (Assets / Liabilities / Passive Income / Net Worth)
4. **Income Statement Card** — section label + list of income lines + expense lines + Net Cash Flow row
5. **Balance Sheet Card** — tabbed Assets | Liabilities columns, per-item value + monthly income/payment, add buttons, totals + Net Worth footer
6. **Cash Flow Diagram** — animated pattern visualization (animated dots flowing along layout paths)
7. **Monthly Trend Chart** — paired bar chart (6 months), assets vs liabilities bars + net worth callout
8. **Manage Assets & Liabilities Card** — full tabbed list with edit/delete per row + add button

**All sections:** `px-4 mb-4`, wrapped in `ScrollView` with `showsVerticalScrollIndicator={false}`.

---

## 2. Components

### ScreenHeader
Already exists at `components/ui/ScreenHeader.tsx`. No changes needed.

### FinancialClassBadge
**File:** `components/cashflow/FinancialClassBadge.tsx` (update)

**Appearance:**
- Outer card: `bg-card border border-border rounded-2xl p-5`
- Left: emoji in `w-14 h-14 rounded-2xl` tinted circle (tint color matches class)
- Right: class label (`text-lg font-bold` in class color) + flow tagline (`text-sm font-mono text-muted-foreground`) + description (`text-sm text-muted-foreground mt-1`)
- 4-stat grid below: `grid grid-cols-2 gap-3` with stat cards

**Financial class logic:**
```typescript
const financialClass: 'poor' | 'middle' | 'rich' =
  assets.length === 0 && passiveFromAssets === 0
    ? 'poor'
    : passiveFromAssets >= totalExpenses
    ? 'rich'
    : 'middle';
```

**Class colors:**
| Class | Emoji | Color | Gradient | Border |
|---|---|---|---|---|
| Poor | 😰 | `#ff6b6b` | `from-red-500/15 to-red-500/5` | `border-red-500/40` |
| Middle | 😐 | `#ffd93d` | `from-yellow-500/15 to-yellow-500/5` | `border-yellow-500/40` |
| Rich | 💎 | `#C5FF00` | `from-primary/15 to-primary/5` | `border-primary/40` |

### IncomeStatementCard
**File:** `components/cashflow/IncomeStatementCard.tsx` (update)

**Appearance:**
- Section label: `text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-3`
- Card: `bg-card border border-border rounded-2xl p-5`
- Income section: `text-green-400` label, each line `text-sm`, amount right-aligned
- Passive income line (if > 0): `text-primary` color
- Expenses section: `text-red-400` label
- Divider between income and expenses
- Net Cash Flow row: bold, colored by positive/negative sign (`text-green-400` / `text-red-400`)

**Data shape:**
```typescript
interface IncomeItem { label: string; amount: number; isPassive?: boolean; }
interface ExpenseItem { label: string; amount: number; }
```

### BalanceSheetCard
**File:** `components/cashflow/BalanceSheetCard.tsx` (update)

**Appearance:**
- Tabs: `flex-row bg-card rounded-2xl p-1` — active tab: `bg-primary text-primary-foreground`, inactive: `text-muted-foreground`
- Assets tab content: list items with `text-primary` accent for values
- Liabilities tab content: list items with `text-red-400` accent for values
- Add button: dashed border `border-dashed border-border` row at bottom of each list
- Footer: totals row + Net Worth (`text-xl font-bold`, color by sign)

### CashFlowDiagram
**File:** `components/cashflow/CashFlowDiagram.tsx` (replace)

**Appearance:**
- Outer card: `bg-card border border-border rounded-2xl overflow-hidden`
- Header: `bg-muted/40 px-5 py-3 border-b border-border` with pattern name + color-coded dot
- Info toggle: reveals description text + tip box (same pattern as prototype)
- Animated content area: SVG-style diagram using positioned `View`s + `Animated`

**Animation (using React Native `Animated` API — no external deps):**
- A colored dot (`rounded-full`, 10x10) animates along a path using `Animated.timing` + `useAnimatedStyle`
- For each pattern, the dot traces a loop:
  - **Poor:** Dot moves Job circle → Income box → Expenses box → 💸 emoji. Loop duration: 2000ms, repeats indefinitely
  - **Middle:** Dot moves Job → Income → Liabilities → loops back to Job. Loop duration: 3000ms
  - **Rich:** Two dots — (1) Assets → Income → Expenses → (loop back), (2) Income → reinvest loop back to Assets. Duration: 2500ms each
- Dot uses `position: absolute` + animated `left`/`top` values following a path keyframe sequence

**Diagram layout per pattern:**
- `View` containers for each "station" (Job bubble, Income box, Expenses box, Assets box, Liabilities box) positioned using flex/absolute
- Connecting arrows rendered as `View`s with `border` styles or simple emoji arrows `→`
- Animated dot overlaid absolutely on top

### MonthlyTrendChart
**File:** `components/cashflow/MonthlyTrendChart.tsx` (update)

**Appearance:**
- Section label
- Card: `bg-card border border-border rounded-2xl`
- Header row: title + insight text (`flex-row items-center gap-1 text-primary`)
- Bar chart: `flex-row items-end gap-2 h-28` — each month has 2 bars (assets=`bg-primary/60`, liabilities=`bg-red-500/50`)
- Bar heights: proportional to max value in dataset
- Legend below: `flex-row gap-4` with color dot + label
- Net worth row: `grid grid-cols-6 gap-1` showing net worth per month in `text-primary font-semibold`

### ManageAssetsLiabilitiesCard
**File:** `components/cashflow/ManageAssetsLiabilitiesCard.tsx` (update)

**Appearance:**
- Tabs (same style as BalanceSheetCard)
- List items: `bg-background border border-border rounded-xl p-3` with icon badge, name, type, value, +/- per month
- Edit button: pencil icon | Delete button: trash icon (red on press)
- Delete confirmation: inline `Check`/`X` buttons replacing delete button on press
- Add button: `border-dashed border-border` full-width button
- Totals row at bottom

---

## 3. Data Model

All data is local state in `index.tsx` (mock data — Supabase hookup is separate work).

```typescript
type FinancialClass = 'poor' | 'middle' | 'rich';

interface Asset { id: string; name: string; type: string; icon: string; value: number; monthlyIncome: number; }
interface Liability { id: string; name: string; type: string; icon: string; amountOwed: number; monthlyPayment: number; interestRate: number; }

// Computed:
totalIncome = INCOME_ITEMS.reduce(sum) + passiveFromAssets
passiveFromAssets = assets.reduce(sum of monthlyIncome)
totalExpenses = EXPENSE_ITEMS.reduce(sum)
netCashFlow = allIncome - totalExpenses
totalAssets = assets.reduce(sum of value)
totalLiabilities = liabilities.reduce(sum of amountOwed)
netWorth = totalAssets - totalLiabilities
financialClass = computed from assets.length + passiveFromAssets vs totalExpenses
```

---

## 4. File Changes

| File | Action |
|---|---|
| `components/cashflow/FinancialClassBadge.tsx` | Replace with prototype-aligned version |
| `components/cashflow/IncomeStatementCard.tsx` | Update styling to match prototype |
| `components/cashflow/BalanceSheetCard.tsx` | Update tabs + add buttons |
| `components/cashflow/CashFlowDiagram.tsx` | Replace with animated version using RN `Animated` |
| `components/cashflow/MonthlyTrendChart.tsx` | Update to match prototype bar chart |
| `components/cashflow/ManageAssetsLiabilitiesCard.tsx` | Update with inline edit/delete |
| `app/(main)/cashflow/index.tsx` | Update to use new components + pass real computed data |
| `app/(main)/cashflow/info.tsx` | Keep as-is (out of scope) |

---

## 5. Implementation Notes

- Use `Pressable` for all tappable elements (not `TouchableOpacity`)
- Icons: `@expo/vector-icons` (`lucide-react-native` from `lucide-react-native`)
- No SVG library dependency — diagram uses positioned `View`s
- Animations use React Native's built-in `Animated` API
- All colors from theme: `text-primary`, `text-expense`, `text-income`, `text-muted-foreground`, etc.
- Border radius: `rounded-2xl` for cards, `rounded-xl` for inputs/chips