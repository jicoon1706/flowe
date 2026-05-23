# Settings Subscreens Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement 8 settings subscreens backed by a shared SettingsContext with mock in-memory state.

**Architecture:** SettingsContext created in `context/SettingsContext.tsx` using `useReducer` + `createContext` (following LearnContext pattern). Provider injected via `app/(main)/settings/_layout.tsx`. Each screen is a standalone file in `app/(main)/settings/`.

**Tech Stack:** Expo Router, NativeWind, React Native, Lucide icons

---

## File Map

| File | Purpose |
|---|---|
| `context/SettingsContext.tsx` | Shared state: profile, security, notifications, affirmations |
| `app/(main)/settings/_layout.tsx` | Provides SettingsContext |
| `app/(main)/settings/account.tsx` | Display name edit |
| `app/(main)/settings/change-pin.tsx` | 3-step PIN change |
| `app/(main)/settings/security.tsx` | Fingerprint + auto-lock |
| `app/(main)/settings/notifications.tsx` | Per-type toggles |
| `app/(main)/settings/categories.tsx` | Expense/Income tabs |
| `app/(main)/settings/recurring.tsx` | Recurring payments list |
| `app/(main)/settings/data.tsx` | Export + Reset |
| `app/(main)/settings/affirmations.tsx` | Affirmation preferences |

---

## Task 1: Create SettingsContext

**File:** Create: `context/SettingsContext.tsx`

- [ ] **Step 1: Write SettingsContext with full state shape and reducer**

```typescript
import React, { createContext, useContext, useReducer, ReactNode } from 'react';

export interface UserProfile {
  displayName: string;
  avatar: string | null;
}

export interface SettingsState {
  profile: UserProfile;
  security: {
    fingerprintEnabled: boolean;
    autoLockTimer: '1 min' | '5 min' | '15 min' | 'Never';
  };
  notifications: {
    cashflow: boolean;
    alert: boolean;
    expense: boolean;
    income: boolean;
    recurring: boolean;
    milestone: boolean;
    tabung: boolean;
    affirmation: boolean;
  };
  affirmations: {
    showOnHome: boolean;
    dailyReminder: string;
    categoryPreference: 'All' | 'Saving' | 'Investing' | 'Mindset' | 'Awareness';
  };
  balanceVisible: boolean;
}

const INITIAL_STATE: SettingsState = {
  profile: { displayName: 'Ahmad', avatar: null },
  security: { fingerprintEnabled: true, autoLockTimer: '5 min' },
  notifications: {
    cashflow: true, alert: true, expense: true, income: true,
    recurring: true, milestone: true, tabung: true, affirmation: true,
  },
  affirmations: { showOnHome: true, dailyReminder: '08:00', categoryPreference: 'All' },
  balanceVisible: true,
};

type SettingsAction =
  | { type: 'UPDATE_PROFILE'; payload: Partial<UserProfile> }
  | { type: 'UPDATE_SECURITY'; payload: Partial<SettingsState['security']> }
  | { type: 'UPDATE_NOTIFICATIONS'; payload: Partial<SettingsState['notifications']> }
  | { type: 'UPDATE_AFFIRMATIONS'; payload: Partial<SettingsState['affirmations']> }
  | { type: 'SET_BALANCE_VISIBLE'; payload: boolean }
  | { type: 'RESET_ALL' };

function settingsReducer(state: SettingsState, action: SettingsAction): SettingsState {
  switch (action.type) {
    case 'UPDATE_PROFILE':
      return { ...state, profile: { ...state.profile, ...action.payload } };
    case 'UPDATE_SECURITY':
      return { ...state, security: { ...state.security, ...action.payload } };
    case 'UPDATE_NOTIFICATIONS':
      return { ...state, notifications: { ...state.notifications, ...action.payload } };
    case 'UPDATE_AFFIRMATIONS':
      return { ...state, affirmations: { ...state.affirmations, ...action.payload } };
    case 'SET_BALANCE_VISIBLE':
      return { ...state, balanceVisible: action.payload };
    case 'RESET_ALL':
      return INITIAL_STATE;
    default:
      return state;
  }
}

interface SettingsContextValue {
  state: SettingsState;
  dispatch: React.Dispatch<SettingsAction>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

interface SettingsProviderProps { children: ReactNode }

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [state, dispatch] = useReducer(settingsReducer, INITIAL_STATE);
  return (
    <SettingsContext.Provider value={{ state, dispatch }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
}
```

