import { View, Text } from 'react-native';
import { TrendingUp, TrendingDown } from 'lucide-react-native';

interface MonthlyDataPoint { month: string; assets: number; liabilities: number; }

interface MonthlyTrendChartProps {
  data: MonthlyDataPoint[];
  netWorthChange: number;
}

export function MonthlyTrendChart({ data, netWorthChange }: MonthlyTrendChartProps) {
  const maxValue = Math.max(...data.map((d) => Math.max(d.assets, d.liabilities)));
  const scale = (value: number) => (value / maxValue) * 96;
  const isPositive = netWorthChange >= 0;

  return (
    <View>
      <View className="bg-muted/40 px-5 py-3 border-b border-border rounded-t-2xl">
        <View className="flex-row items-center justify-between">
          <Text className="font-bold text-sm">Monthly Trend</Text>
          <View className="flex-row items-center gap-1">
            {isPositive
              ? <TrendingUp size={14} color="#C5FF00" />
              : <TrendingDown size={14} color="#ff6b6b" />}
            <Text className={`text-xs font-semibold ${isPositive ? 'text-primary' : 'text-red-400'}`}>
              Net worth {isPositive ? 'grew' : 'fell'} RM {Math.abs(netWorthChange).toLocaleString()} this month
            </Text>
          </View>
        </View>
      </View>
      <View className="bg-card border border-border rounded-b-2xl p-4">
        {/* Bar chart */}
        <View className="flex-row items-end gap-2 h-28 mb-3">
          {data.map((point, i) => (
            <View key={i} className="flex-1 flex flex-col items-center gap-1">
              <View className="flex flex-row items-end gap-0.5 h-24 w-full justify-center">
                <View
                  className="w-4 rounded-t-lg relative"
                  style={{ height: scale(point.assets), backgroundColor: '#C5FF00' + '99' }}
                >
                  <Text className="absolute -top-4 w-full text-center text-xs text-muted-foreground/60">
                    {(point.assets / 1000).toFixed(0)}k
                  </Text>
                </View>
                <View
                  className="w-4 rounded-t-lg"
                  style={{ height: scale(point.liabilities), backgroundColor: '#ff6b6b' + '80' }}
                />
              </View>
              <Text className="text-xs text-muted-foreground">{point.month}</Text>
            </View>
          ))}
        </View>
        {/* Legend */}
        <View className="flex-row gap-4 mb-3">
          <View className="flex-row items-center gap-1.5">
            <View className="w-3 h-3 rounded" style={{ backgroundColor: '#C5FF00' + '99' }} />
            <Text className="text-xs text-muted-foreground">Assets</Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <View className="w-3 h-3 rounded" style={{ backgroundColor: '#ff6b6b' + '80' }} />
            <Text className="text-xs text-muted-foreground">Liabilities</Text>
          </View>
        </View>
        {/* Net worth per month */}
        <View className="grid grid-cols-6 gap-1 border-t border-border pt-3">
          {data.map((point, i) => {
            const nw = point.assets - point.liabilities;
            return (
              <View key={i} className="text-center">
                <Text className="text-xs text-primary font-semibold">{(nw / 1000).toFixed(0)}k</Text>
                <Text className="text-xs text-muted-foreground">{point.month}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}
