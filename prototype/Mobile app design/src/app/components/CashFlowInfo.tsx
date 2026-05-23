import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';

interface Props {
  onBack: () => void;
}

type Pattern = 'poor' | 'middle' | 'rich';

const PATTERNS: { key: Pattern; emoji: string; label: string; color: string; tagline: string }[] = [
  { key: 'poor',   emoji: '😰', label: 'Poor',   color: '#ff6b6b', tagline: 'Income → Expenses' },
  { key: 'middle', emoji: '😐', label: 'Middle',  color: '#ffd93d', tagline: 'Income → Liabilities → Expenses' },
  { key: 'rich',   emoji: '💎', label: 'Rich',    color: '#C5FF00', tagline: 'Assets → Income → Assets' },
];

const CONTENT: Record<Pattern, {
  title: string;
  quote: string;
  description: string;
  facts: string[];
  tip: string;
  tipLabel: string;
}> = {
  poor: {
    title: 'The Poor Cash Flow Pattern',
    quote: '"The poor and the middle class work for money. The rich have money work for them."',
    description:
      'A poor person\'s entire income flows directly into expenses — rent, food, transport, clothes. There are no assets being built and no liabilities. Every ringgit earned is spent. The balance sheet stays empty.',
    facts: [
      'All income comes from a job (active income)',
      'Every ringgit goes straight to daily expenses',
      'No assets accumulating in the balance sheet',
      'No investment or savings habit',
      'Financial stress increases when job is lost',
    ],
    tip: 'Start by saving 10% of every paycheck before spending. Open an ASB or fixed deposit account. Even RM 50/month builds the asset habit.',
    tipLabel: 'First Step',
  },
  middle: {
    title: 'The Middle Class Cash Flow Pattern',
    quote: '"The middle class buys liabilities that they think are assets — a house, a new car, appliances."',
    description:
      'The middle class earns more but also borrows more. Their income goes to expenses AND to monthly liability payments (mortgage, car loan, credit cards). Liabilities drain income back out — creating a treadmill that keeps them trapped.',
    facts: [
      'Income mainly from salary (still active income)',
      'Liabilities (loans) create monthly payment obligations',
      'Payments on liabilities drain income like expenses',
      'The more they earn, the more liabilities they take on',
      'Assets column exists but mostly lifestyle assets (car, house)',
    ],
    tip: 'Before taking any new loan, ask: "Does this asset generate income or drain it?" Focus on building income-generating assets, not lifestyle upgrades.',
    tipLabel: 'Key Rule',
  },
  rich: {
    title: 'The Rich Cash Flow Pattern',
    quote: '"Rich people acquire assets. The poor and middle class acquire liabilities they think are assets."',
    description:
      'The rich build an asset column first — real estate, stocks, business interests. These assets generate passive income (rental, dividends, royalties). That income covers expenses and the surplus is reinvested into more assets. The cycle self-compounds.',
    facts: [
      'Income comes FROM assets, not from a job',
      'Rental income, dividends, royalties flow into income',
      'Expenses are paid by passive income — not active work',
      'Surplus income is reinvested into more assets',
      'The asset column grows continuously and automatically',
    ],
    tip: 'Start by acquiring ONE income-generating asset: a unit trust, ASB, or rental property. When it generates RM 1 passively, you\'ve started the rich pattern.',
    tipLabel: 'Start Here',
  },
};

