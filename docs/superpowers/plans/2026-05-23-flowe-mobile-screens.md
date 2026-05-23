# Flowe Mobile Screens Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the 5 main app screens (Home Dashboard, Calendar, Cash Flow, Add Transaction modal, Settings) using React Native, Expo, NativeWind (Tailwind), React Navigation, and Lucide icons.

**Architecture:** The app uses Expo Router with a `(main)` route group containing a bottom-tab navigator and a modal presentation for Add Transaction. NativeWind provides Tailwind CSS utility classes. Components live in `components/` and screen-specific components in `app/(main)/`. The theme is dark-only with electric lime `#C5FF00` accent.

**Tech Stack:** Expo 54, React Native 0.81, NativeWind (Tailwind CSS), React Navigation 7 (bottom-tabs + native-stack), Lucide React Native, expo-haptics.

---

## Phase 1: Project Foundation

### 1.1: Install NativeWind

**Files:**
- Modify: `package.json` (add nativewind dependencies)
- Create: `tailwind.config.js`
- Create: `nativewind-env.d.ts`
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Add NativeWind dependencies**

Run:
```bash
npm install nativewind tailwindcss @tailwindcss/react-native
npm install --save-dev tailwindcss@^3.4
```

- [ ] **Step 2: Create `tailwind.config.js`**

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#0D0D0D',
        foreground: '#ffffff',
        card: '#1A1A1A',
        'card-foreground': '#ffffff',
        popover: '#1A1A1A',
        secondary: '#2a2a2a',
        muted: '#404040',
        'muted-foreground': '#a0a0a0',
        primary: '#C5FF00',
        'primary-foreground': '#000000',
        accent: '#C5FF00',
        'accent-foreground': '#000000',
        destructive: '#ff4444',
        'destructive-foreground': '#ffffff',
        border: 'rgba(255,255,255,0.1)',
        'input-background': '#1A1A1A',
        'switch-background': '#404040',
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 3: Create `nativewind-env.d.ts`**

```typescript
/// <reference types="nativewind/types" />
```

- [ ] **Step 4: Create `babel.config.js`**

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: ['react-native-worklets/plugin'],
  };
};
```

- [ ] **Step 5: Create `global.css` in `app/` directory**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 6: Update `app/_layout.tsx` to import global.css**

```typescript
import '../global.css';

export default function RootLayout() {
  return (
    <>
      <StatusBar barStyle="light-content" />
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
```

---

### 1.2: Theme Constants

**Files:**
- Create: `constants/theme.ts`
- Create: `constants/categories.ts`

- [ ] **Step 1: Create `constants/theme.ts`**

```typescript
export const theme = {
  colors: {
    background: '#0D0D0D',
    foreground: '#ffffff',
    card: '#1A1A1A',
    'card-foreground': '#ffffff',
    popover: '#1A1A1A',
    secondary: '#2a2a2a',
    muted: '#404040',
    'muted-foreground': '#a0a0a0',
    primary: '#C5FF00',
    'primary-foreground': '#000000',
    accent: '#C5FF00',
    'accent-foreground': '#000000',
    destructive: '#ff4444',
    'destructive-foreground': '#ffffff',
    border: 'rgba(255,255,255,0.1)',
    'input-background': '#1A1A1A',
    'switch-background': '#404040',
    income: '#22C55E',
    expense: '#EF4444',
    transfer: '#3B82F6',
  },
  borderRadius: {
    sm: '0.75rem',    // rounded-lg (12px)
    md: '0.875rem',  // rounded-xl (14px)
    lg: '1rem',      // rounded-2xl (16px)
    xl: '1.25rem',   // rounded-3xl (20px)
    full: '9999px',
  },
  spacing: {
    '4.5': '1.125rem',
    '5.5': '1.375rem',
  },
} as const;

export type Theme = typeof theme;
```

- [ ] **Step 2: Create `constants/categories.ts`**

```typescript
export const expenseCategories = [
  { id: 'food', emoji: '🍔', name: 'Food & Drink', color: '#F97316' },
  { id: 'transport', emoji: '🚗', name: 'Transport', color: '#3B82F6' },
  { id: 'bills', emoji: '🧾', name: 'Bills', color: '#8B5CF6' },
  { id: 'shopping', emoji: '🛍️', name: 'Shopping', color: '#EC4899' },
  { id: 'health', emoji: '💊', name: 'Health', color: '#EF4444' },
  { id: 'entertainment', emoji: '🎬', name: 'Entertainment', color: '#F59E0B' },
  { id: 'others', emoji: '📦', name: 'Others', color: '#6B7280' },
] as const;

export const incomeCategories = [
  { id: 'salary', emoji: '💼', name: 'Salary', color: '#22C55E' },
  { id: 'freelance', emoji: '💻', name: 'Freelance', color: '#3B82F6' },
  { id: 'gift', emoji: '🎁', name: 'Gift', color: '#EC4899' },
  { id: 'allowance', emoji: '💰', name: 'Allowance', color: '#F59E0B' },
  { id: 'investment', emoji: '📈', name: 'Investment', color: '#6366F1' },
  { id: 'rental', emoji: '🏠', name: 'Rental', color: '#14B8A6' },
  { id: 'others', emoji: '📦', name: 'Others', color: '#6B7280' },
] as const;

export const bankColors: Record<string, string> = {
  maybank: '#ffd93d',
  cimb: '#ff6b6b',
  public_bank: '#00d4ff',
  rhb: '#6bcf7f',
  hong_leong: '#C5FF00',
  ambank: '#a78bfa',
  bank_islam: '#34d399',
  bank_rakyat: '#f472b6',
  bsn: '#60a5fa',
  affin_bank: '#fb923c',
  alliance_bank: '#c084fc',
  other: '#94a3b8',
};
```

---

## Phase 2: Navigation Structure

### 2.1: Main App Layout with Bottom Tabs

**Files:**
- Create: `app/(main)/_layout.tsx`
- Create: `app/(main)/index.tsx` (Home - stub)
- Create: `app/(main)/calendar.tsx` (stub)
- Create: `app/(main)/cashflow.tsx` (stub)
- Create: `app/(main)/settings.tsx` (stub)
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Update `app/_layout.tsx`**

```typescript
import '../global.css';
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <>
      <StatusBar barStyle="light-content" />
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(main)" options={{ headerShown: false }} />
        <Stack.Screen
          name="(main)/add-transaction"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
      </Stack>
    </>
  );
}
```

- [ ] **Step 2: Create `app/(main)/_layout.tsx`**

```typescript
import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';
import { Home, Calendar, Plus, CashFlow, Settings } from 'lucide-react-native';

function AddButton() {
  return (
    <View className="w-14 h-14 rounded-full bg-primary items-center justify-center -mt-4 shadow-lg shadow-primary/30">
      <Plus size={24} color="#000000" />
    </View>
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
          href: null, // Hidden from tab bar - opened programmatically
          tabBarButton: () => <AddButton />,
        }}
      />
      <Tabs.Screen
        name="cashflow"
        options={{
          title: 'Cash Flow',
          tabBarIcon: ({ color, size }) => <CashFlow size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
```

- [ ] **Step 3: Create stub screens for all main tabs**

Create each file as a minimal placeholder first:
- `app/(main)/index.tsx`
- `app/(main)/calendar.tsx`
- `app/(main)/cashflow.tsx`
- `app/(main)/settings.tsx`

Each stub exports a component that renders a SafeAreaView with a Text element showing the screen name.

- [ ] **Step 4: Create `app/(main)/add-transaction.tsx` as stub modal**

---

## Phase 3: Shared UI Components

### 3.1: Button Components

**Files:**
- Create: `components/ui/Button.tsx`
- Create: `components/ui/Card.tsx`
- Create: `components/ui/Chip.tsx`
- Create: `components/ui/Badge.tsx`

- [ ] **Step 1: Create `components/ui/Button.tsx`**

```typescript
import { Pressable, Text, View, ActivityIndicator } from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-foreground border border-border',
  ghost: 'bg-transparent text-muted-foreground',
  destructive: 'bg-destructive text-destructive-foreground',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'py-2 px-3 rounded-xl',
  md: 'py-3 px-4 rounded-2xl',
  lg: 'py-4 px-6 rounded-2xl',
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  icon,
}: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        flex-row items-center justify-center gap-2
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.98]'}
        transition-all
        ${className}
      `}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#000' : '#fff'} />
      ) : (
        <>
          {icon}
          <Text
            className={`
              text-base font-semibold
              ${variant === 'primary' ? 'text-primary-foreground' : ''}
              ${variant === 'secondary' || variant === 'ghost' ? 'text-foreground' : ''}
              ${variant === 'destructive' ? 'text-destructive-foreground' : ''}
            `}
          >
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}
```

