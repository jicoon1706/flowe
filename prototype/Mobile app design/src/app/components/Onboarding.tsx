import { useState, useRef } from 'react';
import { ChevronRight, Plus, X, Check, Trash2, ChevronDown } from 'lucide-react';

interface Props {
  onComplete: (data: OnboardingData) => void;
}

export interface OnboardingAccount {
  id: string;
  type: 'bank' | 'tabung' | 'wallet';
  name: string;
  balance: number;
  // tabung only
  target?: number;
  fromDate?: string;
  toDate?: string;
  linkedBankId?: string;
  icon: string;
  color: string;
}

export interface OnboardingData {
  name: string;
  accounts: OnboardingAccount[];
}

// ── Constants ─────────────────────────────────────────────────────────────────
const MY_BANKS = [
  { label: 'Maybank',           icon: '🏦', color: '#ffd93d' },
  { label: 'CIMB Bank',         icon: '🏦', color: '#ff6b6b' },
  { label: 'Public Bank',       icon: '🏦', color: '#00d4ff' },
  { label: 'RHB Bank',          icon: '🏦', color: '#6bcf7f' },
  { label: 'Hong Leong Bank',   icon: '🏦', color: '#C5FF00' },
  { label: 'AmBank',            icon: '🏦', color: '#a78bfa' },
  { label: 'Bank Islam',        icon: '🏦', color: '#34d399' },
  { label: 'Bank Rakyat',       icon: '🏦', color: '#f472b6' },
  { label: 'BSN',               icon: '🏦', color: '#60a5fa' },
  { label: 'Affin Bank',        icon: '🏦', color: '#fb923c' },
  { label: 'Alliance Bank',     icon: '🏦', color: '#c084fc' },
  { label: 'Other Bank',        icon: '🏦', color: '#94a3b8' },
];

const TABUNG_ICONS = ['🐷', '🎯', '✈️', '🏠', '🎓', '💍', '🌙', '🎄', '🏥', '🚗'];
const WALLET_COLORS = ['#6bcf7f', '#ffd93d', '#00d4ff', '#C5FF00', '#f472b6'];

type AccountType = 'bank' | 'tabung' | 'wallet';

interface AccountForm {
  type: AccountType;
  name: string;
  balance: string;
  bankIndex: number;
  customBankName: string;
  target: string;
  fromDate: string;
  toDate: string;
  linkedBankId: string;
  tabungIcon: string;
  showBankDropdown: boolean;
}

function emptyForm(): AccountForm {
  return {
    type: 'bank',
    name: '',
    balance: '',
    bankIndex: 0,
    customBankName: '',
    target: '',
    fromDate: '',
    toDate: '',
    linkedBankId: '',
    tabungIcon: '🐷',
    showBankDropdown: false,
  };
}

// ── Step indicator ─────────────────────────────────────────────────────────────
function StepBar({ step }: { step: 1 | 2 }) {
  const steps = [
    { n: 1, label: 'Your Name' },
    { n: 2, label: 'Accounts' },
  ];
  return (
    <div className="flex items-center gap-3 px-6 pt-8 pb-4">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center gap-3 flex-1">
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                s.n < step
                  ? 'bg-primary text-black'
                  : s.n === step
                  ? 'bg-primary text-black ring-4 ring-primary/25'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {s.n < step ? <Check className="w-4 h-4" /> : s.n}
            </div>
            <span
              className={`text-xs font-semibold ${
                s.n === step ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-0.5 rounded-full ${s.n < step ? 'bg-primary' : 'bg-muted'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Account type selector ──────────────────────────────────────────────────────
function TypeChip({
  type,
  icon,
  label,
  active,
  onClick,
}: {
  type: AccountType;
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl border-2 transition-all ${
        active
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border bg-card text-muted-foreground hover:border-primary/40'
      }`}
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-xs font-semibold">{label}</span>
    </button>
  );
}

