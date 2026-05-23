import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, Edit3, X, Check, TrendingUp, Info } from 'lucide-react';
import { CashFlowDiagram } from './CashFlowDiagram';
import { CashFlowInfo } from './CashFlowInfo';

type FinancialClass = 'poor' | 'middle' | 'rich';

interface Asset {
  id: string;
  name: string;
  type: string;
  icon: string;
  value: number;
  monthlyIncome: number;
  dateAcquired: string;
  note: string;
}

interface Liability {
  id: string;
  name: string;
  type: string;
  icon: string;
  amountOwed: number;
  monthlyPayment: number;
  interestRate: number;
  note: string;
}

const ASSET_TYPES = [
  { label: 'Real Estate', icon: '🏠' },
  { label: 'Stocks / ETF', icon: '📈' },
  { label: 'Unit Trust', icon: '💰' },
  { label: 'Fixed Deposit', icon: '🏦' },
  { label: 'ASB / ASB2', icon: '🐷' },
  { label: 'Gold', icon: '💎' },
  { label: 'Vehicle', icon: '🚗' },
  { label: 'Business', icon: '💼' },
  { label: 'Others', icon: '📦' },
];

const LIABILITY_TYPES = [
  { label: 'Mortgage', icon: '🏦' },
  { label: 'Car Loan', icon: '🚗' },
  { label: 'Credit Card', icon: '💳' },
  { label: 'Study Loan', icon: '🎓' },
  { label: 'Medical Loan', icon: '🏥' },
  { label: 'Business Loan', icon: '💼' },
  { label: 'Others', icon: '📦' },
];

const INITIAL_ASSETS: Asset[] = [
  { id: 'a1', name: 'Rumah Taman Melati', type: 'Real Estate', icon: '🏠', value: 250000, monthlyIncome: 500, dateAcquired: '2020-06-01', note: '' },
  { id: 'a2', name: 'Bursa Stocks Portfolio', type: 'Stocks / ETF', icon: '📈', value: 15000, monthlyIncome: 200, dateAcquired: '2022-01-15', note: '' },
  { id: 'a3', name: 'Amanah Saham Bumiputera', type: 'ASB / ASB2', icon: '🐷', value: 10000, monthlyIncome: 0, dateAcquired: '2018-03-01', note: '' },
  { id: 'a4', name: 'Fixed Deposit Maybank', type: 'Fixed Deposit', icon: '🏦', value: 5000, monthlyIncome: 0, dateAcquired: '2024-01-01', note: '' },
];

const INITIAL_LIABILITIES: Liability[] = [
  { id: 'l1', name: 'Housing Loan CIMB', type: 'Mortgage', icon: '🏦', amountOwed: 180000, monthlyPayment: 1200, interestRate: 4.2, note: '' },
  { id: 'l2', name: 'Car Loan Maybank', type: 'Car Loan', icon: '🚗', amountOwed: 25000, monthlyPayment: 500, interestRate: 3.5, note: '' },
  { id: 'l3', name: 'Credit Card CIMB', type: 'Credit Card', icon: '💳', amountOwed: 3000, monthlyPayment: 300, interestRate: 18, note: '' },
  { id: 'l4', name: 'PTPTN', type: 'Study Loan', icon: '🎓', amountOwed: 12000, monthlyPayment: 150, interestRate: 1, note: '' },
];

const INCOME_ITEMS = [
  { label: 'Salary', icon: '💼', amount: 3500, isPassive: false },
  { label: 'Freelance', icon: '💻', amount: 600, isPassive: false },
];

const EXPENSE_ITEMS = [
  { label: 'Bills & Utilities', icon: '🧾', amount: 350, isRecurring: false },
  { label: 'Food', icon: '🍔', amount: 450, isRecurring: false },
  { label: 'Transport', icon: '🚗', amount: 200, isRecurring: false },
  { label: 'Mortgage Payment', icon: '🔁', amount: 1200, isRecurring: true },
  { label: 'Car Loan', icon: '🔁', amount: 500, isRecurring: true },
];

const TREND_DATA = [
  { month: 'Dec', assets: 260000, liabilities: 228000 },
  { month: 'Jan', assets: 262000, liabilities: 226000 },
  { month: 'Feb', assets: 265000, liabilities: 224000 },
  { month: 'Mar', assets: 268000, liabilities: 222000 },
  { month: 'Apr', assets: 272000, liabilities: 221000 },
  { month: 'May', assets: 280000, liabilities: 220000 },
];

