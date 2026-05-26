import React from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { ChevronDown, Check } from 'lucide-react-native';

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
  const [isOpen, setIsOpen] = React.useState(false);
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
        accessibilityLabel={selected ? `Selected account: ${selected.name}` : 'No account selected'}
        accessibilityRole="button"
        onPress={() => accounts.length > 0 && setIsOpen(true)}
        className="flex-row items-center justify-between bg-input-background border border-border rounded-xl px-4 py-3"
      >
        <View className="flex-row items-center gap-3">
          {selected ? (
            <>
              <View className="w-6 h-6 rounded-lg" style={{ backgroundColor: selected.color + '30' }} />
              <View>
                <Text className="text-sm font-medium text-foreground">{selected.name}</Text>
                <Text className="text-xs text-muted-foreground">RM {selected.balance}</Text>
              </View>
            </>
          ) : (
            <Text className="text-sm text-muted-foreground">No accounts yet</Text>
          )}
        </View>
        <ChevronDown size={18} color="#a0a0a0" />
      </Pressable>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setIsOpen(false)}
        >
          <Pressable className="bg-card rounded-t-3xl p-6 pb-8" onPress={(e) => e.stopPropagation()}>
            <View className="w-12 h-1 bg-border rounded-full mx-auto mb-6" />
            <Text className="text-lg font-semibold text-foreground mb-4">Select Account</Text>
            <View className="gap-2">
              {accounts.map((account) => (
                <Pressable
                  key={account.id}
                  onPress={() => {
                    onChange(account.id);
                    setIsOpen(false);
                  }}
                  className={`flex-row items-center justify-between p-4 rounded-xl ${
                    account.id === value ? 'bg-primary/10 border border-primary' : 'bg-input-background border border-border'
                  }`}
                >
                  <View className="flex-row items-center gap-3">
                    <View className="w-8 h-8 rounded-lg" style={{ backgroundColor: account.color + '30' }} />
                    <View>
                      <Text className="text-sm font-medium text-foreground">{account.name}</Text>
                      <Text className="text-xs text-muted-foreground">RM {account.balance}</Text>
                    </View>
                  </View>
                  {account.id === value && <Check size={20} color="#C5FF00" />}
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}