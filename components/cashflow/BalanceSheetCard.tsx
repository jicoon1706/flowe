import { View, Text, Pressable } from 'react-native';

interface Asset {
  id: string;
  name: string;
  value: number;
  monthly: number;
}

interface Liability {
  id: string;
  name: string;
  value: number;
  monthly: number;
  rate?: string;
}

interface BalanceSheetCardProps {
  assets: Asset[];
  liabilities: Liability[];
  activeTab: 'assets' | 'liabilities';
  onTabChange: (tab: 'assets' | 'liabilities') => void;
  onAddAsset: () => void;
  onAddLiability: () => void;
}

function formatCurrency(amount: number) {
  return `RM ${amount.toLocaleString()}`;
}

function formatMonthly(monthly: number) {
  const sign = monthly >= 0 ? '+' : '';
  return `${sign}${formatCurrency(monthly)}/mo`;
}

export function BalanceSheetCard({
  assets,
  liabilities,
  activeTab,
  onTabChange,
  onAddAsset,
  onAddLiability,
}: BalanceSheetCardProps) {
  const items = activeTab === 'assets' ? assets : liabilities;
  const onAdd = activeTab === 'assets' ? onAddAsset : onAddLiability;

  return (
    <View>
      {/* Tabs */}
      <View className="flex-row bg-card rounded-2xl p-1 mb-3">
        <Pressable
          className={`flex-1 py-2 rounded-xl ${activeTab === 'assets' ? 'bg-primary' : ''}`}
          onPress={() => onTabChange('assets')}
        >
          <Text
            className={`text-sm font-semibold text-center ${
              activeTab === 'assets' ? 'text-primary-foreground' : 'text-muted-foreground'
            }`}
          >
            Assets
          </Text>
        </Pressable>
        <Pressable
          className={`flex-1 py-2 rounded-xl ${activeTab === 'liabilities' ? 'bg-primary' : ''}`}
          onPress={() => onTabChange('liabilities')}
        >
          <Text
            className={`text-sm font-semibold text-center ${
              activeTab === 'liabilities' ? 'text-primary-foreground' : 'text-muted-foreground'
            }`}
          >
            Liabilities
          </Text>
        </Pressable>
      </View>

      {/* List */}
      <View className="bg-card border border-border rounded-2xl">
        {items.map((item, index) => (
          <View
            key={item.id}
            className={`flex-row justify-between items-center py-3 px-4 ${index !== items.length - 1 ? 'border-b border-border' : ''}`}
          >
            <View>
              <Text className="text-sm font-medium text-foreground">{item.name}</Text>
              <Text className="text-xs text-income">{formatMonthly(item.monthly)}</Text>
            </View>
            <Text className="text-sm font-semibold text-foreground">{formatCurrency(item.value)}</Text>
          </View>
        ))}
        <Pressable
          className="flex-row items-center justify-center gap-2 py-3 mt-2 border-t border-dashed border-border"
          onPress={onAdd}
        >
          <Text className="text-sm text-primary font-medium">+ Add {activeTab === 'assets' ? 'Asset' : 'Liability'}</Text>
        </Pressable>
      </View>
    </View>
  );
}