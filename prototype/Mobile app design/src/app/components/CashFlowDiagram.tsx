import { useState, useEffect, useRef } from 'react';
import { Info, X } from 'lucide-react';

type FinancialClass = 'poor' | 'middle' | 'rich';

interface CashFlowDiagramProps {
  financialClass: FinancialClass;
  totalIncome: number;
  passiveIncome: number;
  totalExpenses: number;
  totalAssets: number;
  totalLiabilities: number;
}

// ─── POOR ANIMATED DIAGRAM ─────────────────────────────────────────────────────
function PoorAnimatedDiagram({ income, expenses }: { income: number; expenses: number }) {
  const [key, setKey] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Restart animation every 5.5s
    timerRef.current = setInterval(() => setKey((k) => k + 1), 5500);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  return (
    <svg key={key} viewBox="0 0 300 370" className="w-full" style={{ maxHeight: 340 }}>
      <defs>
        <marker id="arr-pd" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <polygon points="0,0 7,3.5 0,7" fill="#ff6b6b" />
        </marker>
        <style>{`
          @keyframes pd-draw { to { stroke-dashoffset: 0; } }
          @keyframes pd-fade { from { opacity:0; } to { opacity:1; } }
          .pd-line { fill:none; stroke:#ff6b6b; stroke-width:2.5; stroke-dasharray:400; stroke-dashoffset:400; }
          .pd-a1 { animation: pd-draw 0.4s ease-out 0.2s forwards; }
          .pd-a2 { animation: pd-draw 0.35s ease-out 0.8s forwards; }
          .pd-a3 { animation: pd-draw 0.45s ease-out 1.3s forwards; }
          .pd-dot { opacity:0; animation: pd-fade 0.01s 2s forwards; }
          .pd-label { opacity:0; animation: pd-fade 0.3s ease-out 0.6s forwards; }
          .pd-label2 { opacity:0; animation: pd-fade 0.3s ease-out 1.1s forwards; }
          .pd-label3 { opacity:0; animation: pd-fade 0.3s ease-out 1.7s forwards; }
          .pd-warn { opacity:0; animation: pd-fade 0.5s ease-out 2.4s forwards; }
        `}</style>
      </defs>

      {/* ── INCOME STATEMENT box ── */}
      <text x="150" y="13" textAnchor="middle" fill="#ffffff" fillOpacity="0.3" fontSize="8" fontWeight="bold" letterSpacing="1.5">INCOME STATEMENT</text>
      <rect x="36" y="19" width="226" height="144" fill="none" stroke="#ff6b6b" strokeOpacity="0.22" strokeWidth="1.5" rx="6" />

      {/* Income row */}
      <rect x="36" y="19" width="226" height="62" fill="#ff6b6b" fillOpacity="0.09" rx="6" />
      <text x="80" y="44" fill="#ffffff" fontSize="11" fontWeight="bold">Income</text>
      <text x="80" y="60" fill="#ffffff" fillOpacity="0.45" fontSize="8.5">Salary / Freelance</text>
      <text x="256" y="50" textAnchor="end" fill="#ff6b6b" fontSize="11" fontWeight="bold" className="pd-label">
        RM {income.toLocaleString()}
      </text>

      {/* Divider */}
      <line x1="36" y1="81" x2="262" y2="81" stroke="#ffffff" strokeOpacity="0.12" strokeWidth="1" />

      {/* Expenses row */}
      <text x="80" y="104" fill="#ffffff" fontSize="11" fontWeight="bold">Expenses</text>
      <text x="80" y="120" fill="#ffffff" fillOpacity="0.45" fontSize="8.5">Rent • Food • Transport</text>
      <text x="80" y="133" fill="#ffffff" fillOpacity="0.45" fontSize="8.5">Bills • Everything</text>
      <text x="256" y="110" textAnchor="end" fill="#ff6b6b" fontSize="11" fontWeight="bold" className="pd-label2">
        RM {expenses.toLocaleString()}
      </text>

      {/* JOB bubble */}
      <circle cx="14" cy="50" r="11" fill="none" stroke="#ff6b6b" strokeWidth="1.5" />
      <text x="14" y="54" textAnchor="middle" fill="#ff6b6b" fontSize="7" fontWeight="bold">Job</text>

      {/* Arrow 1: Job → Income */}
      <path d="M 25,50 L 36,50" className="pd-line pd-a1" markerEnd="url(#arr-pd)" />
      {/* Arrow 2: Income → Expenses */}
      <path d="M 150,81 L 150,96" className="pd-line pd-a2" markerEnd="url(#arr-pd)" />
      {/* Arrow 3: Expenses → exit (💸 all gone) */}
      <path d="M 262,115 L 286,115" className="pd-line pd-a3" markerEnd="url(#arr-pd)" />
      <text x="284" y="109" fill="#ff6b6b" fillOpacity="0.9" fontSize="12" className="pd-label3">💸</text>

      {/* ── BALANCE SHEET box ── */}
      <text x="150" y="188" textAnchor="middle" fill="#ffffff" fillOpacity="0.3" fontSize="8" fontWeight="bold" letterSpacing="1.5">BALANCE SHEET</text>
      <rect x="36" y="194" width="226" height="128" fill="none" stroke="#ffffff" strokeOpacity="0.1" strokeWidth="1.5" rx="6" />
      <line x1="149" y1="194" x2="149" y2="322" stroke="#ffffff" strokeOpacity="0.1" strokeWidth="1" />

      {/* Assets (empty) */}
      <text x="92" y="222" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">Assets</text>
      <text x="92" y="268" textAnchor="middle" fill="#ffffff" fillOpacity="0.2" fontSize="28">∅</text>
      <text x="92" y="296" textAnchor="middle" fill="#ffffff" fillOpacity="0.2" fontSize="8">empty</text>

      {/* Liabilities (empty) */}
      <text x="205" y="222" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">Liabilities</text>
      <text x="205" y="268" textAnchor="middle" fill="#ffffff" fillOpacity="0.2" fontSize="28">∅</text>
      <text x="205" y="296" textAnchor="middle" fill="#ffffff" fillOpacity="0.2" fontSize="8">empty</text>

      {/* Warning label */}
      <text x="150" y="347" textAnchor="middle" fill="#ff6b6b" fillOpacity="0.75" fontSize="8.5" className="pd-warn">
        ⚠ All income consumed by expenses
      </text>

      {/* Moving money dot */}
      <circle r="5" fill="#ff6b6b" className="pd-dot">
        <animateMotion dur="2.8s" repeatCount="indefinite" begin="2s"
          path="M 14,50 L 36,50 L 149,50 L 149,81 L 149,115 L 262,115 L 286,115" />
      </circle>
    </svg>
  );
}

