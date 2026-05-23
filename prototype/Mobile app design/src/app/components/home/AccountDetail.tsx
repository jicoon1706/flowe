import { useState } from 'react';
import { ChevronLeft, ArrowUpRight, ArrowDownLeft, MoreVertical, Copy, Eye, EyeOff } from 'lucide-react';

export interface BankAccount {
  id: string;
  type: 'bank' | 'wallet';
  name: string;
  balance: number;
  icon: string;
  accountNumber?: string;
  color?: string;
}

interface Props {
  account: BankAccount;
  onBack: () => void;
  onAddTransaction: () => void;
}

const MOCK_TRANSACTIONS: Record<string, { merchant: string; category: string; date: string; amount: number; icon: string }[]> = {
  Maybank: [
    { merchant: 'Salary', category: 'Income', date: 'May 1', amount: 3500, icon: '💼' },
    { merchant: 'Starbucks', category: 'Food & Drink', date: 'May 18', amount: -24.50, icon: '☕' },
    { merchant: 'Grab', category: 'Transport', date: 'May 17', amount: -12.00, icon: '🚗' },
    { merchant: 'Unifi Bill', category: 'Bills', date: 'May 15', amount: -89.00, icon: '🧾' },
    { merchant: 'Freelance', category: 'Income', date: 'May 10', amount: 800, icon: '💻' },
    { merchant: 'Shopee', category: 'Shopping', date: 'May 9', amount: -89.90, icon: '🛍️' },
  ],
  CIMB: [
    { merchant: 'EPF Dividend', category: 'Income', date: 'May 5', amount: 420, icon: '📈' },
    { merchant: 'TNG Reload', category: 'Transport', date: 'May 14', amount: -50, icon: '💳' },
    { merchant: 'McDonald\'s', category: 'Food', date: 'May 16', amount: -18.50, icon: '🍔' },
  ],
  'Cash Wallet': [
    { merchant: 'Morning Nasi Lemak', category: 'Food', date: 'May 18', amount: -7, icon: '🍛' },
    { merchant: 'Parking', category: 'Transport', date: 'May 17', amount: -5, icon: '🅿️' },
    { merchant: 'Teh Tarik', category: 'Food', date: 'May 16', amount: -3, icon: '🍵' },
  ],
};

export function AccountDetail({ account, onBack, onAddTransaction }: Props) {
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [copied, setCopied] = useState(false);

  const txns = MOCK_TRANSACTIONS[account.name] || [];
  const income = txns.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const expenses = txns.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const acctNum = account.accountNumber || '1234 5678 9012';

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const gradients: Record<string, string> = {
    Maybank: 'from-yellow-500/30 to-yellow-500/10',
    CIMB: 'from-red-500/30 to-red-500/10',
    'Cash Wallet': 'from-green-500/30 to-green-500/10',
  };
  const grad = gradients[account.name] || 'from-primary/30 to-primary/10';

  return (
    <div className="min-h-screen pb-6">
      {/* Header */}
      <div className="flex items-center justify-between p-4 mb-2">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-card border border-border hover:bg-muted transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">{account.name}</h1>
        <button className="p-2 rounded-xl bg-card border border-border hover:bg-muted transition-colors">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      {/* Balance Card */}
      <div className={`mx-4 bg-gradient-to-br ${grad} border border-primary/20 rounded-3xl p-6 mb-5`}>
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm text-muted-foreground">Total Balance</p>
          <button onClick={() => setBalanceVisible(!balanceVisible)}>
            {balanceVisible ? <Eye className="w-4 h-4 text-muted-foreground" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
          </button>
        </div>
        <p className="text-4xl font-bold mb-4">
          {balanceVisible ? `RM ${account.balance.toFixed(2)}` : 'RM ••••••'}
        </p>

        {account.type === 'bank' && (
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground font-mono">{acctNum}</p>
            <button onClick={handleCopy} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
              <Copy className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            {copied && <span className="text-xs text-primary">Copied!</span>}
          </div>
        )}
      </div>

      {/* Monthly Summary */}
      <div className="grid grid-cols-2 gap-3 mx-4 mb-5">
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 bg-green-500/20 rounded-full flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4 text-green-500" />
            </div>
            <span className="text-xs text-muted-foreground">Income</span>
          </div>
          <p className="font-bold text-green-400">+RM {income.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">This month</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 bg-red-500/20 rounded-full flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4 text-red-400" />
            </div>
            <span className="text-xs text-muted-foreground">Expenses</span>
          </div>
          <p className="font-bold text-red-400">-RM {expenses.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">This month</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mx-4 mb-6">
        <button
          onClick={onAddTransaction}
          className="flex-1 py-3 bg-primary text-black rounded-xl font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <ArrowUpRight className="w-4 h-4" /> Add Transaction
        </button>
        <button className="flex-1 py-3 bg-card border border-border rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-muted transition-colors">
          <ArrowDownLeft className="w-4 h-4" /> Transfer
        </button>
      </div>

      {/* Transactions */}
      <div className="px-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Transaction History</h3>
        <div className="space-y-2">
          {txns.map((t, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center text-xl">
                  {t.icon}
                </div>
                <div>
                  <p className="font-medium text-sm">{t.merchant}</p>
                  <p className="text-xs text-muted-foreground">{t.date} · {t.category}</p>
                </div>
              </div>
              <p className={`font-bold text-sm ${t.amount > 0 ? 'text-green-400' : 'text-foreground'}`}>
                {t.amount > 0 ? '+' : ''}RM {Math.abs(t.amount).toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
