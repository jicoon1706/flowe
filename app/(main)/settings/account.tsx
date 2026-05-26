import { View, Text, TextInput, Pressable, ScrollView, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { User } from 'lucide-react-native';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../src/lib/supabase';
import { LoadingView } from '../../../components/ui/LoadingView';

const FINANCIAL_IDENTITIES = [
  { label: 'Employee', value: 'employee' },
  { label: 'Entrepreneur', value: 'entrepreneur' },
  { label: 'Investor', value: 'investor' },
  { label: 'Business Owner', value: 'business_owner' },
] as const;

export default function AccountScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [financialIdentity, setFinancialIdentity] = useState<string>('employee');

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('display_name, financial_identity')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) console.warn('[account] fetch profile failed:', error);
        if (data) {
          setName(data.display_name ?? '');
          setFinancialIdentity(data.financial_identity ?? 'employee');
        }
        setLoading(false);
      });
  }, [user]);

  if (loading) return <LoadingView />;

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: name,
        financial_identity: financialIdentity,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);
    setSaving(false);
    if (error) {
      Alert.alert('Save failed', error.message);
      return;
    }
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScreenHeader title="Account" onBack={() => router.back()} />
      <View className="flex-1 px-4 pt-4">
        {/* Avatar */}
        <View className="items-center mb-8">
          <View className="w-24 h-24 rounded-2xl bg-primary items-center justify-center mb-3">
            <User size={40} color="#000000" />
          </View>
          <Text className="text-sm text-muted-foreground">Tap to change photo</Text>
        </View>

        {/* Form */}
        <View className="bg-card border border-border rounded-2xl p-5">
          <Text className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1.5">
            Display Name
          </Text>
          <View className="bg-input-background border border-border rounded-xl px-4 py-3">
            <TextInput
              value={name}
              onChangeText={setName}
              maxLength={30}
              className="text-base text-foreground outline-none"
              placeholderTextColor="#a0a0a0"
            />
          </View>
        </View>

        {/* Financial Identity */}
        <View className="bg-card border border-border rounded-2xl p-5 mt-4">
          <Text className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1.5">
            Financial Identity
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1">
            <View className="flex-row gap-2 px-1">
              {FINANCIAL_IDENTITIES.map((identity) => {
                const isActive = financialIdentity === identity.value;
                return (
                  <Pressable
                    key={identity.value}
                    onPress={() => setFinancialIdentity(identity.value)}
                    className={isActive ? 'bg-primary/10 border border-primary rounded-full px-4 py-2' : 'bg-card border border-border rounded-full px-4 py-2'}
                  >
                    <Text className={isActive ? 'text-primary text-sm' : 'text-muted-foreground text-sm'}>
                      {identity.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Save Button */}
        <Pressable
          onPress={handleSave}
          disabled={saving}
          className="bg-primary text-primary-foreground rounded-2xl py-4 items-center mt-6 active:scale-[0.98] transition-transform"
        >
          <Text className="text-base font-bold text-black">{saving ? 'Saving...' : 'Save'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
