import { View, Text, Pressable } from 'react-native';
import { ChevronDown } from 'lucide-react-native';

interface Account {
  id: string;
  name: string;
  balance: string;
  color: string;
}

interface AccountSelectorProps {
  value: string;
  onChange: (id: string) => void;
  label?: string;
  accounts?: Account[];
}

const defaultAccounts: Account[] = [
  { id: '1', name: 'Maybank', balance: '3,200.00', color: '#ffd93d' },
  { id: '2', name: 'Tabung Raya', balance: '850.00', color: '#6bcf7f' },
  { id: '3', name: 'Cash', balance: '200.00', color: '#00d4ff' },
];

export function AccountSelector({
  value,
  onChange,
  label = 'Account',
  accounts = defaultAccounts,
}: AccountSelectorProps) {
  const selected = accounts.find((a) => a.id === value) || accounts[0];

  return (
    <View className="gap-1.5 mb-4">
      {label && (
        <Text className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
          {label}
        </Text>
      )}
      <Pressable
        accessible
        accessibilityLabel={`Selected account: ${selected.name}`}
        accessibilityRole="button"
        onPress={() => {
          const currentIndex = accounts.findIndex((a) => a.id === value);
          const nextIndex = (currentIndex + 1) % accounts.length;
          onChange(accounts[nextIndex].id);
        }}
        className="flex-row items-center justify-between bg-input-background border border-border rounded-xl px-4 py-3"
      >
        <View className="flex-row items-center gap-3">
          <View className="w-6 h-6 rounded-lg" style={{ backgroundColor: selected.color + '30' }} />
          <View>
            <Text className="text-sm font-medium text-foreground">{selected.name}</Text>
            <Text className="text-xs text-muted-foreground">RM {selected.balance}</Text>
          </View>
        </View>
        <ChevronDown size={18} color="#a0a0a0" />
      </Pressable>
    </View>
  );
}