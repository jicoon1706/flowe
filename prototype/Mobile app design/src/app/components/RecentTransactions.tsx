import { useState } from 'react';
import { X, Repeat, Bell, Paperclip } from 'lucide-react';

type TransactionType = 'expense' | 'income' | 'transfer';
type RecurringFrequency = 'monthly' | 'weekly' | 'yearly';

interface Transaction {
  id: number;
  type: TransactionType;
  name: string;
  amount: number;
  categoryId: string;
  categoryLabel: string;
  categoryIcon: string;
  account: string;
  toAccount?: string;
  date: string;
  recurring?: boolean;
  frequency?: RecurringFrequency;
  startDate?: string;
  endDate?: string;
  reminder?: boolean;
  note?: string;
  picture?: string;
}

const TYPE_STYLES: Record<TransactionType, { label: string; bg: string; text: string }> = {
  expense: { label: 'Expense', bg: 'bg-red-500/15', text: 'text-red-400' },
  income:  { label: 'Income',  bg: 'bg-green-500/15', text: 'text-green-400' },
  transfer:{ label: 'Transfer',bg: 'bg-blue-500/15', text: 'text-blue-400' },
};

function TransactionDetailModal({ transaction, onClose }: { transaction: Transaction; onClose: () => void }) {
  const isIncome = transaction.type === 'income';
  const isTransfer = transaction.type === 'transfer';
  const typeStyle = TYPE_STYLES[transaction.type];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-[448px] bg-card rounded-t-3xl pb-10 overflow-y-auto max-h-[90vh]"
        style={{ animation: 'slideUp 0.25s ease-out' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="sticky top-0 bg-card pt-4 pb-2 px-6 z-10">
          <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-4" />
          <button
            onClick={onClose}
            className="absolute top-4 right-5 p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6">
          {/* Type badge */}
          <div className="flex justify-center mb-4">
            <span className={`text-xs font-medium px-3 py-1 rounded-full ${typeStyle.bg} ${typeStyle.text}`}>
              {typeStyle.label}
            </span>
          </div>

          {/* Icon + Amount + Name */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center text-3xl mb-3">
              {transaction.categoryIcon}
            </div>
            <p className={`text-3xl font-bold ${isIncome ? 'text-green-400' : isTransfer ? 'text-blue-400' : 'text-foreground'}`}>
              {isIncome ? '+' : isTransfer ? '' : '-'}RM {Math.abs(transaction.amount).toFixed(2)}
            </p>
            <p className="text-muted-foreground text-sm mt-1">{transaction.name}</p>
          </div>

          {/* Details */}
          <div className="space-y-0 border border-border rounded-2xl overflow-hidden mb-4">
            <Row label="Category" value={`${transaction.categoryIcon} ${transaction.categoryLabel}`} />
            <Row label="Date" value={transaction.date} />

            {!isTransfer && (
              <Row label={isIncome ? 'To Account' : 'From Account'} value={transaction.account} />
            )}
            {isTransfer && (
              <>
                <Row label="From Account" value={transaction.account} />
                {transaction.toAccount && <Row label="To Account" value={transaction.toAccount} />}
              </>
            )}

            {transaction.recurring && (
              <>
                <Row
                  label="Recurring"
                  value={
                    <span className="flex items-center gap-1">
                      <Repeat className="w-3.5 h-3.5 text-primary" />
                      {transaction.frequency
                        ? transaction.frequency.charAt(0).toUpperCase() + transaction.frequency.slice(1)
                        : 'Yes'}
                    </span>
                  }
                />
                {transaction.startDate && <Row label="Start Date" value={transaction.startDate} />}
                {transaction.endDate
                  ? <Row label="End Date" value={transaction.endDate} />
                  : <Row label="End Date" value="Until stopped" dim />}
                <Row
                  label="Reminder"
                  value={
                    <span className="flex items-center gap-1">
                      <Bell className="w-3.5 h-3.5" />
                      {transaction.reminder ? 'On' : 'Off'}
                    </span>
                  }
                />
              </>
            )}

            {transaction.note && <Row label="Note" value={transaction.note} />}
          </div>

          {/* Receipt image */}
          {transaction.picture ? (
            <div className="mb-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <Paperclip className="w-3.5 h-3.5" />
                <span>Attached Receipt</span>
              </div>
              <img
                src={transaction.picture}
                alt="Receipt"
                className="w-full rounded-xl object-cover max-h-52 border border-border"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 py-4 rounded-xl border border-dashed border-border text-xs text-muted-foreground mb-4">
              <Paperclip className="w-4 h-4" />
              <span>No receipt attached</span>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function Row({
  label,
  value,
  dim,
}: {
  label: string;
  value: React.ReactNode;
  dim?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium text-right max-w-[55%] ${dim ? 'text-muted-foreground' : ''}`}>
        {value}
      </span>
    </div>
  );
}

interface Props {
  onSeeAll: () => void;
}

export function RecentTransactions({ onSeeAll }: Props) {
  const [selected, setSelected] = useState<Transaction | null>(null);

  const transactions: Transaction[] = [
    {
      id: 1,
      type: 'expense',
      name: 'Starbucks',
      amount: -24.50,
      categoryId: 'food',
      categoryLabel: 'Food & Drink',
      categoryIcon: '☕',
      account: 'Maybank',
      date: 'Today, 2:30 PM',
      note: 'Caramel macchiato + muffin',
      picture: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80',
    },
    {
      id: 2,
      type: 'income',
      name: 'Salary',
      amount: 3500.00,
      categoryId: 'salary',
      categoryLabel: 'Salary',
      categoryIcon: '💼',
      account: 'Maybank',
      date: 'May 1, 2025',
      recurring: true,
      frequency: 'monthly',
      startDate: 'Jan 1, 2025',
      reminder: true,
      note: 'Monthly salary – May 2025',
    },
    {
      id: 3,
      type: 'expense',
      name: 'Grab',
      amount: -12.00,
      categoryId: 'transport',
      categoryLabel: 'Transport',
      categoryIcon: '🚗',
      account: 'Cash Wallet',
      date: 'Yesterday',
      note: 'From office to home',
    },
    {
      id: 4,
      type: 'expense',
      name: 'Shopee',
      amount: -89.90,
      categoryId: 'shopping',
      categoryLabel: 'Shopping',
      categoryIcon: '🛍️',
      account: 'CIMB',
      date: 'May 16, 2025',
      note: 'Phone case + charger cable',
      picture: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&q=80',
    },
    {
      id: 5,
      type: 'expense',
      name: 'Unifi Bill',
      amount: -89.00,
      categoryId: 'bills',
      categoryLabel: 'Bills',
      categoryIcon: '🧾',
      account: 'Maybank',
      date: 'May 15, 2025',
      recurring: true,
      frequency: 'monthly',
      startDate: 'Jan 15, 2025',
      reminder: true,
    },
  ];

  return (
    <>
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-medium text-muted-foreground">Recent Transactions</h3>
          <button onClick={onSeeAll} className="text-xs text-primary hover:underline">See All</button>
        </div>
        <div className="space-y-3">
          {transactions.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelected(t)}
              className="w-full bg-card rounded-xl p-4 flex items-center justify-between border border-border hover:border-primary/50 active:scale-[0.98] transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center text-2xl">
                  {t.categoryIcon}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-medium">{t.name}</p>
                    {t.recurring && <span className="text-xs text-primary">🔁</span>}
                    {t.picture && <span className="text-xs text-muted-foreground">📎</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">{t.date}</p>
                </div>
              </div>
              <p className={`font-bold ${t.amount > 0 ? 'text-green-500' : 'text-foreground'}`}>
                {t.amount > 0 ? '+' : ''}RM {Math.abs(t.amount).toFixed(2)}
              </p>
            </button>
          ))}
        </div>
      </div>

      {selected && (
        <TransactionDetailModal transaction={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
