import { useState } from 'react';
import { ChevronLeft, Plus, Trash2, X, RefreshCw, Calendar } from 'lucide-react';

interface Props {
  onBack: () => void;
}

interface RecurringPayment {
  id: string;
  name: string;
  amount: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  nextDate: string;
  category: string;
  active: boolean;
  emoji: string;
}

const DEFAULT_PAYMENTS: RecurringPayment[] = [
  { id: '1', name: 'Netflix', amount: 55, frequency: 'monthly', nextDate: '2026-06-01', category: 'Entertainment', active: true, emoji: '🎬' },
  { id: '2', name: 'Spotify', amount: 22, frequency: 'monthly', nextDate: '2026-06-05', category: 'Entertainment', active: true, emoji: '🎵' },
  { id: '3', name: 'Gym Membership', amount: 100, frequency: 'monthly', nextDate: '2026-06-01', category: 'Health', active: true, emoji: '💪' },
  { id: '4', name: 'Internet Bill', amount: 130, frequency: 'monthly', nextDate: '2026-06-10', category: 'Bills & Utilities', active: true, emoji: '📡' },
  { id: '5', name: 'Annual Insurance', amount: 1200, frequency: 'yearly', nextDate: '2026-12-15', category: 'Health', active: false, emoji: '🛡️' },
];

const FREQ_LABELS = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly' };
const FREQ_COLORS = { daily: '#ff6b6b', weekly: '#ffd93d', monthly: '#C5FF00', yearly: '#00d4ff' };

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function RecurringPaymentsSettings({ onBack }: Props) {
  const [payments, setPayments] = useState(DEFAULT_PAYMENTS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newFreq, setNewFreq] = useState<RecurringPayment['frequency']>('monthly');
  const [newDate, setNewDate] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const totalMonthly = payments
    .filter((p) => p.active)
    .reduce((sum, p) => {
      if (p.frequency === 'monthly') return sum + p.amount;
      if (p.frequency === 'yearly') return sum + p.amount / 12;
      if (p.frequency === 'weekly') return sum + p.amount * 4.33;
      if (p.frequency === 'daily') return sum + p.amount * 30;
      return sum;
    }, 0);

  const toggleActive = (id: string) => {
    setPayments((prev) => prev.map((p) => (p.id === id ? { ...p, active: !p.active } : p)));
  };

  const handleDelete = (id: string) => {
    setPayments((prev) => prev.filter((p) => p.id !== id));
    setDeleteId(null);
  };

  const handleAdd = () => {
    if (!newName.trim() || !newAmount || !newDate) return;
    const payment: RecurringPayment = {
      id: Date.now().toString(),
      name: newName.trim(),
      amount: parseFloat(newAmount),
      frequency: newFreq,
      nextDate: newDate,
      category: 'Others',
      active: true,
      emoji: '💳',
    };
    setPayments((prev) => [...prev, payment]);
    setNewName('');
    setNewAmount('');
    setNewDate('');
    setShowAddModal(false);
  };

  return (
    <div className="min-h-screen p-4 pb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-card border border-border hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Recurring Payments</h1>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="p-2 rounded-xl bg-primary text-black hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 rounded-2xl p-4 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <RefreshCw className="w-4 h-4 text-primary" />
          <span className="text-sm text-muted-foreground">Monthly Recurring</span>
        </div>
        <p className="text-2xl font-bold">RM {totalMonthly.toFixed(2)}</p>
        <p className="text-xs text-muted-foreground mt-1">{payments.filter((p) => p.active).length} active payments</p>
      </div>

      {/* Payment List */}
      <div className="space-y-3">
        {payments.map((payment) => (
          <div
            key={payment.id}
            className={`bg-card border rounded-xl p-4 transition-opacity ${
              payment.active ? 'border-border opacity-100' : 'border-border opacity-50'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-xl flex-shrink-0">
                {payment.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold truncate">{payment.name}</span>
                  <span className="font-bold ml-2 flex-shrink-0">RM {payment.amount.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{
                      backgroundColor: FREQ_COLORS[payment.frequency] + '22',
                      color: FREQ_COLORS[payment.frequency],
                    }}
                  >
                    {FREQ_LABELS[payment.frequency]}
                  </span>
                  <span className="text-xs text-muted-foreground">{payment.category}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>Next: {formatDate(payment.nextDate)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
              <button
                onClick={() => toggleActive(payment.id)}
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  payment.active ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    payment.active ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className="text-xs text-muted-foreground">{payment.active ? 'Active' : 'Paused'}</span>
              <div className="flex-1" />
              {deleteId === payment.id ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDelete(payment.id)}
                    className="text-xs px-3 py-1 bg-red-500/20 text-red-400 rounded-lg"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setDeleteId(null)}
                    className="text-xs px-3 py-1 bg-muted rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setDeleteId(payment.id)}
                  className="p-1.5 rounded-lg hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Payment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center" onClick={() => setShowAddModal(false)}>
          <div
            className="bg-background border border-border rounded-t-3xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">Add Recurring Payment</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 rounded-xl hover:bg-muted transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Payment Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Netflix, Gym..."
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Amount (RM)</label>
                <input
                  type="number"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Frequency</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((freq) => (
                    <button
                      key={freq}
                      onClick={() => setNewFreq(freq)}
                      className={`py-2 rounded-xl text-xs font-medium capitalize border transition-colors ${
                        newFreq === freq
                          ? 'bg-primary text-black border-primary'
                          : 'bg-card border-border text-muted-foreground'
                      }`}
                    >
                      {freq}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Next Payment Date</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <button
              onClick={handleAdd}
              className="w-full mt-6 py-4 bg-primary text-black rounded-2xl font-semibold"
            >
              Add Payment
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
