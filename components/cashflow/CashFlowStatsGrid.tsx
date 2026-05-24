import { View, Text } from 'react-native';

interface CashFlowStats {
  assets: number;
  liabilities: number;
  passiveIncome: number;
  netWorth: number;
}

interface CashFlowStatsGridProps {
  stats: CashFlowStats;
}

function StatCard({ label, value, colorClass }: { label: string; value: string; colorClass: string }) {
  return (
    <View className="bg-card border border-border rounded-2xl p-4">
      <Text className="text-xs text-muted-foreground mb-1">{label}</Text>
      <Text className={`text-lg font-bold ${colorClass}`}>{value}</Text>
    </View>
  );
}

export function CashFlowStatsGrid({ stats }: CashFlowStatsGridProps) {
  const formatCurrency = (amount: number) => `RM ${amount.toLocaleString()}`;

  return (
    <View className="grid grid-cols-2 gap-3">
      <StatCard label="Assets" value={formatCurrency(stats.assets)} colorClass="text-income" />
      <StatCard label="Liabilities" value={formatCurrency(stats.liabilities)} colorClass="text-expense" />
      <StatCard label="Passive Income" value={formatCurrency(stats.passiveIncome)} colorClass="text-primary" />
      <StatCard label="Net Worth" value={formatCurrency(stats.netWorth)} colorClass="text-foreground" />
    </View>
  );
}