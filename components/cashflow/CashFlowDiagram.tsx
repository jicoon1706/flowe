import { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
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

interface AnimatedFlowDotProps {
  keyframes: { x: number; y: number; duration: number }[];
  color: string;
}

function AnimatedFlowDot({ keyframes, color }: AnimatedFlowDotProps) {
  const translateX = useRef(new Animated.Value(keyframes[0].x)).current;
  const translateY = useRef(new Animated.Value(keyframes[0].y)).current;
  const loopRef = useRef<ReturnType<typeof Animated.loop> | null>(null);

  useEffect(() => {
    // Create sequence of all segments chained together
    const segmentAnims = keyframes.map((kf, i) => {
      const next = keyframes[(i + 1) % keyframes.length];
      return Animated.parallel([
        Animated.timing(translateX, {
          toValue: next.x,
          duration: kf.duration,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: next.y,
          duration: kf.duration,
          useNativeDriver: true,
        }),
      ]);
    });

    loopRef.current = Animated.loop(Animated.sequence(segmentAnims));
    loopRef.current.start();
    return () => { if (loopRef.current) loopRef.current.stop(); };
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: color,
        transform: [{ translateX }, { translateY }],
      }}
    />
  );
}

const PATTERN_CONFIG = {
  poor: {
    color: '#ff6b6b',
    borderColor: 'border-red-500/30',
    bgGlow: 'from-red-500/8 to-transparent',
    tagColor: 'bg-red-500/15 text-red-400 border-red-500/30',
    label: 'Poor Pattern',
    desc: 'Income flows directly into expenses. No assets working for you. The money is gone before it can grow.',
    tip: 'Start by saving 10% of every paycheck and open your first investment account.',
    keyframes: [
      { x: 10, y: 200, duration: 400 },
      { x: 80, y: 200, duration: 300 },
      { x: 80, y: 280, duration: 300 },
      { x: 200, y: 280, duration: 300 },
    ] as { x: number; y: number; duration: number }[],
  },
  middle: {
    color: '#ffd93d',
    borderColor: 'border-yellow-500/30',
    bgGlow: 'from-yellow-500/8 to-transparent',
    tagColor: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    label: 'Middle Class Pattern',
    desc: 'Income covers expenses AND liability payments. Debt creates a treadmill that keeps draining your cash flow.',
    tip: 'For every new loan ask: does this generate income? Build assets before upgrading lifestyle.',
    keyframes: [
      { x: 10, y: 200, duration: 400 },
      { x: 140, y: 200, duration: 300 },
      { x: 140, y: 300, duration: 300 },
      { x: 260, y: 300, duration: 400 },
      { x: 140, y: 300, duration: 500 },
      { x: 140, y: 200, duration: 400 },
    ] as { x: number; y: number; duration: number }[],
  },
  rich: {
    color: '#C5FF00',
    borderColor: 'border-primary/30',
    bgGlow: 'from-primary/8 to-transparent',
    tagColor: 'bg-primary/15 text-primary border-primary/30',
    label: 'Rich Pattern',
    desc: 'Assets generate passive income that covers expenses. Surplus is reinvested into more assets — the cycle compounds.',
    tip: 'Keep growing your asset column. Reinvest every surplus ringgit.',
    keyframes: [
      { x: 10, y: 200, duration: 400 },
      { x: 130, y: 200, duration: 300 },
      { x: 130, y: 280, duration: 300 },
      { x: 250, y: 280, duration: 400 },
      { x: 130, y: 280, duration: 400 },
      { x: 130, y: 200, duration: 300 },
      { x: 10, y: 200, duration: 400 },
    ] as { x: number; y: number; duration: number }[],
  },
} as const;

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

  return (
    <View className={`bg-card rounded-2xl border-2 ${config.borderColor} overflow-hidden`}>
      {/* Header */}
      <View className={`bg-gradient-to-br ${config.bgGlow} px-5 py-4 border-b ${config.borderColor}`}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2.5">
            <View
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: config.color }}
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
            <Text className="text-xs" style={{ color: config.color }}>{config.tip}</Text>
          </View>
        </View>
      )}

      {/* Diagram area */}
      <View className="px-4 pt-3 pb-4">
        {/* Visual flow diagram using positioned Views */}
        <View className="relative" style={{ height: 340 }}>
          {/* Job bubble */}
          <View className="absolute left-0 top-[190px] flex-col items-center">
            <View className="w-12 h-12 rounded-full border-2 items-center justify-center" style={{ borderColor: config.color }}>
              <Text className="text-xs font-bold" style={{ color: config.color }}>Job</Text>
            </View>
          </View>

          {/* Income box */}
          <View className="absolute left-[60px] top-[160px]">
            <View className="rounded-xl border px-4 py-3" style={{ borderColor: config.color + '50', backgroundColor: config.color + '15' }}>
              <Text className="text-xs text-foreground font-semibold">Income</Text>
              <Text className="text-sm font-bold" style={{ color: config.color }}>RM {totalIncome.toLocaleString()}</Text>
            </View>
          </View>

          {/* Expenses box */}
          <View className="absolute left-[60px] top-[260px]">
            <View className="rounded-xl border px-4 py-3" style={{ borderColor: config.color + '50', backgroundColor: config.color + '15' }}>
              <Text className="text-xs text-foreground font-semibold">Expenses</Text>
              <Text className="text-sm font-bold" style={{ color: config.color }}>RM {totalExpenses.toLocaleString()}</Text>
            </View>
          </View>

          {/* Assets box (rich only) */}
          {financialClass === 'rich' && (
            <View className="absolute left-[0px] top-[160px]">
              <View className="rounded-xl border px-3 py-2" style={{ borderColor: config.color + '50', backgroundColor: config.color + '15' }}>
                <Text className="text-xs text-foreground font-semibold">Assets</Text>
                <Text className="text-xs font-bold" style={{ color: config.color }}>RM {totalAssets.toLocaleString()}</Text>
              </View>
            </View>
          )}

          {/* Liabilities box (middle only) */}
          {financialClass === 'middle' && (
            <View className="absolute right-[20px] top-[260px]">
              <View className="rounded-xl border px-3 py-2" style={{ borderColor: config.color + '50', backgroundColor: config.color + '15' }}>
                <Text className="text-xs text-foreground font-semibold">Liabilities</Text>
                <Text className="text-xs font-bold text-red-400">RM {totalLiabilities.toLocaleString()}</Text>
              </View>
            </View>
          )}

          {/* Exit emoji (poor only) */}
          {financialClass === 'poor' && (
            <View className="absolute right-[20px] top-[260px]">
              <Text className="text-xl">💸</Text>
            </View>
          )}

          {/* Reinvest emoji (rich only) */}
          {financialClass === 'rich' && (
            <View className="absolute right-[20px] top-[160px]">
              <Text className="text-xl">💎</Text>
            </View>
          )}

          {/* Treadmill emoji (middle only) */}
          {financialClass === 'middle' && (
            <View className="absolute right-[20px] top-[260px]">
              <Text className="text-xl">🔄</Text>
            </View>
          )}

          {/* Animated flow dot */}
          <AnimatedFlowDot keyframes={config.keyframes} color={config.color} />
        </View>

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
              <Text className="text-xs font-mono" style={{ color: config.color }}>Income</Text>
              <Text className="text-xs opacity-60">→</Text>
              <Text className="text-xs font-mono" style={{ color: config.color }}>Expenses + Debt</Text>
              <Text className="text-xs opacity-60">→</Text>
              <Text className="text-xs">🔄 treadmill</Text>
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