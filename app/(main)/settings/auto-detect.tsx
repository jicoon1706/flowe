import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, Platform, AppState, Alert, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { Check, Sparkle, AlertCircle, Plus, X } from '../../../components/ui/icons';
import { Toggle } from '../../../src/components/ui/Toggle';
import * as FloweNotifications from '../../../modules/flowe-notifications';
import {
  NOTIFICATION_SOURCES,
  type NotificationSource,
} from '../../../constants/notificationSources';
import { useAccounts } from '../../../src/hooks/useAccounts';
import { accountsRepository } from '../../../src/repositories/accounts.repository';
import { accountLast4, accountsForSource } from '../../../src/utils/accountMatching';
import { sourceAccounts } from '../../../src/lib/detectPreferences';

/**
 * Fake alerts for exercising the detection flow without waiting for a real
 * payment — Expo Go has no native listener at all, so this is the only way to
 * see the island there. Worded the way the banks actually word them, so they
 * test the parser rather than a shape that happens to suit it.
 */
const DEV_SAMPLES: { label: string; hint: string; raw: FloweNotifications.DevCaptureInput }[] = [
  {
    label: 'Maybank · ZUS COFFEE RM45.90 ••1234',
    hint: 'files itself, if you hold that account',
    raw: {
      packageName: 'com.maybank2u.life',
      title: 'Transaction Alert',
      text: 'RM 45.90 has been debited from your account ending 1234 at ZUS COFFEE',
    },
  },
  {
    label: 'Grab · RM50.00',
    hint: 'asks until a wallet is pinned for Grab — then it files itself',
    raw: {
      packageName: 'com.grabtaxi.passenger',
      title: 'Payment successful',
      text: 'You paid RM50.00 at MCDONALDS Rawang',
    },
  },
  {
    label: 'Setel · PETRONAS RM60.00',
    hint: 'same: an e-wallet alert names no account, so it asks',
    raw: {
      packageName: 'com.setel.mobile',
      title: 'Payment successful',
      text: 'You paid RM60.00 at PETRONAS Jalan Ampang',
    },
  },
  {
    label: 'CIMB · MYR 3,200.00 credited',
    hint: 'income, but no merchant is named — asks',
    raw: {
      packageName: 'com.cimb.octo',
      title: 'Credit Alert',
      text: 'MYR 3,200.00 has been credited to your account ending 9090',
    },
  },
  {
    label: 'Maybank · worded both ways',
    hint: 'direction is a guess, so it always asks',
    raw: {
      packageName: 'com.maybank2u.life',
      title: 'Transaction Alert',
      text: 'RM 20.00 debited, payment received by KEDAI RUNCIT',
    },
  },
  {
    label: 'Maybank · promo',
    hint: 'should vanish — never a transaction',
    raw: {
      packageName: 'com.maybank2u.life',
      title: 'Deal of the day',
      text: 'Get up to RM50 cashback when you spend RM200 this weekend',
    },
  },
];

