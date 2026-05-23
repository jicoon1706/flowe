import { useState } from 'react';
import { ChevronLeft, CheckCheck, Trash2 } from 'lucide-react';

interface Props {
  onBack: () => void;
}

interface Notification {
  id: string;
  emoji: string;
  message: string;
  sub?: string;
  type: 'expense' | 'income' | 'transfer' | 'recurring' | 'alert' | 'tabung' | 'milestone' | 'asset' | 'cashflow' | 'note' | 'affirmation' | 'project';
  timestamp: Date;
  read: boolean;
}

const COLOR_MAP: Record<Notification['type'], { bg: string; dot: string }> = {
  expense:     { bg: 'bg-red-500/15',     dot: 'bg-red-400' },
  income:      { bg: 'bg-green-500/15',   dot: 'bg-green-400' },
  transfer:    { bg: 'bg-blue-500/15',    dot: 'bg-blue-400' },
  recurring:   { bg: 'bg-blue-500/15',    dot: 'bg-blue-400' },
  alert:       { bg: 'bg-yellow-500/15',  dot: 'bg-yellow-400' },
  tabung:      { bg: 'bg-pink-500/15',    dot: 'bg-pink-400' },
  milestone:   { bg: 'bg-primary/15',     dot: 'bg-primary' },
  asset:       { bg: 'bg-primary/15',     dot: 'bg-primary' },
  cashflow:    { bg: 'bg-primary/15',     dot: 'bg-primary' },
  note:        { bg: 'bg-purple-500/15',  dot: 'bg-purple-400' },
  affirmation: { bg: 'bg-indigo-500/15',  dot: 'bg-indigo-400' },
  project:     { bg: 'bg-orange-500/15',  dot: 'bg-orange-400' },
};

const now = new Date();
const minsAgo  = (m: number) => new Date(now.getTime() - m * 60_000);
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3_600_000);
const daysAgo  = (d: number) => new Date(now.getTime() - d * 86_400_000);

const INITIAL: Notification[] = [
  {
    id: 'n1',
    emoji: '💎',
    message: "You've reached Rich pattern this month!",
    sub: 'Your passive income now covers all expenses. Keep growing your assets.',
    type: 'cashflow',
    timestamp: minsAgo(8),
    read: false,
  },
  {
    id: 'n2',
    emoji: '⏰',
    message: 'Unifi bill due tomorrow — RM 89',
    sub: 'Recurring expense · Bills & Utilities',
    type: 'alert',
    timestamp: minsAgo(34),
    read: false,
  },
  {
    id: 'n3',
    emoji: '✅',
    message: 'RM 24.50 — Food & Drink saved',
    sub: 'Tealive @ Mid Valley · Maybank',
    type: 'expense',
    timestamp: hoursAgo(2),
    read: false,
  },
  {
    id: 'n4',
    emoji: '💚',
    message: 'RM 3,500 Salary → Maybank',
    sub: 'Income recorded · 💼 Salary',
    type: 'income',
    timestamp: hoursAgo(5),
    read: false,
  },
  {
    id: 'n5',
    emoji: '🔁',
    message: 'RM 89 Unifi bill recorded automatically',
    sub: 'Recurring · Bills & Utilities · Maybank',
    type: 'recurring',
    timestamp: hoursAgo(9),
    read: false,
  },
  {
    id: 'n6',
    emoji: '🎉',
    message: 'Tabung Raya complete!',
    sub: 'Goal RM 500 reached. Well done! 🥳',
    type: 'milestone',
    timestamp: daysAgo(1),
    read: true,
  },
  {
    id: 'n7',
    emoji: '🔁',
    message: 'RM 200 Maybank → Tabung Raya',
    sub: 'Transfer · Tabung contribution',
    type: 'transfer',
    timestamp: daysAgo(1),
    read: true,
  },
  {
    id: 'n8',
    emoji: '⏰',
    message: 'Tabung Balik Kampung ends in 3 days',
    sub: 'RM 320 / RM 500 saved · 64% complete',
    type: 'alert',
    timestamp: daysAgo(1),
    read: true,
  },
  {
    id: 'n9',
    emoji: '📈',
    message: 'ASB added — RM 10,000',
    sub: 'Asset · ASB / ASB2 · +RM 0/mo passive income',
    type: 'asset',
    timestamp: daysAgo(2),
    read: true,
  },
  {
    id: 'n10',
    emoji: '🏦',
    message: 'Housing Loan CIMB added — RM 180,000',
    sub: 'Liability · Mortgage · RM 1,200/mo payment',
    type: 'asset',
    timestamp: daysAgo(2),
    read: true,
  },
  {
    id: 'n11',
    emoji: '📁',
    message: '"Belajar Saham & ETF" project created',
    sub: 'Financial Tasks · Learn section',
    type: 'project',
    timestamp: daysAgo(3),
    read: true,
  },
  {
    id: 'n12',
    emoji: '📌',
    message: 'Entry added to "Pelan Kewangan 2025"',
    sub: 'Financial Tasks · 3 entries now',
    type: 'project',
    timestamp: daysAgo(3),
    read: true,
  },
  {
    id: 'n13',
    emoji: '💬',
    message: '"Spend with intention, not impulse."',
    sub: 'Daily affirmation · ⚠️ Awareness',
    type: 'affirmation',
    timestamp: daysAgo(4),
    read: true,
  },
  {
    id: 'n14',
    emoji: '📝',
    message: '"Bajet Raya" note saved',
    sub: 'Financial Notes · tagged #raya #budget',
    type: 'note',
    timestamp: daysAgo(5),
    read: true,
  },
  {
    id: 'n15',
    emoji: '🐷',
    message: 'Tabung Raya created — Goal RM 500',
    sub: 'Linked to Maybank · Due 28 Mac 2026',
    type: 'tabung',
    timestamp: daysAgo(6),
    read: true,
  },
];

