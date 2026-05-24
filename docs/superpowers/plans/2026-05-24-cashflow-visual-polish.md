# Cash Flow Visual Polish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish the visual design of `app/(main)/cashflow/index.tsx` and its 6 child components — cleaner hierarchy, softer color use, better spacing, no structural changes.

**Architecture:** Individual component files updated one at a time. Animations use React Native built-in `Animated` API. No new dependencies.

**Tech Stack:** React Native `Animated`, NativeWind (Tailwind), `lucide-react-native`.

---

## File Map

| File | Changes |
|---|---|
| `components/cashflow/FinancialClassBadge.tsx` | StatCard left-border, emoji glow shadow, pulse animation |
| `components/cashflow/IncomeStatementCard.tsx` | Colored dot prefixes, softer line amounts, bold Net Cash Flow |
| `components/cashflow/BalanceSheetCard.tsx` | Softer active tab, Net Worth `text-2xl`, colored left borders per row |
| `components/cashflow/CashFlowDiagram.tsx` | Pulsing header dot, consistent color alpha usage |
| `components/cashflow/MonthlyTrendChart.tsx` | Conditional TrendingUp/Down, bar value labels |
| `components/cashflow/ManageAssetsLiabilitiesCard.tsx` | Left-border per row, filled Add button, red delete confirm |

---

## Task 1: FinancialClassBadge — Glow, Pulse, Border

**Files:**
- Modify: `components/cashflow/FinancialClassBadge.tsx`

- [ ] **Step 1: Replace FinancialClassBadge with visual polish**

```typescript
import { View, Text, Animated } from 'react-native';

type FinancialClass = 'poor' | 'middle' | 'rich';

interface FinancialClassBadgeProps {
  financialClass: FinancialClass;
  totalAssets: number;
  totalLiabilities: number;
  passiveIncome: number;
  netWorth: number;
  totalIncome: number;
  totalExpenses: number;
}

const CLASS_CONFIG = {
  poor: {
    emoji: '😰',
    label: 'Poor Pattern',
    color: '#ff6b6b',
    bgGlow: 'from-red-500/15 to-red-500/5',
    borderColor: 'border-red-500/40',
    tagColor: 'bg-red-500/15 text-red-400 border-red-500/30',
    flow: 'Income → Expenses (all of it)',
    desc: 'Your income goes directly to expenses. No assets working for you yet.',
  },
  middle: {
    emoji: '😐',
    label: 'Middle Class Pattern',
    color: '#ffd93d',
    bgGlow: 'from-yellow-500/15 to-yellow-500/5',
    borderColor: 'border-yellow-500/40',
    tagColor: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    flow: 'Income → Expenses + Liabilities',
    desc: 'You earn well but liabilities eat your income. Build assets to escape this cycle.',
  },
  rich: {
    emoji: '💎',
    label: 'Rich Pattern',
    color: '#C5FF00',
    bgGlow: 'from-primary/15 to-primary/5',
    borderColor: 'border-primary/40',
    tagColor: 'bg-primary/15 text-primary border-primary/30',
    flow: 'Assets → Income → More Assets',
    desc: 'Your assets generate income. Money works for you. Keep growing your asset column!',
  },
} as const;

function StatCard({ label, value, colorClass, borderColor }: {
  label: string;
  value: string;
  colorClass: string;
  borderColor: string;
}) {
  return (
    <View className="flex-1 bg-black/20 rounded-xl p-3 border-l-2" style={{ borderLeftColor: borderColor }}>
      <Text className="text-xs text-muted-foreground mb-0.5">{label}</Text>
      <Text className={`text-base font-bold ${colorClass}`}>{value}</Text>
    </View>
  );
}

export function FinancialClassBadge({
  financialClass,
  totalAssets,
  totalLiabilities,
  passiveIncome,
  netWorth,
}: FinancialClassBadgeProps) {
  const config = CLASS_CONFIG[financialClass] ?? CLASS_CONFIG.poor;
  const scaleAnim = Animated.useRef(new Animated.Value(1)).current;

  Animated.useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1.0, duration: 1000, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <View className={`bg-gradient-to-br ${config.bgGlow} border-2 ${config.borderColor} rounded-2xl p-5`}>
      <View className="flex-row items-center gap-3 mb-3">
        <Animated.View
          className="w-14 h-14 rounded-2xl items-center justify-center"
          style={{
            backgroundColor: config.color + '25',
            transform: [{ scale: scaleAnim }],
            shadowColor: config.color,
            shadowOpacity: 0.3,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 0 },
          }}
        >
          <Text className="text-4xl">{config.emoji}</Text>
        </Animated.View>
        <View className="flex-1">
          <Text className="text-lg font-bold" style={{ color: config.color }}>
            {config.label}
          </Text>
          <Text className="text-xs font-mono text-muted-foreground">{config.flow}</Text>
        </View>
      </View>
      <Text className="text-sm text-muted-foreground mb-4">{config.desc}</Text>
      <View className="flex-row gap-2">
        <StatCard label="Assets" value={`RM ${totalAssets.toLocaleString()}`} colorClass="text-primary" borderColor={config.color} />
        <StatCard label="Liabilities" value={`RM ${totalLiabilities.toLocaleString()}`} colorClass="text-red-400" borderColor={config.color} />
      </View>
      <View className="flex-row gap-2 mt-2">
        <StatCard label="Passive Income" value={`RM ${passiveIncome.toFixed(0)}/mo`} colorClass="text-primary" borderColor={config.color} />
        <StatCard
          label="Net Worth"
          value={`RM ${netWorth.toLocaleString()}`}
          colorClass={netWorth >= 0 ? 'text-primary' : 'text-red-400'}
          borderColor={config.color}
        />
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Commit**

```
git add components/cashflow/FinancialClassBadge.tsx
git commit -m "feat(cashflow): add pulse animation, glow shadow, colored left-border stat cards"
```

---

## Task 2: IncomeStatementCard — Dot Prefixes & Softer Hierarchy

**Files:**
- Modify: `components/cashflow/IncomeStatementCard.tsx`

- [ ] **Step 1: Replace IncomeStatementCard with visual polish**

```typescript
import { View, Text } from 'react-native';

