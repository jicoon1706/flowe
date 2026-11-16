import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform, Pressable, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { BellRing, Check, Landmark, Plus, Shield, Smartphone, Wallet } from 'lucide-react-native';
import { colors, radius } from '@/theme/tokens';
import { NOTIFICATION_SOURCES, type NotificationSource } from '@/constants/notificationSources';
import { institutionDomain } from '@/constants/institutionDomains';
import { SettingsScreen } from '@/components/settings/SettingsScreen';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { GradientFill } from '@/components/ui/GradientFill';
import { SettingsRow } from '@/components/ui/SettingsRow';
import { Sheet } from '@/components/ui/Sheet';
import { Text } from '@/components/ui/Text';
import { TextInput } from '@/components/ui/TextInput';
import { Toggle } from '@/components/ui/Toggle';
import { useToast } from '@/components/ui/ToastProvider';
import { useLock } from '@/context/LockContext';
import { useAccounts } from '@/src/hooks/useAccounts';
import { accountsRepository } from '@/src/repositories/accounts.repository';
import { accountLast4, accountsForSource } from '@/src/utils/accountMatching';
import { sourceAccounts } from '@/src/lib/detectPreferences';
import type { AnyAccount } from '@/src/utils/accountDisplay';
import * as FloweNotifications from '@/modules/flowe-notifications';

/**
 * settings/auto-detect — master switch + per-source toggles with real logos.
 * Defaults: on for every app that maps to an account the user added. Toggling
 * on without notification access opens the permission sheet first.
 */
