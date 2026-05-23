import { useState } from 'react';
import { X, Camera, Calendar as CalendarIcon, Repeat, Paperclip } from 'lucide-react';

type TransactionType = 'expense' | 'income' | 'transfer';
type RecurringFrequency = 'monthly' | 'weekly' | 'yearly';

interface AddTransactionProps {
  onClose: () => void;
}

export function AddTransaction({ onClose }: AddTransactionProps) {
  const [activeTab, setActiveTab] = useState<TransactionType>('expense');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [account, setAccount] = useState('');
  const [toAccount, setToAccount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [reminder, setReminder] = useState(false);
  const [note, setNote] = useState('');

  const expenseCategories = [
    { id: 'food', label: 'Food & Drink', icon: '🍔' },
    { id: 'transport', label: 'Transport', icon: '🚗' },
    { id: 'bills', label: 'Bills', icon: '🧾' },
    { id: 'shopping', label: 'Shopping', icon: '🛍️' },
    { id: 'health', label: 'Health', icon: '💊' },
    { id: 'entertainment', label: 'Entertainment', icon: '🎬' },
    { id: 'others', label: 'Others', icon: '📦' }
  ];

  const incomeCategories = [
    { id: 'salary', label: 'Salary', icon: '💼' },
    { id: 'freelance', label: 'Freelance', icon: '💻' },
    { id: 'gift', label: 'Gift', icon: '🎁' },
    { id: 'cashback', label: 'Cashback', icon: '💰' },
    { id: 'dividends', label: 'Dividends', icon: '📈' },
    { id: 'rental', label: 'Rental', icon: '🏠' },
    { id: 'others', label: 'Others', icon: '📦' }
  ];

  const accounts = [
    { id: 'maybank', label: 'Maybank', type: 'bank' },
    { id: 'cimb', label: 'CIMB', type: 'bank' },
    { id: 'wallet', label: 'Cash Wallet', type: 'wallet' },
    { id: 'tabung-raya', label: 'Tabung Raya', type: 'tabung' }
  ];

  const categories = activeTab === 'expense' ? expenseCategories : incomeCategories;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle transaction submission
    console.log({
      type: activeTab,
      name,
      amount,
      category: category || 'others',
      account,
      toAccount,
      date,
      isRecurring,
      frequency,
      startDate,
      endDate,
      reminder,
      note
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-y-auto">
      <div className="min-h-screen p-4 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Add Transaction</h1>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scan Receipt Button */}
        <button className="w-full bg-primary text-primary-foreground rounded-xl p-4 flex items-center justify-center gap-2 mb-6 hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
          <Camera className="w-5 h-5" />
          <span className="font-medium">Scan Receipt</span>
        </button>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('expense')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-colors ${
              activeTab === 'expense'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border hover:bg-muted'
            }`}
          >
            Expense
          </button>
          <button
            onClick={() => setActiveTab('income')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-colors ${
              activeTab === 'income'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border hover:bg-muted'
            }`}
          >
            Income
          </button>
          <button
            onClick={() => setActiveTab('transfer')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-colors ${
              activeTab === 'transfer'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border hover:bg-muted'
            }`}
          >
            Transfer
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Transfer Tab */}
          {activeTab === 'transfer' ? (
            <>
              {/* From Account */}
              <div>
                <label className="block text-sm font-medium mb-2">From Account</label>
                <select
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  className="w-full bg-input-background border border-border rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="">Select account</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* To Account */}
              <div>
                <label className="block text-sm font-medium mb-2">To Account</label>
                <select
                  value={toAccount}
                  onChange={(e) => setToAccount(e.target.value)}
                  className="w-full bg-input-background border border-border rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="">Select account</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium mb-2">Amount (RM)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  className="w-full bg-input-background border border-border rounded-xl p-4 text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium mb-2">Date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-input-background border border-border rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <CalendarIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Transaction Name */}
              <div>
                <label className="block text-sm font-medium mb-2">Transaction Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={`e.g., ${activeTab === 'expense' ? 'Starbucks' : 'Monthly Salary'}`}
                  className="w-full bg-input-background border border-border rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium mb-2">Amount (RM)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  className="w-full bg-input-background border border-border rounded-xl p-4 text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`p-3 rounded-xl border transition-colors ${
                        category === cat.id
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-card border-border hover:bg-muted'
                      }`}
                    >
                      <div className="text-2xl mb-1">{cat.icon}</div>
                      <div className="text-xs">{cat.label}</div>
                    </button>
                  ))}
                </div>
                {!category && (
                  <p className="text-xs text-muted-foreground mt-2">
                    No category selected → auto "Others"
                  </p>
                )}
              </div>

              {/* Account */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {activeTab === 'expense' ? 'From Account' : 'To Account'}
                </label>
                <select
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  className="w-full bg-input-background border border-border rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="">Select account</option>
                  {accounts.filter(acc => acc.type !== 'tabung').map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium mb-2">Date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-input-background border border-border rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <CalendarIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </>
          )}

          {/* Recurring Toggle */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Repeat className="w-5 h-5 text-primary" />
                <span className="font-medium">Recurring</span>
              </div>
              <button
                type="button"
                onClick={() => setIsRecurring(!isRecurring)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  isRecurring ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    isRecurring ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {isRecurring && (
              <div className="space-y-4 pt-4 border-t border-border">
                {/* Frequency */}
                <div>
                  <label className="block text-sm font-medium mb-2">Frequency</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['monthly', 'weekly', 'yearly'] as RecurringFrequency[]).map((freq) => (
                      <button
                        key={freq}
                        type="button"
                        onClick={() => setFrequency(freq)}
                        className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                          frequency === freq
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted hover:bg-muted/80'
                        }`}
                      >
                        {freq.charAt(0).toUpperCase() + freq.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium mb-2">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-input-background border border-border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-sm font-medium mb-2">End Date (optional)</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    placeholder="Until I stop it"
                    className="w-full bg-input-background border border-border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave empty for "Until I stop it"
                  </p>
                </div>

                {/* Reminder */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Reminder before due</span>
                  <button
                    type="button"
                    onClick={() => setReminder(!reminder)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      reminder ? 'bg-primary' : 'bg-muted'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        reminder ? 'translate-x-6' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium mb-2">Note (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note..."
              rows={3}
              className="w-full bg-input-background border border-border rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          {/* Attach Image */}
          <button
            type="button"
            className="w-full bg-card border border-border rounded-xl p-4 flex items-center justify-center gap-2 hover:bg-muted transition-colors"
          >
            <Paperclip className="w-5 h-5" />
            <span className="font-medium">Attach Image (optional)</span>
          </button>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-primary text-primary-foreground rounded-xl p-4 font-bold text-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
          >
            {activeTab === 'transfer' ? 'Transfer' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  );
}
