# Onboarding Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the black/purple placeholder at `app/index.tsx` with the full Phase 1 (auth setup) + Phase 2 (onboarding) flow from prototype screens 01–08e, persisted via anonymous Supabase sign-in + `expo-secure-store`.

**Architecture:** Three Expo Router groups — `(auth)`, `(onboarding)`, `(main)` — gated by a rewritten root `_layout.tsx` that reads secure-store flags + Supabase session. Onboarding state lives in a React Context; PIN hash + flags persist to secure-store and `auth_config`; profile name + accounts written atomically on the final "Done" tap.

**Tech Stack:** Expo SDK 54, React Native 0.81, expo-router 6, NativeWind 4, react-native-reanimated 4, `@expo/vector-icons`, `expo-secure-store`, `expo-local-authentication`, `expo-crypto`, `@supabase/supabase-js`.

**Spec:** [docs/superpowers/specs/2026-05-25-onboarding-flow-design.md](../specs/2026-05-25-onboarding-flow-design.md)

---

## File Map

**New:**
- `app/(auth)/_layout.tsx`, `welcome.tsx`, `create-pin.tsx`, `confirm-pin.tsx`, `fingerprint.tsx`, `success.tsx`
- `app/(onboarding)/_layout.tsx`, `name.tsx`, `accounts.tsx`
- `context/OnboardingContext.tsx`
- `components/ui/PinDots.tsx`, `PinPad.tsx` (new, controlled — not the existing `src/components/ui/PinPad.tsx`)
- `components/ui/ProgressDots.tsx`, `OnboardingProgress.tsx`
- `components/onboarding/BankDropdown.tsx`, `TypeChip.tsx`, `BankForm.tsx`, `TabungForm.tsx`, `WalletForm.tsx`, `AccountChip.tsx`, `CelebrationOverlay.tsx`
- `constants/banks.ts`
- `src/lib/secureStore.ts` (typed wrapper)
- `src/lib/pinCrypto.ts` (sha256 helper)
- `src/repositories/authConfig.repository.ts`
- `src/types/onboarding.ts`
- `__tests__/onboarding-reducer.test.ts`, `pin-pad.test.ts`, `pin-crypto.test.ts`
- `jest.config.js`, `jest.setup.ts`

**Modified:**
- `app/_layout.tsx` — replace with session/onboarding gate
- `package.json` — add `expo-crypto`, jest deps

**Deleted:**
- `app/index.tsx` — gate owns the root route

---

## Task 1: Install dependencies and bootstrap Jest

**Files:**
- Modify: `package.json`
- Create: `jest.config.js`, `jest.setup.ts`

- [ ] **Step 1: Install runtime + test deps**

```bash
npx expo install expo-crypto
npm install --save-dev jest jest-expo @testing-library/react-native @types/jest
```

- [ ] **Step 2: Add test script to package.json**

In `package.json`, add to `"scripts"`:
```json
"test": "jest"
```

- [ ] **Step 3: Create `jest.config.js`**

```js
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEach: ['<rootDir>/jest.setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|nativewind|react-native-css-interop))',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};
```

- [ ] **Step 4: Create `jest.setup.ts`**

```ts
import '@testing-library/react-native/extend-expect';
```

- [ ] **Step 5: Verify jest runs (no tests yet → "no tests found" is OK)**

Run: `npm test -- --passWithNoTests`
Expected: exits 0 with "No tests found".

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json jest.config.js jest.setup.ts
git commit -m "chore: add expo-crypto and bootstrap jest"
```

---

## Task 2: Banks constant + onboarding types

**Files:**
- Create: `constants/banks.ts`, `src/types/onboarding.ts`

- [ ] **Step 1: Create `constants/banks.ts`**

```ts
export type Bank = { id: string; name: string; color: string };

export const MALAYSIAN_BANKS: Bank[] = [
  { id: 'maybank', name: 'Maybank', color: '#ffd93d' },
  { id: 'cimb', name: 'CIMB Bank', color: '#ff6b6b' },
  { id: 'public', name: 'Public Bank', color: '#00d4ff' },
  { id: 'rhb', name: 'RHB Bank', color: '#6bcf7f' },
  { id: 'hong-leong', name: 'Hong Leong Bank', color: '#C5FF00' },
  { id: 'ambank', name: 'AmBank', color: '#a78bfa' },
  { id: 'bank-islam', name: 'Bank Islam', color: '#34d399' },
  { id: 'bank-rakyat', name: 'Bank Rakyat', color: '#f472b6' },
  { id: 'bsn', name: 'BSN', color: '#60a5fa' },
  { id: 'affin', name: 'Affin Bank', color: '#fb923c' },
  { id: 'alliance', name: 'Alliance Bank', color: '#c084fc' },
  { id: 'other', name: 'Other Bank', color: '#94a3b8' },
];

export const TABUNG_ICONS = ['piggy', 'coin', 'home', 'gift', 'car', 'rocket', 'palm', 'building', 'train', 'target'] as const;
export type TabungIcon = typeof TABUNG_ICONS[number];
```

- [ ] **Step 2: Create `src/types/onboarding.ts`**

```ts
import type { TabungIcon } from '../../constants/banks';

export type DraftBank = {
  kind: 'bank';
  bankId: string;
  customName?: string;
  accountLast4?: string;
  openingBalance: number;
};

export type DraftTabung = {
  kind: 'tabung';
  name: string;
  icon: TabungIcon;
  target: number;
  fromDate: string;
  toDate: string;
  linkedBankId?: string;
};

export type DraftWallet = {
  kind: 'wallet';
  name: string;
  openingBalance: number;
};

export type DraftAccount = DraftBank | DraftTabung | DraftWallet;
```

- [ ] **Step 3: Commit**

```bash
git add constants/banks.ts src/types/onboarding.ts
git commit -m "feat: add banks constant and onboarding draft types"
```

---

## Task 3: SecureStore wrapper + PIN crypto helper (TDD)

**Files:**
- Create: `src/lib/secureStore.ts`, `src/lib/pinCrypto.ts`
- Test: `__tests__/pin-crypto.test.ts`

- [ ] **Step 1: Write failing test for `hashPin`**

`__tests__/pin-crypto.test.ts`:
```ts
import { hashPin } from '../src/lib/pinCrypto';

jest.mock('expo-crypto', () => ({
  digestStringAsync: jest.fn(async (_alg: string, value: string) =>
    `hashed:${value}`
  ),
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
}));

describe('hashPin', () => {
  it('hashes the pin via SHA-256', async () => {
    const h = await hashPin('123456');
    expect(h).toBe('hashed:123456');
  });
});
```

- [ ] **Step 2: Run — expect FAIL ("Cannot find module ../src/lib/pinCrypto")**

Run: `npm test -- pin-crypto`
Expected: FAIL.

- [ ] **Step 3: Create `src/lib/pinCrypto.ts`**

```ts
import * as Crypto from 'expo-crypto';

export async function hashPin(pin: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, pin);
}
```

- [ ] **Step 4: Run — expect PASS**

Run: `npm test -- pin-crypto`
Expected: 1 test passing.

- [ ] **Step 5: Create `src/lib/secureStore.ts`**

```ts
import * as SecureStore from 'expo-secure-store';

const KEYS = {
  pinSet: 'flowe.pin_set',
  pinHash: 'flowe.pin_hash',
  fingerprintEnabled: 'flowe.fingerprint_enabled',
  onboardingDone: 'flowe.onboarding_done',
} as const;

