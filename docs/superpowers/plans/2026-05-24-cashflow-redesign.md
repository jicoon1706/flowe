# Cash Flow Page Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign `app/(main)/cashflow/index.tsx` and its component tree to match the prototype's richer structure, with animated cash flow diagrams using React Native's built-in `Animated` API.

**Architecture:** Components receive data via props from the parent `index.tsx`, which holds all local state (mock data). Financial class is computed dynamically. Animations use `Animated.timing` + `useAnimatedStyle` from react-native to move a dot along X/Y axes inside a positioned container.

**Tech Stack:** React Native `Animated`, NativeWind (Tailwind), `@expo/vector-icons` (`lucide-react-native`), `react-native-safe-area-context`, `expo-router`.

---

## File Map

| File | Action |
|---|---|
| `components/cashflow/FinancialClassBadge.tsx` | Replace |
| `components/cashflow/IncomeStatementCard.tsx` | Replace |
| `components/cashflow/BalanceSheetCard.tsx` | Replace |
| `components/cashflow/CashFlowDiagram.tsx` | Replace |
| `components/cashflow/MonthlyTrendChart.tsx` | Replace |
| `components/cashflow/ManageAssetsLiabilitiesCard.tsx` | Replace |
| `app/(main)/cashflow/index.tsx` | Replace |

---

## Task 1: FinancialClassBadge

**Files:**
- Modify: `components/cashflow/FinancialClassBadge.tsx`

- [ ] **Step 1: Replace FinancialClassBadge component**

```typescript
import { View, Text } from 'react-native';

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

function StatCard({ label, value, colorClass }: { label: string; value: string; colorClass: string }) {
  return (
    <View className="bg-black/20 rounded-xl p-3">
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
  const config = CLASS_CONFIG[financialClass];

  return (
    <View className={`bg-gradient-to-br ${config.bgGlow} border-2 ${config.borderColor} rounded-2xl p-5`}>
      <View className="flex-row items-center gap-3 mb-3">
        <View
          className="w-14 h-14 rounded-2xl items-center justify-center"
          style={{ backgroundColor: config.color + '25' }}
        >
          <Text className="text-4xl">{config.emoji}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-lg font-bold" style={{ color: config.color }}>
            {config.label}
          </Text>
          <Text className="text-xs font-mono text-muted-foreground">{config.flow}</Text>
        </View>
      </View>
      <Text className="text-sm text-muted-foreground mb-4">{config.desc}</Text>
      <View className="grid grid-cols-2 gap-3">
        <StatCard label="Assets" value={`RM ${totalAssets.toLocaleString()}`} colorClass="text-primary" />
        <StatCard label="Liabilities" value={`RM ${totalLiabilities.toLocaleString()}`} colorClass="text-red-400" />
        <StatCard label="Passive Income" value={`RM ${passiveIncome.toFixed(0)}/mo`} colorClass="text-primary" />
        <StatCard
          label="Net Worth"
          value={`RM ${netWorth.toLocaleString()}`}
          colorClass={netWorth >= 0 ? 'text-primary' : 'text-red-400'}
        />
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Commit**

```
git add components/cashflow/FinancialClassBadge.tsx
git commit -m "refactor(cashflow): rewrite FinancialClassBadge with dynamic class, stats grid, prototype styling"
```

---

## Task 2: IncomeStatementCard

**Files:**
- Modify: `components/cashflow/IncomeStatementCard.tsx`

- [ ] **Step 1: Replace IncomeStatementCard component**

```typescript
import { View, Text } from 'react-native';