- [ ] **Step 2: Export SettingsProvider from context/index.ts**

If `context/index.ts` exists, add the export. Otherwise, skip.

---

## Task 2: Create Settings Layout

**File:** Create: `app/(main)/settings/_layout.tsx`

```tsx
import { Stack } from 'expo-router';
import { SettingsProvider } from '../../context/SettingsContext';

export default function SettingsLayout() {
  return (
    <SettingsProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SettingsProvider>
  );
}
```

---

## Task 3: Account Screen

**File:** Create: `app/(main)/settings/account.tsx`

- [ ] **Step 1: Write account.tsx**

```tsx
import { View, Text, TextInput, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { User } from 'lucide-react-native';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { useSettings } from '../../../context/SettingsContext';

export default function AccountScreen() {
  const router = useRouter();
  const { state, dispatch } = useSettings();
  const [name, setName] = useState(state.profile.displayName);

  const handleSave = () => {
    dispatch({ type: 'UPDATE_PROFILE', payload: { displayName: name } });
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScreenHeader title="Account" onBack={() => router.back()} />
      <View className="flex-1 px-4 pt-4">
        {/* Avatar */}
        <View className="items-center mb-8">
          <View className="w-24 h-24 rounded-2xl bg-primary items-center justify-center mb-3">
            <User size={40} color="#000000" />
          </View>
          <Text className="text-sm text-muted-foreground">Tap to change photo</Text>
        </View>

        {/* Form */}
        <View className="bg-card border border-border rounded-2xl p-5">
          <Text className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1.5">
            Display Name
          </Text>
          <View className="bg-input-background border border-border rounded-xl px-4 py-3">
            <TextInput
              value={name}
              onChangeText={setName}
              maxLength={30}
              className="text-base text-foreground outline-none"
              placeholderTextColor="#a0a0a0"
            />
          </View>
        </View>

        {/* Save Button */}
        <Pressable
          onPress={handleSave}
          className="bg-primary text-primary-foreground rounded-2xl py-4 items-center mt-6 active:scale-[0.98] transition-transform"
        >
          <Text className="text-base font-bold text-black">Save</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
```

Note: add `useState` import at top.

---

## Task 4: Change PIN Screen

**File:** Create: `app/(main)/settings/change-pin.tsx`

- [ ] **Step 1: Write change-pin.tsx**

```tsx
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { Numpad } from '../../../components/ui/Numpad';

const MOCK_PIN = '123456';

export default function ChangePinScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0); // 0=current, 1=new, 2=confirm
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');

  const pins = [currentPin, newPin, confirmPin];
  const setPins = [setCurrentPin, setNewPin, setConfirmPin];

  const handlePinChange = (value: string) => {
    setError('');
    setPins[step](value);
    if (value.length === 6) {
      setTimeout(() => {
        if (step === 0) {
          if (value === MOCK_PIN) {
            setStep(1);
          } else {
            setError('Incorrect PIN');
            setCurrentPin('');
          }
        } else if (step === 1) {
          setStep(2);
        } else {
          if (value === newPin) {
            // Success — in real app would persist new PIN
            router.back();
          } else {
            setError('PINs don\'t match. Try again.');
            setConfirmPin('');
          }
        }
      }, 250);
    }
  };

  const labels = ['Enter Current PIN', 'Enter New PIN', 'Confirm New PIN'];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScreenHeader title="Change PIN" onBack={() => router.back()} />
      <View className="flex-1 px-4 pt-6 items-center">
        <Text className="text-foreground text-lg font-medium mb-2">{labels[step]}</Text>

        {/* PIN Dots */}
        <View className="flex-row gap-3 mb-8">
          {[0,1,2,3,4,5].map(i => (
            <View key={i} className={`w-4 h-4 rounded-full border-2 ${
              i < pins[step].length
                ? 'bg-primary border-primary'
                : 'border-muted-foreground'
            }`} />
          ))}
        </View>

        {error ? <Text className="text-xs text-red-400 mb-4">{error}</Text> : null}

        <Numpad value={pins[step]} onChange={handlePinChange} maxLength={6} />

        {/* Back button for step > 0 */}
        {step > 0 && (
          <Pressable onPress={() => { setStep(s => s - 1); setError(''); }} className="mt-6">
            <Text className="text-sm text-muted-foreground">← Choose a different PIN</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}
```