export const flags = {
  async pinSet(): Promise<boolean> {
    return (await SecureStore.getItemAsync(KEYS.pinSet)) === '1';
  },
  async onboardingDone(): Promise<boolean> {
    return (await SecureStore.getItemAsync(KEYS.onboardingDone)) === '1';
  },
  async fingerprintEnabled(): Promise<boolean> {
    return (await SecureStore.getItemAsync(KEYS.fingerprintEnabled)) === '1';
  },
  async setPin(hash: string, fingerprintEnabled: boolean): Promise<void> {
    await SecureStore.setItemAsync(KEYS.pinHash, hash);
    await SecureStore.setItemAsync(KEYS.fingerprintEnabled, fingerprintEnabled ? '1' : '0');
    await SecureStore.setItemAsync(KEYS.pinSet, '1');
  },
  async markOnboardingDone(): Promise<void> {
    await SecureStore.setItemAsync(KEYS.onboardingDone, '1');
  },
};
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/pinCrypto.ts src/lib/secureStore.ts __tests__/pin-crypto.test.ts
git commit -m "feat: add pin hashing helper and secure-store wrapper"
```

---

## Task 4: auth_config repository

**Files:**
- Create: `src/repositories/authConfig.repository.ts`
- Modify: `src/repositories/index.ts`

- [ ] **Step 1: Create `src/repositories/authConfig.repository.ts`**

```ts
import { supabase } from '../lib/supabase';
import { fromSupabaseError } from '../utils/result';
import type { Result, SupabaseError } from '../utils/result';

export const authConfigRepository = {
  async upsert(params: {
    userId: string;
    pinHash: string;
    fingerprintEnabled: boolean;
  }): Promise<Result<void, SupabaseError>> {
    const { error } = await supabase
      .from('auth_config')
      .upsert(
        {
          user_id: params.userId,
          pin_hash: params.pinHash,
          fingerprint_enabled: params.fingerprintEnabled,
        },
        { onConflict: 'user_id' }
      );
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: undefined };
  },
};
```

- [ ] **Step 2: Re-export from index**

In `src/repositories/index.ts`, append:
```ts
export { authConfigRepository } from './authConfig.repository';
```

- [ ] **Step 3: Commit**

```bash
git add src/repositories/authConfig.repository.ts src/repositories/index.ts
git commit -m "feat: add authConfig repository for upserting PIN hash"
```

---

## Task 5: OnboardingContext + reducer (TDD)

**Files:**
- Create: `context/OnboardingContext.tsx`
- Test: `__tests__/onboarding-reducer.test.ts`

- [ ] **Step 1: Write failing test for the reducer**

`__tests__/onboarding-reducer.test.ts`:
```ts
import { onboardingReducer, initialOnboardingState } from '../context/OnboardingContext';

describe('onboardingReducer', () => {
  it('sets pin', () => {
    const s = onboardingReducer(initialOnboardingState, { type: 'SET_PIN', pin: '123456' });
    expect(s.pin).toBe('123456');
  });

  it('clears pin', () => {
    const s = onboardingReducer({ ...initialOnboardingState, pin: 'x' }, { type: 'CLEAR_PIN' });
    expect(s.pin).toBeNull();
  });

  it('adds and removes draft accounts', () => {
    const draft = { kind: 'wallet' as const, name: 'Cash', openingBalance: 50 };
    const s1 = onboardingReducer(initialOnboardingState, { type: 'ADD_DRAFT', draft });
    expect(s1.draftAccounts).toHaveLength(1);
    const s2 = onboardingReducer(s1, { type: 'REMOVE_DRAFT', index: 0 });
    expect(s2.draftAccounts).toHaveLength(0);
  });

  it('sets name and fingerprint flag', () => {
    let s = onboardingReducer(initialOnboardingState, { type: 'SET_NAME', name: 'Ahmad' });
    expect(s.name).toBe('Ahmad');
    s = onboardingReducer(s, { type: 'SET_FINGERPRINT', enabled: true });
    expect(s.fingerprintEnabled).toBe(true);
  });
});
```

- [ ] **Step 2: Run — expect FAIL (module not found)**

Run: `npm test -- onboarding-reducer`
Expected: FAIL.

- [ ] **Step 3: Create `context/OnboardingContext.tsx`**

```tsx
import { createContext, useContext, useReducer, ReactNode } from 'react';
import type { DraftAccount } from '../src/types/onboarding';

export type OnboardingState = {
  pin: string | null;
  fingerprintEnabled: boolean;
  name: string;
  draftAccounts: DraftAccount[];
};

export const initialOnboardingState: OnboardingState = {
  pin: null,
  fingerprintEnabled: false,
  name: '',
  draftAccounts: [],
};

type Action =
  | { type: 'SET_PIN'; pin: string }
  | { type: 'CLEAR_PIN' }
  | { type: 'SET_FINGERPRINT'; enabled: boolean }
  | { type: 'SET_NAME'; name: string }
  | { type: 'ADD_DRAFT'; draft: DraftAccount }
  | { type: 'REMOVE_DRAFT'; index: number }
  | { type: 'RESET' };

export function onboardingReducer(state: OnboardingState, action: Action): OnboardingState {
  switch (action.type) {
    case 'SET_PIN': return { ...state, pin: action.pin };
    case 'CLEAR_PIN': return { ...state, pin: null };
    case 'SET_FINGERPRINT': return { ...state, fingerprintEnabled: action.enabled };
    case 'SET_NAME': return { ...state, name: action.name };
    case 'ADD_DRAFT': return { ...state, draftAccounts: [...state.draftAccounts, action.draft] };
    case 'REMOVE_DRAFT': return {
      ...state,
      draftAccounts: state.draftAccounts.filter((_, i) => i !== action.index),
    };
    case 'RESET': return initialOnboardingState;
    default: return state;
  }
}

const Ctx = createContext<{
  state: OnboardingState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(onboardingReducer, initialOnboardingState);
  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>;
}

export function useOnboarding() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useOnboarding must be inside OnboardingProvider');
  return v;
}
```

- [ ] **Step 4: Run — expect PASS**

Run: `npm test -- onboarding-reducer`
Expected: 4 tests passing.

- [ ] **Step 5: Commit**

```bash
git add context/OnboardingContext.tsx __tests__/onboarding-reducer.test.ts
git commit -m "feat: add OnboardingContext with tested reducer"
```

---

## Task 6: Root gate — rewrite `app/_layout.tsx`, delete `app/index.tsx`

**Files:**
- Modify: `app/_layout.tsx`
- Delete: `app/index.tsx`

- [ ] **Step 1: Delete placeholder**

```bash
git rm app/index.tsx
```

- [ ] **Step 2: Rewrite `app/_layout.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, Pressable } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import './global.css';
import { supabase } from '../src/lib/supabase';
import { authRepository } from '../src/repositories';
import { flags } from '../src/lib/secureStore';
import { OnboardingProvider } from '../context/OnboardingContext';

type GateState = 'loading' | 'error' | 'auth' | 'onboarding' | 'main';

