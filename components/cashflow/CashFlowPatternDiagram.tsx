import { useState, useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import Svg, {
  Rect,
  Line,
  Path,
  Circle,
  Text as SvgText,
  Defs,
  Marker,
  Polygon,
} from 'react-native-svg';

type PatternKey = 'poor' | 'middle' | 'rich';

interface Props {
  pattern: PatternKey;
}

// ─── Geometry (viewBox 340 x 400) ──────────────────────────────────────────
const VB_W = 340;
const VB_H = 400;

// Income Statement
const IS_X = 70;
const IS_Y = 30;
const IS_W = 200;
const IS_H = 150;
const IS_SPLIT_Y = IS_Y + 60; // Income (top) / Expenses (bottom)

// Balance Sheet
const BS_X = 70;
const BS_Y = 220;
const BS_W = 200;
const BS_H = 150;
const BS_SPLIT_X = BS_X + BS_W / 2;

// Anchor points
const JOB = { x: 30, y: IS_Y + 30 };
const SALARY = { x: IS_X + IS_W - 8, y: IS_Y + 30 };
const EXPENSES_DOT = { x: IS_X + IS_W - 8, y: IS_SPLIT_Y + 30 };
const ASSETS_DOT = { x: BS_X + 30, y: BS_Y + 8 };
const LIAB_DOT = { x: BS_X + BS_W - 8, y: BS_Y + 8 };
const EXIT = { x: 325, y: IS_SPLIT_Y + 30 };

const COLORS: Record<PatternKey, string> = {
  poor: '#ff6b6b',
  middle: '#ffd93d',
  rich: '#C5FF00',
};

// ─── Animated dot ──────────────────────────────────────────────────────────
function AnimatedDot({
  pathRef,
  color,
  duration,
  totalLength,
}: {
  pathRef: React.RefObject<any>;
  color: string;
  duration: number;
  totalLength: number;
}) {
  const [pt, setPt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration,
        useNativeDriver: false,
      })
    );
    const id = progress.addListener(({ value }) => {
      const node = pathRef.current;
      if (node && typeof node.getPointAtLength === 'function') {
        try {
          const p = node.getPointAtLength(value * totalLength);
          setPt({ x: p.x, y: p.y });
        } catch {}
      }
    });
    loop.start();
    return () => {
      loop.stop();
      progress.removeListener(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration, totalLength]);

  return (
    <>
      <Circle cx={pt.x} cy={pt.y} r={6} fill={color} opacity={0.35} />
      <Circle cx={pt.x} cy={pt.y} r={3.5} fill={color} />
    </>
  );
}

// ─── Flow paths ────────────────────────────────────────────────────────────
function getFlowPath(p: PatternKey): { d: string; length: number; closed: boolean } {
  if (p === 'poor') {
    // Job → Income → straight down to Expenses → exit right
    const d =
      `M ${JOB.x + 14} ${JOB.y}` +
      ` C 80 30, 180 30, ${SALARY.x} ${SALARY.y}` +
      ` L ${EXPENSES_DOT.x} ${EXPENSES_DOT.y}` +
      ` L ${EXIT.x} ${EXIT.y}`;
    return { d, length: 380, closed: false };
  }

  if (p === 'middle') {
    // Job → Income → loops down around to Liabilities → up to Expenses → exit
    const d =
      `M ${JOB.x + 14} ${JOB.y}` +
      ` C 80 30, 180 30, ${SALARY.x} ${SALARY.y}` +
      ` C 305 100, 320 170, 310 210` +
      ` C 305 240, 290 245, ${LIAB_DOT.x} ${LIAB_DOT.y}` +
      ` C 240 180, 240 130, ${EXPENSES_DOT.x} ${EXPENSES_DOT.y}` +
      ` L ${EXIT.x} ${EXIT.y}`;
    return { d, length: 800, closed: false };
  }

  // rich: Assets → up & right to Income → down to Expenses → arc down & left back to Assets
  const d =
    `M ${ASSETS_DOT.x} ${ASSETS_DOT.y}` +
    ` C 60 160, 90 60, ${SALARY.x} ${SALARY.y}` +
    ` L ${EXPENSES_DOT.x} ${EXPENSES_DOT.y}` +
    ` C 320 180, 320 320, 200 365` +
    ` C 150 380, 100 360, ${ASSETS_DOT.x} ${ASSETS_DOT.y}`;
  return { d, length: 900, closed: true };
}