Note: add `useState` import.

---

## Task 5: Security Screen

**File:** Create: `app/(main)/settings/security.tsx`

- [ ] **Step 1: Write security.tsx**

```tsx
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Shield } from 'lucide-react-native';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { Toggle } from '../../../components/ui/Toggle';
import { Chip } from '../../../components/ui/Chip';
import { useSettings } from '../../../context/SettingsContext';

const AUTO_LOCK_OPTIONS = ['1 min', '5 min', '15 min', 'Never'] as const;

export default function SecurityScreen() {
  const router = useRouter();
  const { state, dispatch } = useSettings();

  const toggleFingerprint = (val: boolean) => {
    dispatch({ type: 'UPDATE_SECURITY', payload: { fingerprintEnabled: val } });
  };

  const setAutoLock = (timer: typeof AUTO_LOCK_OPTIONS[number]) => {
    dispatch({ type: 'UPDATE_SECURITY', payload: { autoLockTimer: timer } });
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScreenHeader title="Security" onBack={() => router.back()} />
      <View className="flex-1 px-4 pt-4">
        <View className="bg-card border border-border rounded-2xl p-5 mb-6">
          {/* Fingerprint */}
          <View className="flex-row items-center justify-between py-3">
            <View className="flex-row items-center gap-3">
              <Shield size={20} color="#a0a0a0" />
              <Text className="text-foreground text-base">Fingerprint</Text>
            </View>
            <Toggle
              value={state.security.fingerprintEnabled}
              onValueChange={toggleFingerprint}
            />
          </View>

          <View className="border-t border-border my-1" />

          {/* Auto-lock */}
          <View className="py-3">
            <Text className="text-foreground text-base mb-3">Auto-lock Timer</Text>
            <View className="flex-row flex-wrap gap-2">
              {AUTO_LOCK_OPTIONS.map(opt => (
                <Chip
                  key={opt}
                  label={opt}
                  selected={state.security.autoLockTimer === opt}
                  onPress={() => setAutoLock(opt)}
                />
              ))}
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
```

---

## Task 6: Notifications Screen

**File:** Create: `app/(main)/settings/notifications.tsx`

- [ ] **Step 1: Write notifications.tsx**

```tsx
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { SettingsGroup } from '../../../components/ui/SettingsGroup';
import { SettingsRow } from '../../../components/ui/SettingsRow';
import { Toggle } from '../../../components/ui/Toggle';
import { useSettings } from '../../../context/SettingsContext';

type NotificationKey = keyof typeof initialNotifications;

const initialNotifications = {
  cashflow: true, alert: true, expense: true, income: true,
  recurring: true, milestone: true, tabung: true, affirmation: true,
};

const GROUPS = {
  Alerts: ['cashflow', 'alert', 'milestone'],
  Activity: ['expense', 'income', 'recurring', 'tabung'],
  Reminders: ['affirmation'],
};

const LABELS: Record<string, string> = {
  cashflow: 'Cashflow Updates', alert: 'Bill Alerts', milestone: 'Milestones',
  expense: 'Expenses', income: 'Income', recurring: 'Recurring', tabung: 'Tabung',
  affirmation: 'Affirmations',
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { state, dispatch } = useSettings();

  const toggle = (key: NotificationKey) => (val: boolean) => {
    dispatch({ type: 'UPDATE_NOTIFICATIONS', payload: { [key]: val } });
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScreenHeader title="Notifications" onBack={() => router.back()} />
      <View className="flex-1 px-4 pt-4">
        {Object.entries(GROUPS).map(([groupName, keys]) => (
          <SettingsGroup key={groupName} title={groupName}>
            {keys.map(key => (
              <View key={key} className="border-t border-border first:border-t-0">
                <SettingsRow
                  label={LABELS[key]}
                  icon={<Bell size={16} color="#a0a0a0" />}
                  onPress={() => {}}
                  hasChevron={false}
                >
                  <Toggle
                    value={state.notifications[key as NotificationKey]}
                    onValueChange={toggle(key as NotificationKey)}
                  />
                </SettingsRow>
              </View>
            ))}
          </SettingsGroup>
        ))}
      </View>
    </SafeAreaView>
  );
}
```

