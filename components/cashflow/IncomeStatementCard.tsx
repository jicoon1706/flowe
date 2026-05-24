import { View, Text } from 'react-native';

interface IncomeItem { label: string; amount: number; isPassive?: boolean; }
interface ExpenseItem { label: string; amount: number; }

interface IncomeStatementCardProps {
  incomeItems: IncomeItem[];
  expenseItems: ExpenseItem[];
  passiveFromAssets: number;
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
}

export function IncomeStatementCard({
  incomeItems,
  expenseItems,
  passiveFromAssets,
  totalIncome,
  totalExpenses,
  netCashFlow,
}: IncomeStatementCardProps) {
  return (
    <View>
      <View className="bg-muted/40 px-5 py-3 border-b border-border rounded-t-2xl">
        <Text className="font-bold tracking-wide text-sm">INCOME STATEMENT</Text>
      </View>
      <View className="bg-card border border-border rounded-b-2xl p-5 space-y-4">
        {/* Income */}
        <View>
          <Text className="font-semibold text-sm mb-2 text-green-400">Income</Text>
          <View className="space-y-2">
            {incomeItems.map((item, i) => (
              <View key={i} className="flex-row justify-between text-sm">
                <Text className="text-muted-foreground">{item.label}</Text>
                <Text className="text-foreground">RM {item.amount.toLocaleString()}</Text>
              </View>
            ))}
            {passiveFromAssets > 0 && (
              <View className="flex-row justify-between text-sm">
                <Text className="text-muted-foreground">📈 Passive (Assets)</Text>
                <Text className="text-primary">RM {passiveFromAssets.toLocaleString()}</Text>
              </View>
            )}
            <View className="border-t border-border pt-2 flex-row justify-between font-semibold text-sm">
              <Text className="text-foreground">Total Income</Text>
              <Text className="text-green-400">RM {totalIncome.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* Expenses */}
        <View>
          <Text className="font-semibold text-sm mb-2 text-red-400">Expenses</Text>
          <View className="space-y-2">
            {expenseItems.map((item, i) => (
              <View key={i} className="flex-row justify-between text-sm">
                <Text className="text-muted-foreground">{item.label}</Text>
                <Text className="text-foreground">RM {item.amount.toLocaleString()}</Text>
              </View>
            ))}
            <View className="border-t border-border pt-2 flex-row justify-between font-semibold text-sm">
              <Text className="text-foreground">Total Expenses</Text>
              <Text className="text-red-400">RM {totalExpenses.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* Net Cash Flow */}
        <View className="border-t-2 border-border pt-3 flex-row justify-between items-center">
          <Text className="font-bold">Net Cash Flow</Text>
          <Text className={`text-xl font-bold ${netCashFlow >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            RM {netCashFlow.toLocaleString()} {netCashFlow >= 0 ? '✅' : '⚠️'}
          </Text>
        </View>
      </View>
    </View>
  );
}