const MONTHS = ['Jan 2026', 'Feb 2026', 'Mar 2026', 'Apr 2026', 'May 2026', 'Jun 2026'];

function emptyAsset(): Omit<Asset, 'id'> {
  return { name: '', type: 'Real Estate', icon: '🏠', value: 0, monthlyIncome: 0, dateAcquired: '', note: '' };
}
function emptyLiability(): Omit<Liability, 'id'> {
  return { name: '', type: 'Mortgage', icon: '🏦', amountOwed: 0, monthlyPayment: 0, interestRate: 0, note: '' };
}

export function CashFlow() {
  const [monthIndex, setMonthIndex] = useState(4); // May 2026
  const [assets, setAssets] = useState<Asset[]>(INITIAL_ASSETS);
  const [liabilities, setLiabilities] = useState<Liability[]>(INITIAL_LIABILITIES);
  const [manageTab, setManageTab] = useState<'assets' | 'liabilities'>('assets');

  // Add/Edit Asset modal
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [assetForm, setAssetForm] = useState(emptyAsset());

  // Add/Edit Liability modal
  const [showLiabilityModal, setShowLiabilityModal] = useState(false);
  const [editingLiability, setEditingLiability] = useState<Liability | null>(null);
  const [liabilityForm, setLiabilityForm] = useState(emptyLiability());

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  // --- Calculations ---
  const totalIncome = INCOME_ITEMS.reduce((s, i) => s + i.amount, 0);
  const passiveFromAssets = assets.reduce((s, a) => s + a.monthlyIncome, 0);
  const allIncome = totalIncome + passiveFromAssets;
  const totalExpenses = EXPENSE_ITEMS.reduce((s, e) => s + e.amount, 0);
  const netCashFlow = allIncome - totalExpenses;
  const totalAssets = assets.reduce((s, a) => s + a.value, 0);
  const totalLiabilities = liabilities.reduce((s, l) => s + l.amountOwed, 0);
  const netWorth = totalAssets - totalLiabilities;

  // Dynamic financial class
  const financialClass: FinancialClass =
    assets.length === 0 && passiveFromAssets === 0
      ? 'poor'
      : passiveFromAssets >= totalExpenses
      ? 'rich'
      : 'middle';

  const classInfo = {
    poor: {
      emoji: '😰', title: 'Poor Pattern', color: 'text-red-400',
      border: 'border-red-500/40', bg: 'from-red-500/15 to-red-500/5',
      desc: 'Your income goes directly to expenses. No assets working for you yet.',
      flow: 'Income → Expenses (all of it)',
    },
    middle: {
      emoji: '😐', title: 'Middle Class Pattern', color: 'text-yellow-400',
      border: 'border-yellow-500/40', bg: 'from-yellow-500/15 to-yellow-500/5',
      desc: 'You earn well but liabilities eat your income. Build assets to escape this cycle.',
      flow: 'Income → Expenses + Liabilities',
    },
    rich: {
      emoji: '💎', title: 'Rich Pattern', color: 'text-primary',
      border: 'border-primary/40', bg: 'from-primary/15 to-primary/5',
      desc: 'Your assets generate income. Money works for you. Keep growing your asset column!',
      flow: 'Assets → Income → More Assets',
    },
  }[financialClass];

  // --- Asset modal helpers ---
  const openAddAsset = () => {
    setEditingAsset(null);
    setAssetForm(emptyAsset());
    setShowAssetModal(true);
  };
  const openEditAsset = (a: Asset) => {
    setEditingAsset(a);
    setAssetForm({ name: a.name, type: a.type, icon: a.icon, value: a.value, monthlyIncome: a.monthlyIncome, dateAcquired: a.dateAcquired, note: a.note });
    setShowAssetModal(true);
  };
  const saveAsset = () => {
    if (!assetForm.name.trim()) return;
    if (editingAsset) {
      setAssets((prev) => prev.map((a) => a.id === editingAsset.id ? { ...assetForm, id: editingAsset.id } : a));
    } else {
      setAssets((prev) => [...prev, { ...assetForm, id: Date.now().toString() }]);
    }
    setShowAssetModal(false);
  };
  const deleteAsset = (id: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== id));
    setDeleteId(null);
  };

  // --- Liability modal helpers ---
  const openAddLiability = () => {
    setEditingLiability(null);
    setLiabilityForm(emptyLiability());
    setShowLiabilityModal(true);
  };
  const openEditLiability = (l: Liability) => {
    setEditingLiability(l);
    setLiabilityForm({ name: l.name, type: l.type, icon: l.icon, amountOwed: l.amountOwed, monthlyPayment: l.monthlyPayment, interestRate: l.interestRate, note: l.note });
    setShowLiabilityModal(true);
  };
  const saveLiability = () => {
    if (!liabilityForm.name.trim()) return;
    if (editingLiability) {
      setLiabilities((prev) => prev.map((l) => l.id === editingLiability.id ? { ...liabilityForm, id: editingLiability.id } : l));
    } else {
      setLiabilities((prev) => [...prev, { ...liabilityForm, id: Date.now().toString() }]);
    }
    setShowLiabilityModal(false);
  };
  const deleteLiability = (id: string) => {
    setLiabilities((prev) => prev.filter((l) => l.id !== id));
    setDeleteId(null);
  };

  // Trend chart helpers
  const maxTrend = Math.max(...TREND_DATA.map((d) => d.assets));

  if (showInfo) return <CashFlowInfo onBack={() => setShowInfo(false)} />;

  return (
    <div className="min-h-screen p-4 pb-6 space-y-5">

      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Cash Flow</h1>
          <button
            onClick={() => setShowInfo(true)}
            className="p-2 rounded-xl bg-card border border-border hover:bg-muted transition-colors"
          >
            <Info className="w-5 h-5 text-primary" />
          </button>
        </div>
        <div className="flex items-center justify-between bg-card rounded-xl p-4 border border-border">
          <button
            onClick={() => setMonthIndex((i) => Math.max(0, i - 1))}
            className="p-1 hover:bg-muted rounded-full transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-medium">{MONTHS[monthIndex]}</span>
          <button
            onClick={() => setMonthIndex((i) => Math.min(MONTHS.length - 1, i + 1))}
            className="p-1 hover:bg-muted rounded-full transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Section 1 — Financial Class Badge */}
      <div className={`bg-gradient-to-br ${classInfo.bg} border-2 ${classInfo.border} rounded-2xl p-5`}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">{classInfo.emoji}</span>
          <div>
            <h2 className={`text-lg font-bold ${classInfo.color}`}>{classInfo.title}</h2>
            <p className="text-xs font-mono text-muted-foreground">{classInfo.flow}</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-4">{classInfo.desc}</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-black/20 rounded-xl p-3">
            <p className="text-xs text-muted-foreground mb-0.5">Assets</p>
            <p className="font-bold">RM {totalAssets.toLocaleString()}</p>
          </div>
          <div className="bg-black/20 rounded-xl p-3">
            <p className="text-xs text-muted-foreground mb-0.5">Liabilities</p>
            <p className="font-bold">RM {totalLiabilities.toLocaleString()}</p>
          </div>
          <div className="bg-black/20 rounded-xl p-3">
            <p className="text-xs text-muted-foreground mb-0.5">Passive Income</p>
            <p className="font-bold text-primary">RM {passiveFromAssets.toFixed(0)}/mo</p>
          </div>
          <div className="bg-black/20 rounded-xl p-3">
            <p className="text-xs text-muted-foreground mb-0.5">Net Worth</p>
            <p className="font-bold">RM {netWorth.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Section 2 — Income Statement */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="bg-muted/40 px-5 py-3 border-b border-border">
          <p className="font-bold tracking-wide text-sm">INCOME STATEMENT</p>
        </div>
        <div className="p-5 space-y-4">
          {/* Income */}
          <div>
            <p className="font-semibold text-sm mb-2 text-green-400">Income</p>
            <div className="space-y-2">
              {INCOME_ITEMS.map((item) => (
                <div key={item.label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.icon} {item.label}</span>
                  <span>RM {item.amount.toLocaleString()}</span>
                </div>
              ))}
              {passiveFromAssets > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">📈 Passive (Assets)</span>
                  <span className="text-primary">RM {passiveFromAssets.toLocaleString()}</span>
                </div>
              )}
              <div className="border-t border-border pt-2 flex justify-between font-semibold text-sm">
                <span>Total Income</span>
                <span className="text-green-400">RM {allIncome.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Expenses */}
          <div>
            <p className="font-semibold text-sm mb-2 text-red-400">Expenses</p>
            <div className="space-y-2">
              {EXPENSE_ITEMS.map((item) => (
                <div key={item.label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.icon} {item.label}</span>
                  <span>RM {item.amount.toLocaleString()}</span>
                </div>
              ))}
              <div className="border-t border-border pt-2 flex justify-between font-semibold text-sm">
                <span>Total Expenses</span>
                <span className="text-red-400">RM {totalExpenses.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Net Cash Flow */}
          <div className="border-t-2 border-border pt-3 flex justify-between items-center">
            <span className="font-bold">Net Cash Flow</span>
            <span className={`text-xl font-bold ${netCashFlow >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              RM {netCashFlow.toLocaleString()} {netCashFlow >= 0 ? '✅' : '⚠️'}
            </span>
          </div>
        </div>
      </div>

      {/* Section 3 — Balance Sheet */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="bg-muted/40 px-5 py-3 border-b border-border">
          <p className="font-bold tracking-wide text-sm">BALANCE SHEET</p>
        </div>
        <div className="grid grid-cols-2 divide-x divide-border">
          {/* Assets column */}
          <div className="p-4">
            <p className="font-semibold text-sm text-primary mb-3">Assets</p>
            <div className="space-y-3">
              {assets.map((a) => (
                <div key={a.id} className="group">
                  <p className="text-xs text-muted-foreground">{a.icon} {a.type}</p>
                  <p className="font-medium text-sm">RM {a.value.toLocaleString()}</p>
                  {a.monthlyIncome > 0 && (
                    <p className="text-xs text-primary">+RM {a.monthlyIncome}/mo</p>
                  )}
                </div>
              ))}
              <button
                onClick={openAddAsset}
                className="w-full py-2 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/20 transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Add Asset
              </button>
            </div>
          </div>

          {/* Liabilities column */}
          <div className="p-4">
            <p className="font-semibold text-sm text-red-400 mb-3">Liabilities</p>
            <div className="space-y-3">
              {liabilities.map((l) => (
                <div key={l.id} className="group">
                  <p className="text-xs text-muted-foreground">{l.icon} {l.type}</p>
                  <p className="font-medium text-sm">RM {l.amountOwed.toLocaleString()}</p>
                  <p className="text-xs text-red-400">-RM {l.monthlyPayment}/mo</p>
                </div>
              ))}
              <button
                onClick={openAddLiability}
                className="w-full py-2 bg-red-500/10 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/20 transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Add Liability
              </button>
            </div>
          </div>
        </div>

        {/* Net Worth */}
        <div className="px-5 py-4 border-t border-border bg-muted/20">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Total Assets</span>
            <span className="font-semibold text-primary">RM {totalAssets.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm mb-3">
            <span className="text-muted-foreground">Total Liabilities</span>
            <span className="font-semibold text-red-400">RM {totalLiabilities.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center border-t border-border pt-3">
            <span className="font-bold">Net Worth</span>
            <span className={`text-xl font-bold ${netWorth >= 0 ? 'text-primary' : 'text-red-400'}`}>
              RM {netWorth.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Section 4 — Cash Flow Diagram */}
      <CashFlowDiagram
        financialClass={financialClass}
        totalIncome={allIncome}
        passiveIncome={passiveFromAssets}
        totalExpenses={totalExpenses}
        totalAssets={totalAssets}
        totalLiabilities={totalLiabilities}
      />

      {/* Section 5 — Monthly Trend */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="bg-muted/40 px-5 py-3 border-b border-border flex items-center justify-between">
          <p className="font-bold text-sm">Monthly Trend</p>
          <div className="flex items-center gap-1 text-primary">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-semibold">Net worth grew RM 8,000 this month</span>
          </div>
        </div>
        <div className="p-4">
          {/* Bar chart */}
          <div className="flex items-end gap-2 h-28 mb-2">
            {TREND_DATA.map((d) => (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                <div className="flex items-end gap-0.5 w-full h-24">
                  <div
                    className="flex-1 bg-primary/60 rounded-t-lg transition-all"
                    style={{ height: `${(d.assets / maxTrend) * 100}%` }}
                  />
                  <div
                    className="flex-1 bg-red-500/50 rounded-t-lg transition-all"
                    style={{ height: `${(d.liabilities / maxTrend) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{d.month}</span>
              </div>
            ))}
          </div>
          {/* Legend */}
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-primary/60" />
              <span className="text-xs text-muted-foreground">Assets</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-red-500/50" />
              <span className="text-xs text-muted-foreground">Liabilities</span>
            </div>
          </div>
          {/* Net worth per month */}
          <div className="mt-3 grid grid-cols-6 gap-1">
            {TREND_DATA.map((d) => {
              const nw = d.assets - d.liabilities;
              return (
                <div key={d.month} className="text-center">
                  <p className="text-xs text-primary font-semibold">{(nw / 1000).toFixed(0)}k</p>
                  <p className="text-xs text-muted-foreground">{d.month}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Section 6 — Assets & Liabilities Management */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="bg-muted/40 px-5 py-3 border-b border-border">
          <p className="font-bold text-sm">Manage Assets & Liabilities</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-3 border-b border-border">
          {(['assets', 'liabilities'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setManageTab(tab)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold capitalize transition-colors ${
                manageTab === tab ? 'bg-primary text-black' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Assets list */}
        {manageTab === 'assets' && (
          <div className="p-4 space-y-2">
            {assets.map((a) => (
              <div key={a.id} className="bg-background border border-border rounded-xl p-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary/15 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                    {a.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{a.name}</p>
                    <p className="text-xs text-muted-foreground">{a.type}</p>
                    <div className="flex gap-3 mt-1">
                      <span className="text-sm font-bold">RM {a.value.toLocaleString()}</span>
                      {a.monthlyIncome > 0 && (
                        <span className="text-xs text-primary">+RM {a.monthlyIncome}/mo</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => openEditAsset(a)}
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    {deleteId === a.id ? (
                      <div className="flex gap-1">
                        <button onClick={() => deleteAsset(a.id)} className="p-1.5 rounded-lg bg-red-500/20 text-red-400">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteId(null)} className="p-1.5 rounded-lg bg-muted">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteId(a.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div className="border-t border-border pt-3 flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Assets</span>
              <span className="font-bold text-primary">RM {totalAssets.toLocaleString()}</span>
            </div>
            <button
              onClick={openAddAsset}
              className="w-full py-3 bg-primary/10 text-primary border border-primary/30 border-dashed rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary/20 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Asset
            </button>
          </div>
        )}

        {/* Liabilities list */}
        {manageTab === 'liabilities' && (
          <div className="p-4 space-y-2">
            {liabilities.map((l) => (
              <div key={l.id} className="bg-background border border-border rounded-xl p-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-red-500/15 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                    {l.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{l.name}</p>
                    <p className="text-xs text-muted-foreground">{l.type} {l.interestRate > 0 ? `· ${l.interestRate}% p.a.` : ''}</p>
                    <div className="flex gap-3 mt-1">
                      <span className="text-sm font-bold">RM {l.amountOwed.toLocaleString()}</span>
                      <span className="text-xs text-red-400">-RM {l.monthlyPayment}/mo</span>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => openEditLiability(l)}
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    {deleteId === l.id ? (
                      <div className="flex gap-1">
                        <button onClick={() => deleteLiability(l.id)} className="p-1.5 rounded-lg bg-red-500/20 text-red-400">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteId(null)} className="p-1.5 rounded-lg bg-muted">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteId(l.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div className="border-t border-border pt-3 flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Liabilities</span>
              <span className="font-bold text-red-400">RM {totalLiabilities.toLocaleString()}</span>
            </div>
            <button
              onClick={openAddLiability}
              className="w-full py-3 bg-red-500/10 text-red-400 border border-red-500/30 border-dashed rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-red-500/20 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Liability
            </button>
          </div>
        )}
      </div>

      {/* Add / Edit Asset Modal */}
      {showAssetModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center" onClick={() => setShowAssetModal(false)}>
          <div
            className="bg-background border border-border rounded-t-3xl p-5 w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">{editingAsset ? 'Edit Asset' : 'Add Asset'}</h2>
              <button onClick={() => setShowAssetModal(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Asset Name</label>
                <input
                  type="text"
                  value={assetForm.name}
                  onChange={(e) => setAssetForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Amanah Saham, Rumah Taman Melati"
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Asset Type</label>
                <div className="flex flex-wrap gap-2">
                  {ASSET_TYPES.map((t) => (
                    <button
                      key={t.label}
                      onClick={() => setAssetForm((f) => ({ ...f, type: t.label, icon: t.icon }))}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                        assetForm.type === t.label
                          ? 'bg-primary text-black border-primary'
                          : 'bg-card border-border text-muted-foreground'
                      }`}
                    >
                      {t.icon} {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Current Value (RM)</label>
                <input
                  type="number"
                  value={assetForm.value || ''}
                  onChange={(e) => setAssetForm((f) => ({ ...f, value: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Monthly Income from this asset <span className="text-xs">(optional)</span>
                </label>
                <input
                  type="number"
                  value={assetForm.monthlyIncome || ''}
                  onChange={(e) => setAssetForm((f) => ({ ...f, monthlyIncome: parseFloat(e.target.value) || 0 }))}
                  placeholder="e.g. rental income, dividend"
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-sm"
                />
                <p className="text-xs text-primary mt-1 px-1">This counts toward your passive income score</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Date Acquired <span className="text-xs">(optional)</span></label>
                <input
                  type="date"
                  value={assetForm.dateAcquired}
                  onChange={(e) => setAssetForm((f) => ({ ...f, dateAcquired: e.target.value }))}
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Note <span className="text-xs">(optional)</span></label>
                <input
                  type="text"
                  value={assetForm.note}
                  onChange={(e) => setAssetForm((f) => ({ ...f, note: e.target.value }))}
                  placeholder="Any notes about this asset"
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-sm"
                />
              </div>
            </div>

            <button
              onClick={saveAsset}
              disabled={!assetForm.name.trim()}
              className="w-full mt-6 py-4 bg-primary text-black rounded-2xl font-bold disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" /> {editingAsset ? 'Save Changes' : 'Add Asset'}
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit Liability Modal */}
      {showLiabilityModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center" onClick={() => setShowLiabilityModal(false)}>
          <div
            className="bg-background border border-border rounded-t-3xl p-5 w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">{editingLiability ? 'Edit Liability' : 'Add Liability'}</h2>
              <button onClick={() => setShowLiabilityModal(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Liability Name</label>
                <input
                  type="text"
                  value={liabilityForm.name}
                  onChange={(e) => setLiabilityForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Housing Loan CIMB, Car Loan Maybank"
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Liability Type</label>
                <div className="flex flex-wrap gap-2">
                  {LIABILITY_TYPES.map((t) => (
                    <button
                      key={t.label}
                      onClick={() => setLiabilityForm((f) => ({ ...f, type: t.label, icon: t.icon }))}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                        liabilityForm.type === t.label
                          ? 'bg-red-500 text-white border-red-500'
                          : 'bg-card border-border text-muted-foreground'
                      }`}
                    >
                      {t.icon} {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Total Amount Owed (RM)</label>
                <input
                  type="number"
                  value={liabilityForm.amountOwed || ''}
                  onChange={(e) => setLiabilityForm((f) => ({ ...f, amountOwed: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Monthly Payment (RM)</label>
                <input
                  type="number"
                  value={liabilityForm.monthlyPayment || ''}
                  onChange={(e) => setLiabilityForm((f) => ({ ...f, monthlyPayment: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Interest Rate (%) <span className="text-xs">(optional)</span></label>
                <input
                  type="number"
                  value={liabilityForm.interestRate || ''}
                  onChange={(e) => setLiabilityForm((f) => ({ ...f, interestRate: parseFloat(e.target.value) || 0 }))}
                  placeholder="e.g. 4.2"
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Note <span className="text-xs">(optional)</span></label>
                <input
                  type="text"
                  value={liabilityForm.note}
                  onChange={(e) => setLiabilityForm((f) => ({ ...f, note: e.target.value }))}
                  placeholder="Any notes about this liability"
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-sm"
                />
              </div>
            </div>

            <button
              onClick={saveLiability}
              disabled={!liabilityForm.name.trim()}
              className="w-full mt-6 py-4 bg-red-500 text-white rounded-2xl font-bold disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" /> {editingLiability ? 'Save Changes' : 'Add Liability'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
