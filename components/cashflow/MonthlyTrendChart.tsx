import { View, Text } from 'react-native';
import { TrendingUp, TrendingDown } from 'lucide-react-native';

interface MonthlyDataPoint { month: string; assets: number; liabilities: number; }

interface MonthlyTrendChartProps {
  data: MonthlyDataPoint[];
  netWorthChange: number;
}

const ASSET_COLOR = '#C5FF00';
const LIABILITY_COLOR = '#ff6b6b';
const CHART_HEIGHT = 110;

export function MonthlyTrendChart({ data, netWorthChange }: MonthlyTrendChartProps) {
  const maxValue = Math.max(...data.map((d) => Math.max(d.assets, d.liabilities)));
  const scale = (value: number) => (value / maxValue) * CHART_HEIGHT;
  const isPositive = netWorthChange >= 0;
  const trendColor = isPositive ? ASSET_COLOR : LIABILITY_COLOR;

  // Net worth trend (line points)
  const netWorths = data.map((d) => d.assets - d.liabilities);
  const maxNw = Math.max(...netWorths);
  const minNw = Math.min(...netWorths);
  const nwRange = maxNw - minNw || 1;

  return (
    <View className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <View className="px-5 pt-4 pb-3">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="font-bold tracking-wider text-xs text-muted-foreground">
            MONTHLY TREND
          </Text>
          <Text className="text-xs text-muted-foreground">{data.length}-month view</Text>
        </View>
        <View
          className="flex-row items-center gap-2 self-start px-3 py-1.5 rounded-lg"
          style={{ backgroundColor: trendColor + '18' }}
        >
          {isPositive
            ? <TrendingUp size={14} color={trendColor} />
            : <TrendingDown size={14} color={trendColor} />}
          <Text className="text-xs font-semibold" style={{ color: trendColor }}>
            {isPositive ? 'Net worth grew' : 'Net worth fell'} RM {Math.abs(netWorthChange).toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Bar chart */}
      <View className="px-4 pb-3">
        <View className="flex-row items-end gap-3" style={{ height: CHART_HEIGHT + 16 }}>
          {data.map((point, i) => {
            const nw = point.assets - point.liabilities;
            const nwPct = ((nw - minNw) / nwRange) * 100;
            return (
              <View key={i} className="flex-1 items-center">
                <View
                  className="flex-row items-end justify-center gap-1 w-full"
                  style={{ height: CHART_HEIGHT }}
                >
                  <View
                    className="flex-1 rounded-t-md max-w-[14px]"
                    style={{
                      height: scale(point.assets),
                      backgroundColor: ASSET_COLOR,
                      opacity: 0.85,
                    }}
                  />
                  <View
                    className="flex-1 rounded-t-md max-w-[14px]"
                    style={{
                      height: scale(point.liabilities),
                      backgroundColor: LIABILITY_COLOR,
                      opacity: 0.75,
                    }}
                  />
                </View>
                <View className="mt-1.5 items-center">
                  <Text className="text-[10px] text-muted-foreground">{point.month}</Text>
                  <Text
                    className="text-[10px] font-bold"
                    style={{ color: nwPct >= 50 ? ASSET_COLOR : '#a0a0a0' }}
                  >
                    {(nw / 1000).toFixed(0)}k
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Legend */}
      <View className="px-5 pb-4 flex-row items-center justify-between border-t border-border pt-3">
        <View className="flex-row gap-4">
          <View className="flex-row items-center gap-1.5">
            <View className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: ASSET_COLOR }} />
            <Text className="text-[11px] text-muted-foreground">Assets</Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <View className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: LIABILITY_COLOR }} />
            <Text className="text-[11px] text-muted-foreground">Liabilities</Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <Text className="text-[11px] font-bold text-primary">k</Text>
            <Text className="text-[11px] text-muted-foreground">Net worth</Text>
          </View>
        </View>
        <Text className="text-[10px] text-muted-foreground">RM × 1,000</Text>
      </View>
    </View>
  );
}