function formatTime(d: Date): string {
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return 'Baru sahaja';
  if (mins < 60) return `${mins} min lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs} jam lalu`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Semalam';
  return `${days} hari lalu`;
}

function isToday(d: Date) {
  const t = new Date();
  return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
}
function isYesterday(d: Date) {
  const y = new Date();
  y.setDate(y.getDate() - 1);
  return d.getDate() === y.getDate() && d.getMonth() === y.getMonth() && d.getFullYear() === y.getFullYear();
}

export function Notifications({ onBack }: Props) {
  const [items, setItems] = useState<Notification[]>(INITIAL);

  const unreadCount = items.filter((n) => !n.read).length;

  const markAllRead = () => setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  const markRead    = (id: string) => setItems((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  const deleteItem  = (id: string) => setItems((prev) => prev.filter((n) => n.id !== id));

  const today     = items.filter((n) => isToday(n.timestamp));
  const yesterday = items.filter((n) => isYesterday(n.timestamp));
  const earlier   = items.filter((n) => !isToday(n.timestamp) && !isYesterday(n.timestamp));

  const Section = ({ label, list }: { label: string; list: Notification[] }) => {
    if (list.length === 0) return null;
    return (
      <div className="mb-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-4 py-2">{label}</p>
        <div className="space-y-0.5 px-4">
          {list.map((n) => {
            const colors = COLOR_MAP[n.type];
            return (
              <div
                key={n.id}
                onClick={() => markRead(n.id)}
                className={`relative flex items-start gap-3 p-4 rounded-2xl cursor-pointer transition-all active:scale-[0.98] ${
                  n.read ? 'bg-card' : 'bg-card border border-primary/20'
                }`}
              >
                {/* Unread dot */}
                {!n.read && (
                  <span className="absolute top-3.5 right-3.5 w-2 h-2 rounded-full bg-primary" />
                )}

                {/* Icon */}
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 ${colors.bg}`}>
                  {n.emoji}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-4">
                  <p className={`text-sm leading-snug ${n.read ? 'text-foreground/80' : 'font-semibold text-foreground'}`}>
                    {n.message}
                  </p>
                  {n.sub && (
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.sub}</p>
                  )}
                  <p className="text-xs text-muted-foreground/60 mt-1">{formatTime(n.timestamp)}</p>
                </div>

                {/* Delete */}
                <button
                  onClick={(e) => { e.stopPropagation(); deleteItem(n.id); }}
                  className="absolute bottom-3.5 right-3.5 p-1 rounded-lg hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                  style={{ opacity: 0.35 }}
                >
                  <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-card border border-border hover:bg-muted transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-lg">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 px-3 py-2 bg-primary/10 text-primary rounded-xl text-xs font-semibold hover:bg-primary/20 transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto pb-6 pt-2">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center px-8">
            <div className="w-20 h-20 bg-muted rounded-3xl flex items-center justify-center mb-5 text-4xl">🔔</div>
            <p className="font-bold text-lg mb-2">All caught up!</p>
            <p className="text-sm text-muted-foreground">No notifications yet. We'll alert you when something happens.</p>
          </div>
        ) : (
          <>
            <Section label="Today" list={today} />
            <Section label="Yesterday" list={yesterday} />
            <Section label="Earlier" list={earlier} />
          </>
        )}
      </div>
    </div>
  );
}

// Export the unread count helper so Home can show the badge
export function getUnreadCount() {
  return INITIAL.filter((n) => !n.read).length;
}
