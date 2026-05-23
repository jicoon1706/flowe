import { useState } from 'react';
import { ChevronLeft, Plus, PiggyBank, Wallet, Building2, TrendingUp, X, Check } from 'lucide-react';
import { BankAccount } from './AccountDetail';
import { TabungData } from './TabungDetail';

interface Props {
  onBack: () => void;
  onSelectAccount: (account: BankAccount) => void;
  onSelectTabung: (tabung: TabungData) => void;
  onNewTabung: () => void;
}

const BANK_ACCOUNTS: BankAccount[] = [
  { id: 'maybank', type: 'bank', name: 'Maybank', balance: 2850.00, icon: '🏦', accountNumber: '1122 3344 5566', color: '#ffd93d' },
  { id: 'cimb', type: 'bank', name: 'CIMB', balance: 1200.00, icon: '🏦', accountNumber: '9988 7766 5544', color: '#ff6b6b' },
  { id: 'wallet', type: 'wallet', name: 'Cash Wallet', balance: 200.00, icon: '👛', color: '#6bcf7f' },
];

const TABUNGS: TabungData[] = [
  { id: 'raya', name: 'Tabung Raya', saved: 300, target: 500, daysLeft: 12, icon: '🌙', description: 'Save for Eid celebration' },
  { id: 'holiday', name: 'Holiday Fund', saved: 800, target: 2000, daysLeft: 60, icon: '✈️', description: 'Dream vacation savings' },
];

const INVESTMENTS = [
  { name: 'ASNB', amount: 5000, return: '+8.5%', icon: '📈', color: '#6bcf7f' },
  { name: 'EPF', amount: 12400, return: '+5.35%', icon: '🏛️', color: '#00d4ff' },
];

type FilterTab = 'all' | 'bank' | 'tabung' | 'investment';

export function AccountsPage({ onBack, onSelectAccount, onSelectTabung, onNewTabung }: Props) {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAccName, setNewAccName] = useState('');
  const [newAccBalance, setNewAccBalance] = useState('');
  const [newAccType, setNewAccType] = useState<'bank' | 'wallet'>('bank');

  const totalBankBalance = BANK_ACCOUNTS.reduce((s, a) => s + a.balance, 0);
  const totalTabung = TABUNGS.reduce((s, t) => s + t.saved, 0);
  const totalInvestment = INVESTMENTS.reduce((s, i) => s + i.amount, 0);
  const netWorth = totalBankBalance + totalTabung + totalInvestment;

  const handleAddAccount = () => {
    setShowAddModal(false);
    setNewAccName('');
    setNewAccBalance('');
  };

  return (
    <div className="min-h-screen pb-6">
      {/* Header */}
      <div className="flex items-center justify-between p-4 mb-2">
        <button onClick={onBack} className="p-2 rounded-xl bg-card border border-border hover:bg-muted transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">Accounts</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="p-2 rounded-xl bg-primary text-black hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Net Worth Card */}
      <div className="mx-4 mb-5 bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 rounded-3xl p-5">
        <p className="text-sm text-muted-foreground mb-1">Total Net Worth</p>
        <p className="text-3xl font-bold mb-4">RM {netWorth.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</p>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-black/20 rounded-xl p-2.5 text-center">
            <p className="text-xs text-muted-foreground">Bank</p>
            <p className="font-bold text-sm">RM {totalBankBalance.toLocaleString()}</p>
          </div>
          <div className="bg-black/20 rounded-xl p-2.5 text-center">
            <p className="text-xs text-muted-foreground">Tabung</p>
            <p className="font-bold text-sm">RM {totalTabung}</p>
          </div>
          <div className="bg-black/20 rounded-xl p-2.5 text-center">
            <p className="text-xs text-muted-foreground">Invest</p>
            <p className="font-bold text-sm">RM {totalInvestment.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 px-4 mb-5 overflow-x-auto pb-1">
        {(['all', 'bank', 'tabung', 'investment'] as FilterTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap border transition-colors flex-shrink-0 capitalize ${
              activeTab === tab
                ? 'bg-primary text-black border-primary'
                : 'bg-card border-border text-muted-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="px-4 space-y-5">
        {/* Bank & Wallet Accounts */}
        {(activeTab === 'all' || activeTab === 'bank') && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-muted-foreground">Bank & Wallets</h3>
            </div>
            <div className="space-y-2">
              {BANK_ACCOUNTS.map((acc) => (
                <button
                  key={acc.id}
                  onClick={() => onSelectAccount(acc)}
                  className="w-full bg-card border border-border rounded-2xl p-4 flex items-center gap-3 hover:border-primary/50 active:bg-muted transition-all text-left"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ backgroundColor: (acc.color || '#C5FF00') + '22' }}
                  >
                    {acc.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{acc.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{acc.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">RM {acc.balance.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Available</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tabungs */}
        {(activeTab === 'all' || activeTab === 'tabung') && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <PiggyBank className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-medium text-muted-foreground">Tabung (Savings Goals)</h3>
              </div>
              <button
                onClick={onNewTabung}
                className="text-xs text-primary font-semibold"
              >
                + New
              </button>
            </div>
            <div className="space-y-2">
              {TABUNGS.map((t) => {
                const pct = Math.round((t.saved / t.target) * 100);
                return (
                  <button
                    key={t.id}
                    onClick={() => onSelectTabung(t)}
                    className="w-full bg-card border border-border rounded-2xl p-4 text-left hover:border-primary/50 active:bg-muted transition-all"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                        {t.icon}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.daysLeft} days left</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">{pct}%</p>
                        <p className="text-xs text-muted-foreground">RM {t.saved}/{t.target}</p>
                      </div>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Investments */}
        {(activeTab === 'all' || activeTab === 'investment') && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-muted-foreground">Investments</h3>
            </div>
            <div className="space-y-2">
              {INVESTMENTS.map((inv) => (
                <div
                  key={inv.name}
                  className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ backgroundColor: inv.color + '22' }}
                  >
                    {inv.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{inv.name}</p>
                    <p className="text-xs text-muted-foreground">Investment</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">RM {inv.amount.toLocaleString()}</p>
                    <p className="text-xs font-semibold" style={{ color: inv.color }}>{inv.return}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center" onClick={() => setShowAddModal(false)}>
          <div className="bg-background border border-border rounded-t-3xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">Add Account</h2>
              <button onClick={() => setShowAddModal(false)}>
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="flex gap-2 mb-4">
              {(['bank', 'wallet'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setNewAccType(type)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border font-semibold text-sm transition-colors capitalize ${
                    newAccType === type ? 'bg-primary text-black border-primary' : 'bg-card border-border text-muted-foreground'
                  }`}
                >
                  {type === 'bank' ? <Building2 className="w-4 h-4" /> : <Wallet className="w-4 h-4" />}
                  {type}
                </button>
              ))}
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Account Name</label>
                <input
                  type="text"
                  value={newAccName}
                  onChange={(e) => setNewAccName(e.target.value)}
                  placeholder="e.g. RHB Bank"
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Current Balance (RM)</label>
                <input
                  type="number"
                  value={newAccBalance}
                  onChange={(e) => setNewAccBalance(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <button onClick={handleAddAccount} className="w-full py-4 bg-primary text-black rounded-2xl font-bold flex items-center justify-center gap-2">
              <Check className="w-5 h-5" /> Add Account
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
