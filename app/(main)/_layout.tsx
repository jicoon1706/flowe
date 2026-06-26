import { TabBarProvider, useTabBar } from '@/context/TabBarContext';
import { LockProvider } from '@/context/LockContext';
import { Tabs, usePathname, useRouter } from 'expo-router';
import { Calendar, DollarSign, Home, Plus, Settings } from 'lucide-react-native';
import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { processDueRecurring } from '@/src/services/recurring';

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

function TabBarVisibilityWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { hideTabBar, showTabBar } = useTabBar();

  useEffect(() => {
    // Hide tab bar for nested settings routes
    const hiddenPaths = ['settings/account', 'settings/change-pin', 'settings/security', 'settings/notifications', 'settings/categories', 'settings/recurring', 'settings/affirmations', 'settings/data'];
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
  // On every app open, materialize any recurring rules whose date has arrived
  // into real dated transactions (and catch up missed periods). Fire-and-forget.
  useEffect(() => {
    processDueRecurring();
  }, []);

  return (
    <LockProvider>
      <TabBarProvider>
        <TabBarVisibilityWrapper>
          <MainTabs />
        </TabBarVisibilityWrapper>
      </TabBarProvider>
    </LockProvider>
  );
}