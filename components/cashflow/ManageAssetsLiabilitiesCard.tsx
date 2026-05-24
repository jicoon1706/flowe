import { View, Text, Pressable } from 'react-native';
import { useState } from 'react';
import { Trash, Pencil, Plus, Check, X, Wallet, Scale } from 'lucide-react-native';

interface Asset { id: string; name: string; type: string; icon: string; value: number; monthlyIncome: number; }
interface Liability { id: string; name: string; type: string; icon: string; amountOwed: number; monthlyPayment: number; }

interface ManageAssetsLiabilitiesCardProps {
  assets: Asset[];
  liabilities: Liability[];
  activeTab: 'assets' | 'liabilities';
  onTabChange: (tab: 'assets' | 'liabilities') => void;
  onEdit: (item: Asset | Liability) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

const ASSET_COLOR = '#C5FF00';
const LIABILITY_COLOR = '#ff6b6b';

export function ManageAssetsLiabilitiesCard({
  assets,
  liabilities,
  activeTab,
  onTabChange,
  onEdit,
  onDelete,
  onAdd,
}: ManageAssetsLiabilitiesCardProps) {
  const items = activeTab === 'assets' ? assets : liabilities;
  const isLiability = activeTab === 'liabilities';
  const accentColor = isLiability ? LIABILITY_COLOR : ASSET_COLOR;
  const [deleteId, setDeleteId] = useState<string | null>(null);

  return (
    <View className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-4 pb-3">
        <Text className="font-bold tracking-wider text-xs text-muted-foreground">
          MANAGE ASSETS & LIABILITIES
        </Text>
        <Text className="text-xs text-muted-foreground">{items.length} items</Text>
      </View>

      {/* Segmented tabs */}
      <View className="px-5 pb-4">
        <View className="flex-row bg-background rounded-xl p-1 border border-border">
          {(['assets', 'liabilities'] as const).map((tab) => {
            const active = activeTab === tab;
            const tabColor = tab === 'assets' ? ASSET_COLOR : LIABILITY_COLOR;
            return (
              <Pressable
                key={tab}
                onPress={() => { onTabChange(tab); setDeleteId(null); }}
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
          const isAsset = !isLiability;
          const v = isAsset ? (item as Asset).value : (item as Liability).amountOwed;
          const m = isAsset ? (item as Asset).monthlyIncome : (item as Liability).monthlyPayment;
          const name = isAsset ? (item as Asset).name : (item as Liability).name;
          const type = isAsset ? (item as Asset).type : (item as Liability).type;
          const icon = isAsset ? (item as Asset).icon : (item as Liability).icon;
          const isDeleting = deleteId === item.id;

          return (
            <View
              key={item.id}
              className="bg-background border border-border rounded-xl p-3 mb-2 border-l-2"
              style={{
                borderLeftColor: accentColor,
                ...(isDeleting && { borderColor: LIABILITY_COLOR + '60', backgroundColor: LIABILITY_COLOR + '08' }),
              }}
            >
              <View className="flex-row items-center gap-3">
                <View
                  className="w-11 h-11 rounded-xl items-center justify-center"
                  style={{ backgroundColor: accentColor + '20' }}
                >
                  <Text className="text-xl">{icon}</Text>
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-sm text-foreground" numberOfLines={1}>
                    {name}
                  </Text>
                  <Text className="text-[11px] text-muted-foreground mb-0.5">{type}</Text>
                  <View className="flex-row items-baseline gap-2">
                    <Text className="text-sm font-bold" style={{ color: accentColor }}>
                      RM {v.toLocaleString()}
                    </Text>
                    <Text className="text-[11px]" style={{ color: accentColor, opacity: 0.85 }}>
                      {isAsset ? `+RM ${m}/mo` : `-RM ${m}/mo`}
                    </Text>
                  </View>
                </View>
                <View className="flex-row gap-1.5">
                  {isDeleting ? (
                    <>
                      <Pressable
                        onPress={() => { onDelete(item.id); setDeleteId(null); }}
                        className="w-8 h-8 rounded-lg items-center justify-center"
                        style={{ backgroundColor: LIABILITY_COLOR }}
                      >
                        <Check size={15} color="#ffffff" />
                      </Pressable>
                      <Pressable
                        onPress={() => setDeleteId(null)}
                        className="w-8 h-8 rounded-lg items-center justify-center bg-muted"
                      >
                        <X size={15} color="#a0a0a0" />
                      </Pressable>
                    </>
                  ) : (
                    <>
                      <Pressable
                        onPress={() => onEdit(item)}
                        className="w-8 h-8 rounded-lg items-center justify-center"
                        style={{ backgroundColor: '#ffffff10' }}
                      >
                        <Pencil size={14} color="#a0a0a0" />
                      </Pressable>
                      <Pressable
                        onPress={() => setDeleteId(item.id)}
                        className="w-8 h-8 rounded-lg items-center justify-center"
                        style={{ backgroundColor: LIABILITY_COLOR + '15' }}
                      >
                        <Trash size={14} color={LIABILITY_COLOR} />
                      </Pressable>
                    </>
                  )}
                </View>
              </View>
            </View>
          );
        })}

        {items.length === 0 && (
          <View className="py-6 items-center">
            <Text className="text-sm text-muted-foreground">
              No {isLiability ? 'liabilities' : 'assets'} yet
            </Text>
          </View>
        )}

        <Pressable
          onPress={onAdd}
          className="flex-row items-center justify-center gap-2 py-3 mb-4 rounded-xl border border-dashed"
          style={{
            borderColor: accentColor + '50',
            backgroundColor: accentColor + '10',
          }}
        >
          <Plus size={16} color={accentColor} />
          <Text
            className="text-sm font-semibold"
            numberOfLines={1}
            style={{ color: accentColor }}
          >
            {isLiability ? 'Add Liability' : 'Add Asset'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