// ─── Per-pattern text content ──────────────────────────────────────────────
const CONTENT: Record<PatternKey, {
  income: string[];
  expenses: string[];
  assets: { text: string; dim?: boolean }[];
  liabilities: { text: string; dim?: boolean }[];
  showJob: boolean;
}> = {
  poor: {
    income: ['Salary'],
    expenses: ['Taxes', 'Rent · Food', 'Transport · Clothes'],
    assets: [{ text: '/', dim: true }, { text: 'empty', dim: true }],
    liabilities: [{ text: '/', dim: true }, { text: 'empty', dim: true }],
    showJob: true,
  },
  middle: {
    income: ['Salary'],
    expenses: [
      'Taxes · Mortgage Payment',
      'Car Payment · Credit Card',
      'School Loan Payment',
    ],
    assets: [
      { text: 'House (home)', dim: true },
      { text: 'Car (home)', dim: true },
    ],
    liabilities: [
      { text: 'Mortgage' },
      { text: 'Car Loans' },
      { text: 'Credit Card' },
      { text: 'School Loans' },
    ],
    showJob: true,
  },
  rich: {
    income: ['Rental · Dividend', 'Interest · Royalties'],
    expenses: ['Taxes', 'Mortgage (minimal)'],
    assets: [
      { text: 'Real Estate' },
      { text: 'Stocks / Bonds' },
      { text: 'Notes' },
      { text: 'Intellectual Property' },
    ],
    liabilities: [
      { text: 'Mortgage', dim: true },
      { text: 'Consumer Loans', dim: true },
      { text: 'Credit Cards', dim: true },
    ],
    showJob: false,
  },
};

