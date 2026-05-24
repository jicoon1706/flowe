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
    bgGlow: 'from-red-500/15 to-red-500/5',
    borderColor: 'border-red-500/40',
    tagColor: 'bg-red-500/15 text-red-400 border-red-500/30',
    flow: 'Income → Expenses (all of it)',
    desc: 'Your income goes directly to expenses. No assets working for you yet.',
  },
  middle: {
    emoji: '😐',
    label: 'Middle Class Pattern',
    color: '#ffd93d',
    bgGlow: 'from-yellow-500/15 to-yellow-500/5',
    borderColor: 'border-yellow-500/40',
    tagColor: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    flow: 'Income → Expenses + Liabilities',
    desc: 'You earn well but liabilities eat your income. Build assets to escape this cycle.',
  },
  rich: {
    emoji: '💎',
    label: 'Rich Pattern',
    color: '#C5FF00',
    bgGlow: 'from-primary/15 to-primary/5',
    borderColor: 'border-primary/40',
    tagColor: 'bg-primary/15 text-primary border-primary/30',
    flow: 'Assets → Income → More Assets',
    desc: 'Your assets generate income. Money works for you. Keep growing your asset column!',
  },
} as const;

function StatCard({ label, value, colorClass, borderColor }: {
  label: string;
  value: string;
  colorClass: string;
  borderColor: string;
}) {
  return (
    <View className="flex-1 bg-black/20 rounded-xl p-3 border-l-2" style={{ borderLeftColor: borderColor }}>
      <Text className="text-xs text-muted-foreground mb-0.5">{label}</Text>
      <Text className={`text-base font-bold ${colorClass}`}>{value}</Text>
    </View>
  );
}

export function FinancialClassBadge({
  financialClass,
  totalAssets,
  totalLiabilities,
  passiveIncome,
  netWorth,
}: FinancialClassBadgeProps) {
  const config = CLASS_CONFIG[financialClass] ?? CLASS_CONFIG.poor;
  const scaleAnim = Animated.useRef(new Animated.Value(1)).current;

  Animated.useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1.0, duration: 1000, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <View className={`bg-gradient-to-br ${config.bgGlow} border-2 ${config.borderColor} rounded-2xl p-5`}>
      <View className="flex-row items-center gap-3 mb-3">
        <Animated.View
          className="w-14 h-14 rounded-2xl items-center justify-center"
          style={{
            backgroundColor: config.color + '25',
            transform: [{ scale: scaleAnim }],
            shadowColor: config.color,
            shadowOpacity: 0.3,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 0 },
          }}
        >
          <Text className="text-4xl">{config.emoji}</Text>
        </Animated.View>
        <View className="flex-1">
          <Text className="text-lg font-bold" style={{ color: config.color }}>
            {config.label}
          </Text>
          <Text className="text-xs font-mono text-muted-foreground">{config.flow}</Text>
        </View>
      </View>
      <Text className="text-sm text-muted-foreground mb-4">{config.desc}</Text>
      <View className="flex-row gap-2">
        <StatCard label="Assets" value={`RM ${totalAssets.toLocaleString()}`} colorClass="text-primary" borderColor={config.color} />
        <StatCard label="Liabilities" value={`RM ${totalLiabilities.toLocaleString()}`} colorClass="text-red-400" borderColor={config.color} />
      </View>
      <View className="flex-row gap-2 mt-2">
        <StatCard label="Passive Income" value={`RM ${passiveIncome.toFixed(0)}/mo`} colorClass="text-primary" borderColor={config.color} />
        <StatCard
          label="Net Worth"
          value={`RM ${netWorth.toLocaleString()}`}
          colorClass={netWorth >= 0 ? 'text-primary' : 'text-red-400'}
          borderColor={config.color}
        />
      </View>
    </View>
  );
}