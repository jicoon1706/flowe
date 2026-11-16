import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Send, Store } from 'lucide-react-native';
import { colors, radius } from '@/theme/tokens';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { HeroScreen } from '@/components/ui/HeroScreen';
import { InlineError } from '@/components/ui/InlineError';
import { LogoWell } from '@/components/ui/LogoWell';
import { SettingsRow } from '@/components/ui/SettingsRow';
import { Text } from '@/components/ui/Text';
import { TextInput } from '@/components/ui/TextInput';
import { TopBar } from '@/components/ui/TopBar';
import { useToast } from '@/components/ui/ToastProvider';
import { useAuth } from '@/context/AuthContext';
import { merchantLogoRequestsRepository, type MerchantLogoRequest } from '@/src/repositories/merchantLogos.repository';
import { matchMerchant } from '@/src/utils/merchantLogo';

const CATEGORIES = [
  { value: 'food', label: 'Food & Drink' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'transport', label: 'Transport' },
  { value: 'bills', label: 'Bills' },
  { value: 'others', label: 'Other' },
];

/** settings/merchant-request — for merchants without a logo or auto-detect rule. Primary: Send request. */
export default function MerchantRequestScreen() {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const [merchant, setMerchant] = useState('');
  const [example, setExample] = useState('');
  const [category, setCategory] = useState('food');
  const [sending, setSending] = useState(false);
  const [mine, setMine] = useState<MerchantLogoRequest[]>([]);

  const loadMine = useCallback(async () => {
    const r = await merchantLogoRequestsRepository.fetchMine();
    if (r.ok) setMine(r.data);
  }, []);
  useEffect(() => { if (user) loadMine(); }, [user, loadMine]);

  const name = merchant.trim();
  const known = name.length >= 2 ? matchMerchant(name) : undefined;

  const send = async () => {
    if (!user || name.length < 2 || known) return;
    setSending(true);
    const res = await merchantLogoRequestsRepository.create({ user_id: user.id, merchant: name, example_name: example.trim() || undefined, category });
    setSending(false);
    if (!res.ok) {
      const duplicate = res.error.message?.toLowerCase().includes('duplicate');
      if (duplicate) toast.failure(`You’ve already asked for ${name}`);
      else toast.failure('Couldn’t send request', { label: 'Retry', onPress: send });
      return;
    }
    setMerchant(''); setExample('');
    loadMine();
    toast.success('Request sent');
  };

  return (
    <HeroScreen
      heroHeight={180}
      bottomPadding={32}
      sheetPadding={{ top: 20, horizontal: 24 }}
      hero={
        <>
          <TopBar onBack={() => router.back()} />
          <Text variant="display-md" tone="inverse" style={{ paddingHorizontal: 24, marginTop: 12 }} accessibilityRole="header">Request a merchant</Text>
        </>
      }
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: radius.md, backgroundColor: colors['surface-container'], paddingVertical: 14, paddingHorizontal: 16 }}>
        <LogoWell merchant={name} fallback={Store} on="grey" />
        <View style={{ flex: 1 }}>
          <Text variant="body-lg">{name || 'Merchant'}</Text>
          <Text variant="label-sm" tone="meta">{known ? 'Flowe already knows this one' : 'No logo yet — shown with a line icon'}</Text>
        </View>
      </View>
      <TextInput label="Merchant name" value={merchant} onChangeText={setMerchant} autoCapitalize="words" placeholder="e.g. 99 Speedmart" />
      {known ? <InlineError message={`${name} is already recognised. Nothing to request.`} /> : null}
      <TextInput label="How it shows on your statement (optional)" value={example} onChangeText={setExample} autoCapitalize="characters" placeholder="e.g. 99SM SS15" />
      <View style={{ gap: 8 }}>
        <Text variant="label-sm" tone="muted">Usual category</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {CATEGORIES.map((c) => <Chip key={c.value} label={c.label} selected={c.value === category} onPress={() => setCategory(c.value)} />)}
        </View>
      </View>
      <View style={{ height: 8 }} />
      <Button label="Send request" icon={Send} onPress={send} loading={sending} loadingLabel="Sending…" disabled={name.length < 2 || !!known} fullWidth />
      {mine.length ? (
        <View style={{ marginTop: 8 }}>
          <Text variant="label-sm" tone="muted">Your requests</Text>
          {mine.map((r) => (
            <SettingsRow key={r.id} label={r.merchant} value={r.status === 'pending' ? 'Waiting to be added' : r.status === 'added' ? 'Added' : 'Not added'} icon={Store} />
          ))}
        </View>
      ) : null}
    </HeroScreen>
  );
}