Note: SettingsRow needs to support `children` for the Toggle. Verify if existing SettingsRow accepts children — if not, a small adjustment may be needed. If the existing SettingsRow doesn't render children, modify it to accept and render a `rightElement` prop instead.

---

## Task 7: Categories Screen

**File:** Create: `app/(main)/settings/categories.tsx`

- [ ] **Step 1: Write categories.tsx**

```tsx
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { expenseCategories, incomeCategories } from '../../../constants/categories';

export default function CategoriesScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<'expense' | 'income'>('expense');

  const categories = tab === 'expense' ? expenseCategories : incomeCategories;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScreenHeader title="Categories" onBack={() => router.back()} />
      <View className="flex-1 px-4 pt-4">
        {/* Tab bar */}
        <View className="flex-row gap-3 mb-6">
          {(['expense', 'income'] as const).map(t => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              className={`flex-1 py-3 rounded-2xl items-center ${
                tab === t ? 'bg-primary' : 'bg-card border border-border'
              }`}
            >
              <Text className={`text-sm font-semibold ${tab === t ? 'text-black' : 'text-foreground'}`}>
                {t === 'expense' ? 'Expense' : 'Income'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Category list */}
        <View className="bg-card border border-border rounded-2xl p-4">
          {categories.map(cat => (
            <View key={cat.id} className="flex-row items-center gap-3 py-3 border-b border-border last:border-b-0">
              <Text className="text-lg">{cat.emoji}</Text>
              <View className="flex-1">
                <Text className="text-foreground text-sm">{cat.name}</Text>
              </View>
              <View className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}
```

Note: add `useState` import.

---

## Task 8: Recurring Screen

**File:** Create: `app/(main)/settings/recurring.tsx`

- [ ] **Step 1: Write recurring.tsx**

```tsx
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Repeat, Pause, Play } from 'lucide-react-native';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';

const MOCK_RECURING = [
  { id: '1', name: 'Unifi', amount: 89, frequency: 'Monthly', paused: false },
  { id: '2', name: 'Netflix', amount: 53, frequency: 'Monthly', paused: false },
  { id: '3', name: 'Axiata', amount: 30, frequency: 'Monthly', paused: true },
];

export default function RecurringScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScreenHeader title="Recurring Payments" onBack={() => router.back()} />
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-4 pt-4">
        <View className="bg-card border border-border rounded-2xl overflow-hidden">
          {MOCK_RECURING.map((item, i) => (
            <View key={item.id}>
              {i > 0 && <View className="border-t border-border" />}
              <View className="flex-row items-center justify-between p-4">
                <View className="flex-row items-center gap-3">
                  <Repeat size={18} color="#a0a0a0" />
                  <View>
                    <Text className="text-foreground text-sm font-medium">{item.name}</Text>
                    <Text className="text-muted-foreground text-xs">RM {item.amount} · {item.frequency}</Text>
                  </View>
                </View>
                <Pressable onPress={() => {}} className="p-2">
                  {item.paused
                    ? <Play size={18} color="#a0a0a0" />
                    : <Pause size={18} color="#a0a0a0" />
                  }
                </Pressable>
              </View>
            </View>
          ))}
        </View>
        <Text className="text-center text-xs text-muted-foreground mt-4 pb-8">
          Tap pause to temporarily stop a payment
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
```

---

## Task 9: Data Screen

**File:** Create: `app/(main)/settings/data.tsx`

- [ ] **Step 1: Write data.tsx**