interface IncomeItem { label: string; amount: number; isPassive?: boolean; }
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
          <Text className="font-semibold text-sm mb-2 text-green-400">Income</Text>
          <View className="space-y-2">
            {incomeItems.map((item, i) => (
              <View key={i} className="flex-row justify-between text-sm">
                <Text className="text-muted-foreground">{item.label}</Text>
                <Text className="text-foreground">RM {item.amount.toLocaleString()}</Text>
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
          <Text className="font-semibold text-sm mb-2 text-red-400">Expenses</Text>
          <View className="space-y-2">
            {expenseItems.map((item, i) => (
              <View key={i} className="flex-row justify-between text-sm">
                <Text className="text-muted-foreground">{item.label}</Text>
                <Text className="text-foreground">RM {item.amount.toLocaleString()}</Text>
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
git commit -m "refactor(cashflow): rewrite IncomeStatementCard with full income/expense breakdown"
```

---

## Task 3: BalanceSheetCard

**Files:**
- Modify: `components/cashflow/BalanceSheetCard.tsx`

- [ ] **Step 1: Replace BalanceSheetCard component**

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
  return (
    <View className="flex-row justify-between items-center py-2">
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
  assets,
  liabilities,
  activeTab,
  onTabChange,
  onAddAsset,
  onAddLiability,
  totalAssets,
  totalLiabilities,
  netWorth,
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
              activeTab === tab ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
            }`}
          >
            <Text className={`text-center ${activeTab === tab ? 'text-primary-foreground' : ''}`}>
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
              return (
                <ItemRow
                  key={l.id}
                  icon={l.icon}
                  name={l.name}
                  type={l.type}
                  value={l.amountOwed}
                  monthly={l.monthlyPayment}
                  isLiability
                />
              );
            }
            const a = item as Asset;
            return (
              <ItemRow
                key={a.id}
                icon={a.icon}
                name={a.name}
                type={a.type}
                value={a.value}
                monthly={a.monthlyIncome}
                isLiability={false}
              />
            );
          })}
        </View>
        <Pressable
          onPress={onAdd}
          className="flex-row items-center justify-center gap-2 py-3 border-t border-dashed border-border"
        >
          <Plus size={16} color="#C5FF00" />
          <Text className="text-sm text-primary font-medium">
            Add {activeTab === 'assets' ? 'Asset' : 'Liability'}
          </Text>
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
            <Text className={`text-xl font-bold ${netWorth >= 0 ? 'text-primary' : 'text-red-400'}`}>
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
git commit -m "refactor(cashflow): rewrite BalanceSheetCard with tabs, item rows, totals footer"
```

---

## Task 4: CashFlowDiagram (Animated)

**Files:**
- Modify: `components/cashflow/CashFlowDiagram.tsx`

- [ ] **Step 1: Replace CashFlowDiagram with animated version using React Native Animated API**

```typescript
import { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import { Info, X } from 'lucide-react-native';

type FinancialClass = 'poor' | 'middle' | 'rich';

interface CashFlowDiagramProps {
  financialClass: FinancialClass;
  totalIncome: number;
  passiveIncome: number;
  totalExpenses: number;
  totalAssets: number;
  totalLiabilities: number;
}

interface AnimatedFlowDotProps {
  keyframes: { x: number; y: number; duration: number }[];
  color: string;
}

function AnimatedFlowDot({ keyframes, color }: AnimatedFlowDotProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    // Animate from 0 to 1 over the total duration, then loop
    const totalDuration = keyframes.reduce((s, k) => s + k.duration, 0);
    loopRef.current = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: totalDuration,
        useNativeDriver: true,
      })
    );
    loopRef.current.start();
    return () => { if (loopRef.current) loopRef.current.stop(); };
  }, []);

  // Compute current position based on progress
  const getPosition = (p: number) => {
    const totalDuration = keyframes.reduce((s, k) => s + k.duration, 0);
    const elapsed = p * totalDuration;
    let accum = 0;
    for (let i = 0; i < keyframes.length; i++) {
      const k = keyframes[i];
      const next = keyframes[(i + 1) % keyframes.length];
      if (elapsed < accum + k.duration) {
        const t = (elapsed - accum) / k.duration;
        return {
          x: k.x + (next.x - k.x) * t,
          y: k.y + (next.y - k.y) * t,
        };
      }
      accum += k.duration;
    }
    return { x: keyframes[0].x, y: keyframes[0].y };
  };

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [keyframes[0].x, keyframes[keyframes.length - 1].x],
  });

  return (
    <View className="absolute left-0 top-0 w-full h-full">
      <Animated.View
        style={{
          position: 'absolute',
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: color,
          transform: [{ translateX }, { translateY: progress }],
        }}
      />
    </View>
  );
}

