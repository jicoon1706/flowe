import { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { MerchantIcon } from '../../../components/ui/MerchantIcon';
import { useAuth } from '../../../context/AuthContext';
import { useKeyboardHeight } from '../../../src/hooks/useKeyboardHeight';
import { expenseCategories } from '../../../constants/categories';
import { matchMerchant } from '../../../src/utils/merchantLogo';
import {
  merchantLogoRequestsRepository,
  type MerchantLogoRequest,
} from '../../../src/repositories/merchantLogos.repository';

const STATUS_LABEL: Record<MerchantLogoRequest['status'], string> = {
  pending: 'Waiting to be added',
  added: 'Added — it should show up now',
  declined: 'Not added',
};

const STATUS_COLOR: Record<MerchantLogoRequest['status'], string> = {
  pending: '#a0a0a0',
  added: '#C5FF00',
  declined: '#ff6b6b',
};

/**
 * Asks for a merchant Flowe doesn't recognise yet.
 *
 * The logo list is curated rather than user-editable — one person's typo would
 * otherwise put a wrong brand mark on everyone's transactions — so this is the
 * way in: the request is filed, and whoever maintains the list turns it into a
 * real entry. Requests reach every user once granted, since the list is fetched
 * from the database at launch rather than shipped in the app.
 */
export default function MerchantRequestScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const keyboardHeight = useKeyboardHeight();

  const [merchant, setMerchant] = useState('');
  const [exampleName, setExampleName] = useState('');
  const [category, setCategory] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [mine, setMine] = useState<MerchantLogoRequest[]>([]);

  const loadMine = useCallback(async () => {
    const result = await merchantLogoRequestsRepository.fetchMine();
    if (result.ok) setMine(result.data);
  }, []);

  useEffect(() => {
    if (user) loadMine();
  }, [user, loadMine]);

  // Nothing to request if the name already matches something — tell the user
  // rather than letting them file a duplicate and wait on it.
  const alreadyKnown = matchMerchant(merchant.trim());
  const canSubmit = merchant.trim().length >= 2 && !alreadyKnown && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit || !user) return;
    setSubmitting(true);
    const result = await merchantLogoRequestsRepository.create({
      user_id: user.id,
      merchant: merchant.trim(),
      example_name: exampleName.trim() || undefined,
      category: category || undefined,
    });
    setSubmitting(false);

    if (!result.ok) {
      // The unique index on (user, merchant) while pending is doing its job.
      const duplicate = result.error.message?.toLowerCase().includes('duplicate');
      Alert.alert(
        duplicate ? 'Already requested' : 'Could not send',
        duplicate
          ? `You've already asked for ${merchant.trim()}. It's still waiting to be added.`
          : result.error.message
      );
      return;
    }

    setMerchant('');
    setExampleName('');
    setCategory('');
    loadMine();
    Alert.alert(
      'Request sent',
      'Thanks — once it’s added, the logo appears on your transactions without needing an app update.'
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScreenHeader title="Request a merchant" onBack={() => router.back()} />

      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: keyboardHeight ? keyboardHeight + 32 : 40 }}
      >
        <Text className="text-sm text-muted-foreground mb-5">
          Spotted a shop Flowe shows a plain icon for? Tell us its name and we&apos;ll add its
          logo to the list everyone shares.
        </Text>

        {/* Merchant name */}
        <Text className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1.5">
          Merchant name
        </Text>
        <TextInput
          value={merchant}
          onChangeText={setMerchant}
          placeholder="e.g. Mixue"
          placeholderTextColor="#6b7280"
          autoCapitalize="words"
          className="bg-card border border-border rounded-xl px-4 py-3 text-foreground mb-2"
        />

        {/* Recognised already — show what it currently resolves to. */}
        {alreadyKnown && (
          <View className="flex-row items-center gap-3 bg-card border border-primary/40 rounded-xl px-4 py-3 mb-4">
            <MerchantIcon name={merchant} fallback="🏷️" size={36} />
            <Text className="flex-1 text-xs text-muted-foreground">
              Flowe already recognises this one — it should be showing its logo on your
              transactions.
            </Text>
          </View>
        )}
        {!alreadyKnown && <View className="mb-2" />}

        {/* Example transaction name */}
        <Text className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1.5">
          How it appears on your statement{' '}
          <Text className="text-muted-foreground/70 normal-case">(optional)</Text>
        </Text>
        <TextInput
          value={exampleName}
          onChangeText={setExampleName}
          placeholder="e.g. MIXUE SETIA ALAM SDN BHD"
          placeholderTextColor="#6b7280"
          autoCapitalize="characters"
          className="bg-card border border-border rounded-xl px-4 py-3 text-foreground mb-1"
        />
        <Text className="text-[11px] text-muted-foreground mb-4">
          Helps us match the right keyword instead of guessing at it.
        </Text>

        {/* Category */}
        <Text className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1.5">
          Usual category <Text className="text-muted-foreground/70 normal-case">(optional)</Text>
        </Text>
        <View className="flex-row flex-wrap gap-2 mb-5">
          {expenseCategories.map((c) => {
            const active = category === c.id;
            return (
              <Pressable
                key={c.id}
                // Tapping the selected chip clears it — "no opinion" has to stay
                // reachable once something has been picked.
                onPress={() => setCategory(active ? '' : c.id)}
                className={`flex-row items-center gap-1.5 px-3 py-2 rounded-xl ${
                  active ? 'bg-primary' : 'bg-card border border-border'
                }`}
              >
                <Text className="text-sm">{c.emoji}</Text>
                <Text
                  className={`text-xs ${active ? 'text-black font-semibold' : 'text-foreground'}`}
                >
                  {c.name}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={handleSubmit}
          disabled={!canSubmit}
          className={`items-center py-3.5 rounded-2xl ${canSubmit ? 'bg-primary' : 'bg-muted'}`}
        >
          <Text
            className={`text-sm font-semibold ${
              canSubmit ? 'text-black' : 'text-muted-foreground'
            }`}
          >
            {submitting ? 'Sending…' : 'Send request'}
          </Text>
        </Pressable>

        {/* What they've already asked for */}
        {mine.length > 0 && (
          <View className="mt-8">
            <Text className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-3">
              Your requests
            </Text>
            {mine.map((r) => (
              <View
                key={r.id}
                className="flex-row items-center gap-3 bg-card border border-border rounded-xl px-4 py-3 mb-2"
              >
                <MerchantIcon name={r.merchant} fallback="🏷️" size={36} />
                <View className="flex-1">
                  <Text className="text-sm font-medium text-foreground">{r.merchant}</Text>
                  <Text className="text-[11px]" style={{ color: STATUS_COLOR[r.status] }}>
                    {STATUS_LABEL[r.status]}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
