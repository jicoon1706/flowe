import { Tabs, useRouter } from 'expo-router';
import { Calendar, DollarSign, Home, Plus, Settings } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

function AddButton(props: { onPress?: () => void }) {
  const router = useRouter();
  return (
    <Pressable onPress={() => router.push('/(main)/add-transaction')}>
      <View className="w-14 h-14 rounded-full bg-primary items-center justify-center -mt-4 shadow-lg shadow-primary/30">
        <Plus size={24} color="#000000" />
      </View>
    </Pressable>
  );
}

export default function MainLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0D0D0D',
          borderTopColor: 'rgba(255,255,255,0.1)',
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
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
          tabBarButton: (props) => <AddButton {...props} />,
        }}
      />
      <Tabs.Screen
        name="cashflow"
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
        }}
      />
      <Tabs.Screen
        name="home/analysis"
        options={{
          href: null,  // This hides it from the tab bar
        }}
      />
      <Tabs.Screen
        name="home/accounts"
        options={{
          href: null,  // This hides it from the tab bar
        }}
      />
      <Tabs.Screen
        name="home/account/[id]"
        options={{
          href: null,  // This hides it from the tab bar
        }}
      />
      <Tabs.Screen
        name="home/tabung/[id]"
        options={{
          href: null,  // This hides it from the tab bar
        }}
      />
      <Tabs.Screen
        name="home/learn/index"
        options={{
          href: null,  // This hides it from the tab bar
        }}
      />
      <Tabs.Screen
        name="home/learn/[projectId]"
        options={{
          href: null,  // This hides it from the tab bar
        }}
      />
      <Tabs.Screen
        name="home/learn/[projectId]/add-entry"
        options={{
          href: null,  // This hides it from the tab bar
        }}
      />
      <Tabs.Screen
        name="home/learn/[projectId]/entry"
        options={{
          href: null,  // This hides it from the tab bar
        }}
      />
      <Tabs.Screen
        name="tabung/new/index"
        options={{
          href: null,  // This hides it from the tab bar
        }}
      />
      <Tabs.Screen
        name="tabung/new/form"
        options={{
          href: null,  // This hides it from the tab bar
        }}
      />
    </Tabs>
  );
}