// ─── MIDDLE CLASS ANIMATED DIAGRAM ────────────────────────────────────────────
function MiddleAnimatedDiagram({ income, expenses, liabilities }: { income: number; expenses: number; liabilities: number }) {
  const [key, setKey] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => setKey((k) => k + 1), 7000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  return (
    <svg key={key} viewBox="0 0 300 385" className="w-full" style={{ maxHeight: 360 }}>
      <defs>
        <marker id="arr-md" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <polygon points="0,0 7,3.5 0,7" fill="#ffd93d" />
        </marker>
        <style>{`
          @keyframes md-draw { to { stroke-dashoffset: 0; } }
          @keyframes md-fade { from{opacity:0;} to{opacity:1;} }
          .md-line { fill:none; stroke:#ffd93d; stroke-width:2.5; stroke-dasharray:600; stroke-dashoffset:600; }
          .md-loop { fill:none; stroke:#ffd93d; stroke-width:2.5; stroke-dasharray:900; stroke-dashoffset:900; }
          .md-a1 { animation: md-draw 0.4s ease-out 0.2s forwards; }
          .md-a2 { animation: md-draw 0.4s ease-out 0.8s forwards; }
          .md-a3 { animation: md-draw 1.6s ease-out 1.4s forwards; }
          .md-dot  { opacity:0; animation: md-fade 0.01s 3.2s forwards; }
          .md-dot2 { opacity:0; animation: md-fade 0.01s 4.8s forwards; }
          .md-label  { opacity:0; animation: md-fade 0.3s ease-out 0.5s forwards; }
          .md-label2 { opacity:0; animation: md-fade 0.3s ease-out 1.1s forwards; }
          .md-label3 { opacity:0; animation: md-fade 0.3s ease-out 3s forwards; }
          .md-warn   { opacity:0; animation: md-fade 0.5s ease-out 3.5s forwards; }
        `}</style>
      </defs>

      {/* INCOME STATEMENT */}
      <text x="150" y="13" textAnchor="middle" fill="#ffffff" fillOpacity="0.3" fontSize="8" fontWeight="bold" letterSpacing="1.5">INCOME STATEMENT</text>
      <rect x="36" y="19" width="226" height="152" fill="none" stroke="#ffd93d" strokeOpacity="0.22" strokeWidth="1.5" rx="6" />
      <rect x="36" y="19" width="226" height="63" fill="#ffd93d" fillOpacity="0.09" rx="6" />

      <text x="80" y="44" fill="#ffffff" fontSize="11" fontWeight="bold">Income</text>
      <text x="80" y="60" fill="#ffffff" fillOpacity="0.45" fontSize="8.5">Salary (active)</text>
      <text x="256" y="50" textAnchor="end" fill="#ffd93d" fontSize="11" fontWeight="bold" className="md-label">
        RM {income.toLocaleString()}
      </text>

      <line x1="36" y1="82" x2="262" y2="82" stroke="#ffffff" strokeOpacity="0.12" strokeWidth="1" />

      <text x="80" y="105" fill="#ffffff" fontSize="11" fontWeight="bold">Expenses</text>
      <text x="80" y="121" fill="#ffffff" fillOpacity="0.45" fontSize="8.5">Mortgage • Car Loan</text>
      <text x="80" y="135" fill="#ffffff" fillOpacity="0.45" fontSize="8.5">Bills • Credit Card</text>
      <text x="80" y="149" fill="#ffffff" fillOpacity="0.45" fontSize="8.5">School Loan</text>
      <text x="256" y="111" textAnchor="end" fill="#ffd93d" fontSize="11" fontWeight="bold" className="md-label2">
        RM {expenses.toLocaleString()}
      </text>

      {/* JOB bubble */}
      <circle cx="14" cy="50" r="11" fill="none" stroke="#ffd93d" strokeWidth="1.5" />
      <text x="14" y="54" textAnchor="middle" fill="#ffd93d" fontSize="7" fontWeight="bold">Job</text>

      {/* Arrow 1: Job → Income */}
      <path d="M 25,50 L 36,50" className="md-line md-a1" markerEnd="url(#arr-md)" />
      {/* Arrow 2: Income → Expenses */}
      <path d="M 149,82 L 149,97" className="md-line md-a2" markerEnd="url(#arr-md)" />
      {/* Arrow 3: Liabilities drain back loop */}
      <path d="M 205,335 C 205,365 14,365 14,137 L 36,137" className="md-loop md-a3" markerEnd="url(#arr-md)" />

      {/* BALANCE SHEET */}
      <text x="150" y="202" textAnchor="middle" fill="#ffffff" fillOpacity="0.3" fontSize="8" fontWeight="bold" letterSpacing="1.5">BALANCE SHEET</text>
      <rect x="36" y="208" width="226" height="140" fill="none" stroke="#ffffff" strokeOpacity="0.1" strokeWidth="1.5" rx="6" />
      <line x1="149" y1="208" x2="149" y2="348" stroke="#ffffff" strokeOpacity="0.1" strokeWidth="1" />

      {/* Assets side */}
      <text x="92" y="232" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">Assets</text>
      <text x="92" y="258" textAnchor="middle" fill="#ffffff" fillOpacity="0.35" fontSize="8.5">House (some)</text>
      <text x="92" y="272" textAnchor="middle" fill="#ffffff" fillOpacity="0.35" fontSize="8.5">Car (some)</text>

      {/* Liabilities side */}
      <text x="205" y="232" textAnchor="middle" fill="#ffd93d" fontSize="10" fontWeight="bold">Liabilities</text>
      <text x="205" y="254" textAnchor="middle" fill="#ffd93d" fillOpacity="0.7" fontSize="8.5">Mortgage</text>
      <text x="205" y="268" textAnchor="middle" fill="#ffd93d" fillOpacity="0.7" fontSize="8.5">Car Loans</text>
      <text x="205" y="282" textAnchor="middle" fill="#ffd93d" fillOpacity="0.7" fontSize="8.5">Credit Cards</text>
      <text x="205" y="296" textAnchor="middle" fill="#ffd93d" fillOpacity="0.7" fontSize="8.5">Study Loan</text>
      <text x="256" y="310" textAnchor="end" fill="#ffd93d" fillOpacity="0.8" fontSize="9" className="md-label3">
        RM {liabilities.toLocaleString()}
      </text>

      {/* Drain warning */}
      <text x="150" y="365" textAnchor="middle" fill="#ffd93d" fillOpacity="0.75" fontSize="8.5" className="md-warn">
        ⚠ Liabilities drain income — trapped on the treadmill
      </text>

      {/* Dot 1 — main flow */}
      <circle r="5" fill="#ffd93d" className="md-dot">
        <animateMotion dur="3.5s" repeatCount="indefinite" begin="3.2s"
          path="M 14,50 L 36,50 L 149,50 L 149,82 L 149,137 L 36,137" />
      </circle>
      {/* Dot 2 — liability drain loop */}
      <circle r="4" fill="#ffd93d" fillOpacity="0.6" className="md-dot2">
        <animateMotion dur="4s" repeatCount="indefinite" begin="4.8s"
          path="M 205,335 C 205,365 14,365 14,137 L 36,137 L 149,137 L 149,82 L 149,50 L 36,50 L 14,50" />
      </circle>
    </svg>
  );
}

