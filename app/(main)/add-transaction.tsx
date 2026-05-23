import { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Camera, RefreshCw, Calendar } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { expenseCategories, incomeCategories } from '../../constants/categories';
import { Button } from '../../components/ui/Button';
import { AmountInput } from '../../components/ui/AmountInput';
import { CategoryChips } from '../../components/ui/CategoryChips';
import { AccountSelector } from '../../components/ui/AccountSelector';

type TransactionType = 'expense' | 'income' | 'transfer';

export default function AddTransactionScreen() {
  const router = useRouter();
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('food');
  const [account, setAccount] = useState('1');
  const [toAccount, setToAccount] = useState('2');
  const [recurring, setRecurring] = useState(false);
  const [recurringFreq, setRecurringFreq] = useState('monthly');
  const [note, setNote] = useState('');

  const categories = type === 'expense' ? expenseCategories : incomeCategories;

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
        <Pressable onPress={() => router.back()} className="p-2">
          <X size={24} color="#ffffff" />
        </Pressable>
        <Text className="text-lg font-semibold text-foreground">Add Transaction</Text>
        <View className="w-10" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Scan Receipt */}
        <View className="px-4 pt-4">
          <Pressable className="w-full bg-primary rounded-2xl py-4 flex-row items-center justify-center gap-2 active:scale-[0.98] transition-transform">
            <Camera size={20} color="#000000" />
            <Text className="text-base font-bold text-primary-foreground">Scan Receipt</Text>
          </Pressable>
        </View>

        {/* Type Tabs */}
        <View className="px-4 pt-4">
          <View className="flex-row bg-card rounded-2xl p-1">
            {(['expense', 'income', 'transfer'] as TransactionType[]).map((t) => (
              <Pressable
                key={t}
                onPress={() => setType(t)}
                className={`flex-1 py-2.5 rounded-xl ${type === t ? 'bg-primary' : ''}`}
              >
                <Text
                  className={`text-sm font-semibold text-center ${
                    type === t ? 'text-primary-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Amount Input */}
        <View className="px-4 pt-6">
          <AmountInput value={amount} onChange={setAmount} />
        </View>

        {/* Form Fields */}
        <View className="px-4 pt-6">
          {/* Name */}
          <View className="mb-4">
            <Text className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1.5">
              Name
            </Text>
            <TextInput
              placeholder={type === 'expense' ? 'What was this expense?' : 'What was this income?'}
              placeholderTextColor="#a0a0a0"
              value={name}
              onChangeText={setName}
              className="bg-input-background border border-border rounded-xl px-4 py-3 text-base text-foreground"
            />
          </View>

          {/* Category */}
          <Text className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1.5">
            Category
          </Text>
          <CategoryChips
            categories={categories}
            selected={category}
            onSelect={setCategory}
          />

          {/* Account Selector */}
          <AccountSelector
            value={account}
            onChange={setAccount}
            label={type === 'transfer' ? 'From' : type === 'expense' ? 'From Account' : 'To Account'}
          />

          {type === 'transfer' && (
            <AccountSelector value={toAccount} onChange={setToAccount} label="To Account" />
          )}

          {/* Date */}
          <View className="mb-4">
            <Text className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1.5">
              Date
            </Text>
            <Pressable className="flex-row items-center gap-3 bg-input-background border border-border rounded-xl px-4 py-3">
              <Calendar size={18} color="#a0a0a0" />
              <Text className="text-base text-foreground">Today</Text>
            </Pressable>
          </View>

          {/* Recurring Toggle */}
          <Pressable
            onPress={() => setRecurring(!recurring)}
            className="flex-row items-center justify-between bg-card border border-border rounded-xl px-4 py-3 mb-4"
          >
            <View className="flex-row items-center gap-3">
              <RefreshCw size={18} color="#a0a0a0" />
              <View>
                <Text className="text-sm font-medium text-foreground">Recurring</Text>
                <Text className="text-xs text-muted-foreground">Repeat automatically</Text>
              </View>
            </View>
            <View
              className={`w-11 h-6 rounded-full p-0.5 transition-colors ${
                recurring ? 'bg-primary' : 'bg-switch-background'
              }`}
            >
              <View
                className="w-5 h-5 rounded-full bg-white"
                style={{ transform: [{ translateX: recurring ? 20 : 0 }] }}
              />
            </View>
          </Pressable>

          {recurring && (
            <View className="mb-4">
              <Text className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">
                Frequency
              </Text>
              <View className="flex-row gap-2">
                {['weekly', 'monthly', 'yearly'].map((freq) => (
                  <Pressable
                    key={freq}
                    onPress={() => setRecurringFreq(freq)}
                    className={`flex-1 py-2 rounded-xl border ${
                      recurringFreq === freq
                        ? 'bg-primary/10 border-primary'
                        : 'bg-card border-border'
                    }`}
                  >
                    <Text
                      className={`text-xs font-medium text-center ${
                        recurringFreq === freq ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    >
                      {freq.charAt(0).toUpperCase() + freq.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Note */}
          <View className="mb-4">
            <Text className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1.5">
              Note (optional)
            </Text>
            <TextInput
              placeholder="Add a note..."
              placeholderTextColor="#a0a0a0"
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
              className="bg-input-background border border-border rounded-xl px-4 py-3 text-base text-foreground h-20 text-start"
            />
          </View>

          {/* Attach Image */}
          <Pressable className="flex-row items-center justify-center gap-2 py-3 mb-6 border border-dashed border-border rounded-xl">
            <Camera size={18} color="#a0a0a0" />
            <Text className="text-sm text-muted-foreground">Attach Image</Text>
          </Pressable>

          {/* Submit Button */}
          <Button
            title={type === 'transfer' ? 'Transfer' : 'Submit'}
            onPress={() => router.back()}
            variant="primary"
            size="lg"
            className="mb-6"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}