- [ ] **Step 2: Create `components/ui/Card.tsx`**

```typescript
import { View, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  variant?: 'default' | 'gradient';
}

export function Card({ className = '', variant = 'default', children, ...props }: CardProps) {
  return (
    <View
      className={`
        ${variant === 'gradient' ? 'bg-gradient-to-br from-card via-card to-secondary' : 'bg-card'}
        border border-border rounded-2xl p-5
        ${className}
      `}
      {...props}
    >
      {children}
    </View>
  );
}
```

- [ ] **Step 3: Create `components/ui/Chip.tsx`**

```typescript
import { Pressable, Text, View } from 'react-native';

interface ChipProps {
  label: string;
  emoji?: string;
  selected?: boolean;
  onPress?: () => void;
  color?: string;
}

export function Chip({ label, emoji, selected = false, onPress, color }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`
        flex-row items-center gap-1.5 px-3 py-2 rounded-xl
        ${selected ? 'bg-primary/10 border border-primary' : 'bg-card border border-border'}
        ${onPress ? 'active:scale-[0.97] transition-transform' : ''}
      `}
    >
      {emoji && <Text className="text-sm">{emoji}</Text>}
      <Text className={`text-xs font-medium ${selected ? 'text-primary' : 'text-foreground'}`}>
        {label}
      </Text>
      {color && (
        <View className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      )}
    </Pressable>
  );
}
```

- [ ] **Step 4: Create `components/ui/Badge.tsx`**

```typescript
import { View, Text } from 'react-native';

interface BadgeProps {
  label: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

const variantStyles = {
  default: 'bg-secondary text-foreground',
  primary: 'bg-primary/10 text-primary border border-primary/20',
  success: 'bg-income/10 text-income',
  warning: 'bg-yellow-500/10 text-yellow-500',
  danger: 'bg-destructive/10 text-destructive',
};

export function Badge({ label, variant = 'default' }: BadgeProps) {
  return (
    <View className={`px-2 py-0.5 rounded-full ${variantStyles[variant]}`}>
      <Text className="text-xs font-medium">{label}</Text>
    </View>
  );
}
```

---

### 3.2: Input Components

**Files:**
- Create: `components/ui/Input.tsx`
- Create: `components/ui/Numpad.tsx`
- Create: `components/ui/AmountInput.tsx`

- [ ] **Step 1: Create `components/ui/Input.tsx`**

```typescript
import { TextInput, View, Text, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function Input({ label, error, icon, className = '', ...props }: InputProps) {
  return (
    <View className="gap-1.5">
      {label && (
        <Text className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
          {label}
        </Text>
      )}
      <View className="flex-row items-center bg-input-background border border-border rounded-xl px-4 py-3 focus:border-primary transition-colors">
        {icon && <View className="mr-3">{icon}</View>}
        <TextInput
          className={`flex-1 text-base text-foreground placeholder:text-muted-foreground/50 outline-none ${className}`}
          placeholderTextColor="#a0a0a0"
          {...props}
        />
      </View>
      {error && <Text className="text-xs text-red-400 mt-1">{error}</Text>}
    </View>
  );
}
```

- [ ] **Step 2: Create `components/ui/Numpad.tsx`**

```typescript
import { View, Text, Pressable } from 'react-native';
import { Delete } from 'lucide-react-native';

interface NumpadProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
}

export function Numpad({ value, onChange, maxLength = 12 }: NumpadProps) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'];

  const handlePress = (key: string) => {
    if (key === 'del') {
      onChange(value.slice(0, -1));
    } else if (key === '.') {
      if (!value.includes('.') && value.length < maxLength) {
        onChange(value + '.');
      }
    } else {
      const newValue = value + key;
      const parts = newValue.split('.');
      if (parts[0].length <= maxLength - (parts[1] ? parts[1].length + 1 : 0)) {
        if (parts.length > 1 && parts[1].length > 2) return;
        onChange(newValue);
      }
    }
  };

  return (
    <View className="grid grid-cols-3 gap-3 p-4">
      {keys.map((key) => (
        <Pressable
          key={key}
          onPress={() => handlePress(key)}
          className="w-20 h-14 rounded-2xl bg-card border border-border items-center justify-center active:scale-95 transition-transform"
        >
          {key === 'del' ? (
            <Delete size={20} color="#a0a0a0" />
          ) : (
            <Text className="text-2xl font-medium text-foreground">{key}</Text>
          )}
        </Pressable>
      ))}
    </View>
  );
}
```

- [ ] **Step 3: Create `components/ui/AmountInput.tsx`**

```typescript
import { View, Text } from 'react-native';
import { Numpad } from './Numpad';

interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  currency?: string;
}

export function AmountInput({ value = '', onChange, currency = 'RM' }: AmountInputProps) {
  const displayValue = value || '0.00';

  return (
    <View className="items-center">
      <View className="flex-row items-center gap-2 mb-4">
        <Text className="text-2xl font-bold text-muted-foreground">{currency}</Text>
        <Text className="text-4xl font-bold text-foreground">{displayValue}</Text>
      </View>
      <Numpad value={value} onChange={onChange} />
    </View>
  );
}
```

---

### 3.3: Layout Components

**Files:**
- Create: `components/ui/ScreenHeader.tsx`
- Create: `components/ui/SectionHeader.tsx`
- Create: `components/ui/BottomSheet.tsx`

- [ ] **Step 1: Create `components/ui/ScreenHeader.tsx`**

```typescript
import { View, Text, Pressable } from 'react-native';
import { ChevronLeft, MoreHorizontal } from 'lucide-react-native';

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export function ScreenHeader({ title, onBack, rightAction }: ScreenHeaderProps) {
  return (
    <View className="flex-row items-center justify-between px-4 py-3">
      <View className="flex-row items-center gap-3">
        {onBack && (
          <Pressable onPress={onBack} className="p-2 -ml-2">
            <ChevronLeft size={24} color="#ffffff" />
          </Pressable>
        )}
        <Text className="text-xl font-semibold text-foreground">{title}</Text>
      </View>
      {rightAction && <View>{rightAction}</View>}
    </View>
  );
}
```

- [ ] **Step 2: Create `components/ui/SectionHeader.tsx`**

```typescript
import { View, Text, Pressable } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, actionLabel, onAction }: SectionHeaderProps) {
  return (
    <View className="flex-row items-center justify-between px-4 mb-3">
      <Text className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
        {title}
      </Text>
      {actionLabel && (
        <Pressable onPress={onAction} className="flex-row items-center gap-1">
          <Text className="text-xs text-primary font-medium">{actionLabel}</Text>
          <ChevronRight size={14} color="#C5FF00" />
        </Pressable>
      )}
    </View>
  );
}
```

---

## Phase 4: Home Dashboard Screen

