import { View, Text } from 'react-native';
import { TrendingUp, TrendingDown } from 'lucide-react-native';

interface CashFlowDiagramProps {
  pattern: 'poor' | 'middle' | 'rich';
}

export function CashFlowDiagram({ pattern }: CashFlowDiagramProps) {
  return (
    <View className="bg-card border border-border rounded-2xl p-6 items-center">
      <View className="w-full flex-row items-center justify-center gap-4 mb-4">
        {/* Assets Node */}
        <View className="items-center">
          <View className="w-16 h-16 rounded-2xl bg-income/20 items-center justify-center mb-1">
            <TrendingUp size={24} color="#22C55E" />
          </View>
          <Text className="text-xs text-foreground">Assets</Text>
        </View>

        {/* Arrow 1 */}
        <View className="flex-row items-center gap-1">
          <View className="w-8 h-0.5 bg-income" />
          <Text className="text-lg">→</Text>
        </View>

        {/* Income Node */}
        <View className="items-center">
          <View className="w-16 h-16 rounded-2xl bg-primary/20 items-center justify-center mb-1">
            <Text className="text-2xl">💰</Text>
          </View>
          <Text className="text-xs text-foreground">Income</Text>
        </View>

        {/* Arrow 2 */}
        <View className="flex-row items-center gap-1">
          <View className="w-8 h-0.5 bg-primary" />
          <Text className="text-lg">→</Text>
        </View>

        {/* Expenses Node */}
        <View className="items-center">
          <View className="w-16 h-16 rounded-2xl bg-expense/20 items-center justify-center mb-1">
            <TrendingDown size={24} color="#EF4444" />
          </View>
          <Text className="text-xs text-foreground">Expenses</Text>
        </View>
      </View>

      <Text className="text-xs text-muted-foreground text-center px-4">
        Assets generate passive income, which covers expenses and allows reinvestment
      </Text>
    </View>
  );
}