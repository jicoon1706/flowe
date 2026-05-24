# Cash Flow Screen Redesign — Design Spec

**Date:** 2026-05-24
**Author:** Claude
**Status:** Draft

---

## Overview

Redesign `app/(main)/cashflow/index.tsx` to match the prototype design at `prototype/Mobile app design/images/20_cashflow.png`. The redesign uses a component-based architecture following the existing codebase patterns.

---

## Component Architecture

```
app/(main)/cashflow/index.tsx        ← Main screen (assembles components)
├── components/cashflow/
│   ├── FinancialClassBadge.tsx       ← Emoji + label + description card
│   ├── CashFlowStatsGrid.tsx         ← 2×2 grid: Assets, Liabilities, Passive Income, Net Worth
│   ├── CashFlowDiagram.tsx           ← Visual flow diagram (Assets → Income → Expenses)
│   ├── IncomeStatementCard.tsx      ← Income/expense list with totals
│   ├── BalanceSheetCard.tsx          ← Tabs: Assets | Liabilities with list + add button
│   ├── MonthlyTrendChart.tsx         ← 6-month bar chart
│   └── ManageAssetsLiabilitiesCard.tsx  ← Edit/delete + add per item
```

---

## Theme Tokens

| Token | Value | Usage |
|---|---|---|
| `background` | `#1a1a1a` | App background |
| `card` | `#2a2a2a` | Cards, surfaces |
| `border` | `rgba(255,255,255,0.1)` | Dividers, card borders |
| `primary` | `#C5FF00` | CTAs, active states, accent |
| `primary-foreground` | `#000000` | Text on primary |
| `income` | `#22C55E` | Income, positive values |
| `expense` | `#EF4444` | Expenses, negative values |
| `muted-foreground` | `#a0a0a0` | Placeholder, subtle labels |
| `foreground` | `#ffffff` | Primary text |

**Radius:** `rounded-2xl` (16px) for cards, `rounded-xl` (14px) for inputs.

---

## Screen Layout Order

1. **Month Navigator** — ChevronLeft + "May 2025" + ChevronRight
2. **FinancialClassBadge** — emoji card with pattern label
3. **CashFlowStatsGrid** — 2×2 assets/liabilities/passive income/net worth
4. **CashFlowDiagram** — visual flow (assets → income → expenses)
5. **IncomeStatementCard** — income list + expenses + net cash flow
6. **BalanceSheetCard** — tabs (Assets/Liabilities) + list + add button
7. **MonthlyTrendChart** — 6-month bar chart with insight
8. **ManageAssetsLiabilitiesCard** — edit/delete + add (tabbed)

---

## Component Specifications

### 1. FinancialClassBadge

**File:** `components/cashflow/FinancialClassBadge.tsx`

```tsx
// Props
interface FinancialClassBadgeProps {
  emoji: string;
  label: string;
  description: string;
  pattern: 'poor' | 'middle' | 'rich';
}

// Layout
View: bg-card border border-border rounded-2xl p-4 flex-row items-center gap-4
Emoji Badge: w-14 h-14 rounded-2xl bg-primary/10 items-center justify-center
Label: text-base font-semibold text-primary mb-1
Description: text-sm text-muted-foreground
```

### 2. CashFlowStatsGrid

**File:** `components/cashflow/CashFlowStatsGrid.tsx`

```tsx
// Props
interface CashFlowStats {
  assets: number;
  liabilities: number;
  passiveIncome: number;
  netWorth: number;
}

interface CashFlowStatsGridProps {
  stats: CashFlowStats;
}

// Layout
Container: grid grid-cols-2 gap-3
Card: bg-card border border-border rounded-2xl p-4
Label: text-xs text-muted-foreground mb-1
Value: text-lg font-bold [color]
- Assets: text-income (#22C55E)
- Liabilities: text-expense (#EF4444)
- Passive Income: text-primary (#C5FF00)
- Net Worth: text-foreground (#ffffff)
```

### 3. CashFlowDiagram

**File:** `components/cashflow/CashFlowDiagram.tsx`

```tsx
// Props
interface CashFlowDiagramProps {
  pattern: 'poor' | 'middle' | 'rich';
  income: number;
  expenses: number;
}

// Layout
Card: bg-card border border-border rounded-2xl p-6 items-center
Flow row: flex-row items-center justify-center gap-4
Node: w-16 h-16 rounded-2xl [color]/20 items-center justify-center mb-1
- Assets node: bg-income/20, TrendingUp icon, income green
- Income node: bg-primary/20, money emoji, primary lime
- Expenses node: bg-expense/20, TrendingDown icon, expense red
Arrow: w-8 h-0.5 bg-[color], Text "→" between nodes
Node label: text-xs text-foreground
Description: text-xs text-muted-foreground text-center px-4 mt-4
```

### 4. IncomeStatementCard

**File:** `components/cashflow/IncomeStatementCard.tsx`

