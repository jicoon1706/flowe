import { TabBarProvider, useTabBar } from '@/context/TabBarContext';
import { LockProvider, useLock } from '@/context/LockContext';
import { DetectedTransactionsProvider, useDetected } from '@/context/DetectedTransactionsContext';
import { Tabs, usePathname, useRouter } from 'expo-router';
import { Calendar, DollarSign, Home, Plus, Settings } from 'lucide-react-native';
import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { DetectedTransactionIsland } from '@/components/home/DetectedTransactionIsland';
import { isOpenWhileLocked } from '@/src/utils/lockRoutes';
import { startDailyBudgetSync } from '@/src/services/dailyBudget';

function AddButton(props: { onPress?: (e?: any) => void }) {
  const router = useRouter();
  return (
    <Pressable onPress={() => router.push('/(main)/add-transaction')}>
      <View className="w-14 h-14 rounded-full bg-primary items-center justify-center shadow-xl shadow-primary/40">
        <Plus size={24} color="#000000" />
      </View>
    </Pressable>
  );
}

function MainTabs() {
  const { isTabBarHidden } = useTabBar();
  const pathname = usePathname();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          display: isTabBarHidden(pathname) ? 'none' : 'flex',
          position: 'absolute',
          backgroundColor: '#0D0D0D',
          borderTopWidth: 0,
          height: 70,
          paddingBottom: 8,
          paddingTop: 8,
          marginHorizontal: 24,
          marginBottom: 24,
          borderRadius: 24,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.4,
          shadowRadius: 16,
          elevation: 8,
        },
        tabBarActiveTintColor: '#C5FF00',
        tabBarInactiveTintColor: '#a0a0a0',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color, size }) => <Calendar size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="add-transaction"
        options={{
          tabBarButton: () => (
            <View className="flex-1 items-center justify-center">
              <AddButton />
            </View>
          ),
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="cashflow/index"
        options={{
          title: 'Cash Flow',
          tabBarIcon: ({ color, size }) => <DollarSign size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />

      <Tabs.Screen
        name="home/notifications"
        options={{
          href: null,  // This hides it from the tab bar
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="home/analysis"
        options={{
          href: null,  // This hides it from the tab bar
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="home/accounts"
        options={{
          href: null,  // This hides it from the tab bar
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="home/account/[id]"
        options={{
          href: null,  // This hides it from the tab bar
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="home/tabung/[id]"
        options={{
          href: null,  // This hides it from the tab bar
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="home/wallet/[id]"
        options={{
          href: null,  // This hides it from the tab bar
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="home/learn/index"
        options={{
          href: null,  // This hides it from the tab bar
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="home/learn/[projectId]"
        options={{
          href: null,  // This hides it from the tab bar
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="home/learn/[projectId]/add-entry"
        options={{
          href: null,  // This hides it from the tab bar
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="home/learn/[projectId]/entry"
        options={{
          href: null,  // This hides it from the tab bar
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="tabung/new/index"
        options={{
          href: null,  // This hides it from the tab bar
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="tabung/new/form"
        options={{
          href: null,  // This hides it from the tab bar
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="cashflow/info"
        options={{
          href: null,  // This hides it from the tab bar
          tabBarStyle: { display: 'none' },
        }}
      />
    </Tabs>
  );
}

/**
 * Surfaces payments Flowe detected in bank/e-wallet notifications. It lives at
 * the layout level rather than on Home so a detection can be confirmed from
 * wherever the user happens to be — that's the point of the feature.
 */
function DetectedTransactionOverlay() {
  const { prompt, accounts, save, dismiss, snooze } = useDetected();

  return (
    <DetectedTransactionIsland
      detected={prompt}
      accounts={accounts}
      onSave={save}
      onDismiss={dismiss}
      onSnooze={snooze}
    />
  );
}

/**
 * Raises the PIN / fingerprint prompt the moment a locked screen is opened.
 *
 * The app starts locked but usable — home with balances hidden, and the
 * add-transaction form — so the prompt is tied to *where the user goes* rather
 * than to launch. Watching the pathname catches every way in (tab bar, a card
 * on home, a notification deep link) without each caller having to ask. If
 * the user backs out, they're returned to somewhere that is open.
 */
function LockedRouteGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const { locked, requireUnlock } = useLock();

  useEffect(() => {
    if (!locked || isOpenWhileLocked(pathname)) return;
    let stale = false;
    requireUnlock().then((ok) => {
      if (ok || stale) return;
      if (router.canGoBack()) router.back();
      else router.replace('/(main)');
    });
    // The route moved on before an answer came (the prompt is shared, so the
    // next screen's guard owns the outcome now).
    return () => { stale = true; };
  }, [locked, pathname, requireUnlock, router]);

  return null;
}

function TabBarVisibilityWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { hideTabBar, showTabBar } = useTabBar();

  useEffect(() => {
    // Hide tab bar for nested settings routes
    const hiddenPaths = ['settings/account', 'settings/change-pin', 'settings/security', 'settings/notifications', 'settings/categories', 'settings/recurring', 'settings/auto-detect', 'settings/affirmations', 'settings/data', 'settings/budget'];
    if (hiddenPaths.some(path => pathname.includes(path))) {
      hideTabBar(pathname);
    } else {
      showTabBar(pathname);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return <>{children}</>;
}

export default function MainLayout() {
  // Every transaction write redraws the daily-budget widget. Subscribed here,
  // for as long as the user is inside the app, rather than on Home: a payment
  // saved back to an account screen or deleted from its detail sheet moves
  // today's spend just as much as one added from Home, and the widget used to
  // sit on yesterday's figure until Home happened to reload.
  useEffect(() => startDailyBudgetSync(), []);

  // Recurring rules whose date has arrived are no longer auto-materialized; they
  // wait for the user to approve/reject them via the home-screen popup (see
  // usePendingRecurring + PendingRecurringModal).
  return (
    <LockProvider>
      <DetectedTransactionsProvider>
        <TabBarProvider>
          <TabBarVisibilityWrapper>
            <MainTabs />
          </TabBarVisibilityWrapper>
          <DetectedTransactionOverlay />
          <LockedRouteGuard />
        </TabBarProvider>
      </DetectedTransactionsProvider>
    </LockProvider>
  );
}