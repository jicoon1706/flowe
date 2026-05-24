import { View, Text, Pressable } from 'react-native';
import { Plus } from 'lucide-react-native';

interface Asset { id: string; name: string; type: string; icon: string; value: number; monthlyIncome: number; }
interface Liability { id: string; name: string; type: string; icon: string; amountOwed: number; monthlyPayment: number; }

interface BalanceSheetCardProps {
  assets: Asset[];
  liabilities: Liability[];
  activeTab: 'assets' | 'liabilities';
  onTabChange: (tab: 'assets' | 'liabilities') => void;
  onAddAsset: () => void;
  onAddLiability: () => void;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
}

function ItemRow({ icon, name, type, value, monthly, isLiability }: {
  icon: string; name: string; type: string; value: number; monthly: number; isLiability: boolean;
}) {
  const accentColor = isLiability ? '#ff6b6b' : '#C5FF00';
  return (
    <View className={`flex-row justify-between items-center py-2 border-l-2`} style={{ borderLeftColor: accentColor }}>
      <View className="flex-row items-center gap-2">
        <Text className="text-lg">{icon}</Text>
        <View>
          <Text className="text-sm text-foreground">{name}</Text>
          <Text className="text-xs text-muted-foreground">{type}</Text>
        </View>
      </View>
      <View className="items-end">
        <Text className={`text-sm font-semibold ${isLiability ? 'text-red-400' : 'text-primary'}`}>
          RM {value.toLocaleString()}
        </Text>
        <Text className={`text-xs ${isLiability ? 'text-red-400' : 'text-primary'}`}>
          {isLiability ? `-RM ${monthly}/mo` : `+RM ${monthly}/mo`}
        </Text>
      </View>
    </View>
  );
}

export function BalanceSheetCard({
  assets, liabilities, activeTab, onTabChange, onAddAsset, onAddLiability,
  totalAssets, totalLiabilities, netWorth,
}: BalanceSheetCardProps) {
  const items = activeTab === 'assets' ? assets : liabilities;
  const onAdd = activeTab === 'assets' ? onAddAsset : onAddLiability;
  const isLiability = activeTab === 'liabilities';

  return (
    <View>
      <View className="bg-muted/40 px-5 py-3 border-b border-border rounded-t-2xl">
        <Text className="font-bold tracking-wide text-sm">BALANCE SHEET</Text>
      </View>
      {/* Tabs */}
      <View className="flex-row gap-1 p-3 border-b border-border bg-card">
        {(['assets', 'liabilities'] as const).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => onTabChange(tab)}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold capitalize transition-colors ${
              activeTab === tab ? 'bg-primary/20 text-primary' : 'text-muted-foreground'
            }`}
          >
            <Text className={`text-center ${activeTab === tab ? 'text-primary font-semibold' : ''}`}>
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>
      {/* List */}
      <View className="bg-card border border-border rounded-b-2xl">
        <View className="p-4 space-y-1">
          {items.map((item) => {
            if (isLiability) {
              const l = item as Liability;
              return <ItemRow key={l.id} icon={l.icon} name={l.name} type={l.type} value={l.amountOwed} monthly={l.monthlyPayment} isLiability />;
            }
            const a = item as Asset;
            return <ItemRow key={a.id} icon={a.icon} name={a.name} type={a.type} value={a.value} monthly={a.monthlyIncome} isLiability={false} />;
          })}
        </View>
        <Pressable
          onPress={onAdd}
          className="flex-row items-center justify-center gap-2 py-3 mx-4 mb-4 bg-primary/10 rounded-xl"
        >
          <Plus size={16} color="#C5FF00" />
          <Text className="text-sm text-primary font-semibold">Add {activeTab === 'assets' ? 'Asset' : 'Liability'}</Text>
        </Pressable>
        {/* Totals */}
        <View className="px-5 py-4 border-t border-border bg-muted/20">
          <View className="flex-row justify-between text-sm mb-1">
            <Text className="text-muted-foreground">Total Assets</Text>
            <Text className="font-semibold text-primary">RM {totalAssets.toLocaleString()}</Text>
          </View>
          <View className="flex-row justify-between text-sm mb-3">
            <Text className="text-muted-foreground">Total Liabilities</Text>
            <Text className="font-semibold text-red-400">RM {totalLiabilities.toLocaleString()}</Text>
          </View>
          <View className="flex-row justify-between items-center border-t border-border pt-3">
            <Text className="font-bold">Net Worth</Text>
            <Text className={`text-2xl font-bold ${netWorth >= 0 ? 'text-primary' : 'text-red-400'}`}>
              RM {netWorth.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}