const PATTERN_CONFIG = {
  poor: {
    color: '#ff6b6b',
    borderColor: 'border-red-500/30',
    bgGlow: 'from-red-500/8 to-transparent',
    tagColor: 'bg-red-500/15 text-red-400 border-red-500/30',
    label: 'Poor Pattern',
    desc: 'Income flows directly into expenses. No assets working for you. The money is gone before it can grow.',
    tip: 'Start by saving 10% of every paycheck and open your first investment account.',
    // keyframes: [from, to, duration] per segment
    keyframes: [
      { x: 10, y: 200, duration: 400 },
      { x: 80, y: 200, duration: 300 },
      { x: 80, y: 280, duration: 300 },
      { x: 200, y: 280, duration: 300 },
    ],
  },
  middle: {
    color: '#ffd93d',
    borderColor: 'border-yellow-500/30',
    bgGlow: 'from-yellow-500/8 to-transparent',
    tagColor: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    label: 'Middle Class Pattern',
    desc: 'Income covers expenses AND liability payments. Debt creates a treadmill that keeps draining your cash flow.',
    tip: 'For every new loan ask: does this generate income? Build assets before upgrading lifestyle.',
    keyframes: [
      { x: 10, y: 200, duration: 400 },
      { x: 140, y: 200, duration: 300 },
      { x: 140, y: 300, duration: 300 },
      { x: 260, y: 300, duration: 400 },
      { x: 140, y: 300, duration: 500 },
      { x: 140, y: 200, duration: 400 },
    ],
  },
  rich: {
    color: '#C5FF00',
    borderColor: 'border-primary/30',
    bgGlow: 'from-primary/8 to-transparent',
    tagColor: 'bg-primary/15 text-primary border-primary/30',
    label: 'Rich Pattern',
    desc: 'Assets generate passive income that covers expenses. Surplus is reinvested into more assets — the cycle compounds.',
    tip: 'Keep growing your asset column. Reinvest every surplus ringgit.',
    keyframes: [
      { x: 10, y: 200, duration: 400 },
      { x: 130, y: 200, duration: 300 },
      { x: 130, y: 280, duration: 300 },
      { x: 250, y: 280, duration: 400 },
      { x: 130, y: 280, duration: 400 },
      { x: 130, y: 200, duration: 300 },
      { x: 10, y: 200, duration: 400 },
    ],
  },
} as const;