**Files:**
- Create: `app/(main)/index.tsx`
- Create: `components/home/HomeTopBar.tsx`
- Create: `components/home/AffirmationCard.tsx`
- Create: `components/home/BalanceBanner.tsx`
- Create: `components/home/AccountCards.tsx`
- Create: `components/home/Shortcuts.tsx`
- Create: `components/home/RecentTransactions.tsx`

- [ ] **Step 1: Create `components/home/HomeTopBar.tsx`**

```typescript
import { View, Text, Pressable } from 'react-native';
import { Bell, Lock } from 'lucide-react-native';

interface HomeTopBarProps {
  name: string;
  onBellPress: () => void;
  onLockPress: () => void;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function HomeTopBar({ name, onBellPress, onLockPress }: HomeTopBarProps) {
  return (
    <View className="flex-row items-center justify-between px-4 pt-2 pb-4">
      <View>
        <Text className="text-sm text-muted-foreground">{getGreeting()}</Text>
        <Text className="text-xl font-semibold text-foreground">{name}</Text>
      </View>
      <View className="flex-row items-center gap-4">
        <Pressable onPress={onBellPress} className="relative p-2">
          <Bell size={22} color="#ffffff" />
          <View className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500" />
        </Pressable>
        <Pressable onPress={onLockPress} className="p-2">
          <Lock size={22} color="#ffffff" />
        </Pressable>
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Create `components/home/AffirmationCard.tsx`**

```typescript
import { View, Text, Pressable } from 'react-native';
import { Heart, Share2, ChevronLeft, ChevronRight } from 'lucide-react-native';

const affirmations = [
  { emoji: '💰', category: 'Saving', quote: '"The poor and the middle class work for money. The rich have money work for them."' },
  { emoji: '📈', category: 'Investing', quote: '"The biggest risk is not taking any risk."' },
  { emoji: '🧠', category: 'Mindset', quote: '"Financial freedom is freedom from fear."' },
];

interface AffirmationCardProps {
  index: number;
  onNext: () => void;
  onPrev: () => void;
  onFavourite: () => void;
  onShare: () => void;
}