// ─── RICH ANIMATED DIAGRAM ─────────────────────────────────────────────────────
function RichAnimatedDiagram({ passive, expenses, assets }: { passive: number; expenses: number; assets: number }) {
  const [key, setKey] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => setKey((k) => k + 1), 7500);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  return (
    <svg key={key} viewBox="0 0 300 385" className="w-full" style={{ maxHeight: 360 }}>
      <defs>
        <marker id="arr-rd" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <polygon points="0,0 7,3.5 0,7" fill="#C5FF00" />
        </marker>
        <style>{`
          @keyframes rd-draw { to { stroke-dashoffset: 0; } }
          @keyframes rd-fade { from{opacity:0;} to{opacity:1;} }
          .rd-line { fill:none; stroke:#C5FF00; stroke-width:2.5; stroke-dasharray:600; stroke-dashoffset:600; }
          .rd-loop { fill:none; stroke:#C5FF00; stroke-width:2.5; stroke-dasharray:900; stroke-dashoffset:900; }
          .rd-a1 { animation: rd-draw 1.3s ease-out 0.2s forwards; }
          .rd-a2 { animation: rd-draw 0.3s ease-out 1.7s forwards; }
          .rd-a3 { animation: rd-draw 1.3s ease-out 2.1s forwards; }
          .rd-dot  { opacity:0; animation: rd-fade 0.01s 3.6s forwards; }
          .rd-dot2 { opacity:0; animation: rd-fade 0.01s 5.2s forwards; }
          .rd-pulse { opacity:0; animation: rd-fade 0.5s ease-out 0.1s forwards; }
          .rd-label  { opacity:0; animation: rd-fade 0.3s ease-out 0.8s forwards; }
          .rd-label2 { opacity:0; animation: rd-fade 0.3s ease-out 1.9s forwards; }
          .rd-label3 { opacity:0; animation: rd-fade 0.3s ease-out 3.6s forwards; }
          .rd-tip    { opacity:0; animation: rd-fade 0.5s ease-out 4.2s forwards; }
        `}</style>
      </defs>

      {/* INCOME STATEMENT */}
      <text x="150" y="13" textAnchor="middle" fill="#ffffff" fillOpacity="0.3" fontSize="8" fontWeight="bold" letterSpacing="1.5">INCOME STATEMENT</text>
      <rect x="36" y="19" width="226" height="148" fill="none" stroke="#C5FF00" strokeOpacity="0.35" strokeWidth="1.5" rx="6" />
      <rect x="36" y="19" width="226" height="63" fill="#C5FF00" fillOpacity="0.1" rx="6" />

      {/* Income */}
      <text x="80" y="44" fill="#ffffff" fontSize="11" fontWeight="bold">Income</text>
      <text x="80" y="59" fill="#C5FF00" fillOpacity="0.75" fontSize="8.5">Rental • Dividends</text>
      <text x="80" y="72" fill="#C5FF00" fillOpacity="0.75" fontSize="8.5">Interest • Royalties</text>
      <text x="256" y="50" textAnchor="end" fill="#C5FF00" fontSize="11" fontWeight="bold" className="rd-label">
        RM {passive.toLocaleString()}/mo
      </text>

      <line x1="36" y1="82" x2="262" y2="82" stroke="#C5FF00" strokeOpacity="0.2" strokeWidth="1" />

      {/* Expenses */}
      <text x="80" y="106" fill="#ffffff" fontSize="11" fontWeight="bold">Expenses</text>
      <text x="80" y="122" fill="#ffffff" fillOpacity="0.4" fontSize="8.5">Taxes • Living costs</text>
      <text x="80" y="136" fill="#ffffff" fillOpacity="0.4" fontSize="8.5">(minimal)</text>
      <text x="256" y="112" textAnchor="end" fill="#C5FF00" fillOpacity="0.7" fontSize="11" fontWeight="bold" className="rd-label2">
        RM {expenses.toLocaleString()}
      </text>

      {/* Arrow 1: Assets → Income (left loop up) */}
      <path d="M 92,213 C 10,213 10,50 36,50" className="rd-loop rd-a1" markerEnd="url(#arr-rd)" />
      {/* Arrow 2: Income → Expenses (internal) */}
      <path d="M 149,82 L 149,97" className="rd-line rd-a2" markerEnd="url(#arr-rd)" />
      {/* Arrow 3: Reinvest surplus → Assets (right loop down) */}
      <path d="M 262,50 C 296,50 296,325 92,325" className="rd-loop rd-a3" markerEnd="url(#arr-rd)" />

      {/* BALANCE SHEET */}
      <text x="150" y="202" textAnchor="middle" fill="#ffffff" fillOpacity="0.3" fontSize="8" fontWeight="bold" letterSpacing="1.5">BALANCE SHEET</text>
      <rect x="36" y="208" width="226" height="140" fill="none" stroke="#C5FF00" strokeOpacity="0.25" strokeWidth="1.5" rx="6" />
      <rect x="36" y="208" width="113" height="140" fill="#C5FF00" fillOpacity="0.06" rx="6" />
      <line x1="149" y1="208" x2="149" y2="348" stroke="#C5FF00" strokeOpacity="0.15" strokeWidth="1" />

      {/* Assets (glowing) */}
      <text x="92" y="232" textAnchor="middle" fill="#C5FF00" fontSize="10" fontWeight="bold">Assets</text>
      <text x="92" y="254" textAnchor="middle" fill="#C5FF00" fillOpacity="0.7" fontSize="8.5">Real Estate</text>
      <text x="92" y="268" textAnchor="middle" fill="#C5FF00" fillOpacity="0.7" fontSize="8.5">Stocks / ETF</text>
      <text x="92" y="282" textAnchor="middle" fill="#C5FF00" fillOpacity="0.7" fontSize="8.5">Unit Trusts</text>
      <text x="92" y="296" textAnchor="middle" fill="#C5FF00" fillOpacity="0.7" fontSize="8.5">Gold</text>
      <text x="92" y="318" textAnchor="middle" fill="#C5FF00" fontSize="9" fontWeight="bold" className="rd-label3">
        RM {assets.toLocaleString()}
      </text>

      {/* Liabilities (minimal) */}
      <text x="205" y="232" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">Liabilities</text>
      <text x="205" y="268" textAnchor="middle" fill="#ffffff" fillOpacity="0.25" fontSize="8.5">Mortgage</text>
      <text x="205" y="282" textAnchor="middle" fill="#ffffff" fillOpacity="0.25" fontSize="8.5">Consumer Loans</text>
      <text x="205" y="318" textAnchor="middle" fill="#ffffff" fillOpacity="0.18" fontSize="8.5">(minimal)</text>

      {/* Success tip */}
      <text x="150" y="365" textAnchor="middle" fill="#C5FF00" fillOpacity="0.75" fontSize="8.5" className="rd-tip">
        💎 Assets generate income → reinvest → grow
      </text>

      {/* Dot 1 — Assets → Income → Expenses loop */}
      <circle r="5" fill="#C5FF00" className="rd-dot">
        <animateMotion dur="3s" repeatCount="indefinite" begin="3.6s"
          path="M 92,213 C 10,213 10,50 36,50 L 149,50 L 149,82 L 149,167 L 92,167 L 92,213" />
      </circle>
      {/* Dot 2 — Reinvestment loop */}
      <circle r="4" fill="#C5FF00" fillOpacity="0.6" className="rd-dot2">
        <animateMotion dur="3.5s" repeatCount="indefinite" begin="5.2s"
          path="M 262,50 C 296,50 296,325 92,325 L 92,213 C 10,213 10,50 36,50" />
      </circle>
    </svg>
  );
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
export function CashFlowDiagram({
  financialClass,
  totalIncome,
  passiveIncome,
  totalExpenses,
  totalAssets,
  totalLiabilities,
}: CashFlowDiagramProps) {
  const [showInfo, setShowInfo] = useState(false);

  const config = {
    poor: {
      label: 'Poor Pattern',
      color: '#ff6b6b',
      borderColor: 'border-red-500/30',
      bgGlow: 'from-red-500/8 to-transparent',
      tagColor: 'bg-red-500/15 text-red-400 border-red-500/30',
      desc: 'Income flows directly into expenses. No assets working for you. The money is gone before it can grow.',
      tip: 'Start by saving 10% of every paycheck and open your first investment account.',
    },
    middle: {
      label: 'Middle Class Pattern',
      color: '#ffd93d',
      borderColor: 'border-yellow-500/30',
      bgGlow: 'from-yellow-500/8 to-transparent',
      tagColor: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
      desc: 'Income covers expenses AND liability payments. Debt creates a treadmill that keeps draining your cash flow.',
      tip: 'For every new loan ask: does this generate income? Build assets before upgrading lifestyle.',
    },
    rich: {
      label: 'Rich Pattern',
      color: '#C5FF00',
      borderColor: 'border-primary/30',
      bgGlow: 'from-primary/8 to-transparent',
      tagColor: 'bg-primary/15 text-primary border-primary/30',
      desc: 'Assets generate passive income that covers expenses. Surplus is reinvested into more assets — the cycle compounds.',
      tip: 'Keep growing your asset column. Reinvest every surplus ringgit.',
    },
  }[financialClass];

  return (
    <div className={`bg-card rounded-2xl border-2 ${config.borderColor} overflow-hidden`}>
      {/* Header */}
      <div className={`bg-gradient-to-br ${config.bgGlow} px-5 py-4 border-b ${config.borderColor}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-2.5 h-2.5 rounded-full animate-pulse"
              style={{ backgroundColor: config.color, boxShadow: `0 0 8px ${config.color}` }}
            />
            <div>
              <h3 className="font-bold text-sm" style={{ color: config.color }}>Cash Flow Pattern</h3>
              <span
                className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full border mt-0.5 ${config.tagColor}`}
              >
                {config.label}
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="p-2 rounded-xl bg-black/20 hover:bg-black/30 transition-colors"
          >
            {showInfo ? <X className="w-4 h-4 text-muted-foreground" /> : <Info className="w-4 h-4 text-muted-foreground" />}
          </button>
        </div>
      </div>

      {/* Info panel */}
      {showInfo && (
        <div
          className="px-5 py-4 border-b text-sm space-y-2"
          style={{ borderColor: config.color + '30', backgroundColor: config.color + '0a' }}
        >
          <p className="text-muted-foreground leading-relaxed">{config.desc}</p>
          <div
            className="flex items-start gap-2 rounded-xl p-3 border mt-1"
            style={{ borderColor: config.color + '40', backgroundColor: config.color + '10' }}
          >
            <span className="text-base flex-shrink-0">💡</span>
            <p className="text-xs" style={{ color: config.color }}>{config.tip}</p>
          </div>
        </div>
      )}

      {/* Animated diagram */}
      <div className="px-4 pt-3 pb-4">
        {financialClass === 'poor' && (
          <PoorAnimatedDiagram income={totalIncome} expenses={totalExpenses} />
        )}
        {financialClass === 'middle' && (
          <MiddleAnimatedDiagram income={totalIncome} expenses={totalExpenses} liabilities={totalLiabilities} />
        )}
        {financialClass === 'rich' && (
          <RichAnimatedDiagram passive={passiveIncome} expenses={totalExpenses} assets={totalAssets} />
        )}

        {/* Flow summary strip */}
        <div
          className="mt-1 rounded-xl px-4 py-2.5 flex items-center justify-center gap-2 text-xs font-medium border"
          style={{
            backgroundColor: config.color + '10',
            borderColor: config.color + '35',
            color: config.color,
          }}
        >
          {financialClass === 'poor' && (
            <>
              <span className="font-mono">Income</span>
              <span className="opacity-60">→</span>
              <span className="font-mono">Expenses</span>
              <span className="opacity-60">→</span>
              <span>💸 gone</span>
            </>
          )}
          {financialClass === 'middle' && (
            <>
              <span className="font-mono">Income</span>
              <span className="opacity-60">→</span>
              <span className="font-mono">Expenses + Debt</span>
              <span className="opacity-60">→</span>
              <span>🔄 treadmill</span>
            </>
          )}
          {financialClass === 'rich' && (
            <>
              <span className="font-mono">Assets</span>
              <span className="opacity-60">→</span>
              <span className="font-mono">Income</span>
              <span className="opacity-60">→</span>
              <span className="font-mono">More Assets</span>
              <span>💎</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