export function CashFlowPatternDiagram({ pattern }: Props) {
  const pathRef = useRef<any>(null);
  const color = COLORS[pattern];
  const fillFaint = color + '12';
  const strokeFaint = color + '55';
  const content = CONTENT[pattern];
  const flow = getFlowPath(pattern);

  return (
    <View style={{ width: '100%' }}>
      <Svg viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%" height={340}>
        <Defs>
          <Marker id={`arrow-${pattern}`} markerWidth={8} markerHeight={8} refX={7} refY={4} orient="auto">
            <Polygon points="0,0 8,4 0,8" fill={color} />
          </Marker>
        </Defs>

        {/* ── INCOME STATEMENT ── */}
        <SvgText
          x={IS_X + IS_W / 2}
          y={IS_Y - 8}
          fill="#9ca3af"
          fontSize={9}
          fontWeight="700"
          textAnchor="middle"
        >
          INCOME STATEMENT
        </SvgText>
        <Rect
          x={IS_X}
          y={IS_Y}
          width={IS_W}
          height={IS_H}
          fill={fillFaint}
          stroke={strokeFaint}
          strokeWidth={1.5}
          rx={6}
        />
        <Line x1={IS_X} y1={IS_SPLIT_Y} x2={IS_X + IS_W} y2={IS_SPLIT_Y} stroke={strokeFaint} strokeWidth={1} />

        {/* Income label + items */}
        <SvgText x={IS_X + IS_W / 2} y={IS_Y + 16} fill="#f5f5f5" fontSize={11} fontWeight="700" textAnchor="middle">
          Income
        </SvgText>
        {content.income.map((line, i) => (
          <SvgText
            key={`inc-${i}`}
            x={IS_X + IS_W / 2}
            y={IS_Y + 30 + i * 11}
            fill="#bdbdbd"
            fontSize={8.5}
            textAnchor="middle"
          >
            {line}
          </SvgText>
        ))}

        {/* Expenses label + items */}
        <SvgText
          x={IS_X + IS_W / 2}
          y={IS_SPLIT_Y + 16}
          fill="#f5f5f5"
          fontSize={11}
          fontWeight="700"
          textAnchor="middle"
        >
          Expenses
        </SvgText>
        {content.expenses.map((line, i) => (
          <SvgText
            key={`exp-${i}`}
            x={IS_X + IS_W / 2}
            y={IS_SPLIT_Y + 30 + i * 11}
            fill="#bdbdbd"
            fontSize={8.5}
            textAnchor="middle"
          >
            {line}
          </SvgText>
        ))}

        {/* ── BALANCE SHEET ── */}
        <SvgText
          x={BS_X + BS_W / 2}
          y={BS_Y - 8}
          fill="#9ca3af"
          fontSize={9}
          fontWeight="700"
          textAnchor="middle"
        >
          BALANCE SHEET
        </SvgText>
        <Rect
          x={BS_X}
          y={BS_Y}
          width={BS_W}
          height={BS_H}
          fill={fillFaint}
          stroke={strokeFaint}
          strokeWidth={1.5}
          rx={6}
        />
        <Line x1={BS_SPLIT_X} y1={BS_Y} x2={BS_SPLIT_X} y2={BS_Y + BS_H} stroke={strokeFaint} strokeWidth={1} />

        {/* Assets */}
        <SvgText
          x={BS_X + BS_W / 4}
          y={BS_Y + 16}
          fill="#f5f5f5"
          fontSize={11}
          fontWeight="700"
          textAnchor="middle"
        >
          Assets
        </SvgText>
        {content.assets.map((item, i) => (
          <SvgText
            key={`a-${i}`}
            x={BS_X + BS_W / 4}
            y={BS_Y + 34 + i * 12}
            fill={item.dim ? '#6b7280' : '#bdbdbd'}
            fontSize={8.5}
            textAnchor="middle"
          >
            {item.text}
          </SvgText>
        ))}

        {/* Liabilities */}
        <SvgText
          x={BS_SPLIT_X + BS_W / 4}
          y={BS_Y + 16}
          fill="#f5f5f5"
          fontSize={11}
          fontWeight="700"
          textAnchor="middle"
        >
          Liabilities
        </SvgText>
        {content.liabilities.map((item, i) => (
          <SvgText
            key={`l-${i}`}
            x={BS_SPLIT_X + BS_W / 4}
            y={BS_Y + 34 + i * 12}
            fill={item.dim ? '#6b7280' : '#bdbdbd'}
            fontSize={8.5}
            textAnchor="middle"
          >
            {item.text}
          </SvgText>
        ))}

        {/* ── Job circle (poor/middle) ── */}
        {content.showJob && (
          <>
            <Circle cx={JOB.x} cy={JOB.y} r={14} fill="#1a1a1a" stroke={color} strokeWidth={1.5} />
            <SvgText x={JOB.x} y={JOB.y + 3.5} fill={color} fontSize={9} fontWeight="700" textAnchor="middle">
              Job
            </SvgText>
          </>
        )}

        {/* ── Anchor dots ── */}
        <Circle cx={SALARY.x} cy={SALARY.y} r={3} fill={color} />
        <Circle cx={EXPENSES_DOT.x} cy={EXPENSES_DOT.y} r={3} fill={color} />
        {pattern === 'middle' && (
          <Circle cx={LIAB_DOT.x} cy={LIAB_DOT.y} r={3} fill={color} />
        )}
        {pattern === 'rich' && (
          <Circle cx={ASSETS_DOT.x} cy={ASSETS_DOT.y} r={3} fill={color} />
        )}

        {/* ── Flow path ── */}
        <Path
          ref={pathRef}
          d={flow.d}
          stroke={color}
          strokeWidth={1.8}
          fill="none"
          strokeLinecap="round"
          markerEnd={flow.closed ? undefined : `url(#arrow-${pattern})`}
        />

        {/* Animated traveler dot */}
        <AnimatedDot pathRef={pathRef} color={color} duration={4500} totalLength={flow.length} />
      </Svg>
    </View>
  );
}
