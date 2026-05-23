import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useState } from 'react';

interface CalendarProps {
  onAddTransaction: () => void;
}

export function Calendar({ onAddTransaction }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState('May 2025');
  const [selectedDate, setSelectedDate] = useState<number | null>(null);

  // Sample calendar data
  const daysInMonth = 31;
  const firstDayOfMonth = 3; // Wednesday (0 = Sunday)

  const transactionsByDate: Record<number, Array<{type: 'expense' | 'income' | 'transfer', amount: number, name: string, category: string, time: string, icon: string, recurring?: boolean}>> = {
    1:  [{ type: 'income',  amount: 3500,  name: 'Salary',     category: 'Income',       time: '9:00 AM',  icon: '💼' }],
    10: [{ type: 'income',  amount: 800,   name: 'Freelance',  category: 'Income',       time: '2:15 PM',  icon: '💻' }],
    15: [{ type: 'expense', amount: 89,    name: 'Unifi Bill', category: 'Bills',        time: '8:00 AM',  icon: '🧾', recurring: true }],
    16: [{ type: 'expense', amount: 89.90, name: 'Shopee',     category: 'Shopping',     time: '11:30 AM', icon: '🛍️' }],
    17: [{ type: 'expense', amount: 12,    name: 'Grab',       category: 'Transport',    time: '7:45 AM',  icon: '🚗' }],
    18: [
      { type: 'expense', amount: 24.50, name: 'Starbucks', category: 'Food & Drink', time: '2:30 PM', icon: '☕' },
      { type: 'expense', amount: 15,    name: 'Lunch',     category: 'Food & Drink', time: '1:00 PM', icon: '🍛' },
    ],
  };

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const renderCalendarDays = () => {
    const days = [];

    // Empty cells for days before the first day of month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square" />);
    }

    // Actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const hasTransactions = transactionsByDate[day];
      const isSelected = selectedDate === day;
      const isToday = day === 18; // Mock today as 18th

      days.push(
        <button
          key={day}
          onClick={() => setSelectedDate(selectedDate === day ? null : day)}
          className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition-colors ${
            isSelected
              ? 'bg-primary text-primary-foreground'
              : isToday
              ? 'bg-primary/20 text-foreground'
              : 'hover:bg-muted'
          }`}
        >
          <span className="text-sm font-medium">{day}</span>
          {hasTransactions && (
            <div className="flex gap-0.5 mt-1">
              {hasTransactions.map((transaction, idx) => (
                <div
                  key={idx}
                  className={`w-1 h-1 rounded-full ${
                    transaction.type === 'expense'
                      ? 'bg-red-500'
                      : transaction.type === 'income'
                      ? 'bg-green-500'
                      : 'bg-blue-500'
                  }`}
                />
              ))}
            </div>
          )}
        </button>
      );
    }

    return days;
  };

  const allTransactions = Object.entries(transactionsByDate)
    .sort(([a], [b]) => Number(b) - Number(a))
    .flatMap(([, txns]) => txns);

  const displayTransactions = selectedDate
    ? (transactionsByDate[selectedDate] ?? [])
    : allTransactions;

  return (
    <div className="min-h-screen p-4 pb-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Calendar</h1>
        <div className="flex items-center justify-between bg-card rounded-xl p-4 border border-border">
          <button className="p-1 hover:bg-muted rounded-full">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-medium">{currentMonth}</span>
          <button className="p-1 hover:bg-muted rounded-full">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-green-500/10 rounded-xl p-3 border border-green-500/30">
            <p className="text-xs text-muted-foreground">Income</p>
            <p className="text-sm font-bold text-green-500">RM 4,800</p>
          </div>
          <div className="bg-red-500/10 rounded-xl p-3 border border-red-500/30">
            <p className="text-xs text-muted-foreground">Expense</p>
            <p className="text-sm font-bold text-red-500">RM 2,700</p>
          </div>
          <div className="bg-primary/10 rounded-xl p-3 border border-primary/30">
            <p className="text-xs text-muted-foreground">Net</p>
            <p className="text-sm font-bold text-primary">RM 2,100</p>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-card rounded-2xl p-4 mb-6 border border-border">
        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays.map((day, index) => (
            <div key={`weekday-${index}`} className="text-center text-xs text-muted-foreground font-medium">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-2">
          {renderCalendarDays()}
        </div>

        {/* Legend */}
        <div className="flex gap-4 mt-4 pt-4 border-t border-border justify-center text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-muted-foreground">Expense</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-muted-foreground">Income</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-muted-foreground">Transfer</span>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            {selectedDate ? `May ${selectedDate}, 2026` : 'All Transactions'}
          </h3>
          <button
            onClick={onAddTransaction}
            className="flex items-center gap-1.5 text-xs text-primary font-semibold hover:opacity-80 transition-opacity"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>

        {displayTransactions.length > 0 ? (
          <div className="space-y-3">
            {displayTransactions.map((transaction, idx) => (
              <div
                key={idx}
                className="bg-card rounded-xl p-4 flex items-center justify-between border border-border hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center text-2xl">
                    {transaction.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{transaction.name}</p>
                      {transaction.recurring && (
                        <span className="text-xs text-primary">🔁</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {transaction.time} · {transaction.category}
                    </p>
                  </div>
                </div>
                <p className={`font-bold ${transaction.type === 'income' ? 'text-green-500' : 'text-foreground'}`}>
                  {transaction.type === 'income' ? '+' : '-'}RM {transaction.amount.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-muted-foreground text-sm">
            No transactions for this date
          </div>
        )}
      </div>
    </div>
  );
}