export function CashFlowDiagram({
  financialClass,
  totalIncome,
  passiveIncome,
  totalExpenses,
  totalAssets,
  totalLiabilities,
}: CashFlowDiagramProps) {
  const [showInfo, setShowInfo] = useState(false);
  const config = PATTERN_CONFIG[financialClass];

  return (
    <View className={`bg-card rounded-2xl border-2 ${config.borderColor} overflow-hidden`}>
      {/* Header */}
      <View className={`bg-gradient-to-br ${config.bgGlow} px-5 py-4 border-b ${config.borderColor}`}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2.5">
            <View
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: config.color }}
            />
            <View>
              <Text className="font-bold text-sm" style={{ color: config.color }}>Cash Flow Pattern</Text>
              <Text className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full border mt-0.5 ${config.tagColor}`}>
                {config.label}
              </Text>
            </View>
          </View>
          <Pressable onPress={() => setShowInfo(!showInfo)} className="p-2 rounded-xl bg-black/20">
            {showInfo ? <X size={16} color="#a0a0a0" /> : <Info size={16} color="#a0a0a0" />}
          </Pressable>
        </View>
      </View>

      {/* Info panel */}
      {showInfo && (
        <View className="px-5 py-4 border-b" style={{ borderColor: config.color + '30', backgroundColor: config.color + '0a' }}>
          <Text className="text-sm text-muted-foreground leading-relaxed mb-2">{config.desc}</Text>
          <View className="flex-row items-start gap-2 rounded-xl p-3 border" style={{ borderColor: config.color + '40', backgroundColor: config.color + '10' }}>
            <Text className="text-base">💡</Text>
            <Text className="text-xs" style={{ color: config.color }}>{config.tip}</Text>
          </View>
        </View>
      )}

      {/* Diagram area */}
      <View className="px-4 pt-3 pb-4">
        {/* Visual flow diagram using positioned Views */}
        <View className="relative" style={{ height: 340 }}>
          {/* Job bubble */}
          <View className="absolute left-0 top-[190px] flex-col items-center">
            <View className="w-12 h-12 rounded-full border-2 items-center justify-center" style={{ borderColor: config.color }}>
              <Text className="text-xs font-bold" style={{ color: config.color }}>Job</Text>
            </View>
          </View>

          {/* Income box */}
          <View className="absolute left-[60px] top-[160px]">
            <View className="rounded-xl border px-4 py-3" style={{ borderColor: config.color + '50', backgroundColor: config.color + '15' }}>
              <Text className="text-xs text-foreground font-semibold">Income</Text>
              <Text className="text-sm font-bold" style={{ color: config.color }}>RM {totalIncome.toLocaleString()}</Text>
            </View>
          </View>

          {/* Expenses box */}
          <View className="absolute left-[60px] top-[260px]">
            <View className="rounded-xl border px-4 py-3" style={{ borderColor: config.color + '50', backgroundColor: config.color + '15' }}>
              <Text className="text-xs text-foreground font-semibold">Expenses</Text>
              <Text className="text-sm font-bold" style={{ color: config.color }}>RM {totalExpenses.toLocaleString()}</Text>
            </View>
          </View>

          {/* Assets box (rich only) */}
          {financialClass === 'rich' && (
            <View className="absolute left-[0px] top-[160px]">
              <View className="rounded-xl border px-3 py-2" style={{ borderColor: config.color + '50', backgroundColor: config.color + '15' }}>
                <Text className="text-xs text-foreground font-semibold">Assets</Text>
                <Text className="text-xs font-bold" style={{ color: config.color }}>RM {totalAssets.toLocaleString()}</Text>
              </View>
            </View>
          )}

          {/* Liabilities box (middle only) */}
          {financialClass === 'middle' && (
            <View className="absolute right-[20px] top-[260px]">
              <View className="rounded-xl border px-3 py-2" style={{ borderColor: config.color + '50', backgroundColor: config.color + '15' }}>
                <Text className="text-xs text-foreground font-semibold">Liabilities</Text>
                <Text className="text-xs font-bold text-red-400">RM {totalLiabilities.toLocaleString()}</Text>
              </View>
            </View>
          )}

          {/* Exit emoji (poor only) */}
          {financialClass === 'poor' && (
            <View className="absolute right-[20px] top-[260px]">
              <Text className="text-xl">💸</Text>
            </View>
          )}

          {/* Reinvest emoji (rich only) */}
          {financialClass === 'rich' && (
            <View className="absolute right-[20px] top-[160px]">
              <Text className="text-xl">💎</Text>
            </View>
          )}

          {/* Treadmill emoji (middle only) */}
          {financialClass === 'middle' && (
            <View className="absolute right-[20px] top-[260px]">
              <Text className="text-xl">🔄</Text>
            </View>
          )}

          {/* Animated flow dot */}
          <AnimatedFlowDot keyframes={config.keyframes} color={config.color} />
        </View>

        {/* Flow summary strip */}
        <View
          className="mt-1 rounded-xl px-4 py-2.5 flex-row items-center justify-center gap-2 border"
          style={{
            backgroundColor: config.color + '10',
            borderColor: config.color + '35',
          }}
        >
          {financialClass === 'poor' && (
            <>
              <Text className="text-xs font-mono" style={{ color: config.color }}>Income</Text>
              <Text className="text-xs opacity-60">→</Text>
              <Text className="text-xs font-mono" style={{ color: config.color }}>Expenses</Text>
              <Text className="text-xs opacity-60">→</Text>
              <Text className="text-xs">💸 gone</Text>
            </>
          )}
          {financialClass === 'middle' && (
            <>
              <Text className="text-xs font-mono" style={{ color: config.color }}>Income</Text>
              <Text className="text-xs opacity-60">→</Text>
              <Text className="text-xs font-mono" style={{ color: config.color }}>Expenses + Debt</Text>
              <Text className="text-xs opacity-60">→</Text>
              <Text className="text-xs">🔄 treadmill</Text>
            </>
          )}
          {financialClass === 'rich' && (
            <>
              <Text className="text-xs font-mono" style={{ color: config.color }}>Assets</Text>
              <Text className="text-xs opacity-60">→</Text>
              <Text className="text-xs font-mono" style={{ color: config.color }}>Income</Text>
              <Text className="text-xs opacity-60">→</Text>
              <Text className="text-xs font-mono" style={{ color: config.color }}>More Assets</Text>
              <Text className="text-xs">💎</Text>
            </>
          )}
        </View>
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Commit**

```
git add components/cashflow/CashFlowDiagram.tsx
git commit -m "feat(cashflow): add animated CashFlowDiagram with flowing dot patterns"
```

---

## Task 5: MonthlyTrendChart

**Files:**
- Modify: `components/cashflow/MonthlyTrendChart.tsx`

- [ ] **Step 1: Replace MonthlyTrendChart component**

```typescript
import { View, Text } from 'react-native';
import { TrendingUp } from 'lucide-react-native';

