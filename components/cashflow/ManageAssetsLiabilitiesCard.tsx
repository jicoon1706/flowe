import { View, Text, Pressable } from 'react-native';
import { useState } from 'react';
import { Trash, Pencil, Plus, Check, X } from 'lucide-react-native';

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
  const accentColor = isLiability ? '#ff6b6b' : '#C5FF00';
  const [deleteId, setDeleteId] = useState<string | null>(null);

  return (
    <View>
      <View className="bg-muted/40 px-5 py-3 border-b border-border rounded-t-2xl">
        <Text className="font-bold text-sm">Manage Assets & Liabilities</Text>
      </View>
      {/* Tabs */}
      <View className="flex gap-1 p-3 border-b border-border bg-card">
        {(['assets', 'liabilities'] as const).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => onTabChange(tab)}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold capitalize transition-colors ${
              activeTab === tab ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
            }`}
          >
            <Text className={`text-center ${activeTab === tab ? 'text-primary-foreground' : ''}`}>
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>
      {/* List */}
      <View className="bg-card border border-border rounded-b-2xl p-4 space-y-2">
        {items.map((item) => {
          const isAsset = !isLiability;
          const v = isAsset ? (item as Asset).value : (item as Liability).amountOwed;
          const m = isAsset ? (item as Asset).monthlyIncome : (item as Liability).monthlyPayment;
          const name = isAsset ? (item as Asset).name : (item as Liability).name;
          const type = isAsset ? (item as Asset).type : (item as Liability).type;
          const icon = isAsset ? (item as Asset).icon : (item as Liability).icon;
          return (
            <View key={item.id} className="bg-background border border-border border-l-2 rounded-xl p-3" style={{ borderLeftColor: accentColor }}>
              <View className="flex-row items-start gap-3">
                <View className="w-10 h-10 bg-primary/15 rounded-xl items-center justify-center">
                  <Text className="text-xl">{icon}</Text>
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-sm text-foreground">{name}</Text>
                  <Text className="text-xs text-muted-foreground">{type}</Text>
                  <View className="flex-row gap-3 mt-1">
                    <Text className={`text-sm font-bold ${isAsset ? 'text-primary' : 'text-red-400'}`}>
                      RM {v.toLocaleString()}
                    </Text>
                    <Text className={`text-xs ${isAsset ? 'text-primary' : 'text-red-400'}`}>
                      {isAsset ? `+RM ${m}/mo` : `-RM ${m}/mo`}
                    </Text>
                  </View>
                </View>
                <View className="flex-row gap-1">
                  <Pressable onPress={() => onEdit(item)} className="p-1.5 rounded-lg hover:bg-muted">
                    <Pencil size={16} color="#a0a0a0" />
                  </Pressable>
                  {deleteId === item.id ? (
                    <View className="flex-row gap-1">
                      <Pressable onPress={() => { onDelete(item.id); setDeleteId(null); }} className="p-1.5 rounded-lg bg-red-500">
                        <Check size={16} color="#ffffff" />
                      </Pressable>
                      <Pressable onPress={() => setDeleteId(null)} className="p-1.5 rounded-lg bg-muted">
                        <X size={16} color="#a0a0a0" />
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable onPress={() => setDeleteId(item.id)} className="p-1.5 rounded-lg hover:bg-red-500/20">
                      <Trash size={16} color="#a0a0a0" />
                    </Pressable>
                  )}
                </View>
              </View>
            </View>
          );
        })}
        <Pressable
          onPress={onAdd}
          className="flex-row items-center justify-center gap-2 py-3 bg-primary/10 rounded-xl"
        >
          <Plus size={16} color="#C5FF00" />
          <Text className="text-sm text-primary font-semibold">Add {activeTab === 'assets' ? 'Asset' : 'Liability'}</Text>
        </Pressable>
      </View>
    </View>
  );
}