// ── Added account card ─────────────────────────────────────────────────────────
function AccountChip({ acc, onRemove }: { acc: OnboardingAccount; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3">
      <span className="text-xl">{acc.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{acc.name}</p>
        <p className="text-xs text-muted-foreground">
          {acc.type === 'tabung'
            ? `🎯 Target RM ${Number(acc.target).toLocaleString()}`
            : `RM ${acc.balance.toFixed(2)}`}
        </p>
      </div>
      <span
        className="text-xs font-semibold px-2 py-0.5 rounded-full"
        style={{
          backgroundColor: acc.color + '25',
          color: acc.color,
        }}
      >
        {acc.type === 'bank' ? 'Bank' : acc.type === 'tabung' ? 'Tabung' : 'Wallet'}
      </span>
      <button
        onClick={onRemove}
        className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ── SCREEN 2.1 — Name ─────────────────────────────────────────────────────────
function NameScreen({ onNext }: { onNext: (name: string) => void }) {
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex-1 flex flex-col">
      <StepBar step={1} />

      <div className="flex-1 flex flex-col px-6 pt-6 pb-10">
        {/* Illustration */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-24 h-24 bg-primary/15 rounded-3xl flex items-center justify-center text-5xl">
              👋
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-base">
              😊
            </div>
          </div>
        </div>

        <h2 className="text-3xl font-bold mb-2 text-center">What should we<br />call you?</h2>
        <p className="text-muted-foreground text-sm text-center mb-8">
          We'll use your name to personalise your experience
        </p>

        {/* Name input */}
        <div className="relative mb-4">
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) onNext(name.trim()); }}
            placeholder="e.g. Ahmad, Siti, Lee…"
            className="w-full bg-card border-2 border-border rounded-2xl px-5 py-4 text-lg outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/50"
            autoFocus
            maxLength={30}
          />
          {name && (
            <button
              onClick={() => setName('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center mb-auto">
          This is stored only on your device
        </p>

        <button
          onClick={() => { if (name.trim()) onNext(name.trim()); }}
          disabled={!name.trim()}
          className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all mt-8 ${
            name.trim()
              ? 'bg-primary text-black active:scale-[0.98]'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
        >
          Next <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// ── SCREEN 2.2 — Add Accounts ─────────────────────────────────────────────────
function AccountsScreen({
  userName,
  onComplete,
}: {
  userName: string;
  onComplete: (accounts: OnboardingAccount[]) => void;
}) {
  const [accounts, setAccounts] = useState<OnboardingAccount[]>([]);
  const [form, setForm] = useState<AccountForm>(emptyForm());
  const [showForm, setShowForm] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const bankAccounts = accounts.filter((a) => a.type === 'bank');

  const setF = (patch: Partial<AccountForm>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (form.type === 'bank') {
      const bname =
        form.bankIndex === MY_BANKS.length - 1
          ? form.customBankName.trim()
          : MY_BANKS[form.bankIndex].label;
      if (!bname) e.name = 'Please enter a bank name';
      if (!form.balance || isNaN(Number(form.balance)))
        e.balance = 'Enter a valid balance';
    } else if (form.type === 'tabung') {
      if (!form.name.trim()) e.name = 'Tabung name required';
      if (!form.target || isNaN(Number(form.target)) || Number(form.target) <= 0)
        e.target = 'Enter a valid target amount';
    } else {
      if (!form.name.trim()) e.name = 'Wallet name required';
      if (!form.balance || isNaN(Number(form.balance)))
        e.balance = 'Enter a valid balance';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const addAccount = () => {
    if (!validate()) return;
    const id = Date.now().toString();

    let acc: OnboardingAccount;
    if (form.type === 'bank') {
      const bank = MY_BANKS[form.bankIndex];
      const name =
        form.bankIndex === MY_BANKS.length - 1
          ? form.customBankName.trim()
          : bank.label;
      acc = {
        id,
        type: 'bank',
        name,
        balance: Number(form.balance),
        icon: bank.icon,
        color: bank.color,
      };
    } else if (form.type === 'tabung') {
      acc = {
        id,
        type: 'tabung',
        name: form.name.trim(),
        balance: 0,
        target: Number(form.target),
        fromDate: form.fromDate,
        toDate: form.toDate,
        linkedBankId: form.linkedBankId,
        icon: form.tabungIcon,
        color: '#C5FF00',
      };
    } else {
      acc = {
        id,
        type: 'wallet',
        name: form.name.trim() || 'Cash Wallet',
        balance: Number(form.balance),
        icon: '👛',
        color: WALLET_COLORS[accounts.filter((a) => a.type === 'wallet').length % WALLET_COLORS.length],
      };
    }

    setAccounts((prev) => [...prev, acc]);
    setForm(emptyForm());
    setErrors({});
    setShowForm(false);
  };

  const removeAccount = (id: string) =>
    setAccounts((prev) => prev.filter((a) => a.id !== id));

  const selectedBank = MY_BANKS[form.bankIndex];
  const isCustomBank = form.bankIndex === MY_BANKS.length - 1;

  return (
    <div className="flex-1 flex flex-col">
      <StepBar step={2} />

      <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-5">
        <div>
          <h2 className="text-2xl font-bold mb-1">Set up your accounts</h2>
          <p className="text-sm text-muted-foreground">
            Add your bank accounts, tabung, and cash wallet, {userName}.
          </p>
        </div>

        {/* Added accounts list */}
        {accounts.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              Added ({accounts.length})
            </p>
            {accounts.map((acc) => (
              <AccountChip key={acc.id} acc={acc} onRemove={() => removeAccount(acc.id)} />
            ))}
          </div>
        )}

        {/* Add another button (when form hidden) */}
        {!showForm && (
          <button
            onClick={() => { setForm(emptyForm()); setShowForm(true); }}
            className="w-full py-3.5 border-2 border-dashed border-primary/40 rounded-2xl text-primary font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Another Account
          </button>
        )}

        {/* Account form */}
        {showForm && (
          <div className="bg-card border border-border rounded-3xl p-5 space-y-5">
            <p className="text-sm font-bold">
              {accounts.length === 0 ? 'Add your first account' : 'Add another account'}
            </p>

            {/* Type selector */}
            <div className="flex gap-3">
              <TypeChip
                type="bank"
                icon="🏦"
                label="Bank"
                active={form.type === 'bank'}
                onClick={() => setF({ type: 'bank' })}
              />
              <TypeChip
                type="tabung"
                icon="🐷"
                label="Tabung"
                active={form.type === 'tabung'}
                onClick={() => setF({ type: 'tabung' })}
              />
              <TypeChip
                type="wallet"
                icon="👛"
                label="Wallet"
                active={form.type === 'wallet'}
                onClick={() => setF({ type: 'wallet' })}
              />
            </div>

            {/* ── BANK FORM ── */}
            {form.type === 'bank' && (
              <div className="space-y-4">
                {/* Bank selector */}
                <div>
                  <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Bank</label>
                  <div className="relative">
                    <button
                      onClick={() => setF({ showBankDropdown: !form.showBankDropdown })}
                      className="w-full flex items-center justify-between bg-background border border-border rounded-xl px-4 py-3 text-sm"
                    >
                      <span className="flex items-center gap-2">
                        <span>{selectedBank.icon}</span>
                        <span>{isCustomBank ? (form.customBankName || 'Custom bank name…') : selectedBank.label}</span>
                      </span>
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </button>
                    {form.showBankDropdown && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setF({ showBankDropdown: false })}
                        />
                        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl z-20 max-h-52 overflow-y-auto">
                          {MY_BANKS.map((b, i) => (
                            <button
                              key={b.label}
                              onClick={() => setF({ bankIndex: i, showBankDropdown: false })}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted transition-colors text-left"
                            >
                              <span
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: b.color }}
                              />
                              {b.icon} {b.label}
                              {i === form.bankIndex && <Check className="w-4 h-4 text-primary ml-auto" />}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
                </div>

                {/* Custom bank name */}
                {isCustomBank && (
                  <div>
                    <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Bank Name</label>
                    <input
                      value={form.customBankName}
                      onChange={(e) => setF({ customBankName: e.target.value })}
                      placeholder="Enter bank name"
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-colors"
                    />
                  </div>
                )}

                {/* Balance */}
                <div>
                  <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Opening Balance (RM)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">RM</span>
                    <input
                      value={form.balance}
                      onChange={(e) => setF({ balance: e.target.value.replace(/[^0-9.]/g, '') })}
                      placeholder="0.00"
                      inputMode="decimal"
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 pl-10 text-sm outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  {errors.balance && <p className="text-xs text-red-400 mt-1">{errors.balance}</p>}
                </div>
              </div>
            )}

            {/* ── TABUNG FORM ── */}
            {form.type === 'tabung' && (
              <div className="space-y-4">
                {/* Icon picker */}
                <div>
                  <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Icon</label>
                  <div className="flex gap-2 flex-wrap">
                    {TABUNG_ICONS.map((icon) => (
                      <button
                        key={icon}
                        onClick={() => setF({ tabungIcon: icon })}
                        className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center border-2 transition-all ${
                          form.tabungIcon === icon
                            ? 'border-primary bg-primary/15'
                            : 'border-border bg-background'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tabung name */}
                <div>
                  <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Tabung Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => setF({ name: e.target.value })}
                    placeholder="e.g. Tabung Raya, Holiday Fund…"
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-colors"
                  />
                  {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
                </div>

                {/* Target */}
                <div>
                  <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Target Amount (RM)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">RM</span>
                    <input
                      value={form.target}
                      onChange={(e) => setF({ target: e.target.value.replace(/[^0-9.]/g, '') })}
                      placeholder="0.00"
                      inputMode="decimal"
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 pl-10 text-sm outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  {errors.target && <p className="text-xs text-red-400 mt-1">{errors.target}</p>}
                </div>

                {/* Date range */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground font-medium mb-1.5 block">From Date</label>
                    <input
                      type="date"
                      value={form.fromDate}
                      onChange={(e) => setF({ fromDate: e.target.value })}
                      className="w-full bg-background border border-border rounded-xl px-3 py-3 text-sm outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground font-medium mb-1.5 block">To Date</label>
                    <input
                      type="date"
                      value={form.toDate}
                      onChange={(e) => setF({ toDate: e.target.value })}
                      min={form.fromDate}
                      className="w-full bg-background border border-border rounded-xl px-3 py-3 text-sm outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>

                {/* Linked bank */}
                {bankAccounts.length > 0 && (
                  <div>
                    <label className="text-xs text-muted-foreground font-medium mb-1.5 block">
                      Linked Bank <span className="text-muted-foreground/50">(optional)</span>
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => setF({ linkedBankId: '' })}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                          !form.linkedBankId
                            ? 'bg-muted border-muted text-foreground'
                            : 'border-border text-muted-foreground'
                        }`}
                      >
                        None
                      </button>
                      {bankAccounts.map((b) => (
                        <button
                          key={b.id}
                          onClick={() => setF({ linkedBankId: b.id })}
                          className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                            form.linkedBankId === b.id
                              ? 'bg-primary/15 border-primary text-primary'
                              : 'border-border text-muted-foreground'
                          }`}
                        >
                          {b.icon} {b.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── WALLET FORM ── */}
            {form.type === 'wallet' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Wallet Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => setF({ name: e.target.value })}
                    placeholder="e.g. Cash Wallet, Dompet…"
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-colors"
                  />
                  {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Opening Balance (RM)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">RM</span>
                    <input
                      value={form.balance}
                      onChange={(e) => setF({ balance: e.target.value.replace(/[^0-9.]/g, '') })}
                      placeholder="0.00"
                      inputMode="decimal"
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 pl-10 text-sm outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  {errors.balance && <p className="text-xs text-red-400 mt-1">{errors.balance}</p>}
                </div>
              </div>
            )}

            {/* Form actions */}
            <div className="flex gap-3 pt-1">
              {accounts.length > 0 && (
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 bg-muted text-foreground rounded-xl font-semibold text-sm"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={addAccount}
                className="flex-1 py-3 bg-primary text-black rounded-xl font-bold text-sm flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Account
              </button>
            </div>
          </div>
        )}

        {/* Skip hint */}
        {accounts.length === 0 && (
          <p className="text-center text-xs text-muted-foreground/60">
            You can add accounts later in Settings
          </p>
        )}
      </div>

      {/* Footer CTA */}
      <div className="px-6 pb-8 pt-4 border-t border-border">
        <button
          onClick={() => onComplete(accounts)}
          className="w-full py-4 bg-primary text-black rounded-2xl font-bold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          {accounts.length === 0 ? "Skip for now" : `Done, Let's Go!`}
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// ── COMPLETION ANIMATION ────────────────────────────────────────────────────────
function DoneScreen({ userName, accountCount }: { userName: string; accountCount: number }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-6 pb-10">
      <div className="relative">
        <div className="absolute inset-0 blur-3xl bg-primary/20 rounded-full scale-150" />
        <div className="relative w-28 h-28 bg-primary rounded-3xl flex items-center justify-center text-6xl shadow-2xl">
          🎉
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-3xl font-bold">Welcome aboard,<br />{userName}!</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {accountCount > 0
            ? `${accountCount} account${accountCount > 1 ? 's' : ''} added. Your wallet is ready.`
            : 'Your wallet is ready. Add accounts anytime from home.'}
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 w-full text-left space-y-3">
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">What's next</p>
        {[
          { icon: '➕', text: 'Record your first transaction' },
          { icon: '💰', text: 'Check your Cash Flow status' },
          { icon: '📚', text: 'Learn from Rich Dad Poor Dad lessons' },
        ].map(({ icon, text }) => (
          <div key={text} className="flex items-center gap-3">
            <span className="text-lg">{icon}</span>
            <p className="text-sm text-muted-foreground">{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── MAIN ONBOARDING ───────────────────────────────────────────────────────────
export function Onboarding({ onComplete }: Props) {
  type Step = 'name' | 'accounts' | 'done';
  const [step, setStep] = useState<Step>('name');
  const [userName, setUserName] = useState('');
  const [accounts, setAccounts] = useState<OnboardingAccount[]>([]);

  const handleNameNext = (name: string) => {
    setUserName(name);
    setStep('accounts');
  };

  const handleAccountsDone = (accs: OnboardingAccount[]) => {
    setAccounts(accs);
    setStep('done');
    // auto-advance to app after brief celebration
    setTimeout(() => onComplete({ name: userName, accounts: accs }), 1800);
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground max-w-md mx-auto overflow-hidden">
      {step === 'name' && <NameScreen onNext={handleNameNext} />}
      {step === 'accounts' && (
        <AccountsScreen userName={userName} onComplete={handleAccountsDone} />
      )}
      {step === 'done' && (
        <DoneScreen userName={userName} accountCount={accounts.length} />
      )}
    </div>
  );
}