// ─── POOR DIAGRAM ────────────────────────────────────────────────────────────
function PoorDiagram() {
  return (
    <svg key="poor-svg" viewBox="0 0 300 365" className="w-full" style={{ maxHeight: 340 }}>
      <defs>
        <marker id="arr-p" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <polygon points="0,0 7,3.5 0,7" fill="#ff6b6b" />
        </marker>
        <style>{`
          @keyframes cf-draw { to { stroke-dashoffset: 0; } }
          @keyframes cf-dot-in { to { opacity: 1; } }
          .p-line { fill:none; stroke:#ff6b6b; stroke-width:2.5; stroke-dasharray:2000; stroke-dashoffset:2000; }
          .p-a1 { animation: cf-draw 0.35s ease-out 0.3s forwards; }
          .p-a2 { animation: cf-draw 0.35s ease-out 0.85s forwards; }
          .p-a3 { animation: cf-draw 0.45s ease-out 1.35s forwards; }
          .p-dot { opacity:0; animation: cf-dot-in 0.01s 2.1s forwards; }
        `}</style>
      </defs>

      {/* ── INCOME STATEMENT ── */}
      <text x="150" y="14" textAnchor="middle" fill="#ffffff" fillOpacity="0.35" fontSize="8.5" fontWeight="bold" letterSpacing="1.5">INCOME STATEMENT</text>
      {/* outer border */}
      <rect x="38" y="20" width="224" height="142" fill="none" stroke="#ffffff" strokeOpacity="0.18" strokeWidth="1.5" rx="5" />
      {/* Income fill */}
      <rect x="38" y="20" width="224" height="65" fill="#ff6b6b" fillOpacity="0.12" rx="5" />
      {/* Divider */}
      <line x1="38" y1="85" x2="262" y2="85" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="1" />
      {/* Income label */}
      <text x="150" y="50" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">Income</text>
      <text x="150" y="68" textAnchor="middle" fill="#ffffff" fillOpacity="0.5" fontSize="9">Salary</text>
      {/* Expenses label */}
      <text x="150" y="108" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">Expenses</text>
      <text x="124" y="124" textAnchor="middle" fill="#ffffff" fillOpacity="0.5" fontSize="8.5">Taxes • Rent • Food</text>
      <text x="140" y="138" textAnchor="middle" fill="#ffffff" fillOpacity="0.5" fontSize="8.5">Transport • Clothes</text>

      {/* JOB bubble (left) */}
      <circle cx="14" cy="52" r="11" fill="none" stroke="#ff6b6b" strokeWidth="1.5" />
      <text x="14" y="56" textAnchor="middle" fill="#ff6b6b" fontSize="7.5" fontWeight="bold">Job</text>

      {/* Arrow 1: Job → Income */}
      <path d="M 25,52 L 38,52" className="p-line p-a1" markerEnd="url(#arr-p)" />
      {/* Arrow 2: Income → Expenses */}
      <path d="M 150,85 L 150,100" className="p-line p-a2" markerEnd="url(#arr-p)" />
      {/* Arrow 3: Expenses → exit right (all gone) */}
      <path d="M 262,118 L 290,118" className="p-line p-a3" markerEnd="url(#arr-p)" />
      <text x="288" y="112" fill="#ff6b6b" fillOpacity="0.85" fontSize="11">💸</text>

      {/* ── BALANCE SHEET ── */}
      <text x="150" y="188" textAnchor="middle" fill="#ffffff" fillOpacity="0.35" fontSize="8.5" fontWeight="bold" letterSpacing="1.5">BALANCE SHEET</text>
      <rect x="38" y="194" width="224" height="130" fill="none" stroke="#ffffff" strokeOpacity="0.12" strokeWidth="1.5" rx="5" />
      <line x1="150" y1="194" x2="150" y2="324" stroke="#ffffff" strokeOpacity="0.12" strokeWidth="1" />
      <text x="94" y="222" textAnchor="middle" fill="#ffffff" fontSize="10.5" fontWeight="bold">Assets</text>
      <text x="94" y="264" textAnchor="middle" fill="#ffffff" fillOpacity="0.25" fontSize="22">/</text>
      <text x="94" y="290" textAnchor="middle" fill="#ffffff" fillOpacity="0.25" fontSize="9">empty</text>
      <text x="206" y="222" textAnchor="middle" fill="#ffffff" fontSize="10.5" fontWeight="bold">Liabilities</text>
      <text x="206" y="264" textAnchor="middle" fill="#ffffff" fillOpacity="0.25" fontSize="22">/</text>
      <text x="206" y="290" textAnchor="middle" fill="#ffffff" fillOpacity="0.25" fontSize="9">empty</text>

      {/* Money dot */}
      <circle r="5" fill="#ff6b6b" className="p-dot">
        <animateMotion dur="2.8s" repeatCount="indefinite" begin="2.1s"
          path="M 14,52 L 38,52 L 150,52 L 150,85 L 150,118 L 262,118 L 290,118" />
      </circle>
    </svg>
  );
}