export function AffirmationCard({ index, onNext, onPrev, onFavourite, onShare }: AffirmationCardProps) {
  const current = affirmations[index % affirmations.length];

  return (
    <View className="mx-4 mb-5 bg-gradient-to-br from-primary/20 via-card to-card border border-primary/20 rounded-2xl p-4">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2">
          <Text className="text-lg">{current.emoji}</Text>
          <Text className="text-xs text-primary font-medium uppercase tracking-wider">
            {current.category}
          </Text>
        </View>
        <View className="flex-row items-center gap-3">
          <Pressable onPress={onFavourite} className="p-1">
            <Heart size={18} color="#EF4444" fill="#EF4444" />
          </Pressable>
          <Pressable onPress={onShare} className="p-1">
            <Share2 size={18} color="#a0a0a0" />
          </Pressable>
        </View>
      </View>
      <Text className="text-sm italic text-foreground mb-4 leading-relaxed">
        {current.quote}
      </Text>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-1">
          {affirmations.map((_, i) => (
            <View
              key={i}
              className={`w-1.5 h-1.5 rounded-full mx-0.5 ${
                i === index % affirmations.length ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </View>
        <View className="flex-row items-center gap-2">
          <Pressable onPress={onPrev} className="p-1">
            <ChevronLeft size={18} color="#a0a0a0" />
          </Pressable>
          <Pressable onPress={onNext} className="p-1">
            <ChevronRight size={18} color="#ffffff" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
```

- [ ] **Step 3: Create `components/home/BalanceBanner.tsx`**

```typescript
import { View, Text, Pressable } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';

interface BalanceBannerProps {
  balance: string;
  visible: boolean;
  onToggle: () => void;
}

export function BalanceBanner({ balance = '4,250.00', visible, onToggle }: BalanceBannerProps) {
  return (
    <View className="mx-4 mb-5 bg-gradient-to-br from-card via-card to-secondary rounded-2xl p-5 border border-border shadow-lg">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-sm text-muted-foreground font-medium">Total Balance</Text>
        <Pressable onPress={onToggle} className="p-1">
          {visible ? <Eye size={18} color="#a0a0a0" /> : <EyeOff size={18} color="#a0a0a0" />}
        </Pressable>
      </View>
      <Text className="text-3xl font-bold text-foreground">
        {visible ? `RM ${balance}` : 'RM ••••••'}
      </Text>
    </View>
  );
}
```

- [ ] **Step 4: Create `components/home/AccountCards.tsx`**

```typescript
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Landmark, PiggyBank, Wallet } from 'lucide-react-native';

const accounts = [
  { id: '1', type: 'bank', name: 'Maybank', balance: '3,200.00', color: '#ffd93d' },
  { id: '2', type: 'tabung', name: 'Tabung Raya', saved: '850.00', target: '5,000.00', color: '#6bcf7f' },
  { id: '3', type: 'wallet', name: 'Cash', balance: '200.00', color: '#00d4ff' },
];

interface AccountCardsProps {
  onAccountPress: (id: string) => void;
}

export function AccountCards({ onAccountPress }: AccountCardsProps) {
  return (
    <View className="mb-5">
      <View className="flex-row items-center justify-between px-4 mb-3">
        <Text className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
          Accounts
        </Text>
        <Pressable>
          <Text className="text-xs text-primary font-medium">See All</Text>
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
        {accounts.map((account) => (
          <Pressable
            key={account.id}
            onPress={() => onAccountPress(account.id)}
            className="mr-3 bg-card border border-border rounded-2xl p-4 w-36 active:scale-[0.98] transition-transform"
          >
            <View className="flex-row items-center justify-between mb-3">
              <View
                className="w-8 h-8 rounded-xl items-center justify-center"
                style={{ backgroundColor: account.color + '20' }}
              >
                {account.type === 'bank' && <Landmark size={16} color={account.color} />}
                {account.type === 'tabung' && <PiggyBank size={16} color={account.color} />}
                {account.type === 'wallet' && <Wallet size={16} color={account.color} />}
              </View>
            </View>
            <Text className="text-sm font-medium text-foreground mb-1">{account.name}</Text>
            {account.type === 'tabung' ? (
              <View>
                <Text className="text-xs text-muted-foreground">RM {account.saved} / {account.target}</Text>
                <View className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                  <View
                    className="h-full rounded-full"
                    style={{
                      width: `${(parseFloat(account.saved) / parseFloat(account.target)) * 100}%`,
                      backgroundColor: account.color,
                    }}
                  />
                </View>
              </View>
            ) : (
              <Text className="text-base font-semibold text-foreground">RM {account.balance}</Text>
            )}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
```

- [ ] **Step 5: Create `components/home/Shortcuts.tsx`**

```typescript
import { View, Text, Pressable } from 'react-native';
import { BarChart3, BookOpen, PiggyBank, CreditCard } from 'lucide-react-native';

const shortcuts = [
  { id: 'analysis', icon: BarChart3, label: 'Analysis' },
  { id: 'learn', icon: BookOpen, label: 'Learn' },
  { id: 'newTabung', icon: PiggyBank, label: 'New Tabung' },
  { id: 'accounts', icon: CreditCard, label: 'Accounts' },
];

interface ShortcutsProps {
  onPress: (id: string) => void;
}

export function Shortcuts({ onPress }: ShortcutsProps) {
  return (
    <View className="px-4 mb-5">
      <View className="grid grid-cols-4 gap-3">
        {shortcuts.map((shortcut) => {
          const Icon = shortcut.icon;
          return (
            <Pressable
              key={shortcut.id}
              onPress={() => onPress(shortcut.id)}
              className="bg-card border border-border rounded-2xl p-3 items-center active:scale-[0.97] transition-transform"
            >
              <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center mb-2">
                <Icon size={20} color="#C5FF00" />
              </View>
              <Text className="text-xs text-foreground font-medium text-center">{shortcut.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
```

- [ ] **Step 6: Create `components/home/RecentTransactions.tsx`**

```typescript
import { View, Text, Pressable } from 'react-native';
import { RefreshCw, Image, ChevronRight } from 'lucide-react-native';

const transactions = [
  { id: '1', name: 'Makan Siang', category: 'Food', emoji: '🍔', amount: '-12.50', type: 'expense', date: 'Today', recurring: true },
  { id: '2', name: 'Salary', category: 'Income', emoji: '💼', amount: '+3,500.00', type: 'income', date: 'Yesterday', recurring: true },
  { id: '3', name: 'Grab', category: 'Transport', emoji: '🚗', amount: '-8.00', type: 'expense', date: 'Yesterday', recurring: false },
  { id: '4', name: 'Unifi', category: 'Bills', emoji: '🧾', amount: '-89.00', type: 'expense', date: '19 May', recurring: true },
  { id: '5', name: 'Transfer to Tabung', category: 'Transfer', emoji: '🔄', amount: '-100.00', type: 'transfer', date: '18 May', recurring: false },
];

interface RecentTransactionsProps {
  onSeeAll: () => void;
  onTransactionPress: (id: string) => void;
}

export function RecentTransactions({ onSeeAll, onTransactionPress }: RecentTransactionsProps) {
  return (
    <View className="px-4 mb-6 flex-1">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
          Recent Transactions
        </Text>
        <Pressable onPress={onSeeAll}>
          <Text className="text-xs text-primary font-medium">See All</Text>
        </Pressable>
      </View>
      <View className="gap-2">
        {transactions.map((tx) => (
          <Pressable
            key={tx.id}
            onPress={() => onTransactionPress(tx.id)}
            className="flex-row items-center justify-between bg-card border border-border rounded-xl px-4 py-3 active:scale-[0.98] transition-transform"
          >
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-xl bg-secondary items-center justify-center">
                <Text className="text-base">{tx.emoji}</Text>
              </View>
              <View>
                <View className="flex-row items-center gap-1.5">
                  <Text className="text-sm font-medium text-foreground">{tx.name}</Text>
                  {tx.recurring && <RefreshCw size={10} color="#a0a0a0" />}
                  {tx.type === 'expense' && <Image size={10} color="#a0a0a0" />}
                </View>
                <Text className="text-xs text-muted-foreground">{tx.date}</Text>
              </View>
            </View>
            <View className="flex-row items-center gap-2">
              <Text
                className={`text-sm font-semibold ${
                  tx.type === 'income' ? 'text-income' : tx.type === 'expense' ? 'text-expense' : 'text-transfer'
                }`}
              >
                {tx.amount}
              </Text>
              <ChevronRight size={16} color="#a0a0a0" />
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
```

- [ ] **Step 7: Create `app/(main)/index.tsx`**

```typescript
import { useState } from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { HomeTopBar } from '../../components/home/HomeTopBar';
import { AffirmationCard } from '../../components/home/AffirmationCard';
import { BalanceBanner } from '../../components/home/BalanceBanner';
import { AccountCards } from '../../components/home/AccountCards';
import { Shortcuts } from '../../components/home/Shortcuts';
import { RecentTransactions } from '../../components/home/RecentTransactions';
import { BottomNav } from '../../components/BottomNav';

export default function HomeScreen() {
  const router = useRouter();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [affirmationIndex, setAffirmationIndex] = useState(0);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <HomeTopBar
          name="Ahmad"
          onBellPress={() => router.push('/notifications')}
          onLockPress={() => router.push('/lock')}
        />
        <AffirmationCard
          index={affirmationIndex}
          onNext={() => setAffirmationIndex((i) => i + 1)}
          onPrev={() => setAffirmationIndex((i) => i - 1)}
          onFavourite={() => {}}
          onShare={() => {}}
        />
        <BalanceBanner
          balance="4,250.00"
          visible={balanceVisible}
          onToggle={() => setBalanceVisible(!balanceVisible)}
        />
        <AccountCards onAccountPress={(id) => router.push(`/account/${id}`)} />
        <Shortcuts onPress={(id) => {
          switch (id) {
            case 'analysis': router.push('/analysis'); break;
            case 'learn': router.push('/learn'); break;
            case 'newTabung': router.push('/tabung/new'); break;
            case 'accounts': router.push('/accounts'); break;
          }
        }} />
        <RecentTransactions
          onSeeAll={() => router.push('/calendar')}
          onTransactionPress={(id) => router.push('/transaction-detail')}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
```

---

## Phase 5: Calendar Screen

**Files:**
- Create: `app/(main)/calendar.tsx`

- [ ] **Step 1: Create `app/(main)/calendar.tsx`**

```typescript
import { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react-native';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Card } from '../../components/ui/Card';

const currentMonth = 'May 2025';
const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const calendarDays = [
  { day: 1, hasTransaction: true, types: ['expense', 'income'] },
  { day: 2, hasTransaction: false },
  { day: 3, hasTransaction: true, types: ['expense'] },
  { day: 4, hasTransaction: false },
  { day: 5, hasTransaction: true, types: ['income'] },
  { day: 6, hasTransaction: false },
  { day: 7, hasTransaction: false },
  { day: 8, hasTransaction: true, types: ['expense', 'transfer'] },
  { day: 9, hasTransaction: false },
  { day: 10, hasTransaction: true, types: ['income'] },
  { day: 11, hasTransaction: false },
  { day: 12, hasTransaction: true, types: ['expense'] },
  { day: 13, hasTransaction: false },
  { day: 14, hasTransaction: true, types: ['income'] },
  { day: 15, hasTransaction: false },
  { day: 16, hasTransaction: true, types: ['expense'] },
  { day: 17, hasTransaction: false },
  { day: 18, hasTransaction: true, types: ['income'] },
  { day: 19, hasTransaction: false },
  { day: 20, hasTransaction: true, types: ['expense', 'income'] },
  { day: 21, hasTransaction: false },
  { day: 22, hasTransaction: true, types: ['transfer'] },
  { day: 23, hasTransaction: false },
  { day: 24, hasTransaction: true, types: ['expense'] },
  { day: 25, hasTransaction: false },
  { day: 26, hasTransaction: true, types: ['income'] },
  { day: 27, hasTransaction: false },
  { day: 28, hasTransaction: true, types: ['expense'] },
  { day: 29, hasTransaction: false },
  { day: 30, hasTransaction: true, types: ['income'] },
  { day: 31, hasTransaction: false },
];

const dayTransactions = [
  { id: '1', name: 'Makan Siang', emoji: '🍔', amount: '-12.50', type: 'expense', time: '12:30 PM' },
  { id: '2', name: 'Salary', emoji: '💼', amount: '+3,500.00', type: 'income', time: '9:00 AM' },
];

const summary = {
  income: '4,230.00',
  expense: '1,245.00',
  net: '2,985.00',
};

export default function CalendarScreen() {
  const [selectedDay, setSelectedDay] = useState(20);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScreenHeader title="Calendar" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Month Navigator */}
        <View className="flex-row items-center justify-between px-4 py-3">
          <Pressable className="p-2">
            <ChevronLeft size={24} color="#ffffff" />
          </Pressable>
          <Text className="text-lg font-semibold text-foreground">{currentMonth}</Text>
          <Pressable className="p-2">
            <ChevronRight size={24} color="#ffffff" />
          </Pressable>
        </View>

        {/* Summary Cards */}
        <View className="flex-row gap-2 px-4 mb-4">
          <Card className="flex-1">
            <Text className="text-xs text-muted-foreground mb-1">Income</Text>
            <Text className="text-base font-bold text-income">+RM {summary.income}</Text>
          </Card>
          <Card className="flex-1">
            <Text className="text-xs text-muted-foreground mb-1">Expense</Text>
            <Text className="text-base font-bold text-expense">-RM {summary.expense}</Text>
          </Card>
          <Card className="flex-1">
            <Text className="text-xs text-muted-foreground mb-1">Net</Text>
            <Text className="text-base font-bold text-primary">+RM {summary.net}</Text>
          </Card>
        </View>

        {/* Calendar Grid */}
        <View className="px-4 mb-4">
          <View className="bg-card border border-border rounded-2xl p-4">
            {/* Day Headers */}
            <View className="flex-row mb-2">
              {days.map((day) => (
                <View key={day} className="flex-1 items-center">
                  <Text className="text-xs text-muted-foreground font-medium">{day}</Text>
                </View>
              ))}
            </View>
            {/* Calendar Days */}
            <View className="flex-row flex-wrap">
              {/* Empty cells for first week alignment */}
              <View className="w-[14.28%] h-10" />
              {calendarDays.map((item) => {
                const isToday = item.day === 20;
                const isSelected = item.day === selectedDay;
                return (
                  <Pressable
                    key={item.day}
                    onPress={() => setSelectedDay(item.day)}
                    className="w-[14.28%] h-10 items-center justify-center"
                  >
                    <View
                      className={`
                        w-8 h-8 rounded-full items-center justify-center
                        ${isSelected ? 'bg-primary' : ''}
                        ${isToday && !isSelected ? 'border border-primary' : ''}
                      `}
                    >
                      <Text
                        className={`
                          text-sm font-medium
                          ${isSelected ? 'text-primary-foreground' : 'text-foreground'}
                        `}
                      >
                        {item.day}
                      </Text>
                    </View>
                    {/* Transaction dots */}
                    {item.hasTransaction && (
                      <View className="absolute bottom-0.5 flex-row gap-0.5">
                        {item.types?.slice(0, 3).map((type, i) => (
                          <View
                            key={i}
                            className={`w-1 h-1 rounded-full ${
                              type === 'income' ? 'bg-income' : type === 'expense' ? 'bg-expense' : 'bg-transfer'
                            }`}
                          />
                        ))}
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        {/* Legend */}
        <View className="flex-row items-center justify-center gap-4 px-4 mb-4">
          <View className="flex-row items-center gap-1.5">
            <View className="w-2 h-2 rounded-full bg-income" />
            <Text className="text-xs text-muted-foreground">Income</Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <View className="w-2 h-2 rounded-full bg-expense" />
            <Text className="text-xs text-muted-foreground">Expense</Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <View className="w-2 h-2 rounded-full bg-transfer" />
            <Text className="text-xs text-muted-foreground">Transfer</Text>
          </View>
        </View>

        {/* Day Transactions */}
        <View className="px-4 mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-sm font-semibold text-foreground">
              {selectedDay === 20 ? 'Today' : `${selectedDay} May`}
            </Text>
            <Pressable className="flex-row items-center gap-1 bg-primary rounded-xl px-3 py-1.5">
              <Plus size={14} color="#000" />
              <Text className="text-xs font-semibold text-primary-foreground">Add</Text>
            </Pressable>
          </View>
          <View className="gap-2">
            {dayTransactions.map((tx) => (
              <View
                key={tx.id}
                className="flex-row items-center justify-between bg-card border border-border rounded-xl px-4 py-3"
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-9 h-9 rounded-xl bg-secondary items-center justify-center">
                    <Text className="text-base">{tx.emoji}</Text>
                  </View>
                  <View>
                    <Text className="text-sm font-medium text-foreground">{tx.name}</Text>
                    <Text className="text-xs text-muted-foreground">{tx.time}</Text>
                  </View>
                </View>
                <Text
                  className={`text-sm font-semibold ${
                    tx.type === 'income' ? 'text-income' : 'text-expense'
                  }`}
                >
                  {tx.amount}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
```

---

## Phase 6: Cash Flow Screen

**Files:**
- Create: `app/(main)/cashflow.tsx`

- [ ] **Step 1: Create `app/(main)/cashflow.tsx`**

```typescript
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Info, ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react-native';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

const financialClass = {
  emoji: '💎',
  label: 'Rich Pattern',
  description: 'Your passive income exceeds your expenses',
};

const stats = {
  assets: '45,000',
  liabilities: '12,000',
  passiveIncome: '2,500',
  netWorth: '33,000',
};

const incomeStatement = [
  { label: 'Salary', amount: '4,230.00' },
  { label: 'Freelance', amount: '500.00' },
  { label: 'Passive Income', amount: '2,500.00', isHighlight: true },
  { label: 'Total Income', amount: '7,230.00', isBold: true },
  { label: 'Expenses', amount: '-2,145.00', isExpense: true },
  { label: 'Net Cash Flow', amount: '+5,085.00', isPositive: true },
];

const assets = [
  { name: 'Maybank Savings', value: '15,000', monthly: '+200/mo' },
  { name: 'Tabung Raya', value: '5,000', monthly: '+400/mo' },
  { name: 'ASB', value: '25,000', monthly: '+50/mo' },
];

const liabilities = [
  { name: 'Car Loan', value: '12,000', monthly: '-450/mo', rate: '2.5%' },
];

export default function CashFlowScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScreenHeader
        title="Cash Flow"
        rightAction={
          <Pressable onPress={() => {}} className="p-2">
            <Info size={22} color="#ffffff" />
          </Pressable>
        }
      />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Month Navigator */}
        <View className="flex-row items-center justify-between px-4 py-3">
          <Pressable className="p-2">
            <ChevronLeft size={24} color="#ffffff" />
          </Pressable>
          <Text className="text-lg font-semibold text-foreground">May 2025</Text>
          <Pressable className="p-2">
            <ChevronRight size={24} color="#ffffff" />
          </Pressable>
        </View>

        {/* Financial Class Badge */}
        <View className="px-4 mb-4">
          <View className="bg-card border border-border rounded-2xl p-4 flex-row items-center gap-4">
            <View className="w-14 h-14 rounded-2xl bg-primary/10 items-center justify-center">
              <Text className="text-3xl">{financialClass.emoji}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-primary mb-1">{financialClass.label}</Text>
              <Text className="text-sm text-muted-foreground">{financialClass.description}</Text>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View className="px-4 mb-4">
          <View className="grid grid-cols-2 gap-3">
            <Card>
              <Text className="text-xs text-muted-foreground mb-1">Assets</Text>
              <Text className="text-lg font-bold text-income">RM {stats.assets}</Text>
            </Card>
            <Card>
              <Text className="text-xs text-muted-foreground mb-1">Liabilities</Text>
              <Text className="text-lg font-bold text-expense">RM {stats.liabilities}</Text>
            </Card>
            <Card>
              <Text className="text-xs text-muted-foreground mb-1">Passive Income</Text>
              <Text className="text-lg font-bold text-primary">RM {stats.passiveIncome}</Text>
            </Card>
            <Card>
              <Text className="text-xs text-muted-foreground mb-1">Net Worth</Text>
              <Text className="text-lg font-bold text-foreground">RM {stats.netWorth}</Text>
            </Card>
          </View>
        </View>

        {/* Cash Flow Diagram */}
        <View className="px-4 mb-4">
          <Text className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-3 px-4">
            Cash Flow Pattern
          </Text>
          <Card className="items-center py-6">
            {/* Rich Pattern SVG Illustration */}
            <View className="w-full flex-row items-center justify-center gap-4 mb-4">
              <View className="items-center">
                <View className="w-16 h-16 rounded-2xl bg-income/20 items-center justify-center mb-1">
                  <TrendingUp size={24} color="#22C55E" />
                </View>
                <Text className="text-xs text-foreground">Assets</Text>
              </View>
              <View className="flex-row items-center gap-1">
                <View className="w-8 h-0.5 bg-income" />
                <Text className="text-lg">→</Text>
              </View>
              <View className="items-center">
                <View className="w-16 h-16 rounded-2xl bg-primary/20 items-center justify-center mb-1">
                  <Text className="text-2xl">💰</Text>
                </View>
                <Text className="text-xs text-foreground">Income</Text>
              </View>
              <View className="flex-row items-center gap-1">
                <View className="w-8 h-0.5 bg-primary" />
                <Text className="text-lg">→</Text>
              </View>
              <View className="items-center">
                <View className="w-16 h-16 rounded-2xl bg-expense/20 items-center justify-center mb-1">
                  <TrendingDown size={24} color="#EF4444" />
                </View>
                <Text className="text-xs text-foreground">Expenses</Text>
              </View>
            </View>
            <Text className="text-xs text-muted-foreground text-center px-4">
              Assets generate passive income, which covers expenses and allows reinvestment
            </Text>
          </Card>
        </View>

        {/* Income Statement */}
        <View className="px-4 mb-4">
          <Text className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-3 px-4">
            Income Statement
          </Text>
          <Card>
            {incomeStatement.map((item, index) => (
              <View
                key={index}
                className={`flex-row justify-between py-2 ${index !== incomeStatement.length - 1 ? 'border-b border-border' : ''}`}
              >
                <Text
                  className={`
                    text-sm
                    ${item.isBold ? 'font-semibold text-foreground' : ''}
                    ${item.isHighlight ? 'text-primary' : ''}
                    ${item.isExpense ? 'text-expense' : ''}
                    ${!item.isBold && !item.isHighlight && !item.isExpense ? 'text-foreground' : ''}
                  `}
                >
                  {item.label}
                </Text>
                <Text
                  className={`
                    text-sm font-medium
                    ${item.isBold ? 'font-semibold' : ''}
                    ${item.isPositive ? 'text-income' : ''}
                    ${item.isExpense ? 'text-expense' : ''}
                    ${!item.isPositive && !item.isExpense ? 'text-foreground' : ''}
                  `}
                >
                  {item.amount}
                </Text>
              </View>
            ))}
          </Card>
        </View>

        {/* Balance Sheet Tabs */}
        <View className="px-4 mb-4">
          <View className="flex-row bg-card rounded-2xl p-1 mb-3">
            <Pressable className="flex-1 py-2 rounded-xl bg-primary">
              <Text className="text-sm font-semibold text-primary-foreground text-center">Assets</Text>
            </Pressable>
            <Pressable className="flex-1 py-2 rounded-xl">
              <Text className="text-sm font-semibold text-muted-foreground text-center">Liabilities</Text>
            </Pressable>
          </View>
          <Card>
            {assets.map((asset, index) => (
              <View
                key={index}
                className={`flex-row justify-between items-center py-3 ${index !== assets.length - 1 ? 'border-b border-border' : ''}`}
              >
                <View>
                  <Text className="text-sm font-medium text-foreground">{asset.name}</Text>
                  <Text className="text-xs text-income">{asset.monthly}</Text>
                </View>
                <Text className="text-sm font-semibold text-foreground">RM {asset.value}</Text>
              </View>
            ))}
            <Pressable className="flex-row items-center justify-center gap-2 py-3 mt-2 border-t border-dashed border-border">
              <Text className="text-sm text-primary font-medium">+ Add Asset</Text>
            </Pressable>
          </Card>
        </View>

        {/* Monthly Trend Chart Placeholder */}
        <View className="px-4 mb-8">
          <Text className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-3 px-4">
            Monthly Trend
          </Text>
          <Card className="items-center py-8">
            <Text className="text-sm text-muted-foreground">Net worth grew RM 1,500 this month</Text>
            <View className="flex-row items-end gap-2 mt-4 h-24">
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, i) => {
                const assetHeight = [40, 50, 55, 60, 70, 80][i];
                const liabilityHeight = [30, 28, 25, 22, 20, 18][i];
                return (
                  <View key={month} className="items-center gap-1">
                    <View className="flex-row items-end gap-0.5">
                      <View className="w-4 bg-income rounded-t" style={{ height: assetHeight }} />
                      <View className="w-4 bg-expense rounded-t" style={{ height: liabilityHeight }} />
                    </View>
                    <Text className="text-xs text-muted-foreground">{month}</Text>
                  </View>
                );
              })}
            </View>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
```

---

## Phase 7: Add Transaction Modal

**Files:**
- Create: `app/(main)/add-transaction.tsx`
- Create: `components/ui/CategoryChips.tsx`
- Create: `components/ui/AccountSelector.tsx`

- [ ] **Step 1: Create `components/ui/CategoryChips.tsx`**

```typescript
import { ScrollView } from 'react-native';
import { Chip } from '../ui/Chip';

interface Category {
  id: string;
  emoji: string;
  name: string;
  color?: string;
}

interface CategoryChipsProps {
  categories: readonly Category[];
  selected: string;
  onSelect: (id: string) => void;
}

export function CategoryChips({ categories, selected, onSelect }: CategoryChipsProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
      <View className="flex-row gap-2 px-4">
        {categories.map((cat) => (
          <Chip
            key={cat.id}
            label={cat.name}
            emoji={cat.emoji}
            selected={selected === cat.id}
            onPress={() => onSelect(cat.id)}
          />
        ))}
      </View>
    </ScrollView>
  );
}
```

- [ ] **Step 2: Create `components/ui/AccountSelector.tsx`**

```typescript
import { View, Text, Pressable } from 'react-native';
import { ChevronDown } from 'lucide-react-native';

interface Account {
  id: string;
  name: string;
  balance: string;
  color: string;
}

const accounts: Account[] = [
  { id: '1', name: 'Maybank', balance: '3,200.00', color: '#ffd93d' },
  { id: '2', name: 'Tabung Raya', balance: '850.00', color: '#6bcf7f' },
  { id: '3', name: 'Cash', balance: '200.00', color: '#00d4ff' },
];

interface AccountSelectorProps {
  value: string;
  onChange: (id: string) => void;
  label?: string;
}

export function AccountSelector({ value, label = 'Account', onChange }: AccountSelectorProps) {
  const selected = accounts.find((a) => a.id === value) || accounts[0];

  return (
    <View className="gap-1.5 mb-4">
      {label && (
        <Text className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
          {label}
        </Text>
      )}
      <Pressable className="flex-row items-center justify-between bg-input-background border border-border rounded-xl px-4 py-3">
        <View className="flex-row items-center gap-3">
          <View className="w-6 h-6 rounded-lg" style={{ backgroundColor: selected.color + '30' }} />
          <View>
            <Text className="text-sm font-medium text-foreground">{selected.name}</Text>
            <Text className="text-xs text-muted-foreground">RM {selected.balance}</Text>
          </View>
        </View>
        <ChevronDown size={18} color="#a0a0a0" />
      </Pressable>
    </View>
  );
}
```

- [ ] **Step 3: Create `app/(main)/add-transaction.tsx`**

```typescript
import { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Camera, RefreshCw, Calendar } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { expenseCategories, incomeCategories } from '../../constants/categories';
import { Button } from '../../components/ui/Button';
import { AmountInput } from '../../components/ui/AmountInput';
import { CategoryChips } from '../../components/ui/CategoryChips';
import { AccountSelector } from '../../components/ui/AccountSelector';

type TransactionType = 'expense' | 'income' | 'transfer';

export default function AddTransactionScreen() {
  const router = useRouter();
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('food');
  const [account, setAccount] = useState('1');
  const [toAccount, setToAccount] = useState('2');
  const [recurring, setRecurring] = useState(false);
  const [recurringFreq, setRecurringFreq] = useState('monthly');
  const [note, setNote] = useState('');

  const categories = type === 'expense' ? expenseCategories : incomeCategories;

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
        <Pressable onPress={() => router.back()} className="p-2">
          <X size={24} color="#ffffff" />
        </Pressable>
        <Text className="text-lg font-semibold text-foreground">Add Transaction</Text>
        <View className="w-10" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Scan Receipt */}
        <View className="px-4 pt-4">
          <Pressable className="w-full bg-primary rounded-2xl py-4 flex-row items-center justify-center gap-2 active:scale-[0.98] transition-transform">
            <Camera size={20} color="#000000" />
            <Text className="text-base font-bold text-primary-foreground">Scan Receipt</Text>
          </Pressable>
        </View>

        {/* Type Tabs */}
        <View className="px-4 pt-4">
          <View className="flex-row bg-card rounded-2xl p-1">
            {(['expense', 'income', 'transfer'] as TransactionType[]).map((t) => (
              <Pressable
                key={t}
                onPress={() => setType(t)}
                className={`flex-1 py-2.5 rounded-xl ${type === t ? 'bg-primary' : ''}`}
              >
                <Text
                  className={`text-sm font-semibold text-center ${
                    type === t ? 'text-primary-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Amount Input */}
        <View className="px-4 pt-6">
          <AmountInput value={amount} onChange={setAmount} />
        </View>

        {/* Form Fields */}
        <View className="px-4 pt-6">
          {/* Name */}
          <View className="mb-4">
            <Text className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1.5">
              Name
            </Text>
            <TextInput
              placeholder={type === 'expense' ? 'What was this expense?' : 'What was this income?'}
              placeholderTextColor="#a0a0a0"
              value={name}
              onChangeText={setName}
              className="bg-input-background border border-border rounded-xl px-4 py-3 text-base text-foreground"
            />
          </View>

          {/* Category */}
          <Text className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1.5">
            Category
          </Text>
          <CategoryChips
            categories={categories}
            selected={category}
            onSelect={setCategory}
          />

          {/* Account Selector */}
          <AccountSelector
            value={account}
            onChange={setAccount}
            label={type === 'transfer' ? 'From' : type === 'expense' ? 'From Account' : 'To Account'}
          />

          {type === 'transfer' && (
            <AccountSelector value={toAccount} onChange={setToAccount} label="To Account" />
          )}

          {/* Date */}
          <View className="mb-4">
            <Text className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1.5">
              Date
            </Text>
            <Pressable className="flex-row items-center gap-3 bg-input-background border border-border rounded-xl px-4 py-3">
              <Calendar size={18} color="#a0a0a0" />
              <Text className="text-base text-foreground">Today</Text>
            </Pressable>
          </View>

          {/* Recurring Toggle */}
          <Pressable
            onPress={() => setRecurring(!recurring)}
            className="flex-row items-center justify-between bg-card border border-border rounded-xl px-4 py-3 mb-4"
          >
            <View className="flex-row items-center gap-3">
              <RefreshCw size={18} color="#a0a0a0" />
              <View>
                <Text className="text-sm font-medium text-foreground">Recurring</Text>
                <Text className="text-xs text-muted-foreground">Repeat automatically</Text>
              </View>
            </View>
            <View
              className={`w-11 h-6 rounded-full p-0.5 transition-colors ${
                recurring ? 'bg-primary' : 'bg-switch-background'
              }`}
            >
              <View
                className={`w-5 h-5 rounded-full bg-white transition-transform ${recurring ? 'translate-x-5' : ''}`}
              />
            </View>
          </Pressable>

          {recurring && (
            <View className="mb-4">
              <Text className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">
                Frequency
              </Text>
              <View className="flex-row gap-2">
                {['weekly', 'monthly', 'yearly'].map((freq) => (
                  <Pressable
                    key={freq}
                    onPress={() => setRecurringFreq(freq)}
                    className={`flex-1 py-2 rounded-xl border ${
                      recurringFreq === freq
                        ? 'bg-primary/10 border-primary'
                        : 'bg-card border-border'
                    }`}
                  >
                    <Text
                      className={`text-xs font-medium text-center ${
                        recurringFreq === freq ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    >
                      {freq.charAt(0).toUpperCase() + freq.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Note */}
          <View className="mb-4">
            <Text className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1.5">
              Note (optional)
            </Text>
            <TextInput
              placeholder="Add a note..."
              placeholderTextColor="#a0a0a0"
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
              className="bg-input-background border border-border rounded-xl px-4 py-3 text-base text-foreground h-20 text-start"
            />
          </View>

          {/* Attach Image */}
          <Pressable className="flex-row items-center justify-center gap-2 py-3 mb-6 border border-dashed border-border rounded-xl">
            <Camera size={18} color="#a0a0a0" />
            <Text className="text-sm text-muted-foreground">Attach Image</Text>
          </Pressable>

          {/* Submit Button */}
          <Button
            title={type === 'transfer' ? 'Transfer' : 'Submit'}
            onPress={() => router.back()}
            variant="primary"
            size="lg"
            className="mb-6"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
```

---

## Phase 8: Settings Screen

**Files:**
- Create: `app/(main)/settings.tsx`
- Create: `components/ui/SettingsRow.tsx`
- Create: `components/ui/SettingsGroup.tsx`

- [ ] **Step 1: Create `components/ui/SettingsRow.tsx`**

```typescript
import { View, Text, Pressable } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

interface SettingsRowProps {
  label: string;
  value?: string;
  onPress?: () => void;
  icon?: React.ReactNode;
  danger?: boolean;
  badge?: string;
  hasChevron?: boolean;
}

export function SettingsRow({
  label,
  value,
  onPress,
  icon,
  danger = false,
  badge,
  hasChevron = true,
}: SettingsRowProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className="flex-row items-center justify-between py-3 px-1"
    >
      <View className="flex-row items-center gap-3">
        {icon && <View className="w-5 h-5">{icon}</View>}
        <Text className={`text-sm ${danger ? 'text-destructive' : 'text-foreground'}`}>
          {label}
        </Text>
      </View>
      <View className="flex-row items-center gap-2">
        {value && (
          <Text className="text-sm text-muted-foreground">{value}</Text>
        )}
        {badge && (
          <View className="px-2 py-0.5 rounded-full bg-income/20">
            <Text className="text-xs text-income font-medium">{badge}</Text>
          </View>
        )}
        {hasChevron && onPress && <ChevronRight size={16} color="#a0a0a0" />}
      </View>
    </Pressable>
  );
}
```

- [ ] **Step 2: Create `components/ui/SettingsGroup.tsx`**

```typescript
import { View, Text } from 'react-native';

interface SettingsGroupProps {
  title: string;
  children: React.ReactNode;
}

export function SettingsGroup({ title, children }: SettingsGroupProps) {
  return (
    <View className="mb-6">
      <Text className="text-xs text-muted-foreground uppercase tracking-wider font-semibold px-4 mb-2">
        {title}
      </Text>
      <View className="bg-card border border-border rounded-2xl mx-4 px-4">
        {children}
      </View>
    </View>
  );
}
```

- [ ] **Step 3: Create `app/(main)/settings.tsx`**

```typescript
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { User, Shield, Bell, Settings, Heart, Database, ChevronRight, AlertTriangle } from 'lucide-react-native';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { SettingsGroup } from '../../components/ui/SettingsGroup';
import { SettingsRow } from '../../components/ui/SettingsRow';

export default function SettingsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScreenHeader title="Settings" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View className="px-4 mb-6">
          <Pressable
            onPress={() => router.push('/settings/account')}
            className="flex-row items-center gap-4 bg-card border border-border rounded-2xl p-4"
          >
            <View className="w-16 h-16 rounded-2xl bg-primary items-center justify-center">
              <User size={28} color="#000000" />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-semibold text-foreground mb-0.5">Ahmad</Text>
              <Text className="text-sm text-muted-foreground">Tap to edit profile</Text>
            </View>
            <ChevronRight size={20} color="#a0a0a0" />
          </Pressable>
        </View>

        {/* Settings Groups */}
        <SettingsGroup title="Account">
          <SettingsRow
            label="Display Name"
            value="Ahmad"
            icon={<User size={16} color="#a0a0a0" />}
            onPress={() => router.push('/settings/account')}
          />
        </SettingsGroup>

        <SettingsGroup title="Security">
          <SettingsRow
            label="Change PIN"
            icon={<Shield size={16} color="#a0a0a0" />}
            onPress={() => router.push('/settings/change-pin')}
          />
          <View className="border-t border-border" />
          <SettingsRow
            label="Fingerprint"
            badge="Enabled"
            icon={<Shield size={16} color="#a0a0a0" />}
            onPress={() => router.push('/settings/security')}
          />
          <View className="border-t border-border" />
          <SettingsRow
            label="Auto-lock Timer"
            value="5 min"
            icon={<Shield size={16} color="#a0a0a0" />}
            onPress={() => router.push('/settings/security')}
          />
        </SettingsGroup>

        <SettingsGroup title="App Settings">
          <SettingsRow
            label="Currency"
            value="RM"
            icon={<Settings size={16} color="#a0a0a0" />}
          />
          <View className="border-t border-border" />
          <SettingsRow
            label="Notifications"
            icon={<Bell size={16} color="#a0a0a0" />}
            onPress={() => router.push('/settings/notifications')}
          />
          <View className="border-t border-border" />
          <SettingsRow
            label="Manage Categories"
            icon={<Settings size={16} color="#a0a0a0" />}
            onPress={() => router.push('/settings/categories')}
          />
          <View className="border-t border-border" />
          <SettingsRow
            label="Recurring Payments"
            icon={<Settings size={16} color="#a0a0a0" />}
            onPress={() => router.push('/settings/recurring')}
          />
          <View className="border-t border-border" />
          <SettingsRow
            label="Balance Visibility"
            value="Visible"
            icon={<Settings size={16} color="#a0a0a0" />}
            onPress={() => router.push('/settings/data')}
          />
        </SettingsGroup>

        <SettingsGroup title="Affirmations">
          <SettingsRow
            label="Show on Home"
            badge="On"
            icon={<Heart size={16} color="#a0a0a0" />}
            onPress={() => router.push('/settings/affirmations')}
          />
          <View className="border-t border-border" />
          <SettingsRow
            label="Daily Reminder"
            value="8:00 AM"
            icon={<Bell size={16} color="#a0a0a0" />}
            onPress={() => router.push('/settings/affirmations')}
          />
          <View className="border-t border-border" />
          <SettingsRow
            label="Category Preference"
            value="All"
            icon={<Heart size={16} color="#a0a0a0" />}
            onPress={() => router.push('/settings/affirmations')}
          />
        </SettingsGroup>

        <SettingsGroup title="Data">
          <SettingsRow
            label="Export Data"
            icon={<Database size={16} color="#a0a0a0" />}
            onPress={() => router.push('/settings/data')}
          />
          <View className="border-t border-border" />
          <SettingsRow
            label="Reset App"
            icon={<AlertTriangle size={16} color="#ff4444" />}
            danger
            hasChevron={false}
            onPress={() => router.push('/settings/data')}
          />
        </SettingsGroup>

        {/* Footer */}
        <View className="items-center pb-8 pt-4">
          <Text className="text-xs text-muted-foreground">Flowe v1.0.0</Text>
          <Text className="text-xs text-muted-foreground">Personal Finance Tracker</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
```

---

## Phase 9: Verification

- [ ] **Step 1: Run expo prebuild to generate native directories**

Run: `npx expo prebuild --clean`

- [ ] **Step 2: Start the development server**

Run: `npx expo start`

- [ ] **Step 3: Verify all 5 screens render without errors**

Test each screen manually:
1. Home Dashboard - check all components render (AffirmationCard, BalanceBanner, AccountCards, Shortcuts, RecentTransactions)
2. Calendar - check month navigator, summary cards, day grid, transaction list
3. Cash Flow - check financial class badge, income statement, balance sheet, monthly trend
4. Add Transaction - check type tabs switch, amount input, category chips, form fields
5. Settings - check all groups and rows render correctly

---

## File Summary

| File | Purpose |
|---|---|
| `tailwind.config.js` | Tailwind CSS configuration with Flowe theme tokens |
| `nativewind-env.d.ts` | NativeWind TypeScript declarations |
| `babel.config.js` | Babel config with nativewind preset |
| `app/global.css` | Tailwind directives |
| `constants/theme.ts` | Theme constants (colors, radius, spacing) |
| `constants/categories.ts` | Expense/income category definitions |
| `app/_layout.tsx` | Root layout with Stack navigator |
| `app/(main)/_layout.tsx` | Tab navigator with FAB center button |
| `app/(main)/index.tsx` | Home Dashboard screen |
| `app/(main)/calendar.tsx` | Calendar screen |
| `app/(main)/cashflow.tsx` | Cash Flow screen |
| `app/(main)/add-transaction.tsx` | Add Transaction modal |
| `app/(main)/settings.tsx` | Settings screen |
| `components/ui/Button.tsx` | Reusable Button component |
| `components/ui/Card.tsx` | Reusable Card component |
| `components/ui/Chip.tsx` | Reusable Chip/Tag component |
| `components/ui/Badge.tsx` | Reusable Badge component |
| `components/ui/Input.tsx` | Reusable Input component |
| `components/ui/Numpad.tsx` | Numpad for amount entry |
| `components/ui/AmountInput.tsx` | Amount display with numpad |
| `components/ui/ScreenHeader.tsx` | Screen header with back/nav |
| `components/ui/SectionHeader.tsx` | Section header with action |
| `components/ui/SettingsRow.tsx` | Settings list row |
| `components/ui/SettingsGroup.tsx` | Settings grouped section |
| `components/ui/CategoryChips.tsx` | Horizontal scrolling category chips |
| `components/ui/AccountSelector.tsx` | Account dropdown selector |
| `components/home/HomeTopBar.tsx` | Home screen top bar |
| `components/home/AffirmationCard.tsx` | Affirmation card component |
| `components/home/BalanceBanner.tsx` | Balance display banner |
| `components/home/AccountCards.tsx` | Horizontal account cards carousel |
| `components/home/Shortcuts.tsx` | 4-button shortcuts grid |
| `components/home/RecentTransactions.tsx` | Recent transactions list |

---

## Implementation Order

1. **Phase 1** (Project Foundation) — NativeWind setup first, no code changes to screens
2. **Phase 2** (Navigation) — Build the shell, confirm tabs render before adding screen content
3. **Phase 3** (Shared UI) — Build reusable primitives before screens
4. **Phase 4** (Home) — Home screen with all sub-components
5. **Phase 5** (Calendar) — Calendar screen
6. **Phase 6** (Cash Flow) — Cash Flow screen
7. **Phase 7** (Add Transaction) — Modal screen
8. **Phase 8** (Settings) — Settings screen
9. **Phase 9** (Verification) — Build and test

---

## Key Design Decisions

1. **Background color `#0D0D0D`** — Used throughout (matches prototype screenshots). NOT `#1a1a1a` which is the card color.
2. **NativeWind utility classes** — All styling uses Tailwind classes via NativeWind, no StyleSheet API.
3. **Pressable for all tappable elements** — No TouchableOpacity/TouchableHighlight. Pressable supports hover/press states natively.
4. **No external UI libraries** — Only View, Text, Pressable, ScrollView, TextInput, FlatList, Image from React Native + lucide-react-native icons.
5. **Hardcoded mock data** — All data is placeholder until Supabase backend is connected.
6. **Add Transaction as modal** — Presented via `presentation: 'modal'` in the root Stack, accessed via the FAB center tab button.
7. **Bottom tabs hide Add Transaction** — The `tabBarButton: () => <AddButton />` renders the FAB in the tab bar but the screen itself is `href: null` (hidden from tab bar), opened via router.