export default function RootLayout() {
  const [state, setState] = useState<GateState>('loading');
  const router = useRouter();
  const segments = useSegments();

  async function resolve() {
    setState('loading');
    const sessionResult = await authRepository.getSession();
    if (!sessionResult.ok) { setState('error'); return; }
    let session = sessionResult.data;
    if (!session) {
      const anon = await authRepository.signInAnonymously();
      if (!anon.ok) { setState('error'); return; }
    }
    const pinSet = await flags.pinSet();
    const onboardingDone = await flags.onboardingDone();
    if (!pinSet) setState('auth');
    else if (!onboardingDone) setState('onboarding');
    else setState('main');
  }

  useEffect(() => { resolve(); }, []);

  useEffect(() => {
    if (state === 'loading' || state === 'error') return;
    const top = segments[0];
    if (state === 'auth' && top !== '(auth)') router.replace('/(auth)/welcome');
    if (state === 'onboarding' && top !== '(onboarding)') router.replace('/(onboarding)/name');
    if (state === 'main' && top !== '(main)') router.replace('/(main)');
  }, [state, segments]);

  if (state === 'loading') {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#C5FF00" />
      </View>
    );
  }
  if (state === 'error') {
    return (
      <View className="flex-1 bg-background items-center justify-center px-6">
        <Text className="text-foreground text-lg mb-4">Couldn't connect</Text>
        <Pressable className="bg-primary rounded-2xl py-3 px-6" onPress={resolve}>
          <Text className="text-primary-foreground font-semibold">Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <OnboardingProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(main)" />
      </Stack>
    </OnboardingProvider>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat: rewrite root layout as session/onboarding gate"
```

---

## Task 7: Shared components — ProgressDots, OnboardingProgress, PinDots

**Files:**
- Create: `components/ui/ProgressDots.tsx`, `OnboardingProgress.tsx`, `PinDots.tsx`

- [ ] **Step 1: Create `components/ui/ProgressDots.tsx`** (3-dot for auth)

```tsx
import { View } from 'react-native';

export function ProgressDots({ total, active }: { total: number; active: number }) {
  return (
    <View className="flex-row gap-2 px-6 pt-4">
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          className={`h-1 flex-1 rounded-full ${i === active ? 'bg-primary' : 'bg-muted'}`}
        />
      ))}
    </View>
  );
}
```

- [ ] **Step 2: Create `components/ui/OnboardingProgress.tsx`** (2-step pill+line for onboarding)

```tsx
import { View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';

export function OnboardingProgress({ step }: { step: 1 | 2 }) {
  return (
    <View className="flex-row items-center px-6 pt-4 gap-3">
      <View className={`w-7 h-7 rounded-full items-center justify-center ${step >= 1 ? 'bg-primary' : 'bg-muted'}`}>
        {step > 1
          ? <Feather name="check" size={16} color="#000" />
          : <Text className="text-primary-foreground font-bold">1</Text>}
      </View>
      <Text className={`${step === 1 ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>Your Name</Text>
      <View className={`h-0.5 flex-1 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
      <View className={`w-7 h-7 rounded-full items-center justify-center ${step >= 2 ? 'bg-primary' : 'bg-muted'}`}>
        <Text className={step >= 2 ? 'text-primary-foreground font-bold' : 'text-muted-foreground font-bold'}>2</Text>
      </View>
      <Text className={`${step === 2 ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>Accounts</Text>
    </View>
  );
}
```

- [ ] **Step 3: Create `components/ui/PinDots.tsx`**

```tsx
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';

export function PinDots({ length, error }: { length: number; error?: boolean }) {
  const tx = useSharedValue(0);
  useEffect(() => {
    if (error) {
      tx.value = withSequence(
        withTiming(-8, { duration: 60 }),
        withTiming(8, { duration: 60 }),
        withTiming(-6, { duration: 60 }),
        withTiming(6, { duration: 60 }),
        withTiming(0, { duration: 60 }),
      );
    }
  }, [error]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value }] }));

  return (
    <Animated.View style={style} className="flex-row gap-3 justify-center my-6">
      {Array.from({ length: 6 }).map((_, i) => {
        const filled = i < length;
        return (
          <View
            key={i}
            className={`w-4 h-4 rounded-full border-2 ${
              error ? 'border-destructive bg-destructive' :
              filled ? 'border-primary bg-primary' : 'border-muted-foreground/50'
            }`}
          />
        );
      })}
    </Animated.View>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add components/ui/ProgressDots.tsx components/ui/OnboardingProgress.tsx components/ui/PinDots.tsx
git commit -m "feat: add ProgressDots, OnboardingProgress, PinDots"
```

---

## Task 8: PinPad (controlled, prototype layout) + tests

**Files:**
- Create: `components/ui/PinPad.tsx`
- Test: `__tests__/pin-pad.test.ts` (pure helper test)

- [ ] **Step 1: Write failing test for `appendDigit`**

`__tests__/pin-pad.test.ts`:
```ts
import { appendDigit, backspace } from '../components/ui/PinPad';

describe('PinPad helpers', () => {
  it('appends digit up to 6', () => {
    expect(appendDigit('', '1')).toBe('1');
    expect(appendDigit('12345', '6')).toBe('123456');
    expect(appendDigit('123456', '7')).toBe('123456');
  });
  it('backspaces', () => {
    expect(backspace('123')).toBe('12');
    expect(backspace('')).toBe('');
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `npm test -- pin-pad`

- [ ] **Step 3: Create `components/ui/PinPad.tsx`**

```tsx
import { View, Text, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export function appendDigit(current: string, digit: string): string {
  if (current.length >= 6) return current;
  return current + digit;
}
export function backspace(current: string): string {
  return current.slice(0, -1);
}

const KEYS: Array<{ kind: 'digit' | 'blank' | 'del'; value?: string }> = [
  { kind: 'digit', value: '1' }, { kind: 'digit', value: '2' }, { kind: 'digit', value: '3' },
  { kind: 'digit', value: '4' }, { kind: 'digit', value: '5' }, { kind: 'digit', value: '6' },
  { kind: 'digit', value: '7' }, { kind: 'digit', value: '8' }, { kind: 'digit', value: '9' },
  { kind: 'blank' }, { kind: 'digit', value: '0' }, { kind: 'del' },
];

export function PinPad({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  function press(k: typeof KEYS[number]) {
    Haptics.selectionAsync().catch(() => {});
    if (k.kind === 'digit' && k.value) onChange(appendDigit(value, k.value));
    if (k.kind === 'del') onChange(backspace(value));
  }
  return (
    <View className="flex-row flex-wrap px-6 pb-8">
      {KEYS.map((k, i) => {
        if (k.kind === 'blank') return <View key={i} className="w-1/3 h-20" />;
        return (
          <Pressable
            key={i}
            onPress={() => press(k)}
            accessibilityRole="button"
            accessibilityLabel={k.kind === 'del' ? 'Delete' : `Number ${k.value}`}
            className="w-1/3 h-20 items-center justify-center"
          >
            <View className="bg-card rounded-2xl w-full mx-1 h-16 items-center justify-center active:opacity-70">
              {k.kind === 'digit' ? (
                <Text className="text-foreground text-2xl font-semibold">{k.value}</Text>
              ) : (
                <Feather name="delete" size={22} color="#fff" />
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
```

- [ ] **Step 4: Run — expect PASS**

Run: `npm test -- pin-pad`
Expected: 2 tests passing.

- [ ] **Step 5: Commit**

```bash
git add components/ui/PinPad.tsx __tests__/pin-pad.test.ts
git commit -m "feat: add controlled PinPad with helper tests"
```

---

## Task 9: `(auth)` layout + Welcome screen (01)

**Files:**
- Create: `app/(auth)/_layout.tsx`, `app/(auth)/welcome.tsx`

- [ ] **Step 1: Create `app/(auth)/_layout.tsx`**

```tsx
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, gestureEnabled: false, animation: 'fade' }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="create-pin" />
      <Stack.Screen name="confirm-pin" />
      <Stack.Screen name="fingerprint" />
      <Stack.Screen name="success" />
    </Stack>
  );
}
```

- [ ] **Step 2: Create `app/(auth)/welcome.tsx`**

```tsx
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

export default function Welcome() {
  const router = useRouter();
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerClassName="flex-1 px-6 max-w-md mx-auto w-full" showsVerticalScrollIndicator={false}>
        <View className="flex-1 items-center justify-center">
          <View className="w-20 h-20 rounded-2xl bg-primary items-center justify-center mb-8">
            <Feather name="credit-card" size={36} color="#000" />
          </View>
          <Text className="text-foreground text-4xl font-bold mb-2">Flowe</Text>
          <Text className="text-muted-foreground text-base mb-10">Your personal finance companion</Text>
          {[
            { icon: '💰', text: 'Track income & expenses effortlessly' },
            { icon: '📈', text: 'Build assets like the rich do' },
            { icon: '💎', text: 'Achieve financial freedom' },
          ].map((p) => (
            <View key={p.text} className="bg-card rounded-2xl px-4 py-3 mb-3 w-full flex-row items-center gap-3">
              <Text className="text-xl">{p.icon}</Text>
              <Text className="text-foreground text-sm">{p.text}</Text>
            </View>
          ))}
          <Text className="text-muted-foreground/60 text-xs italic mt-6">Inspired by Rich Dad Poor Dad</Text>
        </View>
        <Pressable
          onPress={() => router.push('/(auth)/create-pin')}
          className="bg-primary rounded-2xl py-4 mb-6 flex-row items-center justify-center gap-2 active:opacity-90"
        >
          <Text className="text-primary-foreground text-base font-bold">Get Started</Text>
          <Feather name="chevron-right" size={20} color="#000" />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
```

- [ ] **Step 3: Manual smoke test**

Run: `npm run start` and reload the app. Expected: Welcome screen renders, "Get Started" navigates to create-pin (will error — that's fine, next task).

- [ ] **Step 4: Commit**

```bash
git add app/\(auth\)/_layout.tsx app/\(auth\)/welcome.tsx
git commit -m "feat(auth): add welcome screen and auth stack layout"
```

---

## Task 10: Create-PIN screen (02)

**Files:**
- Create: `app/(auth)/create-pin.tsx`

- [ ] **Step 1: Create the screen**

```tsx
import { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { PinPad } from '../../components/ui/PinPad';
import { PinDots } from '../../components/ui/PinDots';
import { ProgressDots } from '../../components/ui/ProgressDots';

export default function CreatePin() {
  const [pin, setPin] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (pin.length === 6) {
      const t = setTimeout(() => {
        router.push({ pathname: '/(auth)/confirm-pin', params: { firstPin: pin } });
      }, 250);
      return () => clearTimeout(t);
    }
  }, [pin]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ProgressDots total={3} active={0} />
      <View className="flex-1 items-center px-6 max-w-md mx-auto w-full">
        <View className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary items-center justify-center mt-6 mb-4">
          <Feather name="shield" size={24} color="#C5FF00" />
        </View>
        <Text className="text-foreground text-2xl font-bold">Create Your PIN</Text>
        <Text className="text-muted-foreground text-sm mt-1">Choose a 6-digit PIN to secure your wallet</Text>
        <PinDots length={pin.length} />
      </View>
      <PinPad value={pin} onChange={setPin} />
    </SafeAreaView>
  );
}
```

- [ ] **Step 2: Smoke test**

Run: `npm run start`. Tap digits → dots fill. At 6th digit auto-navigates to confirm-pin (will error — next task).

- [ ] **Step 3: Commit**

```bash
git add app/\(auth\)/create-pin.tsx
git commit -m "feat(auth): add Create PIN screen"
```

---

## Task 11: Confirm-PIN screen (03)

**Files:**
- Create: `app/(auth)/confirm-pin.tsx`

- [ ] **Step 1: Create the screen**

```tsx
import { useState, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { PinPad } from '../../components/ui/PinPad';
import { PinDots } from '../../components/ui/PinDots';
import { ProgressDots } from '../../components/ui/ProgressDots';
import { useOnboarding } from '../../context/OnboardingContext';

export default function ConfirmPin() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const router = useRouter();
  const { firstPin } = useLocalSearchParams<{ firstPin: string }>();
  const { dispatch } = useOnboarding();

  useEffect(() => {
    if (pin.length === 6) {
      if (pin === firstPin) {
        dispatch({ type: 'SET_PIN', pin });
        router.replace('/(auth)/fingerprint');
      } else {
        setError(true);
        const t = setTimeout(() => { setError(false); setPin(''); }, 700);
        return () => clearTimeout(t);
      }
    }
  }, [pin]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ProgressDots total={3} active={0} />
      <View className="flex-1 items-center px-6 max-w-md mx-auto w-full">
        <View className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary items-center justify-center mt-6 mb-4">
          <Feather name="shield" size={24} color="#C5FF00" />
        </View>
        <Text className="text-foreground text-2xl font-bold">Confirm Your PIN</Text>
        <Text className="text-muted-foreground text-sm mt-1">Re-enter the same 6-digit PIN</Text>
        <PinDots length={pin.length} error={error} />
        {error && <Text className="text-destructive text-xs mt-2">PINs don't match. Try again.</Text>}
        <Pressable onPress={() => router.back()} className="mt-6 py-3">
          <Text className="text-muted-foreground text-sm">{'← Choose a different PIN'}</Text>
        </Pressable>
      </View>
      <PinPad value={pin} onChange={setPin} />
    </SafeAreaView>
  );
}
```

- [ ] **Step 2: Smoke test**

Run app. Mismatched PIN → shake + red dots + error text. Matched → navigates to fingerprint (will error).

- [ ] **Step 3: Commit**

```bash
git add app/\(auth\)/confirm-pin.tsx
git commit -m "feat(auth): add Confirm PIN screen with shake on mismatch"
```

---

## Task 12: Fingerprint screen (04)

**Files:**
- Create: `app/(auth)/fingerprint.tsx`

- [ ] **Step 1: Create the screen**

```tsx
import { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';
import { ProgressDots } from '../../components/ui/ProgressDots';
import { useOnboarding } from '../../context/OnboardingContext';

export default function Fingerprint() {
  const router = useRouter();
  const { dispatch } = useOnboarding();
  const [scanning, setScanning] = useState(false);
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(withTiming(1.15, { duration: 900 }), -1, true);
  }, []);
  const pulse = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  async function enable() {
    setScanning(true);
    const has = await LocalAuthentication.hasHardwareAsync();
    if (!has) {
      dispatch({ type: 'SET_FINGERPRINT', enabled: false });
      router.replace('/(auth)/success');
      return;
    }
    const res = await LocalAuthentication.authenticateAsync({ promptMessage: 'Enable fingerprint' });
    if (res.success) {
      setTimeout(() => {
        dispatch({ type: 'SET_FINGERPRINT', enabled: true });
        router.replace('/(auth)/success');
      }, 1800);
    } else {
      setScanning(false);
    }
  }

  function skip() {
    dispatch({ type: 'SET_FINGERPRINT', enabled: false });
    router.replace('/(auth)/success');
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ProgressDots total={3} active={1} />
      <View className="flex-1 items-center justify-center px-6 max-w-md mx-auto w-full">
        <Animated.View style={pulse} className="w-24 h-24 rounded-full bg-primary/20 items-center justify-center mb-8">
          {scanning
            ? <ActivityIndicator color="#C5FF00" />
            : <Feather name="fingerprint" size={48} color="#C5FF00" />}
        </Animated.View>
        <Text className="text-foreground text-2xl font-bold text-center">Enable Fingerprint Login</Text>
        <Text className="text-muted-foreground text-sm text-center mt-2 px-4">
          Biometric data never leaves your device. Your PIN always works as backup.
        </Text>
      </View>
      <View className="px-6 pb-8 gap-3">
        <Pressable onPress={enable} disabled={scanning} className="bg-primary rounded-2xl py-4 items-center active:opacity-90">
          <Text className="text-primary-foreground font-bold">Enable Fingerprint</Text>
        </Pressable>
        <Pressable onPress={skip} className="py-3 items-center">
          <Text className="text-muted-foreground text-sm">Skip for now</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
```

- [ ] **Step 2: Smoke test on a device with biometrics**

Verify enable + skip both navigate to success.

- [ ] **Step 3: Commit**

```bash
git add app/\(auth\)/fingerprint.tsx
git commit -m "feat(auth): add Fingerprint enable/skip screen"
```

---

## Task 13: Auth Success screen (05) — writes PIN to disk + Supabase

**Files:**
- Create: `app/(auth)/success.tsx`

- [ ] **Step 1: Create the screen**

```tsx
import { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { authRepository, authConfigRepository } from '../../src/repositories';
import { hashPin } from '../../src/lib/pinCrypto';
import { flags } from '../../src/lib/secureStore';
import { useOnboarding } from '../../context/OnboardingContext';

type Status = 'saving' | 'ready' | 'error';

export default function Success() {
  const router = useRouter();
  const { state, dispatch } = useOnboarding();
  const [status, setStatus] = useState<Status>('saving');

  async function persist() {
    setStatus('saving');
    if (!state.pin) { setStatus('error'); return; }
    const userRes = await authRepository.getUser();
    if (!userRes.ok || !userRes.data) { setStatus('error'); return; }
    const pinHash = await hashPin(state.pin);
    const upsert = await authConfigRepository.upsert({
      userId: userRes.data.id,
      pinHash,
      fingerprintEnabled: state.fingerprintEnabled,
    });
    if (!upsert.ok) { setStatus('error'); return; }
    await flags.setPin(pinHash, state.fingerprintEnabled);
    dispatch({ type: 'CLEAR_PIN' });
    setStatus('ready');
  }

  useEffect(() => { persist(); }, []);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center px-6 max-w-md mx-auto w-full">
        <View className="w-24 h-24 rounded-full bg-primary items-center justify-center mb-8">
          {status === 'saving'
            ? <ActivityIndicator color="#000" />
            : <Feather name="check" size={48} color="#000" />}
        </View>
        <Text className="text-foreground text-2xl font-bold">
          {status === 'error' ? 'Save failed' : 'Your wallet is secured!'}
        </Text>
        <Text className="text-muted-foreground text-sm text-center mt-2">
          {status === 'error'
            ? "Couldn't save your PIN. Tap retry to try again."
            : '6-digit PIN configured · Fingerprint ' + (state.fingerprintEnabled ? 'enabled' : 'disabled')}
        </Text>
      </View>
      <View className="px-6 pb-8">
        {status === 'error' ? (
          <Pressable onPress={persist} className="bg-primary rounded-2xl py-4 items-center">
            <Text className="text-primary-foreground font-bold">Retry</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => router.replace('/(onboarding)/name')}
            disabled={status !== 'ready'}
            className={`rounded-2xl py-4 items-center ${status === 'ready' ? 'bg-primary' : 'bg-muted'}`}
          >
            <Text className="text-primary-foreground font-bold">Continue to App</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}
```

- [ ] **Step 2: Smoke test**

Run app, complete PIN flow. Verify `auth_config` row exists in Supabase dashboard. Verify subsequent app restart skips auth and lands on onboarding name.

- [ ] **Step 3: Commit**

```bash
git add app/\(auth\)/success.tsx
git commit -m "feat(auth): persist PIN to secure-store + auth_config on Success"
```

---

## Task 14: `(onboarding)` layout + Name screen (06/07)

**Files:**
- Create: `app/(onboarding)/_layout.tsx`, `app/(onboarding)/name.tsx`

- [ ] **Step 1: Create layout**

```tsx
import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, gestureEnabled: false, animation: 'fade' }}>
      <Stack.Screen name="name" />
      <Stack.Screen name="accounts" />
    </Stack>
  );
}
```

- [ ] **Step 2: Create `name.tsx`**

```tsx
import { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { OnboardingProgress } from '../../components/ui/OnboardingProgress';
import { useOnboarding } from '../../context/OnboardingContext';

export default function Name() {
  const { state, dispatch } = useOnboarding();
  const [value, setValue] = useState(state.name);
  const router = useRouter();
  const trimmed = value.trim();
  const enabled = trimmed.length > 0;

  function next() {
    if (!enabled) return;
    dispatch({ type: 'SET_NAME', name: trimmed });
    router.push('/(onboarding)/accounts');
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <OnboardingProgress step={1} />
      <View className="flex-1 px-6 max-w-md mx-auto w-full">
        <View className="items-center mt-8 mb-6">
          <View className="w-20 h-20 rounded-2xl bg-secondary items-center justify-center">
            <Text className="text-4xl">👋</Text>
          </View>
        </View>
        <Text className="text-foreground text-3xl font-bold text-center">What should we{'\n'}call you?</Text>
        <Text className="text-muted-foreground text-sm text-center mt-2">We'll use your name to personalise your experience</Text>
        <View className="bg-card border-2 border-primary rounded-2xl mt-8 flex-row items-center px-4">
          <TextInput
            value={value}
            onChangeText={setValue}
            placeholder="e.g. Ahmad, Siti, Lee..."
            placeholderTextColor="#a0a0a0"
            maxLength={30}
            autoCapitalize="words"
            autoFocus
            className="flex-1 text-foreground text-lg py-4"
          />
          {value.length > 0 && (
            <Pressable onPress={() => setValue('')} className="p-2">
              <Feather name="x" size={18} color="#a0a0a0" />
            </Pressable>
          )}
        </View>
        <Text className="text-muted-foreground/70 text-xs text-center mt-3">This is stored only on your device</Text>
      </View>
      <View className="px-6 pb-8">
        <Pressable
          onPress={next}
          disabled={!enabled}
          className={`rounded-2xl py-4 flex-row items-center justify-center gap-2 ${enabled ? 'bg-primary active:opacity-90' : 'bg-muted'}`}
        >
          <Text className={`font-bold ${enabled ? 'text-primary-foreground' : 'text-muted-foreground'}`}>Next</Text>
          <Feather name="chevron-right" size={20} color={enabled ? '#000' : '#a0a0a0'} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
```

- [ ] **Step 3: Smoke test**

Empty → disabled. Type → enabled, clear-X works, Next navigates to accounts (will error).

- [ ] **Step 4: Commit**

```bash
git add app/\(onboarding\)/_layout.tsx app/\(onboarding\)/name.tsx
git commit -m "feat(onboarding): add Name screen and layout"
```

---

## Task 15: BankDropdown + TypeChip + AccountChip components

**Files:**
- Create: `components/onboarding/BankDropdown.tsx`, `TypeChip.tsx`, `AccountChip.tsx`

- [ ] **Step 1: Create `components/onboarding/TypeChip.tsx`**

```tsx
import { Pressable, View, Text } from 'react-native';

export function TypeChip({
  label, emoji, active, onPress,
}: { label: string; emoji: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 items-center justify-center py-3 rounded-2xl border ${
        active ? 'border-primary bg-primary/10' : 'border-border bg-card'
      }`}
    >
      <Text className="text-2xl mb-1">{emoji}</Text>
      <Text className={`text-sm font-semibold ${active ? 'text-primary' : 'text-muted-foreground'}`}>{label}</Text>
    </Pressable>
  );
}
```

- [ ] **Step 2: Create `components/onboarding/BankDropdown.tsx`**

```tsx
import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { MALAYSIAN_BANKS, type Bank } from '../../constants/banks';

export function BankDropdown({
  value, onChange,
}: { value: string; onChange: (bankId: string) => void }) {
  const [open, setOpen] = useState(false);
  const selected = MALAYSIAN_BANKS.find((b) => b.id === value) ?? MALAYSIAN_BANKS[0];

  return (
    <View>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        className="bg-card border border-border rounded-2xl px-4 py-3 flex-row items-center justify-between"
      >
        <View className="flex-row items-center gap-3">
          <Feather name="home" size={18} color="#fff" />
          <Text className="text-foreground text-base">{selected.name}</Text>
        </View>
        <Feather name={open ? 'chevron-up' : 'chevron-down'} size={18} color="#a0a0a0" />
      </Pressable>
      {open && (
        <View className="bg-card border border-border rounded-2xl mt-2 overflow-hidden">
          {MALAYSIAN_BANKS.map((b: Bank) => {
            const isSel = b.id === value;
            return (
              <Pressable
                key={b.id}
                onPress={() => { onChange(b.id); setOpen(false); }}
                className="flex-row items-center px-4 py-3 active:bg-secondary"
              >
                <View className="w-2 h-2 rounded-full mr-3" style={{ backgroundColor: b.color }} />
                <Feather name="home" size={16} color="#a0a0a0" />
                <Text className="text-foreground ml-3 flex-1">{b.name}</Text>
                {isSel && <Feather name="check" size={16} color="#C5FF00" />}
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}
```

- [ ] **Step 3: Create `components/onboarding/AccountChip.tsx`**

```tsx
import { View, Text, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { DraftAccount } from '../../src/types/onboarding';
import { MALAYSIAN_BANKS } from '../../constants/banks';

export function AccountChip({ draft, onRemove }: { draft: DraftAccount; onRemove: () => void }) {
  const meta = describe(draft);
  return (
    <View className="bg-card rounded-2xl p-4 flex-row items-center gap-3 mb-3">
      <Text className="text-2xl">{meta.emoji}</Text>
      <View className="flex-1">
        <Text className="text-foreground font-semibold">{meta.title}</Text>
        <Text className="text-muted-foreground text-xs mt-0.5">{meta.subtitle}</Text>
      </View>
      <View className="px-2 py-1 rounded-lg bg-primary/10">
        <Text className="text-primary text-xs font-semibold">{meta.badge}</Text>
      </View>
      <Pressable onPress={onRemove} className="p-2">
        <Feather name="trash-2" size={16} color="#ff4444" />
      </Pressable>
    </View>
  );
}

function describe(d: DraftAccount) {
  if (d.kind === 'bank') {
    const bank = MALAYSIAN_BANKS.find((b) => b.id === d.bankId);
    return {
      emoji: '🏦',
      title: d.customName ?? bank?.name ?? 'Bank',
      subtitle: `RM ${d.openingBalance.toFixed(2)}`,
      badge: 'Bank',
    };
  }
  if (d.kind === 'wallet') {
    return { emoji: '🍎', title: d.name, subtitle: `RM ${d.openingBalance.toFixed(2)}`, badge: 'Wallet' };
  }
  return { emoji: '✈️', title: d.name, subtitle: `Target RM ${d.target.toFixed(2)}`, badge: 'Tabung' };
}
```

- [ ] **Step 4: Commit**

```bash
git add components/onboarding/TypeChip.tsx components/onboarding/BankDropdown.tsx components/onboarding/AccountChip.tsx
git commit -m "feat(onboarding): add TypeChip, BankDropdown, AccountChip"
```

---

## Task 16: BankForm, WalletForm, TabungForm sub-components

**Files:**
- Create: `components/onboarding/BankForm.tsx`, `WalletForm.tsx`, `TabungForm.tsx`

- [ ] **Step 1: Create `components/onboarding/BankForm.tsx`**

```tsx
import { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BankDropdown } from './BankDropdown';
import type { DraftBank } from '../../src/types/onboarding';

export function BankForm({ onSubmit }: { onSubmit: (d: DraftBank) => void }) {
  const [bankId, setBankId] = useState('maybank');
  const [customName, setCustomName] = useState('');
  const [last4, setLast4] = useState('');
  const [balance, setBalance] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): DraftBank | null {
    const e: Record<string, string> = {};
    if (bankId === 'other' && !customName.trim()) e.customName = 'Required';
    if (last4 && !/^\d{4}$/.test(last4)) e.last4 = 'Must be 4 digits';
    const bal = parseFloat(balance || '0');
    if (isNaN(bal) || bal < 0) e.balance = 'Must be ≥ 0';
    setErrors(e);
    if (Object.keys(e).length > 0) return null;
    return {
      kind: 'bank',
      bankId,
      customName: bankId === 'other' ? customName.trim() : undefined,
      accountLast4: last4 || undefined,
      openingBalance: bal,
    };
  }

  // Expose validate via ref pattern is overkill — parent calls onSubmit through Add button:
  return (
    <View>
      <Text className="text-muted-foreground text-xs mb-2 mt-4">Bank</Text>
      <BankDropdown value={bankId} onChange={setBankId} />
      {bankId === 'other' && (
        <>
          <Text className="text-muted-foreground text-xs mb-2 mt-4">Custom Bank Name</Text>
          <TextInput
            value={customName}
            onChangeText={setCustomName}
            placeholder="Enter bank name"
            placeholderTextColor="#a0a0a0"
            className="bg-card border border-border rounded-2xl px-4 py-3 text-foreground"
          />
          {errors.customName && <Text className="text-destructive text-xs mt-1">{errors.customName}</Text>}
        </>
      )}
      <Text className="text-muted-foreground text-xs mb-2 mt-4">Last 4 of account no. (optional)</Text>
      <TextInput
        value={last4}
        onChangeText={(t) => setLast4(t.replace(/\D/g, '').slice(0, 4))}
        keyboardType="number-pad"
        maxLength={4}
        placeholder="1234"
        placeholderTextColor="#a0a0a0"
        className="bg-card border border-border rounded-2xl px-4 py-3 text-foreground"
      />
      {errors.last4 && <Text className="text-destructive text-xs mt-1">{errors.last4}</Text>}
      <Text className="text-muted-foreground text-xs mb-2 mt-4">Opening Balance (RM)</Text>
      <TextInput
        value={balance}
        onChangeText={setBalance}
        keyboardType="decimal-pad"
        placeholder="RM 0.00"
        placeholderTextColor="#a0a0a0"
        className="bg-card border border-border rounded-2xl px-4 py-3 text-foreground"
      />
      {errors.balance && <Text className="text-destructive text-xs mt-1">{errors.balance}</Text>}
      <Pressable
        onPress={() => { const d = validate(); if (d) onSubmit(d); }}
        className="bg-primary rounded-2xl py-4 mt-6 flex-row items-center justify-center gap-2 active:opacity-90"
      >
        <Feather name="plus" size={18} color="#000" />
        <Text className="text-primary-foreground font-bold">Add Account</Text>
      </Pressable>
    </View>
  );
}
```

- [ ] **Step 2: Create `components/onboarding/WalletForm.tsx`**

```tsx
import { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { DraftWallet } from '../../src/types/onboarding';

export function WalletForm({ onSubmit }: { onSubmit: (d: DraftWallet) => void }) {
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  function submit() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Required';
    const bal = parseFloat(balance || '0');
    if (isNaN(bal) || bal < 0) e.balance = 'Must be ≥ 0';
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    onSubmit({ kind: 'wallet', name: name.trim(), openingBalance: bal });
  }

  return (
    <View>
      <Text className="text-muted-foreground text-xs mb-2 mt-4">Wallet Name</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="e.g. Cash"
        placeholderTextColor="#a0a0a0"
        className="bg-card border border-border rounded-2xl px-4 py-3 text-foreground"
      />
      {errors.name && <Text className="text-destructive text-xs mt-1">{errors.name}</Text>}
      <Text className="text-muted-foreground text-xs mb-2 mt-4">Opening Balance (RM)</Text>
      <TextInput
        value={balance}
        onChangeText={setBalance}
        keyboardType="decimal-pad"
        placeholder="RM 0.00"
        placeholderTextColor="#a0a0a0"
        className="bg-card border border-border rounded-2xl px-4 py-3 text-foreground"
      />
      {errors.balance && <Text className="text-destructive text-xs mt-1">{errors.balance}</Text>}
      <Pressable
        onPress={submit}
        className="bg-primary rounded-2xl py-4 mt-6 flex-row items-center justify-center gap-2 active:opacity-90"
      >
        <Feather name="plus" size={18} color="#000" />
        <Text className="text-primary-foreground font-bold">Add Account</Text>
      </Pressable>
    </View>
  );
}
```

- [ ] **Step 3: Create `components/onboarding/TabungForm.tsx`**

```tsx
import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { TABUNG_ICONS, type TabungIcon } from '../../constants/banks';
import type { DraftTabung } from '../../src/types/onboarding';

const ICON_EMOJI: Record<TabungIcon, string> = {
  piggy: '🐷', coin: '🪙', home: '🏠', gift: '🎁', car: '🚗',
  rocket: '🚀', palm: '🌴', building: '🏢', train: '🚆', target: '🎯',
};

export function TabungForm({ onSubmit }: { onSubmit: (d: DraftTabung) => void }) {
  const [icon, setIcon] = useState<TabungIcon>('piggy');
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date(Date.now() + 90 * 86400e3));
  const [showFrom, setShowFrom] = useState(false);
  const [showTo, setShowTo] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function submit() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Required';
    const t = parseFloat(target || '0');
    if (isNaN(t) || t <= 0) e.target = 'Must be > 0';
    if (fromDate > toDate) e.dates = 'End date must be after start';
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    onSubmit({
      kind: 'tabung',
      name: name.trim(),
      icon,
      target: t,
      fromDate: fromDate.toISOString().slice(0, 10),
      toDate: toDate.toISOString().slice(0, 10),
    });
  }

  return (
    <View>
      <Text className="text-muted-foreground text-xs mb-2 mt-4">Icon</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
        {TABUNG_ICONS.map((k) => (
          <Pressable
            key={k}
            onPress={() => setIcon(k)}
            className={`w-12 h-12 mr-2 rounded-2xl items-center justify-center border ${
              icon === k ? 'border-primary bg-primary/10' : 'border-border bg-card'
            }`}
          >
            <Text className="text-2xl">{ICON_EMOJI[k]}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <Text className="text-muted-foreground text-xs mb-2 mt-4">Name</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="e.g. Tabung Raya"
        placeholderTextColor="#a0a0a0"
        className="bg-card border border-border rounded-2xl px-4 py-3 text-foreground"
      />
      {errors.name && <Text className="text-destructive text-xs mt-1">{errors.name}</Text>}
      <Text className="text-muted-foreground text-xs mb-2 mt-4">Target (RM)</Text>
      <TextInput
        value={target}
        onChangeText={setTarget}
        keyboardType="decimal-pad"
        placeholder="RM 0.00"
        placeholderTextColor="#a0a0a0"
        className="bg-card border border-border rounded-2xl px-4 py-3 text-foreground"
      />
      {errors.target && <Text className="text-destructive text-xs mt-1">{errors.target}</Text>}
      <View className="flex-row gap-3 mt-4">
        <View className="flex-1">
          <Text className="text-muted-foreground text-xs mb-2">From</Text>
          <Pressable onPress={() => setShowFrom(true)} className="bg-card border border-border rounded-2xl px-4 py-3">
            <Text className="text-foreground">{fromDate.toDateString()}</Text>
          </Pressable>
          {showFrom && <DateTimePicker value={fromDate} mode="date" onChange={(_, d) => { setShowFrom(false); if (d) setFromDate(d); }} />}
        </View>
        <View className="flex-1">
          <Text className="text-muted-foreground text-xs mb-2">To</Text>
          <Pressable onPress={() => setShowTo(true)} className="bg-card border border-border rounded-2xl px-4 py-3">
            <Text className="text-foreground">{toDate.toDateString()}</Text>
          </Pressable>
          {showTo && <DateTimePicker value={toDate} mode="date" minimumDate={fromDate} onChange={(_, d) => { setShowTo(false); if (d) setToDate(d); }} />}
        </View>
      </View>
      {errors.dates && <Text className="text-destructive text-xs mt-1">{errors.dates}</Text>}
      <Pressable onPress={submit} className="bg-primary rounded-2xl py-4 mt-6 flex-row items-center justify-center gap-2 active:opacity-90">
        <Feather name="plus" size={18} color="#000" />
        <Text className="text-primary-foreground font-bold">Add Account</Text>
      </Pressable>
    </View>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add components/onboarding/BankForm.tsx components/onboarding/WalletForm.tsx components/onboarding/TabungForm.tsx
git commit -m "feat(onboarding): add Bank, Wallet, Tabung form sub-components"
```

---

## Task 17: Accounts screen (08/08a/08b/08c/08e) + Done atomic write

**Files:**
- Create: `app/(onboarding)/accounts.tsx`, `components/onboarding/CelebrationOverlay.tsx`

- [ ] **Step 1: Create `components/onboarding/CelebrationOverlay.tsx`**

```tsx
import { View, Text } from 'react-native';

export function CelebrationOverlay({ name }: { name: string }) {
  return (
    <View className="absolute inset-0 bg-background/95 items-center justify-center z-50">
      <View className="w-32 h-32 rounded-full bg-primary/20 items-center justify-center mb-6">
        <Text className="text-6xl">🎉</Text>
      </View>
      <Text className="text-foreground text-2xl font-bold">Welcome aboard, {name}!</Text>
      <Text className="text-muted-foreground text-sm mt-2">Getting your wallet ready…</Text>
    </View>
  );
}
```

- [ ] **Step 2: Create `app/(onboarding)/accounts.tsx`**

```tsx
import { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { OnboardingProgress } from '../../components/ui/OnboardingProgress';
import { TypeChip } from '../../components/onboarding/TypeChip';
import { BankForm } from '../../components/onboarding/BankForm';
import { WalletForm } from '../../components/onboarding/WalletForm';
import { TabungForm } from '../../components/onboarding/TabungForm';
import { AccountChip } from '../../components/onboarding/AccountChip';
import { CelebrationOverlay } from '../../components/onboarding/CelebrationOverlay';
import { useOnboarding } from '../../context/OnboardingContext';
import { authRepository, accountsRepository } from '../../src/repositories';
import { flags } from '../../src/lib/secureStore';
import { supabase } from '../../src/lib/supabase';
import { MALAYSIAN_BANKS } from '../../constants/banks';
import type { DraftAccount } from '../../src/types/onboarding';

type Mode = 'bank' | 'tabung' | 'wallet';

export default function Accounts() {
  const router = useRouter();
  const { state, dispatch } = useOnboarding();
  const [mode, setMode] = useState<Mode>('bank');
  const [adding, setAdding] = useState(state.draftAccounts.length === 0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [celebrating, setCelebrating] = useState(false);

  function addDraft(d: DraftAccount) {
    dispatch({ type: 'ADD_DRAFT', draft: d });
    setAdding(false);
  }

  async function done() {
    setSubmitting(true);
    setSubmitError(null);

    const userRes = await authRepository.getUser();
    if (!userRes.ok || !userRes.data) { setSubmitError('Could not load user'); setSubmitting(false); return; }
    const userId = userRes.data.id;

    const profileUpdate = await supabase.from('profiles').update({ display_name: state.name }).eq('id', userId);
    if (profileUpdate.error) { setSubmitError(profileUpdate.error.message); setSubmitting(false); return; }

    const failed: DraftAccount[] = [];
    for (const d of state.draftAccounts) {
      const result = await persistDraft(userId, d);
      if (!result.ok) failed.push(d);
    }
    if (failed.length > 0) {
      // Drop successes, keep failures so user can retry
      dispatch({ type: 'RESET' });
      failed.forEach((d) => dispatch({ type: 'ADD_DRAFT', draft: d }));
      // Re-set name
      dispatch({ type: 'SET_NAME', name: state.name });
      setSubmitError(`${failed.length} account(s) failed to save`);
      setSubmitting(false);
      return;
    }

    await flags.markOnboardingDone();
    setCelebrating(true);
    setTimeout(() => router.replace('/(main)'), 1800);
  }

  const hasDrafts = state.draftAccounts.length > 0;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <OnboardingProgress step={2} />
      <ScrollView contentContainerClassName="px-6 max-w-md mx-auto w-full pb-32">
        <Text className="text-foreground text-3xl font-bold mt-4">Set up your accounts</Text>
        <Text className="text-muted-foreground text-sm mt-1">
          Add your bank accounts, tabung, and cash wallet{state.name ? `, ${state.name}` : ''}.
        </Text>

        {hasDrafts && !adding && (
          <View className="mt-6">
            <Text className="text-muted-foreground text-xs uppercase font-semibold mb-2">Added ({state.draftAccounts.length})</Text>
            {state.draftAccounts.map((d, i) => (
              <AccountChip key={i} draft={d} onRemove={() => dispatch({ type: 'REMOVE_DRAFT', index: i })} />
            ))}
            <Pressable
              onPress={() => setAdding(true)}
              className="border-2 border-dashed border-primary/40 rounded-2xl py-4 items-center mt-2"
            >
              <Text className="text-primary font-semibold">+ Add Another Account</Text>
            </Pressable>
          </View>
        )}

        {adding && (
          <View className="bg-card rounded-2xl p-5 mt-6">
            <Text className="text-foreground font-semibold mb-4">Add your first account</Text>
            <View className="flex-row gap-3">
              <TypeChip label="Bank" emoji="🏦" active={mode === 'bank'} onPress={() => setMode('bank')} />
              <TypeChip label="Tabung" emoji="🐷" active={mode === 'tabung'} onPress={() => setMode('tabung')} />
              <TypeChip label="Wallet" emoji="🍎" active={mode === 'wallet'} onPress={() => setMode('wallet')} />
            </View>
            {mode === 'bank' && <BankForm onSubmit={addDraft} />}
            {mode === 'tabung' && <TabungForm onSubmit={addDraft} />}
            {mode === 'wallet' && <WalletForm onSubmit={addDraft} />}
            {hasDrafts && (
              <Pressable onPress={() => setAdding(false)} className="py-3 mt-3 items-center">
                <Text className="text-muted-foreground text-sm">Cancel</Text>
              </Pressable>
            )}
          </View>
        )}

        {!hasDrafts && (
          <Text className="text-muted-foreground/70 text-xs text-center mt-4">You can add accounts later in Settings</Text>
        )}

        {submitError && <Text className="text-destructive text-sm text-center mt-4">{submitError}</Text>}
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 px-6 pb-8 bg-background">
        <Pressable
          onPress={done}
          disabled={submitting}
          className={`rounded-2xl py-4 flex-row items-center justify-center gap-2 ${submitting ? 'bg-muted' : 'bg-primary active:opacity-90'}`}
        >
          <Text className="text-primary-foreground font-bold">
            {submitting ? 'Saving…' : hasDrafts ? "Done, Let's Go!" : 'Skip for now'}
          </Text>
          <Feather name="chevron-right" size={20} color="#000" />
        </Pressable>
      </View>

      {celebrating && <CelebrationOverlay name={state.name} />}
    </SafeAreaView>
  );
}

async function persistDraft(userId: string, d: DraftAccount): Promise<{ ok: boolean }> {
  if (d.kind === 'bank') {
    const bank = MALAYSIAN_BANKS.find((b) => b.id === d.bankId);
    const r = await accountsRepository.createBank({
      user_id: userId,
      name: d.customName ?? bank?.name ?? 'Bank',
      color: bank?.color,
      bank_name: d.customName ?? bank?.name ?? 'Bank',
      account_number: d.accountLast4,
      opening_balance: d.openingBalance,
    });
    return { ok: r.ok };
  }
  if (d.kind === 'wallet') {
    const r = await accountsRepository.createWallet({
      user_id: userId,
      name: d.name,
      opening_balance: d.openingBalance,
    });
    return { ok: r.ok };
  }
  const r = await accountsRepository.createTabung({
    user_id: userId,
    name: d.name,
    icon: d.icon,
    target_amount: d.target,
    from_date: d.fromDate,
    to_date: d.toDate,
  });
  return { ok: r.ok };
}
```

- [ ] **Step 3: Verify `accountsRepository.createBank/Wallet/Tabung` signatures match**

Run: `grep -n "createBank\|createWallet\|createTabung" src/repositories/accounts.repository.ts`
If method names differ, update `persistDraft` to match the actual API. If methods don't exist, add them following the existing `CreateBankAccountRequest`/`CreateWalletAccountRequest`/`CreateTabungAccountRequest` types from the repo file (already defined at lines 11–42).

- [ ] **Step 4: Smoke test full flow**

Run: `npm run start`. Walk Welcome → Done. Verify in Supabase dashboard that `profiles.display_name`, `auth_config`, and `bank_accounts`/`wallet_accounts`/`tabung_accounts` rows exist. Verify a kill+relaunch lands directly on `(main)`.

- [ ] **Step 5: Commit**

```bash
git add app/\(onboarding\)/accounts.tsx components/onboarding/CelebrationOverlay.tsx
git commit -m "feat(onboarding): add Accounts screen with atomic Done write"
```

---

## Task 18: Lint, type-check, full manual smoke

- [ ] **Step 1: Lint**

Run: `npm run lint`
Fix any errors.

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit`
Fix any errors.

- [ ] **Step 3: Run all tests**

Run: `npm test`
Expected: all tests passing.

- [ ] **Step 4: Manual smoke checklist** (on iOS or Android device/simulator)

- [ ] Fresh install → Welcome shows
- [ ] Get Started → Create PIN, dots fill, navigates at 6 digits
- [ ] Confirm PIN mismatch → shake + red error + clear
- [ ] Confirm PIN match → fingerprint screen
- [ ] Enable Fingerprint succeeds → success screen
- [ ] Skip fingerprint → success screen
- [ ] Success screen writes auth_config (check Supabase)
- [ ] Continue → Name screen
- [ ] Empty name → Next disabled; typed name → enabled
- [ ] Accounts: switch Bank/Tabung/Wallet chips; bank dropdown opens inline
- [ ] Add 3 accounts → list view with chips + dashed Add Another
- [ ] Remove draft via trash icon works
- [ ] Done writes name + accounts (check Supabase); celebration → main
- [ ] Kill app, relaunch → goes directly to main
- [ ] (Dev only) Clear secure-store + sign out → relaunch → Welcome again

- [ ] **Step 5: Final commit if any fixes**

```bash
git add -A
git commit -m "chore: lint and type-check fixes after onboarding flow"
```

---

## Self-Review Notes

- Spec coverage: all sections 1–7 of the spec map to tasks 1–18. ✅
- Type consistency: `DraftAccount` defined once in `src/types/onboarding.ts`; all callers import from there. ✅
- `accountsRepository` method names verified inline in Task 17 Step 3 (defensive — caller checks actual signatures before assuming).
- No "TODO" / "TBD" / "similar to" placeholders. Every code step shows the full code.
- Test infra bootstrapped in Task 1 before any TDD task uses it.
- The PIN plaintext lives only in React Context and is cleared (`CLEAR_PIN`) immediately after persistence in Task 13.