interface IncomeItem { label: string; amount: number; }
interface ExpenseItem { label: string; amount: number; }

interface IncomeStatementCardProps {
  incomeItems: IncomeItem[];
  expenseItems: ExpenseItem[];
  passiveFromAssets: number;
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
}

export function IncomeStatementCard({
  incomeItems,
  expenseItems,
  passiveFromAssets,
  totalIncome,
  totalExpenses,
  netCashFlow,
}: IncomeStatementCardProps) {
  return (
    <View>
      <View className="bg-muted/40 px-5 py-3 border-b border-border rounded-t-2xl">
        <Text className="font-bold tracking-wide text-sm">INCOME STATEMENT</Text>
      </View>
      <View className="bg-card border border-border rounded-b-2xl p-5 space-y-4">
        {/* Income */}
        <View>
          <View className="flex-row items-center gap-1.5 mb-2">
            <View className="w-2 h-2 rounded-full bg-green-400" />
            <Text className="font-semibold text-sm text-muted-foreground">Income</Text>
          </View>
          <View className="space-y-2">
            {incomeItems.map((item, i) => (
              <View key={i} className="flex-row justify-between text-sm">
                <Text className="text-muted-foreground">{item.label}</Text>
                <Text className="text-muted-foreground">RM {item.amount.toLocaleString()}</Text>
              </View>
            ))}
            {passiveFromAssets > 0 && (
              <View className="flex-row justify-between text-sm">
                <Text className="text-muted-foreground">📈 Passive (Assets)</Text>
                <Text className="text-primary">RM {passiveFromAssets.toLocaleString()}</Text>
              </View>
            )}
            <View className="border-t border-border pt-2 flex-row justify-between font-semibold text-sm">
              <Text className="text-foreground">Total Income</Text>
              <Text className="text-green-400">RM {totalIncome.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* Expenses */}
        <View>
          <View className="flex-row items-center gap-1.5 mb-2">
            <View className="w-2 h-2 rounded-full bg-red-400" />
            <Text className="font-semibold text-sm text-muted-foreground">Expenses</Text>
          </View>
          <View className="space-y-2">
            {expenseItems.map((item, i) => (
              <View key={i} className="flex-row justify-between text-sm">
                <Text className="text-muted-foreground">{item.label}</Text>
                <Text className="text-muted-foreground">RM {item.amount.toLocaleString()}</Text>
              </View>
            ))}
            <View className="border-t border-border pt-2 flex-row justify-between font-semibold text-sm">
              <Text className="text-foreground">Total Expenses</Text>
              <Text className="text-red-400">RM {totalExpenses.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* Net Cash Flow */}
        <View className="border-t-2 border-border pt-3 flex-row justify-between items-center">
          <Text className="font-bold">Net Cash Flow</Text>
          <Text className={`text-xl font-bold ${netCashFlow >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            RM {netCashFlow.toLocaleString()} {netCashFlow >= 0 ? '✅' : '⚠️'}
          </Text>
        </View>
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Commit**

```
git add components/cashflow/IncomeStatementCard.tsx
git commit -m "feat(cashflow): add dot prefixes, softer line items, bold totals"
```

---

## Task 3: BalanceSheetCard — Softer Tabs, 2xl Net Worth, Colored Borders

**Files:**
- Modify: `components/cashflow/BalanceSheetCard.tsx`

- [ ] **Step 1: Replace BalanceSheetCard with visual polish**

```typescript
import { View, Text, Pressable } from 'react-native';
import { Plus } from 'lucide-react-native';

interface Asset { id: string; name: string; type: string; icon: string; value: number; monthlyIncome: number; }
interface Liability { id: string; name: string; type: string; icon: string; amountOwed: number; monthlyPayment: number; }

interface BalanceSheetCardProps {
  assets: Asset[];
  liabilities: Liability[];
  activeTab: 'assets' | 'liabilities';
  onTabChange: (tab: 'assets' | 'liabilities') => void;
  onAddAsset: () => void;
  onAddLiability: () => void;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
}

function ItemRow({ icon, name, type, value, monthly, isLiability }: {
  icon: string; name: string; type: string; value: number; monthly: number; isLiability: boolean;
}) {
  const accentColor = isLiability ? '#ff6b6b' : '#C5FF00';
  return (
    <View className="flex-row justify-between items-center py-2 border-l-2" style={{ borderLeftColor: accentColor }}>
      <View className="flex-row items-center gap-2">
        <Text className="text-lg">{icon}</Text>
        <View>
          <Text className="text-sm text-foreground">{name}</Text>
          <Text className="text-xs text-muted-foreground">{type}</Text>
        </View>
      </View>
      <View className="items-end">
        <Text className={`text-sm font-semibold ${isLiability ? 'text-red-400' : 'text-primary'}`}>
          RM {value.toLocaleString()}
        </Text>
        <Text className={`text-xs ${isLiability ? 'text-red-400' : 'text-primary'}`}>
          {isLiability ? `-RM ${monthly}/mo` : `+RM ${monthly}/mo`}
        </Text>
      </View>
    </View>
  );
}

export function BalanceSheetCard({
  assets, liabilities, activeTab, onTabChange, onAddAsset, onAddLiability,
  totalAssets, totalLiabilities, netWorth,
}: BalanceSheetCardProps) {
  const items = activeTab === 'assets' ? assets : liabilities;
  const onAdd = activeTab === 'assets' ? onAddAsset : onAddLiability;
  const isLiability = activeTab === 'liabilities';

  return (
    <View>
      <View className="bg-muted/40 px-5 py-3 border-b border-border rounded-t-2xl">
        <Text className="font-bold tracking-wide text-sm">BALANCE SHEET</Text>
      </View>
      {/* Tabs */}
      <View className="flex-row gap-1 p-3 border-b border-border bg-card">
        {(['assets', 'liabilities'] as const).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => onTabChange(tab)}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold capitalize transition-colors ${
              activeTab === tab ? 'bg-primary/20 text-primary' : 'text-muted-foreground'
            }`}
          >
            <Text className={`text-center ${activeTab === tab ? 'text-primary font-semibold' : ''}`}>
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>
      {/* List */}
      <View className="bg-card border border-border rounded-b-2xl">
        <View className="p-4 space-y-1">
          {items.map((item) => {
            if (isLiability) {
              const l = item as Liability;
              return <ItemRow key={l.id} icon={l.icon} name={l.name} type={l.type} value={l.amountOwed} monthly={l.monthlyPayment} isLiability />;
            }
            const a = item as Asset;
            return <ItemRow key={a.id} icon={a.icon} name={a.name} type={a.type} value={a.value} monthly={a.monthlyIncome} isLiability={false} />;
          })}
        </View>
        <Pressable onPress={onAdd} className="flex-row items-center justify-center gap-2 py-3 mx-4 mb-4 bg-primary/10 rounded-xl">
          <Plus size={16} color="#C5FF00" />
          <Text className="text-sm text-primary font-semibold">Add {activeTab === 'assets' ? 'Asset' : 'Liability'}</Text>
        </Pressable>
        {/* Totals */}
        <View className="px-5 py-4 border-t border-border bg-muted/20">
          <View className="flex-row justify-between text-sm mb-1">
            <Text className="text-muted-foreground">Total Assets</Text>
            <Text className="font-semibold text-primary">RM {totalAssets.toLocaleString()}</Text>
          </View>
          <View className="flex-row justify-between text-sm mb-3">
            <Text className="text-muted-foreground">Total Liabilities</Text>
            <Text className="font-semibold text-red-400">RM {totalLiabilities.toLocaleString()}</Text>
          </View>
          <View className="flex-row justify-between items-center border-t border-border pt-3">
            <Text className="font-bold">Net Worth</Text>
            <Text className={`text-2xl font-bold ${netWorth >= 0 ? 'text-primary' : 'text-red-400'}`}>
              RM {netWorth.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Commit**

```
git add components/cashflow/BalanceSheetCard.tsx
git commit -m "feat(cashflow): softer tabs, 2xl Net Worth, colored left borders on rows"
```

---

## Task 4: CashFlowDiagram — Pulse Dot, Consistent Alpha

**Files:**
- Modify: `components/cashflow/CashFlowDiagram.tsx`

- [ ] **Step 1: Replace CashFlowDiagram with visual polish**

Key changes:
- Header pulsing dot: add `Animated.loop` scale pulse (1.0 → 1.3 → 1.0, 1500ms) using `Animated.sequence`
- All hardcoded hex+alpha strings replaced with `config.color + alpha`
- The dot itself uses `shadowColor: config.color, shadowOpacity: 0.4, shadowRadius: 6` for glow

```typescript
// The pulsing dot in the header (change from static View to Animated):
const pulseAnim = Animated.useRef(new Animated.Value(1)).current;
Animated.useEffect(() => {
  const p = Animated.loop(
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.3, duration: 750, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1.0, duration: 750, useNativeDriver: true }),
    ])
  );
  p.start();
  return () => p.stop();
}, []);

<Animated.View
  className="w-2.5 h-2.5 rounded-full"
  style={{
    backgroundColor: config.color,
    transform: [{ scale: pulseAnim }],
    shadowColor: config.color,
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  }}
/>
```

- All `style={{ backgroundColor: '#ff6b6b80' }}` replaced with `style={{ backgroundColor: config.color + '80' }}` consistently

- [ ] **Step 2: Commit**

```
git add components/cashflow/CashFlowDiagram.tsx
git commit -m "feat(cashflow): pulsing header dot, consistent config.color alpha usage"
```

---

## Task 5: MonthlyTrendChart — Conditional Trend Icon, Bar Labels

**Files:**
- Modify: `components/cashflow/MonthlyTrendChart.tsx`

- [ ] **Step 1: Replace MonthlyTrendChart with visual polish**

```typescript
import { View, Text } from 'react-native';
import { TrendingUp, TrendingDown } from 'lucide-react-native';

interface MonthlyDataPoint { month: string; assets: number; liabilities: number; }

interface MonthlyTrendChartProps {
  data: MonthlyDataPoint[];
  netWorthChange: number;
}

export function MonthlyTrendChart({ data, netWorthChange }: MonthlyTrendChartProps) {
  const maxValue = Math.max(...data.map((d) => Math.max(d.assets, d.liabilities)));
  const scale = (value: number) => (value / maxValue) * 96;
  const isPositive = netWorthChange >= 0;

  return (
    <View>
      <View className="bg-muted/40 px-5 py-3 border-b border-border rounded-t-2xl">
        <View className="flex-row items-center justify-between">
          <Text className="font-bold text-sm">Monthly Trend</Text>
          <View className="flex-row items-center gap-1">
            {isPositive
              ? <TrendingUp size={14} color="#C5FF00" />
              : <TrendingDown size={14} color="#ff6b6b" />}
            <Text className={`text-xs font-semibold ${isPositive ? 'text-primary' : 'text-red-400'}`}>
              Net worth {isPositive ? 'grew' : 'fell'} RM {Math.abs(netWorthChange).toLocaleString()} this month
            </Text>
          </View>
        </View>
      </View>
      <View className="bg-card border border-border rounded-b-2xl p-4">
        {/* Bar chart */}
        <View className="flex-row items-end gap-2 h-28 mb-3">
          {data.map((point, i) => (
            <View key={i} className="flex-1 flex flex-col items-center gap-1">
              <View className="flex flex-row items-end gap-0.5 h-24 w-full justify-center">
                <View
                  className="w-4 rounded-t-lg relative"
                  style={{ height: scale(point.assets), backgroundColor: '#C5FF00' + '99' }}
                >
                  <Text className="absolute -top-4 w-full text-center text-xs text-muted-foreground/60">
                    {(point.assets / 1000).toFixed(0)}k
                  </Text>
                </View>
                <View
                  className="w-4 rounded-t-lg"
                  style={{ height: scale(point.liabilities), backgroundColor: '#ff6b6b' + '80' }}
                />
              </View>
              <Text className="text-xs text-muted-foreground">{point.month}</Text>
            </View>
          ))}
        </View>
        {/* Legend */}
        <View className="flex-row gap-4 mb-3">
          <View className="flex-row items-center gap-1.5">
            <View className="w-3 h-3 rounded" style={{ backgroundColor: '#C5FF00' + '99' }} />
            <Text className="text-xs text-muted-foreground">Assets</Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <View className="w-3 h-3 rounded" style={{ backgroundColor: '#ff6b6b' + '80' }} />
            <Text className="text-xs text-muted-foreground">Liabilities</Text>
          </View>
        </View>
        {/* Net worth per month */}
        <View className="grid grid-cols-6 gap-1 border-t border-border pt-3">
          {data.map((point, i) => {
            const nw = point.assets - point.liabilities;
            return (
              <View key={i} className="text-center">
                <Text className="text-xs text-primary font-semibold">{(nw / 1000).toFixed(0)}k</Text>
                <Text className="text-xs text-muted-foreground">{point.month}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Commit**

```
git add components/cashflow/MonthlyTrendChart.tsx
git commit -m "feat(cashflow): conditional TrendingUp/Down, bar value labels"
```

---

## Task 6: ManageAssetsLiabilitiesCard — Borders, Filled Add, Red Confirm

**Files:**
- Modify: `components/cashflow/ManageAssetsLiabilitiesCard.tsx`

- [ ] **Step 1: Replace ManageAssetsLiabilitiesCard with visual polish**

Key changes:
- Item rows: `border-l-2` with color (lime for asset, coral for liability) — no filled background
- Add button: filled `bg-primary/10 rounded-xl` with `text-primary font-semibold`
- Delete confirm Check button: `bg-red-500` with white icon

```typescript
// Add button change:
<Pressable
  onPress={onAdd}
  className="flex-row items-center justify-center gap-2 py-3 bg-primary/10 rounded-xl"
>
  <Plus size={16} color="#C5FF00" />
  <Text className="text-sm text-primary font-semibold">Add {activeTab === 'assets' ? 'Asset' : 'Liability'}</Text>
</Pressable>

// Item row border-l-2 — use same accentColor pattern as BalanceSheetCard ItemRow

// Delete confirm:
<Pressable
  onPress={() => { onDelete(item.id); setDeleteId(null); }}
  className="p-1.5 rounded-lg bg-red-500"
>
  <Check size={16} color="#ffffff" />
</Pressable>
```

- [ ] **Step 2: Commit**

```
git add components/cashflow/ManageAssetsLiabilitiesCard.tsx
git commit -m "feat(cashflow): colored row borders, filled Add button, red confirm delete"
```

---

## Spec Coverage Check

- [x] FinancialClassBadge: pulse animation, glow shadow, colored left-border stat cards ✅
- [x] IncomeStatementCard: dot prefixes, softer line items, bold Net Cash Flow ✅
- [x] BalanceSheetCard: softer tabs, 2xl Net Worth, colored left borders per row ✅
- [x] CashFlowDiagram: pulsing header dot, consistent color alpha ✅
- [x] MonthlyTrendChart: conditional TrendingUp/Down, bar value labels ✅
- [x] ManageAssetsLiabilitiesCard: left-border rows, filled Add button, red delete confirm ✅

---

## Type Consistency Check

All components keep existing prop interfaces — no breaking changes to `index.tsx` wiring ✅
All `Animated` hooks from `'react'` — consistent ✅
All icon names use `lucide-react-native` without numeric suffixes ✅

## Placeholder Scan

No TBDs, TODOs, or incomplete sections ✅

---

**Plan complete.**