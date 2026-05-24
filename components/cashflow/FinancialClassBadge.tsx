import { useRef, useEffect } from 'react';
import { View, Text, Animated } from 'react-native';

type FinancialClass = 'poor' | 'middle' | 'rich';

interface FinancialClassBadgeProps {
  financialClass: FinancialClass;
  totalAssets: number;
  totalLiabilities: number;
  passiveIncome: number;
  netWorth: number;
  totalIncome: number;
  totalExpenses: number;
}

const CLASS_CONFIG = {
  poor: {
    emoji: '😰',
    label: 'Poor Pattern',
    color: '#ff6b6b',
    flow: 'Income → Expenses',
    desc: 'Your income goes directly to expenses. No assets working for you yet.',
  },
  middle: {
    emoji: '😐',
    label: 'Middle Class Pattern',
    color: '#ffd93d',
    flow: 'Income → Expenses + Liabilities',
    desc: 'You earn well but liabilities eat your income. Build assets to escape this cycle.',
  },
  rich: {
    emoji: '💎',
    label: 'Rich Pattern',
    color: '#C5FF00',
    flow: 'Assets → Income → More Assets',
    desc: 'Your assets generate income. Money works for you. Keep growing!',
  },
} as const;

function Stat({ label, value, valueColor, accent }: {
  label: string; value: string; valueColor: string; accent: string;
}) {
  return (
    <View
      className="flex-1 rounded-xl p-3 border-l-2"
      style={{ backgroundColor: '#00000033', borderLeftColor: accent }}
    >
      <Text className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
        {label}
      </Text>
      <Text className="text-base font-bold" style={{ color: valueColor }}>
        {value}
      </Text>
    </View>
  );
}

export function FinancialClassBadge({
  financialClass,
  totalAssets,
  totalLiabilities,
  passiveIncome,
  netWorth,
  totalExpenses,
}: FinancialClassBadgeProps) {
  const config = CLASS_CONFIG[financialClass] ?? CLASS_CONFIG.poor;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1.0, duration: 1000, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Progress toward "rich": passive income / total expenses (capped at 100%)
  const richProgress = totalExpenses > 0
    ? Math.min(100, (passiveIncome / totalExpenses) * 100)
    : 0;

  return (
    <View
      className="rounded-2xl p-5 border-2 overflow-hidden"
      style={{
        backgroundColor: config.color + '12',
        borderColor: config.color + '50',
      }}
    >
      {/* Top: emoji + label */}
      <View className="flex-row items-center gap-3 mb-4">
        <Animated.View
          className="w-14 h-14 rounded-2xl items-center justify-center"
          style={{
            backgroundColor: config.color + '25',
            transform: [{ scale: scaleAnim }],
            shadowColor: config.color,
            shadowOpacity: 0.4,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 0 },
          }}
        >
          <Text className="text-3xl">{config.emoji}</Text>
        </Animated.View>
        <View className="flex-1">
          <Text className="text-lg font-bold" style={{ color: config.color }}>
            {config.label}
          </Text>
          <View
            className="self-start mt-0.5 px-2 py-0.5 rounded-md"
            style={{ backgroundColor: config.color + '20' }}
          >
            <Text className="text-[10px] font-mono" style={{ color: config.color }}>
              {config.flow}
            </Text>
          </View>
        </View>
      </View>

      {/* Description */}
      <Text className="text-sm text-muted-foreground mb-4 leading-5">{config.desc}</Text>

      {/* Progress to financial freedom */}
      <View className="mb-4">
        <View className="flex-row justify-between mb-1.5">
          <Text className="text-[11px] font-semibold text-muted-foreground">
            Progress to financial freedom
          </Text>
          <Text className="text-[11px] font-bold" style={{ color: config.color }}>
            {richProgress.toFixed(0)}%
          </Text>
        </View>
        <View className="h-1.5 rounded-full bg-black/40 overflow-hidden">
          <View
            className="h-full rounded-full"
            style={{ width: `${richProgress}%`, backgroundColor: config.color }}
          />
        </View>
        <Text className="text-[10px] text-muted-foreground mt-1">
          Passive income covers {richProgress.toFixed(0)}% of expenses
        </Text>
      </View>

      {/* Stat grid 2x2 */}
      <View className="flex-row gap-2 mb-2">
        <Stat label="Assets" value={`RM ${totalAssets.toLocaleString()}`} valueColor="#C5FF00" accent={config.color} />
        <Stat label="Liabilities" value={`RM ${totalLiabilities.toLocaleString()}`} valueColor="#ff6b6b" accent={config.color} />
      </View>
      <View className="flex-row gap-2">
        <Stat label="Passive/mo" value={`RM ${passiveIncome.toFixed(0)}`} valueColor="#C5FF00" accent={config.color} />
        <Stat
          label="Net Worth"
          value={`RM ${netWorth.toLocaleString()}`}
          valueColor={netWorth >= 0 ? '#C5FF00' : '#ff6b6b'}
          accent={config.color}
        />
      </View>
    </View>
  );
}