// ─── MIDDLE CLASS DIAGRAM ─────────────────────────────────────────────────────
function MiddleDiagram() {
  return (
    <svg key="middle-svg" viewBox="0 0 300 375" className="w-full" style={{ maxHeight: 350 }}>
      <defs>
        <marker id="arr-m" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <polygon points="0,0 7,3.5 0,7" fill="#ffd93d" />
        </marker>
        <style>{`
          @keyframes cf-draw-m { to { stroke-dashoffset: 0; } }
          @keyframes cf-in-m { to { opacity: 1; } }
          .m-line { fill:none; stroke:#ffd93d; stroke-width:2.5; stroke-dasharray:2000; stroke-dashoffset:2000; }
          .m-a1 { animation: cf-draw-m 0.35s ease-out 0.3s forwards; }
          .m-a2 { animation: cf-draw-m 0.35s ease-out 0.85s forwards; }
          .m-a3 { animation: cf-draw-m 1.4s ease-out 1.35s forwards; }
          .m-dot { opacity:0; animation: cf-in-m 0.01s 3s forwards; }
        `}</style>
      </defs>

      {/* ── INCOME STATEMENT ── */}
      <text x="150" y="14" textAnchor="middle" fill="#ffffff" fillOpacity="0.35" fontSize="8.5" fontWeight="bold" letterSpacing="1.5">INCOME STATEMENT</text>
      <rect x="38" y="20" width="224" height="152" fill="none" stroke="#ffffff" strokeOpacity="0.18" strokeWidth="1.5" rx="5" />
      <rect x="38" y="20" width="224" height="65" fill="#ffd93d" fillOpacity="0.1" rx="5" />
      <line x1="38" y1="85" x2="262" y2="85" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="1" />
      <text x="150" y="50" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">Income</text>
      <text x="150" y="68" textAnchor="middle" fill="#ffffff" fillOpacity="0.5" fontSize="9">Salary</text>
      <text x="150" y="108" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">Expenses</text>
      <text x="150" y="124" textAnchor="middle" fill="#ffffff" fillOpacity="0.5" fontSize="8.5">Taxes • Mortgage Payment</text>
      <text x="150" y="138" textAnchor="middle" fill="#ffffff" fillOpacity="0.5" fontSize="8.5">Car Payment • Credit Card</text>
      <text x="150" y="152" textAnchor="middle" fill="#ffffff" fillOpacity="0.5" fontSize="8.5">School Loan Payment</text>

      {/* JOB bubble */}
      <circle cx="14" cy="52" r="11" fill="none" stroke="#ffd93d" strokeWidth="1.5" />
      <text x="14" y="56" textAnchor="middle" fill="#ffd93d" fontSize="7.5" fontWeight="bold">Job</text>

      {/* Arrow 1: Job → Income */}
      <path d="M 25,52 L 38,52" className="m-line m-a1" markerEnd="url(#arr-m)" />
      {/* Arrow 2: Income → Expenses */}
      <path d="M 150,85 L 150,100" className="m-line m-a2" markerEnd="url(#arr-m)" />
      {/* Arrow 3: Big loop — Liabilities drain back to Expenses */}
      {/* From right of liabilities column (x=262, y~310), swing right+down around, up left side to expenses */}
      <path
        d="M 206,330 C 206,362 14,362 14,136 L 38,136"
        className="m-line m-a3"
        markerEnd="url(#arr-m)"
      />

      {/* ── BALANCE SHEET ── */}
      <text x="150" y="202" textAnchor="middle" fill="#ffffff" fillOpacity="0.35" fontSize="8.5" fontWeight="bold" letterSpacing="1.5">BALANCE SHEET</text>
      <rect x="38" y="208" width="224" height="135" fill="none" stroke="#ffffff" strokeOpacity="0.12" strokeWidth="1.5" rx="5" />
      <line x1="150" y1="208" x2="150" y2="343" stroke="#ffffff" strokeOpacity="0.12" strokeWidth="1" />
      <text x="94" y="233" textAnchor="middle" fill="#ffffff" fontSize="10.5" fontWeight="bold">Assets</text>
      <text x="94" y="270" textAnchor="middle" fill="#ffffff" fillOpacity="0.3" fontSize="9">House (some)</text>
      <text x="94" y="285" textAnchor="middle" fill="#ffffff" fillOpacity="0.3" fontSize="9">Car (some)</text>
      <text x="206" y="233" textAnchor="middle" fill="#ffffff" fontSize="10.5" fontWeight="bold">Liabilities</text>
      <text x="206" y="258" textAnchor="middle" fill="#ffd93d" fillOpacity="0.7" fontSize="8.5">Mortgage</text>
      <text x="206" y="272" textAnchor="middle" fill="#ffd93d" fillOpacity="0.7" fontSize="8.5">Car Loans</text>
      <text x="206" y="286" textAnchor="middle" fill="#ffd93d" fillOpacity="0.7" fontSize="8.5">Credit Card</text>
      <text x="206" y="300" textAnchor="middle" fill="#ffd93d" fillOpacity="0.7" fontSize="8.5">School Loans</text>

      {/* Money dot — traces the big drain loop */}
      <circle r="5" fill="#ffd93d" className="m-dot">
        <animateMotion dur="4s" repeatCount="indefinite" begin="3s"
          path="M 14,52 L 38,52 L 150,52 L 150,85 L 150,136 L 38,136 M 206,330 C 206,362 14,362 14,136 L 38,136" />
      </circle>

      {/* Second dot showing the liability drain loop */}
      <circle r="4" fill="#ffd93d" fillOpacity="0.6" className="m-dot">
        <animateMotion dur="4s" repeatCount="indefinite" begin="5s"
          path="M 206,330 C 206,362 14,362 14,136 L 38,136 L 150,136 L 150,85 L 150,52 L 38,52 L 14,52" />
      </circle>
    </svg>
  );
}

