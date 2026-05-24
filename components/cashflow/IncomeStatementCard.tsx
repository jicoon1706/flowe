import { View, Text } from 'react-native';

interface IncomeStatementItem {
  label: string;
  amount: string;
  isBold?: boolean;
  isHighlight?: boolean;
  isExpense?: boolean;
  isPositive?: boolean;
}

interface IncomeStatementCardProps {
  title?: string;
  items: IncomeStatementItem[];
}

export function IncomeStatementCard({ title = 'Income Statement', items }: IncomeStatementCardProps) {
  return (
    <View>
      <Text className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-3 px-4">
        {title}
      </Text>
      <View className="bg-card border border-border rounded-2xl">
        {items.map((item, index) => (
          <View
            key={index}
            className={`flex-row justify-between py-2 px-4 ${index !== items.length - 1 ? 'border-b border-border' : ''}`}
          >
            <Text
              className={`
                text-sm
                ${item.isBold ? 'font-semibold text-foreground' : ''}
                ${item.isHighlight ? 'text-primary' : ''}
                ${item.isExpense ? 'text-expense' : ''}
                ${!item.isBold && !item.isHighlight && !item.isExpense ? 'text-foreground' : ''}
              `}
            >
              {item.label}
            </Text>
            <Text
              className={`
                text-sm font-medium
                ${item.isBold ? 'font-semibold' : ''}
                ${item.isPositive ? 'text-income' : ''}
                ${item.isExpense ? 'text-expense' : ''}
                ${!item.isPositive && !item.isExpense ? 'text-foreground' : ''}
              `}
            >
              {item.amount}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}