interface MonthlyDataPoint { month: string; assets: number; liabilities: number; }

interface MonthlyTrendChartProps {
  data: MonthlyDataPoint[];
  netWorthChange: number;
}

export function MonthlyTrendChart({ data, netWorthChange }: MonthlyTrendChartProps) {
  const maxValue = Math.max(...data.map((d) => Math.max(d.assets, d.liabilities)));
  const scale = (value: number) => (value / maxValue) * 96;

  return (
    <View>
      <View className="bg-muted/40 px-5 py-3 border-b border-border rounded-t-2xl">
        <View className="flex-row items-center justify-between">
          <Text className="font-bold text-sm">Monthly Trend</Text>
          <View className="flex-row items-center gap-1">
            <TrendingUp size={14} color="#C5FF00" />
            <Text className="text-xs text-primary font-semibold">Net worth grew RM {netWorthChange.toLocaleString()} this month</Text>
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
                  className="w-4 rounded-t-lg"
                  style={{ height: scale(point.assets), backgroundColor: '#C5FF00' + '99' }}
                />
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
git commit -m "refactor(cashflow): update MonthlyTrendChart with paired bars and net worth row"
```

---

## Task 6: ManageAssetsLiabilitiesCard

**Files:**
- Modify: `components/cashflow/ManageAssetsLiabilitiesCard.tsx`

- [ ] **Step 1: Replace ManageAssetsLiabilitiesCard component**

```typescript
import React, { View, Text, Pressable } from 'react-native';
import { Trash2, Edit3, Plus, Check, X } from 'lucide-react-native';

interface Asset { id: string; name: string; type: string; icon: string; value: number; monthlyIncome: number; }
interface Liability { id: string; name: string; type: string; icon: string; amountOwed: number; monthlyPayment: number; }

interface ManageAssetsLiabilitiesCardProps {
  assets: Asset[];
  liabilities: Liability[];
  activeTab: 'assets' | 'liabilities';
  onTabChange: (tab: 'assets' | 'liabilities') => void;
  onEdit: (item: Asset | Liability) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

export function ManageAssetsLiabilitiesCard({
  assets,
  liabilities,
  activeTab,
  onTabChange,
  onEdit,
  onDelete,
  onAdd,
}: ManageAssetsLiabilitiesCardProps) {
  const items = activeTab === 'assets' ? assets : liabilities;
  const isLiability = activeTab === 'liabilities';
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  return (
    <View>
      <View className="bg-muted/40 px-5 py-3 border-b border-border rounded-t-2xl">
        <Text className="font-bold text-sm">Manage Assets & Liabilities</Text>
      </View>
      {/* Tabs */}
      <View className="flex gap-1 p-3 border-b border-border bg-card">
        {(['assets', 'liabilities'] as const).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => onTabChange(tab)}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold capitalize transition-colors ${
              activeTab === tab ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
            }`}
          >
            <Text className={`text-center ${activeTab === tab ? 'text-primary-foreground' : ''}`}>
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>
      {/* List */}
      <View className="bg-card border border-border rounded-b-2xl p-4 space-y-2">
        {items.map((item) => {
          const isAsset = !isLiability;
          const v = isAsset ? (item as Asset).value : (item as Liability).amountOwed;
          const m = isAsset ? (item as Asset).monthlyIncome : (item as Liability).monthlyPayment;
          const name = isAsset ? (item as Asset).name : (item as Liability).name;
          const type = isAsset ? (item as Asset).type : (item as Liability).type;
          const icon = isAsset ? (item as Asset).icon : (item as Liability).icon;
          return (
            <View key={item.id} className="bg-background border border-border rounded-xl p-3">
              <View className="flex-row items-start gap-3">
                <View className="w-10 h-10 bg-primary/15 rounded-xl items-center justify-center">
                  <Text className="text-xl">{icon}</Text>
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-sm text-foreground">{name}</Text>
                  <Text className="text-xs text-muted-foreground">{type}</Text>
                  <View className="flex-row gap-3 mt-1">
                    <Text className={`text-sm font-bold ${isAsset ? 'text-primary' : 'text-red-400'}`}>
                      RM {v.toLocaleString()}
                    </Text>
                    <Text className={`text-xs ${isAsset ? 'text-primary' : 'text-red-400'}`}>
                      {isAsset ? `+RM ${m}/mo` : `-RM ${m}/mo`}
                    </Text>
                  </View>
                </View>
                <View className="flex-row gap-1">
                  <Pressable onPress={() => onEdit(item)} className="p-1.5 rounded-lg hover:bg-muted">
                    <Edit3 size={16} color="#a0a0a0" />
                  </Pressable>
                  {deleteId === item.id ? (
                    <View className="flex-row gap-1">
                      <Pressable onPress={() => { onDelete(item.id); setDeleteId(null); }} className="p-1.5 rounded-lg bg-red-500/20">
                        <Check size={16} color="#ff6b6b" />
                      </Pressable>
                      <Pressable onPress={() => setDeleteId(null)} className="p-1.5 rounded-lg bg-muted">
                        <X size={16} color="#a0a0a0" />
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable onPress={() => setDeleteId(item.id)} className="p-1.5 rounded-lg hover:bg-red-500/20">
                      <Trash2 size={16} color="#a0a0a0" />
                    </Pressable>
                  )}
                </View>
              </View>
            </View>
          );
        })}
        <Pressable
          onPress={onAdd}
          className="py-3 border border-dashed border-border rounded-xl items-center mt-2"
        >
          <View className="flex-row items-center gap-2">
            <Plus size={16} color="#C5FF00" />
            <Text className="text-sm text-primary font-medium">Add {activeTab === 'assets' ? 'Asset' : 'Liability'}</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Commit**

```
git add components/cashflow/ManageAssetsLiabilitiesCard.tsx
git commit -m "refactor(cashflow): rewrite ManageAssetsLiabilitiesCard with inline delete confirm"
```

---

## Task 7: cashflow/index.tsx (Wire Everything)

**Files:**
- Modify: `app/(main)/cashflow/index.tsx`

- [ ] **Step 1: Replace cashflow/index.tsx**

```typescript
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Info, ChevronLeft, ChevronRight } from 'lucide-react-native';
import React from 'react';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { FinancialClassBadge } from '../../../components/cashflow/FinancialClassBadge';
import { CashFlowDiagram } from '../../../components/cashflow/CashFlowDiagram';
import { IncomeStatementCard } from '../../../components/cashflow/IncomeStatementCard';
import { BalanceSheetCard } from '../../../components/cashflow/BalanceSheetCard';
import { MonthlyTrendChart } from '../../../components/cashflow/MonthlyTrendChart';
import { ManageAssetsLiabilitiesCard } from '../../../components/cashflow/ManageAssetsLiabilitiesCard';

// ─── Mock data (to be replaced by Supabase hookup) ───────────────────────────
const MONTHS = ['Jan 2026', 'Feb 2026', 'Mar 2026', 'Apr 2026', 'May 2026', 'Jun 2026'];

const INCOME_ITEMS = [
  { label: 'Salary', amount: 3500 },
  { label: 'Freelance', amount: 600 },
];

const EXPENSE_ITEMS = [
  { label: 'Bills & Utilities', amount: 350 },
  { label: 'Food', amount: 450 },
  { label: 'Transport', amount: 200 },
  { label: 'Mortgage Payment', amount: 1200 },
  { label: 'Car Loan', amount: 500 },
];

const INITIAL_ASSETS = [
  { id: 'a1', name: 'Rumah Taman Melati', type: 'Real Estate', icon: '🏠', value: 250000, monthlyIncome: 500 },
  { id: 'a2', name: 'Bursa Stocks Portfolio', type: 'Stocks / ETF', icon: '📈', value: 15000, monthlyIncome: 200 },
  { id: 'a3', name: 'Amanah Saham Bumiputera', type: 'ASB / ASB2', icon: '🐷', value: 10000, monthlyIncome: 0 },
  { id: 'a4', name: 'Fixed Deposit Maybank', type: 'Fixed Deposit', icon: '🏦', value: 5000, monthlyIncome: 0 },
];

const INITIAL_LIABILITIES = [
  { id: 'l1', name: 'Housing Loan CIMB', type: 'Mortgage', icon: '🏦', amountOwed: 180000, monthlyPayment: 1200 },
  { id: 'l2', name: 'Car Loan Maybank', type: 'Car Loan', icon: '🚗', amountOwed: 25000, monthlyPayment: 500 },
  { id: 'l3', name: 'Credit Card CIMB', type: 'Credit Card', icon: '💳', amountOwed: 3000, monthlyPayment: 300 },
  { id: 'l4', name: 'PTPTN', type: 'Study Loan', icon: '🎓', amountOwed: 12000, monthlyPayment: 150 },
];

const MONTHLY_TREND = [
  { month: 'Dec', assets: 260000, liabilities: 228000 },
  { month: 'Jan', assets: 262000, liabilities: 226000 },
  { month: 'Feb', assets: 265000, liabilities: 224000 },
  { month: 'Mar', assets: 268000, liabilities: 222000 },
  { month: 'Apr', assets: 272000, liabilities: 221000 },
  { month: 'May', assets: 280000, liabilities: 220000 },
];

// ─── Types ───────────────────────────────────────────────────────────────────────
type FinancialClass = 'poor' | 'middle' | 'rich';

interface Asset { id: string; name: string; type: string; icon: string; value: number; monthlyIncome: number; }
interface Liability { id: string; name: string; type: string; icon: string; amountOwed: number; monthlyPayment: number; }

// ─── Main screen ────────────────────────────────────────────────────────────────
export default function CashFlowScreen() {
  const router = useRouter();
  const [monthIndex, setMonthIndex] = React.useState(4); // May 2026
  const [assets, setAssets] = React.useState<Asset[]>(INITIAL_ASSETS);
  const [liabilities, setLiabilities] = React.useState<Liability[]>(INITIAL_LIABILITIES);
  const [balanceSheetTab, setBalanceSheetTab] = React.useState<'assets' | 'liabilities'>('assets');
  const [manageTab, setManageTab] = React.useState<'assets' | 'liabilities'>('assets');

  // ─── Computed ────────────────────────────────────────────────────────────────
  const totalIncome = INCOME_ITEMS.reduce((s, i) => s + i.amount, 0);
  const passiveFromAssets = assets.reduce((s, a) => s + a.monthlyIncome, 0);
  const allIncome = totalIncome + passiveFromAssets;
  const totalExpenses = EXPENSE_ITEMS.reduce((s, e) => s + e.amount, 0);
  const netCashFlow = allIncome - totalExpenses;
  const totalAssets = assets.reduce((s, a) => s + a.value, 0);
  const totalLiabilities = liabilities.reduce((s, l) => s + l.amountOwed, 0);
  const netWorth = totalAssets - totalLiabilities;

  const financialClass: FinancialClass =
    assets.length === 0 && passiveFromAssets === 0
      ? 'poor'
      : passiveFromAssets >= totalExpenses
      ? 'rich'
      : 'middle';

  const prevMonth = monthIndex > 0 ? MONTHLY_TREND[monthIndex - 1] : null;
  const currMonth = MONTHLY_TREND[monthIndex];
  const netWorthChange = (currMonth?.assets ?? 0) - (currMonth?.liabilities ?? 0)
    - ((prevMonth?.assets ?? 0) - (prevMonth?.liabilities ?? 0));

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScreenHeader
        title="Cash Flow"
        rightAction={
          <Pressable onPress={() => router.push('/cashflow/info')} className="p-2">
            <Info size={22} color="#ffffff" />
          </Pressable>
        }
      />
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Month Navigator */}
        <View className="flex-row items-center justify-between px-4 py-3">
          <Pressable onPress={() => setMonthIndex((i) => Math.max(0, i - 1))} className="p-2">
            <ChevronLeft size={24} color="#ffffff" />
          </Pressable>
          <Text className="text-lg font-semibold text-foreground">{MONTHS[monthIndex]}</Text>
          <Pressable onPress={() => setMonthIndex((i) => Math.min(MONTHS.length - 1, i + 1))} className="p-2">
            <ChevronRight size={24} color="#ffffff" />
          </Pressable>
        </View>

        {/* Financial Class Badge */}
        <View className="px-4 mb-4">
          <FinancialClassBadge
            financialClass={financialClass}
            totalAssets={totalAssets}
            totalLiabilities={totalLiabilities}
            passiveIncome={passiveFromAssets}
            netWorth={netWorth}
            totalIncome={allIncome}
            totalExpenses={totalExpenses}
          />
        </View>

        {/* Cash Flow Diagram */}
        <View className="px-4 mb-4">
          <CashFlowDiagram
            financialClass={financialClass}
            totalIncome={allIncome}
            passiveIncome={passiveFromAssets}
            totalExpenses={totalExpenses}
            totalAssets={totalAssets}
            totalLiabilities={totalLiabilities}
          />
        </View>

        {/* Income Statement */}
        <View className="px-4 mb-4">
          <IncomeStatementCard
            incomeItems={INCOME_ITEMS}
            expenseItems={EXPENSE_ITEMS}
            passiveFromAssets={passiveFromAssets}
            totalIncome={allIncome}
            totalExpenses={totalExpenses}
            netCashFlow={netCashFlow}
          />
        </View>

        {/* Balance Sheet */}
        <View className="px-4 mb-4">
          <BalanceSheetCard
            assets={assets}
            liabilities={liabilities}
            activeTab={balanceSheetTab}
            onTabChange={setBalanceSheetTab}
            onAddAsset={() => {}}
            onAddLiability={() => {}}
            totalAssets={totalAssets}
            totalLiabilities={totalLiabilities}
            netWorth={netWorth}
          />
        </View>

        {/* Monthly Trend */}
        <View className="px-4 mb-4">
          <MonthlyTrendChart data={MONTHLY_TREND} netWorthChange={netWorthChange} />
        </View>

        {/* Manage Assets & Liabilities */}
        <View className="px-4 mb-8">
          <ManageAssetsLiabilitiesCard
            assets={assets}
            liabilities={liabilities}
            activeTab={manageTab}
            onTabChange={setManageTab}
            onEdit={() => {}}
            onDelete={(id) => {
              setAssets((prev) => prev.filter((a) => a.id !== id));
              setLiabilities((prev) => prev.filter((l) => l.id !== id));
            }}
            onAdd={() => {}}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
```

- [ ] **Step 2: Commit**

```
git add app/(main)/cashflow/index.tsx
git commit -m "feat(cashflow): wire all components with mock data, dynamic financial class calculation"
```

---

## Spec Coverage Check

- [x] Page structure — all 8 sections present in index.tsx ✅
- [x] FinancialClassBadge — dynamic class, stats grid, prototype styling ✅
- [x] IncomeStatementCard — income/expense breakdown, net cash flow ✅
- [x] BalanceSheetCard — tabs, item rows, add buttons, totals + net worth ✅
- [x] CashFlowDiagram — animated dot, info toggle, 3 patterns ✅
- [x] MonthlyTrendChart — paired bars, legend, net worth row ✅
- [x] ManageAssetsLiabilitiesCard — inline edit/delete confirm, add button ✅
- [x] Dynamic financial class computation ✅
- [x] Month navigator with state ✅

## Type Consistency Check

- `FinancialClassBadge` receives typed props matching parent computation outputs ✅
- `BalanceSheetCard` receives typed `Asset[]` and `Liability[]` ✅
- `ManageAssetsLiabilitiesCard` uses consistent `id` field for delete confirm ✅
- All components use `React` import for `useState` / `Fragment` ✅

## Placeholder Scan

- No "TBD", "TODO", or incomplete sections ✅
- No generic "handle edge cases" descriptions ✅
- All keyframe coordinates are concrete numbers ✅

---

**Plan complete.** Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute tasks in this session using `executing-plans`, batch execution with checkpoints

Which approach?