export default function AutoDetectScreen() {
  const router = useRouter();
  const [enabled, setEnabled] = useState(false);
  const [granted, setGranted] = useState(false);
  const [watched, setWatched] = useState<string[]>([]);
  /** Package id → the account its payments always belong to. */
  const [pins, setPins] = useState<Record<string, string>>({});

  const { accounts, fetchAccounts } = useAccounts();
  // Nothing may be decided from an empty account list until it's actually been
  // read — at first render it's empty because nothing has loaded, which looks
  // exactly like a user with no accounts.
  const [accountsLoaded, setAccountsLoaded] = useState(false);

  /** Which of the user's accounts each app's alerts could be filed into. */
  const matchesBySource = useMemo(() => {
    const map: Record<string, any[]> = {};
    NOTIFICATION_SOURCES.forEach((source) => {
      map[source.packageId] = accountsForSource(source, accounts);
    });
    return map;
  }, [accounts]);

  const usableSources = useMemo(
    () => NOTIFICATION_SOURCES.filter((s) => matchesBySource[s.packageId].length > 0),
    [matchesBySource]
  );

  const hasAnyAccount = usableSources.length > 0;

  const sync = useCallback(() => {
    if (!FloweNotifications.isAvailable) return;
    setGranted(FloweNotifications.isPermissionGranted());
    setEnabled(FloweNotifications.isEnabled());
    setWatched(FloweNotifications.getWatchedPackages());
  }, []);

  // Granting access happens in system settings, so the state is re-read both on
  // focus and when the app comes back to the foreground.
  useFocusEffect(useCallback(() => {
    sync();
    fetchAccounts().then(() => setAccountsLoaded(true));
    sourceAccounts.all().then(setPins);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') sync();
    });
    return () => sub.remove();
  }, [sync, fetchAccounts]));

  const seededRef = useRef(false);

  // Watching an app the user holds no account with can only ever produce a
  // detection they cannot file, so the watch list is kept to the apps that map
  // to a real account: seeded from them on first run, and pruned back to them
  // whenever an account goes away.
  useEffect(() => {
    if (!FloweNotifications.isAvailable || !accountsLoaded) return;
    const usableIds = usableSources.map((s) => s.packageId);
    const current = FloweNotifications.getWatchedPackages();
    const next = current.length === 0 && !seededRef.current
      ? usableIds
      : current.filter((p) => usableIds.includes(p));
    seededRef.current = true;

    if (next.length !== current.length || next.some((p, i) => p !== current[i])) {
      FloweNotifications.setWatchedPackages(next);
    }
    setWatched(next);

    // Detection with nothing to detect into is just noise in the shade.
    if (usableIds.length === 0 && FloweNotifications.isEnabled()) {
      FloweNotifications.setEnabled(false);
      setEnabled(false);
    }
  }, [accountsLoaded, usableSources]);

  const goToAccounts = () => router.push('/home/accounts');

  const promptForAccount = (what: string) => {
    Alert.alert(
      'Add an account first',
      `Flowe files a detected payment into one of your accounts, so it needs ${what} before it can watch for them.`,
      [
        { text: 'Not now', style: 'cancel' },
        { text: 'Add account', onPress: goToAccounts },
      ]
    );
  };

  const toggleEnabled = (value: boolean) => {
    if (value && !hasAnyAccount) {
      promptForAccount('at least one bank or e-wallet account');
      return;
    }
    FloweNotifications.setEnabled(value);
    setEnabled(value);
    if (value && !FloweNotifications.isPermissionGranted()) {
      FloweNotifications.openSettings();
    }
  };

  const toggleSource = (source: NotificationSource) => {
    const isOn = watched.includes(source.packageId);
    if (!isOn && matchesBySource[source.packageId].length === 0) {
      promptForAccount(
        source.wallet ? 'an e-wallet account' : `a ${source.label.split(' ')[0]} account`
      );
      return;
    }
    const next = isOn
      ? watched.filter((p) => p !== source.packageId)
      : [...watched, source.packageId];
    FloweNotifications.setWatchedPackages(next);
    setWatched(next);
  };

  // --- Default account per app ---------------------------------------------
  // Nothing in an e-wallet alert names an account, so with more than one wallet
  // every Grab or TNG payment asks the same question forever. Answering it once
  // here is what lets those payments file themselves.
  const [defaultFor, setDefaultFor] = useState<NotificationSource | null>(null);

  const applyDefault = async (source: NotificationSource, accountId: string | null) => {
    const next = accountId
      ? await sourceAccounts.set(source.packageId, accountId)
      : await sourceAccounts.clear(source.packageId);
    setPins(next);
    // Saying where an app's payments go implies wanting them caught at all.
    if (accountId && !watched.includes(source.packageId)) toggleSource(source);
  };

  const onRowPress = (source: NotificationSource) => {
    const matches = matchesBySource[source.packageId];
    if (matches.length === 0) {
      promptForAccount(
        source.wallet ? 'an e-wallet account' : `a ${source.label.split(' ')[0]} account`
      );
      return;
    }
    // One wallet needs no default — it is the only answer there is.
    if (source.wallet) {
      if (matches.length === 1) toggleSource(source);
      else setDefaultFor(source);
      return;
    }
    openDigits(source);
  };

  // --- Last 4 digits -------------------------------------------------------
  // The only thing in a payment alert that tells two accounts at the same bank
  // apart, so it's editable right here rather than only where accounts live.
  const [digitsFor, setDigitsFor] = useState<NotificationSource | null>(null);
  const [digitsDraft, setDigitsDraft] = useState<Record<string, string>>({});
  const [savingDigits, setSavingDigits] = useState(false);

  const openDigits = (source: NotificationSource) => {
    const draft: Record<string, string> = {};
    matchesBySource[source.packageId].forEach((a) => {
      draft[a.id] = accountLast4(a) ?? '';
    });
    setDigitsDraft(draft);
    setDigitsFor(source);
  };

  const saveDigits = async () => {
    if (!digitsFor) return;
    setSavingDigits(true);
    for (const account of matchesBySource[digitsFor.packageId]) {
      const value = digitsDraft[account.id] ?? '';
      if (value === (accountLast4(account) ?? '')) continue;
      await accountsRepository.updateBankAccountNumber(account.id, value);
    }
    await fetchAccounts();
    setSavingDigits(false);
    setDigitsFor(null);
  };

  /** The line under an app's name: what its alerts would be filed into. */
  const describeSource = (source: NotificationSource): string => {
    const matches = matchesBySource[source.packageId];
    const kind = source.wallet ? 'E-wallet' : 'Bank';
    if (!accountsLoaded) return kind;
    if (matches.length === 0) return `${kind} — no account yet, tap to add one`;

    // A pinned account is the whole answer for this app, so it outranks
    // anything else this line could say.
    const pinned = matches.find((a) => a.id === pins[source.packageId]);
    if (pinned && matches.length > 1) return `${kind} · always ${pinned.name}`;

    if (source.wallet) {
      return matches.length === 1
        ? `${kind} · ${matches[0].name}`
        : `${kind} · ${matches.length} wallets — tap to pick a default`;
    }
    if (matches.length === 1) {
      const last4 = accountLast4(matches[0]);
      return last4
        ? `${kind} · ${matches[0].name} ••${last4}`
        : `${kind} · ${matches[0].name} — add last 4 digits`;
    }
    const missing = matches.filter((a) => !accountLast4(a)).length;
    return missing > 0
      ? `${kind} · ${matches.length} accounts — add last 4 digits to tell them apart`
      : `${kind} · ${matches.length} accounts matched by last 4 digits`;
  };

  // Development only: injecting a sample runs the real pipeline end to end, so
  // anything confident enough to file itself writes a real transaction.
  const devPanel = !__DEV__ ? null : (
    <View className="mt-2 mb-10">
      <Text className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2 px-1">
        Simulate a detection (dev)
      </Text>
      <View className="bg-card border border-border rounded-2xl px-4">
        {DEV_SAMPLES.map((sample, i) => (
          <View key={sample.label}>
            {i > 0 && <View className="border-t border-border" />}
            <Pressable
              onPress={() => FloweNotifications.injectDevCapture(sample.raw)}
              className="py-3.5"
            >
              <Text className="text-foreground text-sm">{sample.label}</Text>
              <Text className="text-muted-foreground text-[11px] mt-0.5">{sample.hint}</Text>
            </Pressable>
          </View>
        ))}
      </View>
      <Pressable
        onPress={() => FloweNotifications.clearDevCaptures()}
        className="mt-3 rounded-2xl border border-border py-3 items-center"
      >
        <Text className="text-muted-foreground text-xs">Clear simulated captures</Text>
      </Pressable>
      <Text className="text-[11px] text-muted-foreground text-center px-4 mt-3">
        These go through the real flow — a sample confident enough to file itself writes a
        transaction to Supabase. Go back to Home to see the island.
      </Text>
    </View>
  );

  if (!FloweNotifications.isAvailable) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <ScreenHeader title="Auto-detect" onBack={() => router.back()} />
        <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
          <View className="items-center px-4 pt-16 pb-6">
            <Sparkle size={44} color="#404040" />
            <Text className="text-foreground font-medium mt-4 text-center">
              Not available on this device
            </Text>
            <Text className="text-muted-foreground text-sm mt-2 text-center">
              {Platform.OS === 'ios'
                ? 'iOS does not let any app read another app’s notifications, so transactions can’t be detected automatically.'
                : 'Auto-detect needs a development build of Flowe — it isn’t available in Expo Go.'}
            </Text>
          </View>
          {devPanel}
        </ScrollView>
      </SafeAreaView>
    );
  }

  const digitsAccounts = digitsFor ? matchesBySource[digitsFor.packageId] : [];
  const defaultAccounts = defaultFor ? matchesBySource[defaultFor.packageId] : [];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScreenHeader title="Auto-detect" onBack={() => router.back()} />

      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        <View className="bg-card border border-border rounded-2xl p-5 mb-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 mr-4">
              <Text className="text-foreground font-semibold">Detect transactions</Text>
              <Text className="text-muted-foreground text-xs mt-1">
                Flowe reads payment alerts from the apps below and offers to log them for you.
              </Text>
            </View>
            <Toggle value={enabled} onValueChange={toggleEnabled} disabled={!hasAnyAccount} />
          </View>
        </View>

        {/* Without an account there is nowhere to file a detection, so this is
            the first thing to fix rather than a footnote further down. */}
        {accountsLoaded && !hasAnyAccount && (
          <Pressable
            onPress={goToAccounts}
            className="bg-card border border-primary/40 rounded-2xl p-5 mb-4 flex-row items-center"
          >
            <View className="w-9 h-9 rounded-full items-center justify-center mr-3 bg-primary/15">
              <Plus size={18} color="#C5FF00" />
            </View>
            <View className="flex-1">
              <Text className="text-foreground font-medium">Add an account first</Text>
              <Text className="text-muted-foreground text-xs mt-0.5">
                Auto-detect needs somewhere to put a detected payment. Tap to add your bank or
                e-wallet.
              </Text>
            </View>
          </Pressable>
        )}

        {/* Notification access can only be granted from system settings. */}
        <Pressable
          onPress={() => FloweNotifications.openSettings()}
          className="bg-card border border-border rounded-2xl p-5 mb-4 flex-row items-center"
        >
          <View
            className={`w-9 h-9 rounded-full items-center justify-center mr-3 ${
              granted ? 'bg-primary/15' : 'bg-muted'
            }`}
          >
            <Check size={18} color={granted ? '#C5FF00' : '#a0a0a0'} />
          </View>
          <View className="flex-1">
            <Text className="text-foreground font-medium">
              {granted ? 'Notification access granted' : 'Grant notification access'}
            </Text>
            <Text className="text-muted-foreground text-xs mt-0.5">
              {granted
                ? 'Tap to review it in Android settings'
                : 'Required — Android only lets you turn this on in system settings'}
            </Text>
          </View>
        </Pressable>

        <Text className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2 px-1">
          Apps to watch
        </Text>
        <View className="bg-card border border-border rounded-2xl px-4 mb-4">
          {NOTIFICATION_SOURCES.map((source, i) => {
            const matches = matchesBySource[source.packageId];
            const linked = matches.length > 0;
            const needsDigits = !source.wallet && linked && matches.some((a) => !accountLast4(a));
            return (
              <View key={source.packageId}>
                {i > 0 && <View className="border-t border-border" />}
                <Pressable
                  onPress={() => onRowPress(source)}
                  className="flex-row items-center justify-between py-3.5"
                >
                  <View className="flex-1 mr-4">
                    <Text className={`text-sm ${linked ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {source.label}
                    </Text>
                    <View className="flex-row items-center mt-0.5">
                      {needsDigits && (
                        <View className="mr-1">
                          <AlertCircle size={12} color="#ffd93d" />
                        </View>
                      )}
                      <Text className="text-muted-foreground text-[11px]">
                        {describeSource(source)}
                      </Text>
                    </View>
                  </View>
                  <Toggle
                    value={watched.includes(source.packageId)}
                    onValueChange={() => toggleSource(source)}
                    disabled={!linked}
                  />
                </Pressable>
              </View>
            );
          })}
        </View>

        <Text className="text-xs text-muted-foreground text-center px-4 mb-10">
          Flowe only reads notifications from the apps you tick here, and only to pull out the
          amount and merchant — promotions, OTPs and balance reminders are skipped. Nothing else is
          stored, and detections stay on your phone until you confirm them.
        </Text>

        {devPanel}
      </ScrollView>

      {/* Last 4 digits, per account, for the tapped bank. */}
      <Modal visible={digitsFor !== null} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/70">
          <View className="bg-card rounded-t-3xl p-6 pb-10">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-lg font-bold text-foreground">Last 4 digits</Text>
              <Pressable onPress={() => setDigitsFor(null)} className="p-1">
                <X size={20} color="#a0a0a0" />
              </Pressable>
            </View>
            <Text className="text-muted-foreground text-xs mb-5">
              {digitsFor?.label} alerts usually print the last 4 digits of the account. Fill them in
              and Flowe can file a payment into the right account without asking.
            </Text>

            {digitsAccounts.map((account) => (
              <View key={account.id} className="mb-4">
                <Text className="text-foreground text-sm mb-1.5">{account.name}</Text>
                <TextInput
                  className="bg-background border border-border rounded-xl px-4 py-3 text-foreground"
                  placeholder="1234"
                  placeholderTextColor="#606060"
                  keyboardType="number-pad"
                  maxLength={4}
                  value={digitsDraft[account.id] ?? ''}
                  onChangeText={(text) =>
                    setDigitsDraft((prev) => ({ ...prev, [account.id]: text.replace(/\D/g, '') }))
                  }
                />
              </View>
            ))}

            {digitsAccounts.length > 1 && (
              <View className="mb-5">
                <Text className="text-muted-foreground text-xs mb-2">
                  When an alert prints no digits at all, file it into
                </Text>
                <View className="flex-row flex-wrap">
                  {digitsAccounts.map((account) => {
                    const selected = pins[digitsFor!.packageId] === account.id;
                    return (
                      <Pressable
                        key={account.id}
                        onPress={() => applyDefault(digitsFor!, account.id)}
                        className={`rounded-full px-4 py-2 mr-2 mb-2 border ${
                          selected ? 'bg-primary/15 border-primary' : 'bg-background border-border'
                        }`}
                      >
                        <Text className={`text-xs ${selected ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                          {account.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                  <Pressable
                    onPress={() => applyDefault(digitsFor!, null)}
                    className={`rounded-full px-4 py-2 mr-2 mb-2 border ${
                      digitsFor && !pins[digitsFor.packageId]
                        ? 'bg-primary/15 border-primary'
                        : 'bg-background border-border'
                    }`}
                  >
                    <Text
                      className={`text-xs ${
                        digitsFor && !pins[digitsFor.packageId]
                          ? 'text-primary font-semibold'
                          : 'text-muted-foreground'
                      }`}
                    >
                      Ask me
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}

            <Pressable
              onPress={saveDigits}
              disabled={savingDigits}
              className="bg-primary rounded-2xl py-4 items-center mt-1"
            >
              <Text className="text-sm font-bold text-black">
                {savingDigits ? 'Saving...' : 'Save'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Which account an app's payments belong to, when the alert can't say. */}
      <Modal visible={defaultFor !== null} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/70">
          <View className="bg-card rounded-t-3xl p-6 pb-10">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-lg font-bold text-foreground">Default account</Text>
              <Pressable onPress={() => setDefaultFor(null)} className="p-1">
                <X size={20} color="#a0a0a0" />
              </Pressable>
            </View>
            <Text className="text-muted-foreground text-xs mb-5">
              Nothing in a {defaultFor?.label} alert says which wallet paid. Pick one and Flowe
              files every {defaultFor?.label} payment there without asking.
            </Text>

            {defaultAccounts.map((account) => {
              const selected = pins[defaultFor!.packageId] === account.id;
              return (
                <Pressable
                  key={account.id}
                  onPress={async () => {
                    await applyDefault(defaultFor!, account.id);
                    setDefaultFor(null);
                  }}
                  className={`rounded-2xl px-4 py-3.5 mb-2 border ${
                    selected ? 'bg-primary/15 border-primary' : 'bg-background border-border'
                  }`}
                >
                  <Text className={`text-sm ${selected ? 'text-primary font-semibold' : 'text-foreground'}`}>
                    {account.name}
                  </Text>
                </Pressable>
              );
            })}

            <Pressable
              onPress={async () => {
                await applyDefault(defaultFor!, null);
                setDefaultFor(null);
              }}
              className="rounded-2xl px-4 py-3.5 border border-border"
            >
              <Text className="text-muted-foreground text-sm">Ask me each time</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