```tsx
// Props
interface IncomeStatementItem {
  label: string;
  amount: string;
  isBold?: boolean;
  isHighlight?: boolean;
  isExpense?: boolean;
  isPositive?: boolean;
}

interface IncomeStatementCardProps {
  title?: string;
  items: IncomeStatementItem[];
}

// Layout
Container: bg-card border border-border rounded-2xl
Section label: text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-3 px-4
Row: flex-row justify-between py-2 px-4
Row dividers: border-b border-border (except last item)
Label styling:
- Default: text-sm text-foreground
- Bold: text-sm font-semibold text-foreground
- Highlight: text-sm text-primary
- Expense: text-sm text-expense
Value styling:
- Default: text-sm font-medium text-foreground
- Bold: text-sm font-semibold
- Positive: text-sm font-medium text-income
- Expense: text-sm font-medium text-expense
```

### 5. BalanceSheetCard

**File:** `components/cashflow/BalanceSheetCard.tsx`

```tsx
// Props
interface Asset {
  id: string;
  name: string;
  value: number;
  monthly: number;
}

interface Liability {
  id: string;
  name: string;
  value: number;
  monthly: number;
  rate?: string;
}

interface BalanceSheetCardProps {
  assets: Asset[];
  liabilities: Liability[];
  activeTab: 'assets' | 'liabilities';
  onTabChange: (tab: 'assets' | 'liabilities') => void;
  onAddAsset: () => void;
  onAddLiability: () => void;
}

// Layout
Tab container: flex-row bg-card rounded-2xl p-1 mb-3
Tab: flex-1 py-2 rounded-xl
- Active: bg-primary, text-primary-foreground
- Inactive: transparent, text-muted-foreground
Row: flex-row justify-between items-center py-3
Item left: name (text-sm font-medium) + monthly (text-xs text-income or text-expense)
Item right: text-sm font-semibold text-foreground
Add button: flex-row items-center justify-center gap-2 py-3 mt-2 border-t border-dashed border-border
Add text: text-sm text-primary font-medium
```

### 6. MonthlyTrendChart

**File:** `components/cashflow/MonthlyTrendChart.tsx`

```tsx
// Props
interface MonthlyDataPoint {
  month: string;
  assets: number;
  liabilities: number;
}

interface MonthlyTrendChartProps {
  data: MonthlyDataPoint[];
  netWorthChange: number;
}

// Layout
Container: bg-card border border-border rounded-2xl items-center py-8
Section label: text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-3 px-4
Insight: text-sm text-muted-foreground "Net worth grew RM X this month"
Bar container: flex-row items-end gap-2 mt-4 h-24
Bar pair per month: flex-row items-end gap-0.5
- Asset bar: w-4 bg-income rounded-t, height proportional
- Liability bar: w-4 bg-expense rounded-t, height proportional
Month label: text-xs text-muted-foreground
```

### 7. ManageAssetsLiabilitiesCard

**File:** `components/cashflow/ManageAssetsLiabilitiesCard.tsx`

```tsx
// Props
interface ManageAssetsLiabilitiesCardProps {
  assets: Asset[];
  liabilities: Liability[];
  activeTab: 'assets' | 'liabilities';
  onTabChange: (tab: 'assets' | 'liabilities') => void;
  onEdit: (item: Asset | Liability) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

// Layout - Same tab structure as BalanceSheetCard
Row: flex-row justify-between items-center py-3 border-b border-border
Left: name (text-sm) + monthly (text-xs)
Right: value (text-sm font-semibold) + edit icon button (Pressable)
Delete: Pressable with Trash2 icon, destructive color
```

---

## Navigation Header

```tsx
// In app/(main)/cashflow/index.tsx
<ScreenHeader
  title="Cash Flow"
  rightAction={
    <Pressable onPress={() => router.push('/cashflow/info')} className="p-2">
      <Info size={22} color="#ffffff" />
    </Pressable>
  }
/>
```

---

## Data Types

```typescript
type FinancialClass = 'poor' | 'middle' | 'rich';

interface CashFlowScreenData {
  month: string;
  prevMonth: string;
  nextMonth: string;
  financialClass: {
    emoji: string;
    label: string;
    description: string;
    pattern: FinancialClass;
  };
  stats: {
    assets: number;
    liabilities: number;
    passiveIncome: number;
    netWorth: number;
  };
  incomeStatement: IncomeStatementItem[];
  assets: Asset[];
  liabilities: Liability[];
  monthlyTrend: MonthlyDataPoint[];
}
```

---

## Implementation Notes

1. Use `@expo/vector-icons` (Lucide) for icons
2. All components use only: View, Text, Pressable, ScrollView
3. Follow NativeWind Tailwind class patterns from Flowe_Theme.md
4. Connect to Supabase Edge Functions (`cashflow-summary`, `analysis-monthly`) for real data
5. Month navigation updates the data via Edge Function calls

---

## Files to Create/Modify

**Create:**
- `components/cashflow/FinancialClassBadge.tsx`
- `components/cashflow/CashFlowStatsGrid.tsx`
- `components/cashflow/CashFlowDiagram.tsx`
- `components/cashflow/IncomeStatementCard.tsx`
- `components/cashflow/BalanceSheetCard.tsx`
- `components/cashflow/MonthlyTrendChart.tsx`
- `components/cashflow/ManageAssetsLiabilitiesCard.tsx`

**Modify:**
- `app/(main)/cashflow/index.tsx` — Refactor to use new components with mock data
- `app/(main)/cashflow/info.tsx` — Cash Flow Guide screen (already exists)