import { useState } from 'react';
import { Platform, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { CalendarDays } from 'lucide-react-native';
import { TABUNG_GOALS } from '@/constants/tabungGoals';
import { AccountPill } from '@/components/ui/AccountPill';
import { AmountField } from '@/components/ui/AmountField';
import { Button } from '@/components/ui/Button';
import { HeroScreen } from '@/components/ui/HeroScreen';
import { Text } from '@/components/ui/Text';
import { TextInput } from '@/components/ui/TextInput';
import { TopBar } from '@/components/ui/TopBar';
import { useToast } from '@/components/ui/ToastProvider';
import { useAuth } from '@/context/AuthContext';
import { useAccounts } from '@/src/hooks/useAccounts';
import { parseAmount } from '@/src/lib/money';
import { localYMD } from '@/src/utils/date';

/** tabung/new/form — step 2: name (pre-filled from the goal), target, target date. Primary: Create Tabung. */
export default function NewTabungForm() {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const { goal: goalKey } = useLocalSearchParams<{ goal?: string }>();
  const goal = TABUNG_GOALS.find((g) => g.key === goalKey) ?? TABUNG_GOALS[TABUNG_GOALS.length - 1];
  const { createTabungAccount } = useAccounts();
  const [name, setName] = useState(goal.defaultName);
  const [target, setTarget] = useState('');
  const [date, setDate] = useState(() => { const d = new Date(); return new Date(d.getFullYear() + 1, 11, 31); });
  const [showDate, setShowDate] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; target?: string }>({});
  const [saving, setSaving] = useState(false);

  const create = async () => {
    const t = parseAmount(target);
    const next = { name: name.trim() ? undefined : 'Give this Tabung a name', target: t && t > 0 ? undefined : 'Set a target above RM 0.00' };
    setErrors(next);
    if (next.name || next.target || !user || !t) return;
    setSaving(true);
    const res = await createTabungAccount({
      user_id: user.id,
      name: name.trim(),
      icon: goal.key,
      template_type: goal.key,
      target_amount: t,
      from_date: localYMD(new Date()),
      to_date: localYMD(date),
    });
    setSaving(false);
    if (!res.ok) { toast.failure('Couldn’t create Tabung', { label: 'Retry', onPress: create }); return; }
    toast.success(`Tabung created · ${name.trim()}`);
    router.dismissTo('/home/accounts');
  };

  return (
    <HeroScreen
      bottomPadding={32}
      sheetPadding={{ top: 24, horizontal: 24 }}
      hero={
        <View style={{ paddingBottom: 40 }}>
          <TopBar onBack={() => router.back()} />
          <Text variant="display-md" tone="inverse" style={{ paddingHorizontal: 24, marginTop: 28 }} accessibilityRole="header">{name.trim() || goal.label}</Text>
        </View>
      }
    >
      <TextInput label="Name" value={name} onChangeText={(v) => { setName(v); setErrors((e) => ({ ...e, name: undefined })); }} error={errors.name} autoCapitalize="words" />
      <AmountField label="Target" value={target} onChangeText={(v) => { setTarget(v); setErrors((e) => ({ ...e, target: undefined })); }} error={errors.target} />
      <View style={{ gap: 8 }}>
        <Text variant="label-sm" tone="muted">Target date</Text>
        <View style={{ flexDirection: 'row' }}>
          <AccountPill label={date.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })} plainIcon={CalendarDays} onPress={() => setShowDate(true)} accessibilityLabel="Target date" />
        </View>
      </View>
      {showDate ? (
        <DateTimePicker
          value={date}
          mode="date"
          minimumDate={new Date()}
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={(e: DateTimePickerEvent, d?: Date) => { setShowDate(Platform.OS === 'ios' && e.type !== 'dismissed'); if (d && e.type === 'set') setDate(d); }}
        />
      ) : null}
      <View style={{ flex: 1, minHeight: 24 }} />
      <Button label="Create Tabung" onPress={create} loading={saving} loadingLabel="Creating…" fullWidth />
    </HeroScreen>
  );
}
