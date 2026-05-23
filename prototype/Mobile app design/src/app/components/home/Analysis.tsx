import { useState } from 'react';
import {
  ChevronLeft,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles,
  Wallet,
  PiggyBank,
} from 'lucide-react';

interface Props {
  onBack: () => void;
}

const EXPENSE_CATEGORIES = [
  { name: 'Food & Dining', amount: 680, percentage: 35, color: '#ff6b6b', icon: '🍜' },
  { name: 'Transport', amount: 320, percentage: 16, color: '#00d4ff', icon: '🚗' },
  { name: 'Bills & Utilities', amount: 410, percentage: 21, color: '#ffd93d', icon: '💡' },
  { name: 'Shopping', amount: 290, percentage: 15, color: '#a29bfe', icon: '🛍️' },
  { name: 'Entertainment', amount: 180, percentage: 9, color: '#fd79a8', icon: '🎮' },
  { name: 'Others', amount: 100, percentage: 5, color: '#636e72', icon: '📦' },
];

const INCOME_CATEGORIES = [
  { name: 'Salary', amount: 3500, percentage: 81, color: '#C5FF00', icon: '💼' },
  { name: 'Freelance', amount: 600, percentage: 14, color: '#00d4ff', icon: '💻' },
  { name: 'Investment', amount: 200, percentage: 5, color: '#6bcf7f', icon: '📈' },
];

const BAR_DATA = [
  { month: 'Jan', income: 3500, expense: 2900 },
  { month: 'Feb', income: 3500, expense: 3100 },
  { month: 'Mar', income: 4200, expense: 2800 },
  { month: 'Apr', income: 3800, expense: 3200 },
  { month: 'May', income: 4300, expense: 2650 },
];