```tsx
import { View, Text, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Download, AlertTriangle } from 'lucide-react-native';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { useSettings } from '../../../context/SettingsContext';

export default function DataScreen() {
  const router = useRouter();
  const { dispatch } = useSettings();

  const handleExport = () => {
    Alert.alert('Exporting...', 'Your data is being exported.', [{ text: 'OK' }]);
  };

  const handleReset = () => {
    Alert.alert(
      'Reset App',
      'Are you sure? This will delete all your data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: () => {
            dispatch({ type: 'RESET_ALL' });
            router.push('/');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScreenHeader title="Data" onBack={() => router.back()} />
      <View className="flex-1 px-4 pt-4">
        <View className="bg-card border border-border rounded-2xl p-5 mb-6">
          <Pressable
            onPress={handleExport}
            className="flex-row items-center gap-3 py-3"
          >
            <Download size={20} color="#a0a0a0" />
            <View className="flex-1">
              <Text className="text-foreground text-sm font-medium">Export Data</Text>
              <Text className="text-muted-foreground text-xs">Download all your data as JSON</Text>
            </View>
          </Pressable>
        </View>

        <View className="bg-card border border-border rounded-2xl p-5">
          <Pressable
            onPress={handleReset}
            className="flex-row items-center gap-3 py-3"
          >
            <AlertTriangle size={20} color="#ff4444" />
            <View className="flex-1">
              <Text className="text-destructive text-sm font-medium">Reset App</Text>
              <Text className="text-muted-foreground text-xs">Delete all data and start fresh</Text>
            </View>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
```

---

## Task 10: Affirmations Screen

**File:** Create: `app/(main)/settings/affirmations.tsx`

- [ ] **Step 1: Write affirmations.tsx**

```tsx
import { View, Text, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Heart } from 'lucide-react-native';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { Chip } from '../../../components/ui/Chip';
import { Toggle } from '../../../components/ui/Toggle';
import { useSettings } from '../../../context/SettingsContext';

const CATEGORIES = ['All', 'Saving', 'Investing', 'Mindset', 'Awareness'] as const;

export default function AffirmationsScreen() {
  const router = useRouter();
  const { state, dispatch } = useSettings();

  const update = (payload: Partial<typeof state.affirmations>) => {
    dispatch({ type: 'UPDATE_AFFIRMATIONS', payload });
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScreenHeader title="Affirmations" onBack={() => router.back()} />
      <View className="flex-1 px-4 pt-4">
        <View className="bg-card border border-border rounded-2xl p-5 mb-6">
          {/* Show on Home */}
          <View className="flex-row items-center justify-between py-3">
            <View className="flex-row items-center gap-3">
              <Heart size={20} color="#a0a0a0" />
              <Text className="text-foreground text-base">Show on Home</Text>
            </View>
            <Toggle
              value={state.affirmations.showOnHome}
              onValueChange={v => update({ showOnHome: v })}
            />
          </View>

          <View className="border-t border-border my-1" />

          {/* Daily Reminder */}
          <View className="py-3">
            <Text className="text-foreground text-base mb-2">Daily Reminder</Text>
            <View className="flex-row items-center gap-2">
              <View className="bg-input-background border border-border rounded-xl px-4 py-2">
                <TextInput
                  value={state.affirmations.dailyReminder}
                  onChangeText={v => update({ dailyReminder: v })}
                  className="text-foreground text-sm outline-none"
                  placeholder="08:00"
                  placeholderTextColor="#a0a0a0"
                  maxLength={5}
                />
              </View>
              <Text className="text-xs text-muted-foreground">HH:MM</Text>
            </View>
          </View>

          <View className="border-t border-border my-1" />

          {/* Category Preference */}
          <View className="py-3">
            <Text className="text-foreground text-base mb-3">Category Preference</Text>
            <View className="flex-row flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <Chip
                  key={cat}
                  label={cat}
                  selected={state.affirmations.categoryPreference === cat}
                  onPress={() => update({ categoryPreference: cat })}
                />
              ))}
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
```

---

## Task 11: Update main Settings screen to use context

**File:** Modify: `app/(main)/settings.tsx`

- [ ] **Step 1: Update imports and wire to SettingsContext**

Add `useSettings` from context and replace hardcoded "Ahmad" with `state.profile.displayName`. Also update the Fingerprint badge to show "Enabled"/"Disabled" based on `state.security.fingerprintEnabled`.

Replace the static `badge="Enabled"` on the Fingerprint row with dynamic badge based on `state.security.fingerprintEnabled`.

---

## Self-Review Checklist

- [ ] All 8 subscreens created
- [ ] SettingsContext has all state slices
- [ ] Settings layout provides context to all subscreens  
- [ ] Main settings screen reads from context
- [ ] No placeholder code (no TBD/TODO)
- [ ] All screens use existing components (SettingsGroup, SettingsRow, ScreenHeader, Toggle, Chip, Numpad, Input)
- [ ] Follows dark theme tokens from Flowe_Theme.md