import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { ArrowDownLeft, ArrowUpRight, TrendingUp, TrendingDown, Sparkles, ChevronDown } from 'lucide-react-native';

const COLLAPSED_COUNT = 3;

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

const INCOME_COLOR = '#C5FF00';
const EXPENSE_COLOR = '#ff6b6b';

function Row({ label, amount, color, total, isPassive }: {
  label: string; amount: number; color: string; total: number; isPassive?: boolean;
}) {
  const pct = total > 0 ? Math.min(100, (amount / total) * 100) : 0;
  return (
    <View className="mb-2.5">
      <View className="flex-row justify-between items-center mb-1">
        <View className="flex-row items-center gap-1.5">
          {isPassive && <Sparkles size={12} color={color} />}
          <Text className="text-sm text-foreground">{label}</Text>
        </View>
        <Text className="text-sm font-semibold text-foreground">
          RM {amount.toLocaleString()}
        </Text>
      </View>
      <View className="h-1 rounded-full bg-black/30 overflow-hidden">
        <View
          style={{ width: `${pct}%`, backgroundColor: color, opacity: 0.6 }}
          className="h-full rounded-full"
        />
      </View>
    </View>
  );
}

function SectionHeader({ icon, label, total, color }: {
  icon: React.ReactNode; label: string; total: number; color: string;
}) {
  return (
    <View className="flex-row items-center justify-between mb-3">
      <View className="flex-row items-center gap-2">
        <View
          className="w-7 h-7 rounded-lg items-center justify-center"
          style={{ backgroundColor: color + '25' }}
        >
          {icon}
        </View>
        <Text className="text-sm font-semibold text-foreground">{label}</Text>
      </View>
      <Text className="text-base font-bold" style={{ color }}>
        RM {total.toLocaleString()}
      </Text>
    </View>
  );
}

function ViewAllToggle({ expanded, hiddenCount, color, onPress }: {
  expanded: boolean; hiddenCount: number; color: string; onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-center gap-1 mt-1 py-1.5 active:opacity-60"
    >
      <Text className="text-xs font-semibold" style={{ color }}>
        {expanded ? 'Show less' : `View all (${hiddenCount} more)`}
      </Text>
      <View style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}>
        <ChevronDown size={14} color={color} />
      </View>
    </Pressable>
  );
}

export function IncomeStatementCard({
  incomeItems,
  expenseItems,
  passiveFromAssets,
  totalIncome,
  totalExpenses,
  netCashFlow,
}: IncomeStatementCardProps) {
  const isPositive = netCashFlow >= 0;
  const netColor = isPositive ? INCOME_COLOR : EXPENSE_COLOR;

  const [incomeExpanded, setIncomeExpanded] = useState(false);
  const [expensesExpanded, setExpensesExpanded] = useState(false);

  const sortedIncome = [...incomeItems].sort((a, b) => b.amount - a.amount);
  const sortedExpenses = [...expenseItems].sort((a, b) => b.amount - a.amount);
  const visibleIncome = incomeExpanded ? sortedIncome : sortedIncome.slice(0, COLLAPSED_COUNT);
  const visibleExpenses = expensesExpanded ? sortedExpenses : sortedExpenses.slice(0, COLLAPSED_COUNT);

  return (
    <View className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-4 pb-3">
        <Text className="font-bold tracking-wider text-xs text-muted-foreground">
          INCOME STATEMENT
        </Text>
        <Text className="text-xs text-muted-foreground">Monthly</Text>
      </View>

      {/* Income section */}
      <View className="px-5 pb-4">
        <SectionHeader
          icon={<ArrowDownLeft size={14} color={INCOME_COLOR} />}
          label="Income"
          total={totalIncome}
          color={INCOME_COLOR}
        />
        {visibleIncome.map((item, i) => (
          <Row key={`inc-${i}`} label={item.label} amount={item.amount} color={INCOME_COLOR} total={totalIncome} />
        ))}
        {sortedIncome.length > COLLAPSED_COUNT && (
          <ViewAllToggle
            expanded={incomeExpanded}
            hiddenCount={sortedIncome.length - COLLAPSED_COUNT}
            color={INCOME_COLOR}
            onPress={() => setIncomeExpanded((v) => !v)}
          />
        )}
        {passiveFromAssets > 0 && (
          <Row
            label="Passive from Assets"
            amount={passiveFromAssets}
            color={INCOME_COLOR}
            total={totalIncome}
            isPassive
          />
        )}
      </View>

      {/* Divider */}
      <View className="h-px bg-border mx-5" />

      {/* Expenses section */}
      <View className="px-5 py-4">
        <SectionHeader
          icon={<ArrowUpRight size={14} color={EXPENSE_COLOR} />}
          label="Expenses"
          total={totalExpenses}
          color={EXPENSE_COLOR}
        />
        {visibleExpenses.map((item, i) => (
          <Row key={`exp-${i}`} label={item.label} amount={item.amount} color={EXPENSE_COLOR} total={totalExpenses} />
        ))}
        {sortedExpenses.length > COLLAPSED_COUNT && (
          <ViewAllToggle
            expanded={expensesExpanded}
            hiddenCount={sortedExpenses.length - COLLAPSED_COUNT}
            color={EXPENSE_COLOR}
            onPress={() => setExpensesExpanded((v) => !v)}
          />
        )}
      </View>

      {/* Net Cash Flow hero footer */}
      <View
        className="px-5 py-4 border-t"
        style={{
          backgroundColor: netColor + '12',
          borderTopColor: netColor + '30',
        }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <View
              className="w-8 h-8 rounded-xl items-center justify-center"
              style={{ backgroundColor: netColor + '25' }}
            >
              {isPositive ? (
                <TrendingUp size={16} color={netColor} />
              ) : (
                <TrendingDown size={16} color={netColor} />
              )}
            </View>
            <View>
              <Text className="text-sm font-semibold text-foreground">Net Cash Flow</Text>
              <Text className="text-[10px] text-muted-foreground">
                {isPositive ? 'Surplus this month' : 'Deficit this month'}
              </Text>
            </View>
          </View>
          <Text className="text-2xl font-bold" style={{ color: netColor }}>
            {isPositive ? '+' : ''}RM {netCashFlow.toLocaleString()}
          </Text>
        </View>
      </View>
    </View>
  );
}
