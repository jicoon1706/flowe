import { useCallback, useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { ResponsiveContainer } from '@/components/ui/ResponsiveContainer';
import { Bell, Clock, Plus, Quote, Trash2 } from 'lucide-react-native';
import { colors } from '@/theme/tokens';
import { AffirmationCard } from '@/components/home/AffirmationCard';
import { SettingsScreen } from '@/components/settings/SettingsScreen';
import { AccountPill } from '@/components/ui/AccountPill';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { ConfirmSheet } from '@/components/ui/ConfirmSheet';
import { SettingsRow } from '@/components/ui/SettingsRow';
import { Sheet } from '@/components/ui/Sheet';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { TextInput } from '@/components/ui/TextInput';
import { Toggle } from '@/components/ui/Toggle';
import { useToast } from '@/components/ui/ToastProvider';
import { useAuth } from '@/context/AuthContext';
import { useAffirmations } from '@/src/hooks/useAffirmations';
import { useSettings } from '@/src/hooks/useSettings';
import { affirmationsRepository } from '@/src/repositories/affirmations.repository';
import type { AffirmationCategory, UserAffirmation } from '@/src/types';

const CATEGORIES: { value: AffirmationCategory; label: string }[] = [
  { value: 'saving', label: 'Saving' }, { value: 'investing', label: 'Investing' }, { value: 'mindset', label: 'Mindset' }, { value: 'awareness', label: 'Awareness' },
];

function timeLabel(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(2000, 0, 1, h || 0, m || 0);
  return d.toLocaleTimeString('en-MY', { hour: 'numeric', minute: '2-digit' });
}

/** settings/affirmations — daily toggle + time, gradient preview (one per screen), your own; "Write my own" is secondary. */
export default function AffirmationSettingsScreen() {
  const toast = useToast();
  const { user } = useAuth();
  const { settings, fetchSettings, updateSettings } = useSettings();
  const { affirmations, userAffirmations, loading, fetchAffirmations, fetchUserAffirmations, addUserAffirmation } = useAffirmations();
  const [show, setShow] = useState(true);
  const [time, setTime] = useState('08:00');
  const [picker, setPicker] = useState(false);
  const [writing, setWriting] = useState(false);
  const [text, setText] = useState('');
  const [cat, setCat] = useState<AffirmationCategory>('mindset');
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState<UserAffirmation | null>(null);

  const load = useCallback(() => { if (user) { fetchSettings(user.id); fetchUserAffirmations(user.id); } fetchAffirmations(); }, [user, fetchSettings, fetchUserAffirmations, fetchAffirmations]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  useEffect(() => { if (settings) { setShow(!!settings.show_affirmations); setTime((settings.daily_reminder_time || '08:00').slice(0, 5)); } }, [settings]);

  const persist = async (patch: { show_affirmations?: boolean; daily_reminder_time?: string }) => {
    if (!user) return;
    const res = await updateSettings(user.id, patch);
    if (!res.ok) toast.failure('Couldn’t save that setting', { label: 'Retry', onPress: () => { persist(patch); } });
  };

  const add = async () => {
    if (!user || !text.trim()) return;
    setSaving(true);
    const res = await addUserAffirmation(user.id, text.trim(), cat);
    setSaving(false);
    if (!res.ok) { toast.failure('Couldn’t add it', { label: 'Retry', onPress: add }); return; }
    setWriting(false);
    setText('');
    fetchUserAffirmations(user.id);
    toast.success('Affirmation added');
  };

  const remove = async () => {
    if (!removing || !user) return;
    const res = await affirmationsRepository.removeUserAffirmation(removing.id);
    if (!res.ok) { toast.failure('Couldn’t remove it', { label: 'Retry', onPress: remove }); return; }
    setRemoving(null);
    fetchUserAffirmations(user.id);
  };

  const mine = userAffirmations.filter((a) => a.is_active);
  const preview = mine[0]?.text ?? affirmations[0]?.quote;
  const [h, m] = time.split(':').map(Number);

  return (
    <SettingsScreen
      title="Affirmations"
      overlay={
        <>
          <Sheet visible={writing} onClose={() => setWriting(false)} title="Write my own" dismissible={!saving}>
            <View style={{ gap: 16 }}>
              <TextInput label="Affirmation" value={text} onChangeText={setText} area autoFocus maxLength={140} placeholder="I spend on what matters to me." />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {CATEGORIES.map((c) => <Chip key={c.value} label={c.label} selected={c.value === cat} onPress={() => setCat(c.value)} />)}
              </View>
              <Button label="Add affirmation" onPress={add} loading={saving} disabled={!text.trim()} fullWidth />
            </View>
          </Sheet>
          <ConfirmSheet visible={!!removing} icon={Trash2} title="Remove this affirmation?" message={`“${removing?.text ?? ''}” won’t be shown again.`} confirmLabel="Remove" onConfirm={remove} onCancel={() => setRemoving(null)} />
          {picker ? (
            <ResponsiveContainer variant="form">
              <DateTimePicker
                value={new Date(2000, 0, 1, h || 8, m || 0)}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(e: DateTimePickerEvent, d?: Date) => {
                  setPicker(false);
                  if (d && e.type === 'set') {
                    const v = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                    setTime(v);
                    persist({ daily_reminder_time: v });
                  }
                }}
              />
            </ResponsiveContainer>
          ) : null}
        </>
      }
    >
      {loading && !settings ? (
        <View style={{ gap: 12 }}>{[0, 1, 2].map((i) => <Skeleton key={i} height={48} radius={12} />)}</View>
      ) : (
        <>
          <SettingsRow label="Daily affirmation" icon={Bell} right={<Toggle value={show} onValueChange={(v) => { setShow(v); persist({ show_affirmations: v }); }} accessibilityLabel="Daily affirmation" />} />
          <SettingsRow label="Time" icon={Clock} right={<AccountPill label={timeLabel(time)} plainIcon={Clock} onPress={() => setPicker(true)} accessibilityLabel={`Time: ${timeLabel(time)}`} />} />
          {preview ? (
            <View style={{ gap: 6 }}>
              <Text variant="label-sm" tone="muted">Preview · {timeLabel(time)}</Text>
              <AffirmationCard text={preview} />
            </View>
          ) : null}
          {mine.map((a) => (
            <SettingsRow key={a.id} label={a.text} icon={Quote} onPress={() => setRemoving(a)} right={<Trash2 size={18} color={colors['on-surface-variant']} strokeWidth={1.75} />} accessibilityLabel={`Remove: ${a.text}`} />
          ))}
          <Button label="Write my own" icon={Plus} variant="action" onPress={() => setWriting(true)} fullWidth />
        </>
      )}
    </SettingsScreen>
  );
}
