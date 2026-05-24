import { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import Svg, { Rect, Line, Path, Circle, Text as SvgText, Defs, Marker, Polygon } from 'react-native-svg';
import { Info, X } from 'lucide-react-native';

type FinancialClass = 'poor' | 'middle' | 'rich';

interface CashFlowDiagramProps {
  financialClass: FinancialClass;
  totalIncome: number;
  passiveIncome: number;
  totalExpenses: number;
  totalAssets: number;
  totalLiabilities: number;
}

// ─── Diagram geometry (viewBox 340 x 370) ───────────────────────────────────
const VB_W = 340;
const VB_H = 370;

// Income Statement box
const IS_X = 70;
const IS_Y = 30;
const IS_W = 200;
const IS_H = 130;
const IS_SPLIT_Y = IS_Y + 50; // divider between Income (top, 30–80) and Expenses (80–160)

// Balance Sheet box
const BS_X = 70;
const BS_Y = 200;
const BS_W = 200;
const BS_H = 130;
const BS_SPLIT_X = BS_X + BS_W / 2; // 170 — divider Assets/Liabilities

// Anchor dots — placed on the RIGHT side of each section, away from left-aligned text
const JOB = { x: 30, y: IS_Y + 30 };          // (30, 60)
const SALARY = { x: 245, y: 55 };             // right side of Income section
const EXPENSES_DOT = { x: 245, y: 105 };      // right side of Expenses section
const ASSETS_DOT = { x: 130, y: 220 };        // top-left of Assets section
const LIAB_DOT = { x: 245, y: 220 };          // top-right of Liabilities section
const EXIT = { x: 320, y: 105 };              // arrow exits right of Expenses

// ─── Animated dot that walks an SVG path ───────────────────────────────────
interface AnimatedDotProps {
  pathRef: React.RefObject<any>;
  color: string;
  duration: number;
  totalLength: number;
}
function AnimatedDot({ pathRef, color, duration, totalLength }: AnimatedDotProps) {
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

  return <Circle cx={pt.x} cy={pt.y} r={4} fill={color} />;
}

// ─── Pattern config ────────────────────────────────────────────────────────
const PATTERN_CONFIG = {
  poor: {
    color: '#ff6b6b',
    borderColor: 'border-red-500/30',
    tagColor: 'bg-red-500/15 text-red-400 border-red-500/30',
    label: 'Poor Pattern',
    desc: 'Income flows directly into expenses. No assets working for you. The money is gone before it can grow.',
    tip: 'Start by saving 10% of every paycheck and open your first investment account.',
  },
  middle: {
    color: '#ffd93d',
    borderColor: 'border-yellow-500/30',
    tagColor: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    label: 'Middle Class Pattern',
    desc: 'Income covers expenses AND liability payments. Debt creates a treadmill that keeps draining your cash flow.',
    tip: 'For every new loan ask: does this generate income? Build assets before upgrading lifestyle.',
  },
  rich: {
    color: '#C5FF00',
    borderColor: 'border-primary/30',
    tagColor: 'bg-primary/15 text-primary border-primary/30',
    label: 'Rich Pattern',
    desc: 'Assets generate passive income that covers expenses. Surplus reinvests into more assets — the cycle compounds.',
    tip: 'Keep growing your asset column. Reinvest every surplus ringgit.',
  },
} as const;

// Flow paths per pattern. All routed along the RIGHT side so they don't cross text.
function getFlowPath(cls: FinancialClass): { d: string; length: number } {
  if (cls === 'poor') {
    // Job → Salary → straight down through Expenses → exit right
    const d =
      `M ${JOB.x + 14} ${JOB.y}` +
      ` C 80 25, 180 20, ${SALARY.x} ${SALARY.y}` +
      ` L ${EXPENSES_DOT.x} ${EXPENSES_DOT.y}` +
      ` L ${EXIT.x} ${EXIT.y}`;
    return { d, length: 380 };
  }

  if (cls === 'middle') {
    // Job → Salary → big loop down/right around Income Statement → up into Liabilities
    //      → curve up from Liabilities to Expenses → exit right
    const d =
      `M ${JOB.x + 14} ${JOB.y}` +
      ` C 80 25, 180 20, ${SALARY.x} ${SALARY.y}` +
      ` C 295 90, 310 140, 300 180` +
      ` C 295 225, 275 245, ${LIAB_DOT.x} ${LIAB_DOT.y}` +
      ` C 215 195, 215 135, ${EXPENSES_DOT.x} ${EXPENSES_DOT.y}` +
      ` L ${EXIT.x} ${EXIT.y}`;
    return { d, length: 760 };
  }

  // rich: Assets → Income (Salary/Passive) → Expenses → arc back to Assets (closed loop)
  const d =
    `M ${ASSETS_DOT.x} ${ASSETS_DOT.y}` +
    ` C 95 150, 120 70, ${SALARY.x} ${SALARY.y}` +
    ` C 260 75, 250 95, ${EXPENSES_DOT.x} ${EXPENSES_DOT.y}` +
    ` C 295 130, 305 230, 200 245` +
    ` C 170 248, 145 235, ${ASSETS_DOT.x} ${ASSETS_DOT.y}`;
  return { d, length: 740 };
}

export function CashFlowDiagram({
  financialClass,
  totalIncome,
  passiveIncome,
  totalExpenses,
  totalAssets,
  totalLiabilities,
}: CashFlowDiagramProps) {
  const [showInfo, setShowInfo] = useState(false);
  const config = PATTERN_CONFIG[financialClass] ?? PATTERN_CONFIG.poor;
  const flow = getFlowPath(financialClass);
  const pathRef = useRef<any>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const p = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 750, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.0, duration: 750, useNativeDriver: true }),
      ])
    );
    p.start();
    return () => p.stop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stroke = config.color;
  const strokeFaint = config.color + '55';
  const fillFaint = config.color + '10';

  return (
    <View className={`bg-card rounded-2xl border-2 ${config.borderColor} overflow-hidden`}>
      {/* Header */}
      <View className="px-5 py-4 border-b" style={{ borderColor: config.color + '30' }}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2.5">
            <Animated.View
              className="w-2.5 h-2.5 rounded-full"
              style={{
                backgroundColor: config.color,
                transform: [{ scale: pulseAnim }],
                shadowColor: config.color,
                shadowOpacity: 0.4,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 0 },
              }}
            />
            <View>
              <Text className="font-bold text-sm" style={{ color: config.color }}>Cash Flow Pattern</Text>
              <Text className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full border mt-0.5 ${config.tagColor}`}>
                {config.label}
              </Text>
            </View>
          </View>
          <Pressable onPress={() => setShowInfo(!showInfo)} className="p-2 rounded-xl bg-black/20">
            {showInfo ? <X size={16} color="#a0a0a0" /> : <Info size={16} color="#a0a0a0" />}
          </Pressable>
        </View>
      </View>

      {/* Info panel */}
      {showInfo && (
        <View className="px-5 py-4 border-b" style={{ borderColor: config.color + '30', backgroundColor: config.color + '0a' }}>
          <Text className="text-sm text-muted-foreground leading-relaxed mb-2">{config.desc}</Text>
          <View className="flex-row items-start gap-2 rounded-xl p-3 border" style={{ borderColor: config.color + '40', backgroundColor: config.color + '10' }}>
            <Text className="text-base">💡</Text>
            <Text className="text-xs flex-1" style={{ color: config.color }}>{config.tip}</Text>
          </View>
        </View>
      )}

      {/* Diagram */}
      <View className="px-3 pt-3 pb-4">
        <Svg viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%" height={340}>
          <Defs>
            <Marker
              id="arrowhead"
              markerWidth={8}
              markerHeight={8}
              refX={7}
              refY={4}
              orient="auto"
            >
              <Polygon points="0,0 8,4 0,8" fill={stroke} />
            </Marker>
          </Defs>

          {/* ── INCOME STATEMENT ─────────────────────────── */}
          <SvgText x={IS_X + IS_W / 2} y={IS_Y - 8} fill="#e5e5e5" fontSize={10} fontWeight="700" textAnchor="middle">
            INCOME STATEMENT
          </SvgText>
          <Rect x={IS_X} y={IS_Y} width={IS_W} height={IS_H} fill={fillFaint} stroke={strokeFaint} strokeWidth={1.5} rx={6} />
          <Line x1={IS_X} y1={IS_SPLIT_Y} x2={IS_X + IS_W} y2={IS_SPLIT_Y} stroke={strokeFaint} strokeWidth={1} />

          {/* Income section (left-aligned text, anchor on right) */}
          <SvgText x={IS_X + 10} y={IS_Y + 18} fill="#e5e5e5" fontSize={11} fontWeight="700">Income</SvgText>
          <SvgText x={IS_X + 10} y={IS_Y + 33} fill="#bdbdbd" fontSize={9}>Salary, Freelance</SvgText>

          {/* Expenses section */}
          <SvgText x={IS_X + 10} y={IS_SPLIT_Y + 16} fill="#e5e5e5" fontSize={11} fontWeight="700">Expenses</SvgText>
          <SvgText x={IS_X + 10} y={IS_SPLIT_Y + 30} fill="#bdbdbd" fontSize={9}>Bills · Food · Transport</SvgText>
          {financialClass !== 'rich' && (
            <SvgText x={IS_X + 10} y={IS_SPLIT_Y + 43} fill="#bdbdbd" fontSize={9}>Mortgage · Car · Loans</SvgText>
          )}

          {/* ── BALANCE SHEET ───────────────────────────── */}
          <SvgText x={BS_X + BS_W / 2} y={BS_Y - 8} fill="#e5e5e5" fontSize={10} fontWeight="700" textAnchor="middle">
            BALANCE SHEET
          </SvgText>
          <Rect x={BS_X} y={BS_Y} width={BS_W} height={BS_H} fill={fillFaint} stroke={strokeFaint} strokeWidth={1.5} rx={6} />
          <Line x1={BS_SPLIT_X} y1={BS_Y} x2={BS_SPLIT_X} y2={BS_Y + BS_H} stroke={strokeFaint} strokeWidth={1} />

          {/* Assets */}
          <SvgText x={BS_X + 10} y={BS_Y + 18} fill="#e5e5e5" fontSize={11} fontWeight="700">Assets</SvgText>
          {financialClass === 'rich' && (
            <>
              <SvgText x={BS_X + 10} y={BS_Y + 60} fill="#bdbdbd" fontSize={9}>Real Estate</SvgText>
              <SvgText x={BS_X + 10} y={BS_Y + 73} fill="#bdbdbd" fontSize={9}>Stocks · ASB · FD</SvgText>
            </>
          )}

          {/* Liabilities */}
          <SvgText x={BS_SPLIT_X + 10} y={BS_Y + 18} fill="#e5e5e5" fontSize={11} fontWeight="700">Liabilities</SvgText>
          {financialClass === 'middle' && (
            <>
              <SvgText x={BS_SPLIT_X + 10} y={BS_Y + 60} fill="#bdbdbd" fontSize={9}>Mortgage</SvgText>
              <SvgText x={BS_SPLIT_X + 10} y={BS_Y + 73} fill="#bdbdbd" fontSize={9}>Car Loans</SvgText>
              <SvgText x={BS_SPLIT_X + 10} y={BS_Y + 86} fill="#bdbdbd" fontSize={9}>Credit Card</SvgText>
              <SvgText x={BS_SPLIT_X + 10} y={BS_Y + 99} fill="#bdbdbd" fontSize={9}>Study Loans</SvgText>
            </>
          )}

          {/* ── Job circle (poor/middle) ───────────────────────── */}
          {financialClass !== 'rich' && (
            <>
              <Circle cx={JOB.x} cy={JOB.y} r={14} fill="none" stroke={stroke} strokeWidth={1.5} />
              <SvgText x={JOB.x} y={JOB.y + 4} fill={stroke} fontSize={9} fontWeight="700" textAnchor="middle">
                Job
              </SvgText>
            </>
          )}

          {/* ── Anchor dots (visible) ──────────────────────────── */}
          <Circle cx={SALARY.x} cy={SALARY.y} r={3.5} fill={stroke} />
          <SvgText x={SALARY.x - 6} y={SALARY.y + 3} fill={stroke} fontSize={8} fontWeight="700" textAnchor="end">
            {financialClass === 'rich' ? 'Passive' : 'Salary'}
          </SvgText>

          <Circle cx={EXPENSES_DOT.x} cy={EXPENSES_DOT.y} r={3.5} fill={stroke} />

          {financialClass === 'middle' && (
            <Circle cx={LIAB_DOT.x} cy={LIAB_DOT.y} r={3.5} fill={stroke} />
          )}
          {financialClass === 'rich' && (
            <Circle cx={ASSETS_DOT.x} cy={ASSETS_DOT.y} r={3.5} fill={stroke} />
          )}

          {/* ── Flow path ──────────────────────────────────────── */}
          <Path
            ref={pathRef}
            d={flow.d}
            stroke={stroke}
            strokeWidth={1.8}
            fill="none"
            strokeLinecap="round"
            markerEnd={financialClass === 'rich' ? undefined : 'url(#arrowhead)'}
          />

          {/* Animated traveler dot */}
          <AnimatedDot pathRef={pathRef} color={stroke} duration={4000} totalLength={flow.length} />
        </Svg>

        {/* Flow summary strip */}
        <View
          className="mt-1 rounded-xl px-4 py-2.5 flex-row items-center justify-center gap-2 border"
          style={{
            backgroundColor: config.color + '10',
            borderColor: config.color + '35',
          }}
        >
          {financialClass === 'poor' && (
            <>
              <Text className="text-xs font-mono" style={{ color: config.color }}>Income</Text>
              <Text className="text-xs opacity-60">→</Text>
              <Text className="text-xs font-mono" style={{ color: config.color }}>Expenses</Text>
              <Text className="text-xs opacity-60">→</Text>
              <Text className="text-xs">💸 gone</Text>
            </>
          )}
          {financialClass === 'middle' && (
            <>
              <Text className="text-xs font-mono" style={{ color: config.color }}>Salary</Text>
              <Text className="text-xs opacity-60">→</Text>
              <Text className="text-xs font-mono" style={{ color: config.color }}>Liabilities</Text>
              <Text className="text-xs opacity-60">→</Text>
              <Text className="text-xs font-mono" style={{ color: config.color }}>Expenses</Text>
              <Text className="text-xs">🔄</Text>
            </>
          )}
          {financialClass === 'rich' && (
            <>
              <Text className="text-xs font-mono" style={{ color: config.color }}>Assets</Text>
              <Text className="text-xs opacity-60">→</Text>
              <Text className="text-xs font-mono" style={{ color: config.color }}>Income</Text>
              <Text className="text-xs opacity-60">→</Text>
              <Text className="text-xs font-mono" style={{ color: config.color }}>More Assets</Text>
              <Text className="text-xs">💎</Text>
            </>
          )}
        </View>
      </View>
    </View>
  );
}