export default function AutoDetectScreen() {
  const router = useRouter();
  const toast = useToast();
  const { suspend } = useLock();
  const { accounts, fetchAccounts } = useAccounts();
  const [enabled, setEnabled] = useState(false);
  const [granted, setGranted] = useState(false);
  const [connected, setConnected] = useState(false);
  const [watched, setWatched] = useState<string[]>([]);
  const [pins, setPins] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);
  const [permission, setPermission] = useState(false);
  const [digitsFor, setDigitsFor] = useState<NotificationSource | null>(null);
  const [digits, setDigits] = useState<Record<string, string>>({});
  const [defaultFor, setDefaultFor] = useState<NotificationSource | null>(null);
  const [savingDigits, setSavingDigits] = useState(false);
  const [needAccount, setNeedAccount] = useState<string | null>(null);

  const list = accounts as AnyAccount[];
  const matches = useMemo(() => Object.fromEntries(NOTIFICATION_SOURCES.map((s) => [s.packageId, accountsForSource(s, list) as AnyAccount[]])), [list]);
  const usable = useMemo(() => NOTIFICATION_SOURCES.filter((s) => matches[s.packageId].length > 0), [matches]);

  const sync = useCallback(() => {
    if (!FloweNotifications.isAvailable) return;
    FloweNotifications.ensureListenerBound();
    setGranted(FloweNotifications.isPermissionGranted());
    setConnected(FloweNotifications.isListenerConnected());
    setEnabled(FloweNotifications.isEnabled());
    setWatched(FloweNotifications.getWatchedPackages());
  }, []);

  useFocusEffect(useCallback(() => {
    sync();
    fetchAccounts().then(() => setLoaded(true));
    sourceAccounts.all().then(setPins);
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') sync(); });
    const settle = setTimeout(sync, 2000);
    return () => { sub.remove(); clearTimeout(settle); };
  }, [sync, fetchAccounts]));

  // Watch list defaults to every app that maps to one of the user's accounts.
  const seeded = useRef(false);
  useEffect(() => {
    if (!FloweNotifications.isAvailable || !loaded) return;
    const ids = usable.map((s) => s.packageId);
    const current = FloweNotifications.getWatchedPackages();
    const next = current.length === 0 && !seeded.current ? ids : current.filter((p) => ids.includes(p));
    seeded.current = true;
    if (next.join() !== current.join()) FloweNotifications.setWatchedPackages(next);
    setWatched(next);
    if (!ids.length && FloweNotifications.isEnabled()) { FloweNotifications.setEnabled(false); setEnabled(false); }
  }, [loaded, usable]);

  const openSystemSettings = () => { setPermission(false); suspend(); FloweNotifications.openSettings(); };

  const toggleEnabled = (on: boolean) => {
    if (on && !usable.length) { setNeedAccount('at least one bank or e-wallet account'); return; }
    FloweNotifications.setEnabled(on);
    setEnabled(on);
    if (on && !FloweNotifications.isPermissionGranted()) setPermission(true);
  };

  const toggleSource = (s: NotificationSource) => {
    const on = watched.includes(s.packageId);
    if (!on && !matches[s.packageId].length) { setNeedAccount(s.wallet ? 'an e-wallet account' : `a ${s.label.split(' ')[0]} account`); return; }
    const next = on ? watched.filter((p) => p !== s.packageId) : [...watched, s.packageId];
    FloweNotifications.setWatchedPackages(next);
    setWatched(next);
  };

  const openSource = (s: NotificationSource) => {
    const m = matches[s.packageId];
    if (!m.length) { setNeedAccount(s.wallet ? 'an e-wallet account' : `a ${s.label.split(' ')[0]} account`); return; }
    if (s.wallet) { if (m.length > 1) setDefaultFor(s); else toggleSource(s); return; }
    setDigits(Object.fromEntries(m.map((a) => [a.id, accountLast4(a) ?? ''])));
    setDigitsFor(s);
  };

  const saveDigits = async () => {
    if (!digitsFor) return;
    setSavingDigits(true);
    let failed = false;
    for (const a of matches[digitsFor.packageId]) {
      const v = digits[a.id] ?? '';
      if (v === (accountLast4(a) ?? '')) continue;
      const res = await accountsRepository.updateBankAccountNumber(a.id, v);
      if (!res.ok) failed = true;
    }
    await fetchAccounts();
    setSavingDigits(false);
    if (failed) { toast.failure('Couldn’t save the digits', { label: 'Retry', onPress: saveDigits }); return; }
    setDigitsFor(null);
    toast.success('Saved');
  };

  const pickDefault = async (s: NotificationSource, accountId: string | null) => {
    const next = accountId ? await sourceAccounts.set(s.packageId, accountId) : await sourceAccounts.clear(s.packageId);
    setPins(next);
    setDefaultFor(null);
    if (accountId && !watched.includes(s.packageId)) toggleSource(s);
  };

  const describe = (s: NotificationSource): string => {
    const m = matches[s.packageId];
    const kind = s.wallet ? 'E-wallet' : 'Bank';
    if (!loaded) return kind;
    if (!m.length) return `${kind} · no account yet`;
    const pinned = m.find((a) => a.id === pins[s.packageId]);
    if (pinned && m.length > 1) return `Always ${pinned.name}`;
    if (s.wallet) return m.length === 1 ? m[0].name : `${m.length} wallets · tap to pick a default`;
    if (m.length === 1) { const l4 = accountLast4(m[0]); return l4 ? `${m[0].name} ••${l4}` : `${m[0].name} · add last 4 digits`; }
    const missing = m.filter((a) => !accountLast4(a)).length;
    return missing ? `${m.length} accounts · add last 4 digits` : `${m.length} accounts matched by last 4 digits`;
  };

  if (!FloweNotifications.isAvailable) {
    return (
      <SettingsScreen title="Auto-detect">
        <EmptyState
          icon={Smartphone}
          title="Not available on this device"
          body={Platform.OS === 'ios' ? 'iOS doesn’t let any app read another app’s notifications, so payments can’t be detected automatically.' : 'Auto-detect needs a development build of Flowe.'}
        />
      </SettingsScreen>
    );
  }

  const sources = [...usable, ...NOTIFICATION_SOURCES.filter((s) => !usable.includes(s))];
  const status = !granted ? 'Notification access not granted' : !connected ? 'Access granted · reconnecting' : 'Notification access granted';
  const permSources = usable.map((s) => s.label.split(' ')[0]).filter((v, i, a) => a.indexOf(v) === i).slice(0, 4).join(', ');

  return (
    <SettingsScreen
      title="Auto-detect"
      overlay={
        <>
          <Sheet visible={permission} onClose={() => setPermission(false)} testID="permission-notifications">
            <View style={{ gap: 12 }}>
              <View style={{ width: 72, height: 72, borderRadius: 9999, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
                <GradientFill />
                <BellRing size={32} color={colors['on-primary']} strokeWidth={1.5} />
              </View>
              <Text variant="headline-md" accessibilityRole="header">Allow notification access</Text>
              {[
                { icon: BellRing, text: `Flowe reads alerts only from ${permSources || 'the banks and wallets you added'}.` },
                { icon: Shield, text: 'Read on your phone. Nothing is sent anywhere.' },
                { icon: Smartphone, text: 'Android opens its settings; switch Flowe on and come back.' },
              ].map((p) => (
                <View key={p.text} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 9999, backgroundColor: colors['surface-container'], alignItems: 'center', justifyContent: 'center' }}>
                    <p.icon size={17} color={colors['on-surface']} strokeWidth={1.75} />
                  </View>
                  <Text variant="body-md" style={{ flex: 1 }}>{p.text}</Text>
                </View>
              ))}
              <View style={{ gap: 4, marginTop: 8 }}>
                <Button label="Allow" onPress={openSystemSettings} fullWidth />
                <Button label="Later" variant="text" onPress={() => setPermission(false)} style={{ alignSelf: 'center' }} />
              </View>
            </View>
          </Sheet>
          <Sheet visible={!!digitsFor} onClose={() => setDigitsFor(null)} title={digitsFor ? `${digitsFor.label} accounts` : undefined} scroll dismissible={!savingDigits}>
            <View style={{ gap: 14 }}>
              <Text variant="body-md" tone="muted">Alerts print the last 4 digits of the account. Add them so Flowe files each payment into the right one.</Text>
              {digitsFor ? matches[digitsFor.packageId].map((a) => (
                <TextInput key={a.id} label={a.name} value={digits[a.id] ?? ''} onChangeText={(v) => setDigits((d) => ({ ...d, [a.id]: v.replace(/\D/g, '').slice(0, 4) }))} keyboardType="number-pad" maxLength={4} placeholder="Last 4 digits" />
              )) : null}
              <Button label="Save" onPress={saveDigits} loading={savingDigits} loadingLabel="Saving…" fullWidth />
            </View>
          </Sheet>
          <Sheet visible={!!defaultFor} onClose={() => setDefaultFor(null)} title={defaultFor ? `${defaultFor.label} pays from` : undefined}>
            {defaultFor ? (
              <View>
                {[...matches[defaultFor.packageId], null].map((a) => {
                  const selected = a ? pins[defaultFor.packageId] === a.id : !pins[defaultFor.packageId];
                  return (
                    <Pressable key={a?.id ?? 'ask'} onPress={() => pickDefault(defaultFor, a?.id ?? null)} accessibilityRole="radio" accessibilityState={{ checked: selected }}
                      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 52 }}>
                      <Text variant="body-lg">{a ? a.name : 'Ask me every time'}</Text>
                      {selected ? <Check size={18} color={colors['on-surface']} strokeWidth={2} /> : null}
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </Sheet>
          <Sheet visible={!!needAccount} onClose={() => setNeedAccount(null)} title="Add an account first">
            <View style={{ gap: 14 }}>
              <Text variant="body-md" tone="muted">Flowe files a detected payment into one of your accounts, so it needs {needAccount} before it can watch for them.</Text>
              <Button label="Add account" icon={Plus} onPress={() => { setNeedAccount(null); router.push({ pathname: '/home/accounts', params: { add: '1' } }); }} fullWidth />
              <Button label="Not now" variant="text" onPress={() => setNeedAccount(null)} style={{ alignSelf: 'center' }} />
            </View>
          </Sheet>
        </>
      }
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: radius.md, backgroundColor: colors['surface-container'] }}>
        <View style={{ width: 40, height: 40, borderRadius: 9999, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
          <BellRing size={19} color={colors['on-surface']} strokeWidth={1.75} />
        </View>
        <Pressable style={{ flex: 1 }} onPress={!granted ? () => setPermission(true) : undefined} disabled={granted} accessibilityRole={granted ? undefined : 'button'}>
          <Text variant="body-lg">Read bank alerts</Text>
          <Text variant="label-sm" tone="meta">{status}</Text>
        </Pressable>
        <Toggle value={enabled} onValueChange={toggleEnabled} accessibilityLabel="Read bank alerts" />
      </View>
      <Text variant="label-sm" tone="muted" style={{ marginTop: 8 }}>Supported banks & wallets</Text>
      <View>
        {sources.map((s) => (
          <SettingsRow
            key={s.packageId}
            label={s.label}
            value={describe(s)}
            domain={institutionDomain(s.label, s.bankId)}
            icon={s.wallet ? Wallet : Landmark}
            onPress={() => openSource(s)}
            disabled={!enabled}
            right={<Toggle value={watched.includes(s.packageId)} onValueChange={() => toggleSource(s)} disabled={!enabled} accessibilityLabel={s.label} />}
          />
        ))}
      </View>
    </SettingsScreen>
  );
}
