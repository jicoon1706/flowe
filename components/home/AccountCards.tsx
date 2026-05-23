import { View, Text, Pressable, ScrollView } from 'react-native';
import { Landmark, PiggyBank, Wallet } from 'lucide-react-native';

const accounts: {
  id: string;
  type: 'bank' | 'tabung' | 'wallet';
  name: string;
  balance?: string;
  saved?: string;
  target?: string;
  color: string;
}[] = [
  { id: '1', type: 'bank', name: 'Maybank', balance: '3,200.00', color: '#ffd93d' },
  { id: '2', type: 'tabung', name: 'Tabung Raya', saved: '850.00', target: '5,000.00', color: '#6bcf7f' },
  { id: '3', type: 'wallet', name: 'Cash', balance: '200.00', color: '#00d4ff' },
];

interface AccountCardsProps {
  onAccountPress: (id: string) => void;
}

export function AccountCards({ onAccountPress }: AccountCardsProps) {
  const parseAmount = (str: string) => parseFloat(str.replace(/,/g, ''));
  return (
    <View className="mb-5">
      <View className="flex-row items-center justify-between px-4 mb-3">
        <Text className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
          Accounts
        </Text>
        <Pressable>
          <Text className="text-xs text-primary font-medium">See All</Text>
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
        {accounts.map((account) => (
          <Pressable
            key={account.id}
            onPress={() => onAccountPress(account.id)}
            className="mr-3 bg-card border border-border rounded-2xl p-4 w-36 active:scale-[0.98] transition-transform"
          >
            <View className="flex-row items-center justify-between mb-3">
              <View
                className="w-8 h-8 rounded-xl items-center justify-center"
                style={{ backgroundColor: account.color + '20' }}
              >
                {account.type === 'bank' && <Landmark size={16} color={account.color} />}
                {account.type === 'tabung' && <PiggyBank size={16} color={account.color} />}
                {account.type === 'wallet' && <Wallet size={16} color={account.color} />}
              </View>
            </View>
            <Text className="text-sm font-medium text-foreground mb-1">{account.name}</Text>
            {account.type === 'tabung' ? (
              <View>
                <Text className="text-xs text-muted-foreground">RM {account.saved} / {account.target}</Text>
                <View className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                  <View
                    className="h-full rounded-full"
                    style={{
                      width: `${(parseAmount(account.saved) / parseAmount(account.target)) * 100}%`,
                      backgroundColor: account.color,
                    }}
                  />
                </View>
              </View>
            ) : (
              <Text className="text-base font-semibold text-foreground">RM {account.balance}</Text>
            )}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}