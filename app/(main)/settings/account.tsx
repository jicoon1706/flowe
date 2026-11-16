import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { LogOut } from 'lucide-react-native';
import { SettingsScreen } from '@/components/settings/SettingsScreen';
import { Button } from '@/components/ui/Button';
import { ConfirmSheet } from '@/components/ui/ConfirmSheet';
import { Skeleton } from '@/components/ui/Skeleton';
import { TextInput } from '@/components/ui/TextInput';
import { useToast } from '@/components/ui/ToastProvider';
import { useAuth } from '@/context/AuthContext';
import { useLock } from '@/context/LockContext';
import { useProfile } from '@/src/hooks/useProfile';
import { useSettings } from '@/src/hooks/useSettings';

/**
 * settings/account — name and currency. Primary: Save. "Sign out of this
 * device" locks Flowe behind the PIN; nothing is deleted.
 */
export default function AccountSettingsScreen() {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const { lock } = useLock();
  const { profile, loading, updateProfile } = useProfile(user?.id);
  const { settings, fetchSettings } = useSettings();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => { if (user) fetchSettings(user.id); }, [user, fetchSettings]);
  useEffect(() => { setName(profile?.display_name ?? ''); }, [profile?.display_name]);

  const save = async () => {
    if (!name.trim()) { setError('Enter a name'); return; }
    setSaving(true);
    const res = await updateProfile({ display_name: name.trim() });
    setSaving(false);
    if (!res.ok) { toast.failure('Save failed', { label: 'Retry', onPress: save }); return; }
    toast.success('Saved');
  };

  return (
    <SettingsScreen
      title="Account"
      overlay={
        <ConfirmSheet
          visible={signingOut}
          icon={LogOut}
          title="Sign out of Flowe?"
          message="Your data stays on this phone. You’ll need your PIN to get back in."
          confirmLabel="Sign out"
          onConfirm={() => { setSigningOut(false); lock(); router.replace('/(main)'); }}
          onCancel={() => setSigningOut(false)}
        />
      }
    >
      {loading && !profile ? (
        <View style={{ gap: 14 }}>{[0, 1].map((i) => <Skeleton key={i} height={52} />)}</View>
      ) : (
        <>
          <TextInput label="Name" value={name} onChangeText={(t) => { setName(t); setError(null); }} error={error} autoCapitalize="words" maxLength={30} />
          <TextInput label="Currency" value={settings?.currency === 'RM' || !settings?.currency ? 'Malaysian ringgit (RM)' : settings.currency} editable={false} />
          <View style={{ height: 8 }} />
          <Button label="Save" onPress={save} loading={saving} loadingLabel="Saving…" fullWidth />
          <Button label="Sign out of this device" variant="text" muted onPress={() => setSigningOut(true)} style={{ alignSelf: 'center' }} />
        </>
      )}
    </SettingsScreen>
  );
}