export function Analysis({ onBack }: Props) {
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [selectedMonth, setSelectedMonth] = useState('May');

  const totalExpense = EXPENSE_CATEGORIES.reduce((s, c) => s + c.amount, 0);
  const totalIncome = INCOME_CATEGORIES.reduce((s, c) => s + c.amount, 0);
  const netSavings = totalIncome - totalExpense;
  const savingsRate = Math.round((netSavings / totalIncome) * 100);

  const categories = activeTab === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const maxBar = Math.max(...BAR_DATA.map((d) => Math.max(d.income, d.expense)));

  // Build conic-gradient donut for category breakdown
  let cumulative = 0;
  const donutStops = categories
    .map((c) => {
      const start = cumulative;
      cumulative += c.percentage;
      return `${c.color} ${start * 3.6}deg ${cumulative * 3.6}deg`;
    })
    .join(', ');

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <div className="flex items-center justify-between p-4 mb-2">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-card border border-border hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Analysis</h1>
            <p className="text-xs text-muted-foreground">Track your money flow</p>
          </div>
        </div>
        <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
      </div>

      {/* Month Selector */}
      <div className="flex gap-2 px-4 mb-5 overflow-x-auto pb-1 scrollbar-hide">
        {['Jan', 'Feb', 'Mar', 'Apr', 'May'].map((m) => (
          <button
            key={m}
            onClick={() => setSelectedMonth(m)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap border transition-all flex-shrink-0 ${
              selectedMonth === m
                ? 'bg-primary text-black border-primary shadow-[0_0_20px_rgba(197,255,0,0.25)]'
                : 'bg-card border-border text-muted-foreground hover:border-primary/40'
            }`}
          >
            {m} 2026
          </button>
        ))}
      </div>

      {/* Hero Net Savings Card */}
      <div className="mx-4 mb-4 relative overflow-hidden bg-gradient-to-br from-primary/25 via-primary/10 to-transparent border border-primary/30 rounded-3xl p-5">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <PiggyBank className="w-4 h-4 text-primary" />
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Net Savings</p>
            </div>
            <p className="text-3xl font-bold text-primary">RM {netSavings.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {savingsRate >= 20 ? '🔥 On Rich Dad track' : '⚠️ Below 20% target'}
            </p>
          </div>
          <div className="relative">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{
                background: `conic-gradient(#C5FF00 ${savingsRate * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
              }}
            >
              <div className="w-15 h-15 bg-background rounded-full flex flex-col items-center justify-center" style={{ width: '60px', height: '60px' }}>
                <span className="text-base font-bold text-primary">{savingsRate}%</span>
                <span className="text-[9px] text-muted-foreground uppercase">saved</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 px-4 mb-5">
        <div className="relative overflow-hidden bg-card border border-border rounded-2xl p-4">
          <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-green-500/10 rounded-full blur-xl" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-green-500/15 flex items-center justify-center">
                <ArrowDownLeft className="w-4 h-4 text-green-400" />
              </div>
              <span className="text-xs text-muted-foreground">Income</span>
            </div>
            <p className="font-bold text-green-400">RM {totalIncome.toLocaleString()}</p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3 text-green-400" />
              <span className="text-xs text-green-400">+13% vs last</span>
            </div>
          </div>
        </div>
        <div className="relative overflow-hidden bg-card border border-border rounded-2xl p-4">
          <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-red-500/10 rounded-full blur-xl" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-red-500/15 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4 text-red-400" />
              </div>
              <span className="text-xs text-muted-foreground">Expenses</span>
            </div>
            <p className="font-bold text-red-400">RM {totalExpense.toLocaleString()}</p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingDown className="w-3 h-3 text-green-400" />
              <span className="text-xs text-green-400">-17% vs last</span>
            </div>
          </div>
        </div>
      </div>

      {/* Trend Chart */}
      <div className="mx-4 mb-5 bg-card border border-border rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold">5-Month Trend</p>
            <p className="text-xs text-muted-foreground">Income vs Expenses</p>
          </div>
          <div className="flex gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-green-500" />
              <span className="text-xs text-muted-foreground">In</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-red-500/70" />
              <span className="text-xs text-muted-foreground">Out</span>
            </div>
          </div>
        </div>
        <div className="flex items-end gap-2 h-32">
          {BAR_DATA.map((d) => {
            const isSelected = d.month === selectedMonth;
            return (
              <button
                key={d.month}
                onClick={() => setSelectedMonth(d.month)}
                className="flex-1 flex flex-col items-center gap-1.5 group"
              >
                <div className="flex items-end gap-1 w-full h-24">
                  <div
                    className={`flex-1 rounded-t-md transition-all ${
                      isSelected ? 'bg-green-400' : 'bg-green-500/50 group-hover:bg-green-500/70'
                    }`}
                    style={{ height: `${(d.income / maxBar) * 100}%` }}
                  />
                  <div
                    className={`flex-1 rounded-t-md transition-all ${
                      isSelected ? 'bg-red-400' : 'bg-red-500/40 group-hover:bg-red-500/60'
                    }`}
                    style={{ height: `${(d.expense / maxBar) * 100}%` }}
                  />
                </div>
                <span
                  className={`text-xs ${
                    isSelected ? 'text-primary font-semibold' : 'text-muted-foreground'
                  }`}
                >
                  {d.month}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold">Categories</p>
            <p className="text-xs text-muted-foreground">Where your money goes</p>
          </div>
          <div className="flex gap-1 bg-card border border-border rounded-xl p-1">
            {(['expense', 'income'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                  activeTab === tab ? 'bg-primary text-black' : 'text-muted-foreground'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Donut Chart */}
        <div className="bg-card border border-border rounded-2xl p-4 mb-4 flex items-center gap-4">
          <div className="relative w-28 h-28 flex-shrink-0">
            <div
              className="w-28 h-28 rounded-full"
              style={{ background: `conic-gradient(${donutStops})` }}
            />
            <div className="absolute inset-3 bg-background rounded-full flex flex-col items-center justify-center">
              <Wallet className="w-4 h-4 text-primary mb-0.5" />
              <span className="text-xs text-muted-foreground">Total</span>
              <span className="text-sm font-bold">
                RM {(activeTab === 'expense' ? totalExpense : totalIncome).toLocaleString()}
              </span>
            </div>
          </div>
          <div className="flex-1 grid grid-cols-1 gap-1.5">
            {categories.slice(0, 4).map((c) => (
              <div key={c.name} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                <span className="text-xs text-muted-foreground truncate flex-1">{c.name}</span>
                <span className="text-xs font-semibold">{c.percentage}%</span>
              </div>
            ))}
            {categories.length > 4 && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-muted-foreground/40 flex-shrink-0" />
                <span className="text-xs text-muted-foreground">+{categories.length - 4} more</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2.5">
          {categories.map((cat) => (
            <div
              key={cat.name}
              className="bg-card border border-border rounded-xl p-3 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 border"
                  style={{ backgroundColor: cat.color + '22', borderColor: cat.color + '44' }}
                >
                  {cat.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium truncate">{cat.name}</span>
                    <span className="text-sm font-bold ml-2">RM {cat.amount}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${cat.percentage}%`,
                          backgroundColor: cat.color,
                          boxShadow: `0 0 8px ${cat.color}66`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right">
                      {cat.percentage}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Rich Dad Tip */}
        <div className="mt-5 relative overflow-hidden bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/25 rounded-2xl p-4">
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-primary/15 rounded-full blur-2xl" />
          <div className="relative flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold text-primary mb-1">Rich Dad Insight</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {savingsRate >= 20
                  ? `Great job! You saved ${savingsRate}% of your income this month. Rich Dad recommends saving at least 20%. Keep investing the surplus into assets!`
                  : `You saved ${savingsRate}% this month. Rich Dad recommends saving at least 20% of income. Try reducing ${EXPENSE_CATEGORIES[0].name} spending first.`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
