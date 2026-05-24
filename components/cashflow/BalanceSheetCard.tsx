import { View, Text, Pressable } from 'react-native';
import { Plus, Wallet, Scale } from 'lucide-react-native';

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

const ASSET_COLOR = '#C5FF00';
const LIABILITY_COLOR = '#ff6b6b';

function ItemRow({ icon, name, type, value, monthly, isLiability }: {
  icon: string; name: string; type: string; value: number; monthly: number; isLiability: boolean;
}) {
  const color = isLiability ? LIABILITY_COLOR : ASSET_COLOR;
  return (
    <View
      className="flex-row items-center bg-background border border-border rounded-xl p-3 mb-2 border-l-2"
      style={{ borderLeftColor: color }}
    >
      <View
        className="w-10 h-10 rounded-xl items-center justify-center mr-3"
        style={{ backgroundColor: color + '20' }}
      >
        <Text className="text-lg">{icon}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-sm font-semibold text-foreground">{name}</Text>
        <Text className="text-xs text-muted-foreground">{type}</Text>
      </View>
      <View className="items-end">
        <Text className="text-sm font-bold" style={{ color }}>
          RM {value.toLocaleString()}
        </Text>
        <Text className="text-[11px]" style={{ color, opacity: 0.85 }}>
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
  const isPositive = netWorth >= 0;
  const netColor = isPositive ? ASSET_COLOR : LIABILITY_COLOR;

  const totalBoth = totalAssets + totalLiabilities;
  const assetPct = totalBoth > 0 ? (totalAssets / totalBoth) * 100 : 50;

  return (
    <View className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-4 pb-3">
        <Text className="font-bold tracking-wider text-xs text-muted-foreground">
          BALANCE SHEET
        </Text>
        <Text className="text-xs text-muted-foreground">{items.length} items</Text>
      </View>

      {/* Ratio bar */}
      <View className="px-5 pb-4">
        <View className="h-2 rounded-full bg-black/30 overflow-hidden flex-row">
          <View style={{ width: `${assetPct}%`, backgroundColor: ASSET_COLOR }} className="h-full" />
          <View style={{ width: `${100 - assetPct}%`, backgroundColor: LIABILITY_COLOR }} className="h-full" />
        </View>
        <View className="flex-row justify-between mt-1.5">
          <Text className="text-[10px]" style={{ color: ASSET_COLOR }}>
            Assets {assetPct.toFixed(0)}%
          </Text>
          <Text className="text-[10px]" style={{ color: LIABILITY_COLOR }}>
            Liabilities {(100 - assetPct).toFixed(0)}%
          </Text>
        </View>
      </View>

      {/* Segmented tabs */}
      <View className="px-5 pb-3">
        <View className="flex-row bg-background rounded-xl p-1 border border-border">
          {(['assets', 'liabilities'] as const).map((tab) => {
            const active = activeTab === tab;
            const tabColor = tab === 'assets' ? ASSET_COLOR : LIABILITY_COLOR;
            return (
              <Pressable
                key={tab}
                onPress={() => onTabChange(tab)}
                className="flex-1 py-2 rounded-lg items-center justify-center flex-row gap-1.5"
                style={active ? { backgroundColor: tabColor + '20' } : undefined}
              >
                {tab === 'assets' ? (
                  <Wallet size={13} color={active ? tabColor : '#a0a0a0'} />
                ) : (
                  <Scale size={13} color={active ? tabColor : '#a0a0a0'} />
                )}
                <Text
                  className="text-xs font-semibold capitalize"
                  style={{ color: active ? tabColor : '#a0a0a0' }}
                >
                  {tab}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* List */}
      <View className="px-5">
        {items.map((item) => {
          if (isLiability) {
            const l = item as Liability;
            return <ItemRow key={l.id} icon={l.icon} name={l.name} type={l.type} value={l.amountOwed} monthly={l.monthlyPayment} isLiability />;
          }
          const a = item as Asset;
          return <ItemRow key={a.id} icon={a.icon} name={a.name} type={a.type} value={a.value} monthly={a.monthlyIncome} isLiability={false} />;
        })}
        <Pressable
          onPress={onAdd}
          className="flex-row items-center justify-center gap-2 py-3 mb-4 rounded-xl border border-dashed"
          style={{
            borderColor: (isLiability ? LIABILITY_COLOR : ASSET_COLOR) + '50',
            backgroundColor: (isLiability ? LIABILITY_COLOR : ASSET_COLOR) + '10',
          }}
        >
          <Plus size={16} color={isLiability ? LIABILITY_COLOR : ASSET_COLOR} />
          <Text
            className="text-sm font-semibold"
            numberOfLines={1}
            style={{ color: isLiability ? LIABILITY_COLOR : ASSET_COLOR }}
          >
            {isLiability ? 'Add Liability' : 'Add Asset'}
          </Text>
        </Pressable>
      </View>

      {/* Totals + Net Worth hero footer */}
      <View
        className="px-5 py-4 border-t"
        style={{
          backgroundColor: netColor + '12',
          borderTopColor: netColor + '30',
        }}
      >
        <View className="flex-row justify-between mb-1.5">
          <Text className="text-xs text-muted-foreground">Total Assets</Text>
          <Text className="text-sm font-semibold" style={{ color: ASSET_COLOR }}>
            RM {totalAssets.toLocaleString()}
          </Text>
        </View>
        <View className="flex-row justify-between mb-3">
          <Text className="text-xs text-muted-foreground">Total Liabilities</Text>
          <Text className="text-sm font-semibold" style={{ color: LIABILITY_COLOR }}>
            RM {totalLiabilities.toLocaleString()}
          </Text>
        </View>
        <View
          className="flex-row justify-between items-center pt-3 border-t"
          style={{ borderTopColor: netColor + '30' }}
        >
          <View>
            <Text className="text-sm font-semibold text-foreground">Net Worth</Text>
            <Text className="text-[10px] text-muted-foreground">Assets − Liabilities</Text>
          </View>
          <Text className="text-2xl font-bold" style={{ color: netColor }}>
            {isPositive ? '' : '-'}RM {Math.abs(netWorth).toLocaleString()}
          </Text>
        </View>
      </View>
    </View>
  );
}
