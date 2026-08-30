import { useCallback, useState } from 'react';
import { View, Text, Pressable, ScrollView, Platform, AppState } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { Check, Sparkle } from '../../../components/ui/icons';
import { Toggle } from '../../../src/components/ui/Toggle';
import * as FloweNotifications from '../../../modules/flowe-notifications';
import { NOTIFICATION_SOURCES, DEFAULT_WATCHED_PACKAGES } from '../../../constants/notificationSources';

export default function AutoDetectScreen() {
  const router = useRouter();
  const [enabled, setEnabled] = useState(false);
  const [granted, setGranted] = useState(false);
  const [watched, setWatched] = useState<string[]>([]);
  const [installed, setInstalled] = useState<string[]>([]);

  const sync = useCallback(() => {
    if (!FloweNotifications.isAvailable) return;
    setGranted(FloweNotifications.isPermissionGranted());
    setEnabled(FloweNotifications.isEnabled());

    // An app that isn't on the phone can never post a notification, so it's
    // shown greyed out and can't be watched. Re-read on every focus: the user
    // may have installed or removed one since they were last here.
    const present = FloweNotifications.getInstalledPackages(DEFAULT_WATCHED_PACKAGES);
    setInstalled(present);

    const current = FloweNotifications.getWatchedPackages();
    // First run: watch every supported app the user actually has, so the
    // feature works the moment they grant access rather than needing a second
    // trip through this screen.
    const next = current.length === 0 ? present : current.filter((p) => present.includes(p));
    if (next.length !== current.length) FloweNotifications.setWatchedPackages(next);
    setWatched(next);
  }, []);

  // Granting access happens in system settings, so the state is re-read both on
  // focus and when the app comes back to the foreground.
  useFocusEffect(useCallback(() => {
    sync();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') sync();
    });
    return () => sub.remove();
  }, [sync]));

  const toggleEnabled = (value: boolean) => {
    FloweNotifications.setEnabled(value);
    setEnabled(value);
    if (value && !FloweNotifications.isPermissionGranted()) {
      FloweNotifications.openSettings();
    }
  };

  const toggleSource = (packageId: string) => {
    if (!installed.includes(packageId)) return;
    const next = watched.includes(packageId)
      ? watched.filter((p) => p !== packageId)
      : [...watched, packageId];
    FloweNotifications.setWatchedPackages(next);
    setWatched(next);
  };

  if (!FloweNotifications.isAvailable) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <ScreenHeader title="Auto-detect" onBack={() => router.back()} />
        <View className="flex-1 items-center justify-center px-8">
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
      </SafeAreaView>
    );
  }

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
            <Toggle value={enabled} onValueChange={toggleEnabled} />
          </View>
        </View>

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
            const isInstalled = installed.includes(source.packageId);
            return (
              <View key={source.packageId}>
                {i > 0 && <View className="border-t border-border" />}
                <Pressable
                  onPress={() => toggleSource(source.packageId)}
                  disabled={!isInstalled}
                  className="flex-row items-center justify-between py-3.5"
                >
                  <View className={`flex-1 mr-4 ${isInstalled ? '' : 'opacity-50'}`}>
                    <Text className="text-foreground text-sm">{source.label}</Text>
                    <Text className="text-muted-foreground text-[11px] mt-0.5">
                      {isInstalled
                        ? source.wallet ? 'E-wallet' : 'Bank'
                        : 'Not installed on this phone'}
                    </Text>
                  </View>
                  <Toggle
                    value={isInstalled && watched.includes(source.packageId)}
                    onValueChange={() => toggleSource(source.packageId)}
                    disabled={!isInstalled}
                  />
                </Pressable>
              </View>
            );
          })}
        </View>

        <Text className="text-xs text-muted-foreground text-center px-4 mb-10">
          Flowe only reads notifications from the apps you tick here, and only to pull out the
          amount and merchant. Nothing else is stored, and detections stay on your phone until
          you confirm them.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