// ─── RICH DIAGRAM ─────────────────────────────────────────────────────────────
function RichDiagram() {
  return (
    <svg key="rich-svg" viewBox="0 0 300 375" className="w-full" style={{ maxHeight: 350 }}>
      <defs>
        <marker id="arr-r" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <polygon points="0,0 7,3.5 0,7" fill="#C5FF00" />
        </marker>
        <style>{`
          @keyframes cf-draw-r { to { stroke-dashoffset: 0; } }
          @keyframes cf-in-r { to { opacity: 1; } }
          .r-line { fill:none; stroke:#C5FF00; stroke-width:2.5; stroke-dasharray:2000; stroke-dashoffset:2000; }
          .r-a1 { animation: cf-draw-r 1.2s ease-out 0.3s forwards; }
          .r-a2 { animation: cf-draw-r 0.3s ease-out 1.6s forwards; }
          .r-a3 { animation: cf-draw-r 1.2s ease-out 2s forwards; }
          .r-dot { opacity:0; animation: cf-in-r 0.01s 3.4s forwards; }
          .r-dot2 { opacity:0; animation: cf-in-r 0.01s 4.8s forwards; }
        `}</style>
      </defs>

      {/* ── INCOME STATEMENT ── */}
      <text x="150" y="14" textAnchor="middle" fill="#ffffff" fillOpacity="0.35" fontSize="8.5" fontWeight="bold" letterSpacing="1.5">INCOME STATEMENT</text>
      <rect x="38" y="20" width="224" height="145" fill="none" stroke="#C5FF00" strokeOpacity="0.3" strokeWidth="1.5" rx="5" />
      <rect x="38" y="20" width="224" height="65" fill="#C5FF00" fillOpacity="0.12" rx="5" />
      <line x1="38" y1="85" x2="262" y2="85" stroke="#C5FF00" strokeOpacity="0.3" strokeWidth="1" />
      {/* Income content */}
      <text x="150" y="48" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">Income</text>
      <text x="120" y="64" textAnchor="middle" fill="#C5FF00" fillOpacity="0.75" fontSize="8.5">Rental • Dividend • Interest</text>
      <text x="118" y="76" textAnchor="middle" fill="#C5FF00" fillOpacity="0.75" fontSize="8.5">Royalties</text>
      {/* Expenses content */}
      <text x="150" y="108" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">Expenses</text>
      <text x="150" y="124" textAnchor="middle" fill="#ffffff" fillOpacity="0.45" fontSize="8.5">Taxes • Mortgage Payment</text>
      <text x="130" y="138" textAnchor="middle" fill="#ffffff" fillOpacity="0.45" fontSize="8.5">(minimal)</text>

      {/* Arrow 1: Assets → Income (big left loop, upward) */}
      <path
        d="M 94,210 C 12,210 12,52 38,52"
        className="r-line r-a1"
        markerEnd="url(#arr-r)"
      />
      {/* Arrow 2: Income → Expenses (internal) */}
      <path d="M 150,85 L 150,100" className="r-line r-a2" markerEnd="url(#arr-r)" />
      {/* Arrow 3: Income reinvests → Assets (big right loop, downward) */}
      <path
        d="M 262,52 C 296,52 296,320 94,320"
        className="r-line r-a3"
        markerEnd="url(#arr-r)"
      />

      {/* ── BALANCE SHEET ── */}
      <text x="150" y="200" textAnchor="middle" fill="#ffffff" fillOpacity="0.35" fontSize="8.5" fontWeight="bold" letterSpacing="1.5">BALANCE SHEET</text>
      <rect x="38" y="206" width="224" height="140" fill="none" stroke="#C5FF00" strokeOpacity="0.25" strokeWidth="1.5" rx="5" />
      <line x1="150" y1="206" x2="150" y2="346" stroke="#C5FF00" strokeOpacity="0.2" strokeWidth="1" />
      <rect x="38" y="206" width="112" height="140" fill="#C5FF00" fillOpacity="0.06" rx="5" />
      <text x="94" y="230" textAnchor="middle" fill="#C5FF00" fontSize="10.5" fontWeight="bold">Assets</text>
      <text x="94" y="252" textAnchor="middle" fill="#C5FF00" fillOpacity="0.7" fontSize="8.5">Real Estate</text>
      <text x="94" y="266" textAnchor="middle" fill="#C5FF00" fillOpacity="0.7" fontSize="8.5">Stocks / Bonds</text>
      <text x="94" y="280" textAnchor="middle" fill="#C5FF00" fillOpacity="0.7" fontSize="8.5">Notes</text>
      <text x="94" y="294" textAnchor="middle" fill="#C5FF00" fillOpacity="0.7" fontSize="8.5">Intellectual Property</text>
      <text x="206" y="230" textAnchor="middle" fill="#ffffff" fontSize="10.5" fontWeight="bold">Liabilities</text>
      <text x="206" y="268" textAnchor="middle" fill="#ffffff" fillOpacity="0.3" fontSize="9">Mortgage</text>
      <text x="206" y="283" textAnchor="middle" fill="#ffffff" fillOpacity="0.3" fontSize="9">Consumer Loans</text>
      <text x="206" y="298" textAnchor="middle" fill="#ffffff" fillOpacity="0.3" fontSize="9">Credit Cards</text>
      <text x="206" y="315" textAnchor="middle" fill="#ffffff" fillOpacity="0.18" fontSize="8.5">(minimal)</text>

      {/* Dot 1 — Assets → Income loop */}
      <circle r="5" fill="#C5FF00" className="r-dot">
        <animateMotion dur="3s" repeatCount="indefinite" begin="3.4s"
          path="M 94,210 C 12,210 12,52 38,52 L 150,52 L 150,85 L 150,165 L 94,165 L 94,210" />
      </circle>
      {/* Dot 2 — Reinvestment loop (Income → Assets) */}
      <circle r="4" fill="#C5FF00" fillOpacity="0.65" className="r-dot2">
        <animateMotion dur="3.5s" repeatCount="indefinite" begin="4.8s"
          path="M 262,52 C 296,52 296,320 94,320 L 94,210 C 12,210 12,52 38,52" />
      </circle>
    </svg>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export function CashFlowInfo({ onBack }: Props) {
  const [pattern, setPattern] = useState<Pattern>('poor');

  const p = PATTERNS.find((x) => x.key === pattern)!;
  const c = CONTENT[pattern];

  const borderColor = { poor: '#ff6b6b', middle: '#ffd93d', rich: '#C5FF00' }[pattern];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border flex-shrink-0">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-card border border-border hover:bg-muted transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold">Cash Flow Guide</h1>
          <p className="text-xs text-muted-foreground">Rich Dad Poor Dad — Lesson 2</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-6">
        {/* Intro quote */}
        <div className="mx-4 mt-4 mb-4 bg-card border border-border rounded-2xl p-4">
          <p className="text-xs italic text-muted-foreground leading-relaxed">
            "The cash flow pattern of an asset puts money in your pocket. The cash flow pattern of a liability takes money from your pocket."
          </p>
          <p className="text-xs text-primary font-semibold mt-2">— Robert Kiyosaki, Rich Dad Poor Dad</p>
        </div>

        {/* Pattern Tabs */}
        <div className="flex gap-2 px-4 mb-5">
          {PATTERNS.map((pt) => (
            <button
              key={pt.key}
              onClick={() => setPattern(pt.key)}
              style={pattern === pt.key ? { borderColor: pt.color, color: pt.color, backgroundColor: pt.color + '18' } : {}}
              className={`flex-1 py-2.5 rounded-xl border font-semibold text-xs transition-all ${
                pattern === pt.key ? 'border-current' : 'border-border text-muted-foreground bg-card hover:bg-muted'
              }`}
            >
              {pt.emoji} {pt.label}
            </button>
          ))}
        </div>

        {/* Pattern Card */}
        <div className="px-4 space-y-4">
          {/* Title */}
          <div
            className="rounded-2xl p-4 border"
            style={{ borderColor: borderColor + '50', background: borderColor + '0d' }}
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl">{p.emoji}</span>
              <div>
                <h2 className="font-bold" style={{ color: borderColor }}>{c.title}</h2>
                <p className="text-xs text-muted-foreground font-mono">{p.tagline}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{c.description}</p>
          </div>

          {/* Animated Diagram */}
          <div
            className="rounded-2xl border p-4"
            style={{ borderColor: borderColor + '30', background: '#1a1a1a' }}
            key={pattern}
          >
            <p className="text-xs font-semibold mb-3 text-center" style={{ color: borderColor }}>
              — Cash Flow Pattern —
            </p>
            {pattern === 'poor' && <PoorDiagram />}
            {pattern === 'middle' && <MiddleDiagram />}
            {pattern === 'rich' && <RichDiagram />}
            <p className="text-xs text-center text-muted-foreground mt-2">Watch the money flow ↑</p>
          </div>

          {/* Key Facts */}
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-sm font-bold mb-3">Key Characteristics</p>
            <div className="space-y-2">
              {c.facts.map((fact, i) => (
                <div key={i} className="flex gap-2.5 items-start">
                  <span className="text-xs mt-0.5 flex-shrink-0" style={{ color: borderColor }}>●</span>
                  <p className="text-sm text-muted-foreground leading-relaxed">{fact}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quote */}
          <div
            className="rounded-2xl p-4 border"
            style={{ borderColor: borderColor + '30', background: borderColor + '0a' }}
          >
            <p className="text-xs font-semibold mb-2" style={{ color: borderColor }}>💬 Rich Dad Says</p>
            <p className="text-sm italic text-muted-foreground leading-relaxed">{c.quote}</p>
          </div>

          {/* Actionable Tip */}
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs px-2 py-0.5 rounded-full font-bold text-black" style={{ backgroundColor: borderColor }}>
                {c.tipLabel}
              </span>
              <span className="text-xs text-muted-foreground">Action for you</span>
            </div>
            <p className="text-sm text-foreground leading-relaxed">{c.tip}</p>
          </div>

          {/* Compare all patterns summary */}
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-sm font-bold mb-3">Pattern Comparison</p>
            <div className="space-y-2">
              {[
                { emoji: '😰', label: 'Poor', flow: 'Job → Income → Expenses', color: '#ff6b6b' },
                { emoji: '😐', label: 'Middle', flow: 'Job → Income → Liabilities → Expenses', color: '#ffd93d' },
                { emoji: '💎', label: 'Rich', flow: 'Assets → Income → Expenses + More Assets', color: '#C5FF00' },
              ].map((row) => (
                <div key={row.label} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                  <span className="text-lg flex-shrink-0">{row.emoji}</span>
                  <div>
                    <span className="text-xs font-bold" style={{ color: row.color }}>{row.label}</span>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">{row.flow}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
