import { View, Text, Pressable, ScrollView } from 'react-native';
import { Landmark, PiggyBank, Wallet } from 'lucide-react-native';
import type { Account } from '../../src/types/database.types';
import { accountColor } from '../../src/utils/accountColor';

interface AccountCardsProps {
  accounts: Account[];
  onAccountPress: (id: string, type: 'bank' | 'tabung' | 'wallet') => void;
  visible?: boolean;
}

export function AccountCards({ accounts, onAccountPress, visible = true }: AccountCardsProps) {
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
        {accounts.map((account) => {
          const color = accountColor(account);
          const name = account.name;
           
          const bank = (account as any).bank_accounts;
           
          const tabung = (account as any).tabung_accounts;
           
          const wallet = (account as any).wallet_accounts;
          const balance = bank?.current_balance ?? wallet?.current_balance ?? 0;
          const saved = tabung?.saved_amount ?? 0;
          const target = tabung?.target_amount ?? 0;
          return (
          <Pressable
            key={account.id}
            onPress={() => onAccountPress(account.id, account.type)}
            className="mr-3 bg-card border border-border rounded-2xl p-4 w-36 active:scale-[0.98] transition-transform"
          >
            <View className="flex-row items-center justify-between mb-3">
              <View
                className="w-8 h-8 rounded-xl items-center justify-center"
                style={{ backgroundColor: color + '20' }}
              >
                {account.type === 'bank' && <Landmark size={16} color={color} />}
                {account.type === 'tabung' && <PiggyBank size={16} color={color} />}
                {account.type === 'wallet' && <Wallet size={16} color={color} />}
              </View>
            </View>
            <Text className="text-sm font-medium text-foreground mb-1">{name}</Text>
            {account.type === 'tabung' ? (
              <View>
                <Text className="text-xs text-muted-foreground">
                  {visible
                    ? `RM ${saved.toLocaleString('en-US', { minimumFractionDigits: 2 })} / ${target.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                    : 'RM •••• / ••••'}
                </Text>
                <View className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                  <View
                    className="h-full rounded-full"
                    style={{
                      width: target ? `${(saved / target) * 100}%` : '0%',
                      backgroundColor: color,
                    }}
                  />
                </View>
              </View>
            ) : (
              <Text className="text-base font-semibold text-foreground">
                {visible ? `RM ${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'RM ••••••'}
              </Text>
            )}
          </Pressable>
        );
        })}
      </ScrollView>
    </View>
  );
}