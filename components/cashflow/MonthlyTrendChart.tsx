import { View, Text } from 'react-native';

interface MonthlyDataPoint {
  month: string;
  assets: number;
  liabilities: number;
}

interface MonthlyTrendChartProps {
  data: MonthlyDataPoint[];
  netWorthChange: number;
}

export function MonthlyTrendChart({ data, netWorthChange }: MonthlyTrendChartProps) {
  const maxValue = Math.max(...data.map(d => Math.max(d.assets, d.liabilities)));
  const scale = (value: number) => (value / maxValue) * 80; // max height of 80px

  return (
    <View>
      <Text className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-3 px-4">
        Monthly Trend
      </Text>
      <View className="bg-card border border-border rounded-2xl items-center py-8 px-4">
        <Text className="text-sm text-muted-foreground">
          Net worth grew RM {netWorthChange.toLocaleString()} this month
        </Text>
        <View className="flex-row items-end gap-2 mt-4 h-24">
          {data.map((point, i) => (
            <View key={i} className="items-center gap-1">
              <View className="flex-row items-end gap-0.5">
                <View
                  className="w-4 bg-income rounded-t"
                  style={{ height: scale(point.assets) }}
                />
                <View
                  className="w-4 bg-expense rounded-t"
                  style={{ height: scale(point.liabilities) }}
                />
              </View>
              <Text className="text-xs text-muted-foreground">{point.month}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}