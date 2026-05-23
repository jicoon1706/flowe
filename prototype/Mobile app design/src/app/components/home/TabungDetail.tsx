import { useState } from 'react';
import { ChevronLeft, Plus, Minus, Edit3, Target, Calendar, TrendingUp, X, Check, AlertCircle } from 'lucide-react';

export interface TabungData {
  id: string;
  name: string;
  saved: number;
  target: number;
  daysLeft: number;
  icon: string;
  description?: string;
  deadline?: string;
  color?: string;
}

interface Props {
  tabung: TabungData;
  onBack: () => void;
}

const CONTRIBUTIONS = [
  { date: 'May 18, 2026', amount: 50, note: 'Weekly top-up' },
  { date: 'May 11, 2026', amount: 50, note: 'Weekly top-up' },
  { date: 'May 4, 2026', amount: 100, note: 'Bonus savings' },
  { date: 'Apr 27, 2026', amount: 50, note: 'Weekly top-up' },
  { date: 'Apr 20, 2026', amount: 50, note: 'Weekly top-up' },
];

type HistoryEntry = { date: string; amount: number; note: string; type: 'topup' | 'withdraw' };

export function TabungDetail({ tabung, onBack }: Props) {
  const [showTopUp, setShowTopUp] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpNote, setTopUpNote] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawNote, setWithdrawNote] = useState('');
  const [currentSaved, setCurrentSaved] = useState(tabung.saved);
  const [editTarget, setEditTarget] = useState(tabung.target.toString());
  const [editName, setEditName] = useState(tabung.name);
  const [topUpSuccess, setTopUpSuccess] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>(
    CONTRIBUTIONS.map((c) => ({ ...c, type: 'topup' as const }))
  );

  const progress = Math.min((currentSaved / tabung.target) * 100, 100);
  const remaining = tabung.target - currentSaved;
  const weeklyNeeded = tabung.daysLeft > 0 ? (remaining / (tabung.daysLeft / 7)).toFixed(2) : '0.00';

  const handleTopUp = () => {
    const amt = parseFloat(topUpAmount);
    if (!amt || amt <= 0) return;
    setCurrentSaved((prev) => Math.min(prev + amt, tabung.target));
    setHistory((prev) => [
      { date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }), amount: amt, note: topUpNote || 'Top up', type: 'topup' },
      ...prev,
    ]);
    setTopUpSuccess(true);
    setTopUpAmount('');
    setTopUpNote('');
    setTimeout(() => {
      setShowTopUp(false);
      setTopUpSuccess(false);
    }, 1500);
  };

  const handleWithdraw = () => {
    const amt = parseFloat(withdrawAmount);
    setWithdrawError('');
    if (!amt || amt <= 0) return;
    if (amt > currentSaved) {
      setWithdrawError(`Cannot withdraw more than RM ${currentSaved.toFixed(2)}`);
      return;
    }
    setCurrentSaved((prev) => prev - amt);
    setHistory((prev) => [
      { date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }), amount: amt, note: withdrawNote || 'Withdrawal', type: 'withdraw' },
      ...prev,
    ]);
    setWithdrawSuccess(true);
    setWithdrawAmount('');
    setWithdrawNote('');
    setTimeout(() => {
      setShowWithdraw(false);
      setWithdrawSuccess(false);
    }, 1500);
  };

  const QUICK_AMOUNTS = [10, 20, 50, 100];

  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

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
        <h1 className="text-lg font-bold">{editName}</h1>
        <button
          onClick={() => setShowEdit(true)}
          className="p-2 rounded-xl bg-card border border-border hover:bg-muted transition-colors"
        >
          <Edit3 className="w-5 h-5" />
        </button>
      </div>

      {/* Progress Circle */}
      <div className="flex flex-col items-center py-6 mx-4 bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 rounded-3xl mb-5">
        <div className="relative w-36 h-36 mb-4">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="10" className="text-muted opacity-30" />
            <circle
              cx="60" cy="60" r="54" fill="none"
              stroke="#C5FF00" strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl mb-1">{tabung.icon}</span>
            <span className="text-lg font-bold text-primary">{Math.round(progress)}%</span>
          </div>
        </div>

        <div className="text-center">
          <p className="text-3xl font-bold">RM {currentSaved.toFixed(2)}</p>
          <p className="text-sm text-muted-foreground">of RM {tabung.target.toFixed(2)} goal</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 mx-4 mb-5">
        <div className="bg-card border border-border rounded-2xl p-3 text-center">
          <Target className="w-4 h-4 text-primary mx-auto mb-1" />
          <p className="font-bold text-sm">RM {remaining.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">Remaining</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-3 text-center">
          <Calendar className="w-4 h-4 text-primary mx-auto mb-1" />
          <p className="font-bold text-sm">{tabung.daysLeft}</p>
          <p className="text-xs text-muted-foreground">Days left</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-3 text-center">
          <TrendingUp className="w-4 h-4 text-primary mx-auto mb-1" />
          <p className="font-bold text-sm">RM {weeklyNeeded}</p>
          <p className="text-xs text-muted-foreground">Per week</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-4 mb-6 flex gap-3">
        <button
          onClick={() => setShowTopUp(true)}
          className="flex-1 py-4 bg-primary text-black rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5" /> Top Up
        </button>
        <button
          onClick={() => { setWithdrawError(''); setShowWithdraw(true); }}
          className="flex-1 py-4 bg-card border border-border text-foreground rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform hover:bg-muted"
        >
          <Minus className="w-5 h-5" /> Withdraw
        </button>
      </div>

      {/* Transaction History */}
      <div className="px-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Transaction History</h3>
        <div className="space-y-2">
          {history.map((c, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${c.type === 'withdraw' ? 'bg-red-500/15' : 'bg-primary/15'}`}>
                  {c.type === 'withdraw'
                    ? <Minus className="w-4 h-4 text-red-400" />
                    : <Plus className="w-4 h-4 text-primary" />}
                </div>
                <div>
                  <p className="font-medium text-sm">{c.note}</p>
                  <p className="text-xs text-muted-foreground">{c.date}</p>
                </div>
              </div>
              <p className={`font-bold ${c.type === 'withdraw' ? 'text-red-400' : 'text-primary'}`}>
                {c.type === 'withdraw' ? '-' : '+'}RM {c.amount.toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Top Up Modal */}
      {showTopUp && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center" onClick={() => setShowTopUp(false)}>
          <div
            className="bg-background border border-border rounded-t-3xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            {topUpSuccess ? (
              <div className="flex flex-col items-center py-6 gap-3">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                  <Check className="w-8 h-8 text-black" />
                </div>
                <p className="text-lg font-bold">Top Up Successful!</p>
                <p className="text-sm text-muted-foreground">Your tabung is growing 🌱</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold">Top Up {editName}</h2>
                  <button onClick={() => setShowTopUp(false)}>
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Amount (RM)</label>
                  <input
                    type="number"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary text-xl font-bold"
                  />
                </div>

                <div className="flex gap-2 mb-4">
                  {QUICK_AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setTopUpAmount(amt.toString())}
                      className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                        topUpAmount === amt.toString()
                          ? 'bg-primary text-black border-primary'
                          : 'bg-card border-border text-muted-foreground'
                      }`}
                    >
                      RM {amt}
                    </button>
                  ))}
                </div>

                <div className="mb-5">
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Note (optional)</label>
                  <input
                    type="text"
                    value={topUpNote}
                    onChange={(e) => setTopUpNote(e.target.value)}
                    placeholder="e.g. Weekly savings"
                    className="w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <button
                  onClick={handleTopUp}
                  className="w-full py-4 bg-primary text-black rounded-2xl font-bold"
                >
                  Confirm Top Up
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdraw && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center" onClick={() => setShowWithdraw(false)}>
          <div
            className="bg-background border border-border rounded-t-3xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            {withdrawSuccess ? (
              <div className="flex flex-col items-center py-6 gap-3">
                <div className="w-16 h-16 bg-red-500/20 border border-red-500/30 rounded-full flex items-center justify-center">
                  <Check className="w-8 h-8 text-red-400" />
                </div>
                <p className="text-lg font-bold">Withdrawal Successful</p>
                <p className="text-sm text-muted-foreground">Amount removed from your tabung</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold">Withdraw from {editName}</h2>
                  <button onClick={() => setShowWithdraw(false)}>
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>

                <div className="bg-muted/40 border border-border rounded-xl p-3 mb-4 flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Available balance:</span>
                  <span className="text-sm font-bold text-primary">RM {currentSaved.toFixed(2)}</span>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Amount (RM)</label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => { setWithdrawAmount(e.target.value); setWithdrawError(''); }}
                    placeholder="0.00"
                    className="w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-red-400 text-xl font-bold"
                  />
                  {withdrawError && (
                    <div className="flex items-center gap-1.5 mt-2 text-red-400">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <p className="text-xs">{withdrawError}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mb-4">
                  {QUICK_AMOUNTS.filter((a) => a <= currentSaved).map((amt) => (
                    <button
                      key={amt}
                      onClick={() => { setWithdrawAmount(amt.toString()); setWithdrawError(''); }}
                      className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                        withdrawAmount === amt.toString()
                          ? 'bg-red-500/20 text-red-400 border-red-500/40'
                          : 'bg-card border-border text-muted-foreground'
                      }`}
                    >
                      RM {amt}
                    </button>
                  ))}
                </div>

                <div className="mb-5">
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Note (optional)</label>
                  <input
                    type="text"
                    value={withdrawNote}
                    onChange={(e) => setWithdrawNote(e.target.value)}
                    placeholder="e.g. Emergency use"
                    className="w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-red-400"
                  />
                </div>

                <button
                  onClick={handleWithdraw}
                  className="w-full py-4 bg-red-500/20 border border-red-500/30 text-red-400 rounded-2xl font-bold hover:bg-red-500/30 transition-colors"
                >
                  Confirm Withdrawal
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Edit Goal Modal */}
      {showEdit && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center" onClick={() => setShowEdit(false)}>
          <div
            className="bg-background border border-border rounded-t-3xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">Edit Goal</h2>
              <button onClick={() => setShowEdit(false)}>
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-4 mb-5">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Tabung Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Target Amount (RM)</label>
                <input
                  type="number"
                  value={editTarget}
                  onChange={(e) => setEditTarget(e.target.value)}
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>
            <button
              onClick={() => setShowEdit(false)}
              className="w-full py-4 bg-primary text-black rounded-2xl font-bold"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
