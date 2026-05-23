# Settings Sub-pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 8 settings sub-screens for the Flowe React Native app following the existing dark theme and Learn-stack pattern.

**Architecture:** Stack navigator under `app/(tabs)/settings/` with shared dark header styling. Each screen is a self-contained component with local state and mock data. Reusable UI components extracted to `src/components/ui/`.

**Tech Stack:** React Native (Expo), expo-router Stack, React Native StyleSheet, local useState management.

---

## File Structure

```
app/(tabs)/settings/
├── _layout.tsx          # Stack navigator (CREATE)
├── account.tsx          # Account settings (CREATE)
├── change-pin.tsx       # Change PIN flow (CREATE)
├── security.tsx          # Security settings (CREATE)
├── notifications.tsx     # Notification toggles (CREATE)
├── categories.tsx        # Tabbed category management (CREATE)
├── recurring.tsx         # Recurring payments list (CREATE)
├── affirmations.tsx     # Affirmation preferences (CREATE)
└── data.tsx              # Export + Reset (CREATE)

src/components/ui/
├── PinPad.tsx            # 6-digit numpad (CREATE - reusable)
└── Toggle.tsx             # Custom toggle switch (CREATE - reusable)
```

---

## Task 1: Create Settings Stack Layout

**Files:**
- Create: `app/(tabs)/settings/_layout.tsx`

- [ ] **Step 1: Create the settings stack layout**

```tsx
import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function SettingsStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: Colors.dark.cardBg,
        },
        headerTintColor: Colors.dark.text,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 16,
        },
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: Colors.dark.darkBg,
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}
```

- [ ] **Step 2: Commit**
```
git add app/(tabs)/settings/_layout.tsx
git commit -m "feat: add settings stack layout"
```

---

## Task 2: Create PinPad Component

**Files:**
- Create: `src/components/ui/PinPad.tsx`
- Modify: `constants/theme.ts` (add `pinDot` colors if needed)

- [ ] **Step 1: Create the PinPad component**

```tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';

interface PinPadProps {
  onComplete: (pin: string) => void;
  error?: string;
}

export function PinPad({ onComplete, error }: PinPadProps) {
  const [pin, setPin] = useState('');

  const handlePress = (digit: string) => {
    if (pin.length < 6) {
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length === 6) {
        onComplete(newPin);
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
  };

  const handleClear = () => {
    setPin('');
  };

  const renderDot = (index: number) => {
    const filled = index < pin.length;
    return (
      <View
        key={index}
        style={[
          styles.dot,
          filled && styles.dotFilled,
          error && styles.dotError,
        ]}
      />
    );
  };

  const renderButton = (digit: string) => (
    <TouchableOpacity
      key={digit}
      style={styles.button}
      onPress={() => handlePress(digit)}
      activeOpacity={0.7}
    >
      <Text style={styles.buttonText}>{digit}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* PIN dots */}
      <View style={styles.dotsContainer}>
        {[0, 1, 2, 3, 4, 5].map(renderDot)}
      </View>

      {/* Error message */}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Numpad */}
      <View style={styles.numpad}>
        <View style={styles.row}>
          {renderButton('1')}
          {renderButton('2')}
          {renderButton('3')}
        </View>
        <View style={styles.row}>
          {renderButton('4')}
          {renderButton('5')}
          {renderButton('6')}
        </View>
        <View style={styles.row}>
          {renderButton('7')}
          {renderButton('8')}
          {renderButton('9')}
        </View>
        <View style={styles.row}>
          <TouchableOpacity style={styles.button} onPress={handleClear} activeOpacity={0.7}>
            <Text style={styles.buttonText}>C</Text>
          </TouchableOpacity>
          {renderButton('0')}
          <TouchableOpacity style={styles.button} onPress={handleDelete} activeOpacity={0.7}>
            <Text style={styles.deleteText}>⌫</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.dark.textSecondary,
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: Colors.dark.tint,
    borderColor: Colors.dark.tint,
  },
  dotError: {
    borderColor: Colors.dark.destructive,
    backgroundColor: Colors.dark.destructive,
  },
  errorText: {
    color: Colors.dark.destructive,
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  numpad: {
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  button: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.dark.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 28,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  deleteText: {
    fontSize: 24,
    color: Colors.dark.text,
  },
});
```

- [ ] **Step 2: Commit**
```
git add src/components/ui/PinPad.tsx
git commit -m "feat: create reusable PinPad component"
```

---

## Task 3: Create Toggle Component

**Files:**
- Create: `src/components/ui/Toggle.tsx`

- [ ] **Step 1: Create the Toggle component**

```tsx
import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';

interface ToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

export function Toggle({ value, onValueChange, disabled = false }: ToggleProps) {
  return (
    <TouchableOpacity
      onPress={() => onValueChange(!value)}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <View style={[styles.toggle, value && styles.toggleOn, disabled && styles.toggleDisabled]}>
        <View style={[styles.toggleDot, value && styles.toggleDotOn]} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.dark.border,
    justifyContent: 'center',
    padding: 2,
  },
  toggleOn: {
    backgroundColor: Colors.dark.tint,
  },
  toggleDisabled: {
    opacity: 0.5,
  },
  toggleDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.dark.textSecondary,
  },
  toggleDotOn: {
    backgroundColor: Colors.dark.darkBg,
    alignSelf: 'flex-end',
  },
});
```

- [ ] **Step 2: Commit**
```
git add src/components/ui/Toggle.tsx
git commit -m "feat: create reusable Toggle component"
```

---

## Task 4: Create account.tsx

**Files:**
- Create: `app/(tabs)/settings/account.tsx`

- [ ] **Step 1: Create account settings screen**

```tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { Toggle } from '@/components/ui/Toggle';

const EMOJI_OPTIONS = ['👤', '👨', '👩', '🧑', '👴', '👵', '🦊', '🐱', '🐶', '🦁', '🐼', '🐨'];

const IDENTITIES = ['Student', 'Employee', 'Business Owner', 'Investor'];

export default function AccountSettings() {
  const router = useRouter();
  const [avatar, setAvatar] = useState('👤');
  const [name, setName] = useState('Akmal');
  const [identity, setIdentity] = useState('Employee');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showIdentityPicker, setShowIdentityPicker] = useState(false);

  const hasChanges = avatar !== '👤' || name !== 'Akmal' || identity !== 'Employee';

  const handleSave = () => {
    // Save logic here (mock - no backend)
    alert('Account settings saved!');
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        {/* Avatar */}
        <TouchableOpacity style={styles.avatarContainer} onPress={() => setShowEmojiPicker(true)}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{avatar}</Text>
          </View>
          <Text style={styles.avatarHint}>Tap to change</Text>
        </TouchableOpacity>

        {/* Display Name */}
        <View style={styles.section}>
          <Text style={styles.label}>Display Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            maxLength={30}
            placeholderTextColor={Colors.dark.textSecondary}
          />
        </View>

        {/* Financial Identity */}
        <View style={styles.section}>
          <Text style={styles.label}>Financial Identity</Text>
          <TouchableOpacity style={styles.picker} onPress={() => setShowIdentityPicker(true)}>
            <Text style={styles.pickerText}>{identity}</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveBtn, !hasChanges && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!hasChanges}
        >
          <Text style={styles.saveBtnText}>Simpan</Text>
        </TouchableOpacity>
      </View>

      {/* Emoji Picker Modal */}
      <Modal visible={showEmojiPicker} transparent animationType="fade" onRequestClose={() => setShowEmojiPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Choose Avatar</Text>
            <View style={styles.emojiGrid}>
              {EMOJI_OPTIONS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={[styles.emojiBtn, avatar === emoji && styles.emojiBtnSelected]}
                  onPress={() => {
                    setAvatar(emoji);
                    setShowEmojiPicker(false);
                  }}
                >
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowEmojiPicker(false)}>
              <Text style={styles.cancelBtnText}>Batal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Identity Picker Modal */}
      <Modal visible={showIdentityPicker} transparent animationType="fade" onRequestClose={() => setShowIdentityPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Financial Identity</Text>
            {IDENTITIES.map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.optionRow, identity === option && styles.optionRowSelected]}
                onPress={() => {
                  setIdentity(option);
                  setShowIdentityPicker(false);
                }}
              >
                <Text style={[styles.optionText, identity === option && styles.optionTextSelected]}>{option}</Text>
                {identity === option && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowIdentityPicker(false)}>
              <Text style={styles.cancelBtnText}>Batal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.darkBg },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  avatarContainer: { alignItems: 'center', marginBottom: 32 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.dark.tint, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  avatarText: { fontSize: 40 },
  avatarHint: { fontSize: 12, color: Colors.dark.textSecondary },
  section: { marginBottom: 24 },
  label: { fontSize: 12, fontWeight: '600', color: Colors.dark.textSecondary, marginBottom: 8, textTransform: 'uppercase' },
  input: { backgroundColor: Colors.dark.cardBg, borderRadius: 12, padding: 14, fontSize: 16, color: Colors.dark.text },
  picker: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.dark.cardBg, borderRadius: 12, padding: 14 },
  pickerText: { flex: 1, fontSize: 16, color: Colors.dark.text },
  chevron: { fontSize: 20, color: Colors.dark.textSecondary },
  saveBtn: { backgroundColor: Colors.dark.tint, borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 16 },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { fontSize: 16, fontWeight: '600', color: '#000' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', paddingHorizontal: 24 },
  modalCard: { backgroundColor: Colors.dark.cardBg, borderRadius: 20, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.dark.text, marginBottom: 20, textAlign: 'center' },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  emojiBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.dark.border, alignItems: 'center', justifyContent: 'center' },
  emojiBtnSelected: { backgroundColor: Colors.dark.tint },
  emojiText: { fontSize: 28 },
  optionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.dark.border },
  optionRowSelected: { backgroundColor: 'rgba(197, 255, 0, 0.1)' },
  optionText: { flex: 1, fontSize: 16, color: Colors.dark.text },
  optionTextSelected: { color: Colors.dark.tint, fontWeight: '600' },
  checkmark: { color: Colors.dark.tint, fontSize: 18 },
  cancelBtn: { marginTop: 12, paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { fontSize: 15, color: Colors.dark.textSecondary },
});
```

- [ ] **Step 2: Commit**
```
git add app/(tabs)/settings/account.tsx
git commit -m "feat: add account settings screen"
```

---

## Task 5: Create change-pin.tsx

**Files:**
- Create: `app/(tabs)/settings/change-pin.tsx`

- [ ] **Step 1: Create change PIN screen**

```tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PinPad } from '@/components/ui/PinPad';
import { Colors } from '@/constants/theme';

type Step = 'current' | 'new' | 'confirm';

export default function ChangePinScreen() {
  const [step, setStep] = useState<Step>('current');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [error, setError] = useState('');

  const handlePinComplete = (pin: string) => {
    setError('');

    if (step === 'current') {
      // Mock validation - any 6 digits accepted
      setCurrentPin(pin);
      setStep('new');
    } else if (step === 'new') {
      setNewPin(pin);
      setStep('confirm');
    } else if (step === 'confirm') {
      if (pin === newPin) {
        // Success
        alert('PIN changed successfully!');
        setStep('current');
        setCurrentPin('');
        setNewPin('');
      } else {
        setError('PINs don\'t match. Try again.');
        setStep('new');
        setNewPin('');
      }
    }
  };

  const getStepTitle = (): string => {
    if (step === 'current') return 'Enter Current PIN';
    if (step === 'new') return 'Enter New PIN';
    return 'Confirm New PIN';
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{getStepTitle()}</Text>
          <Text style={styles.subtitle}>Enter your 6-digit PIN</Text>
        </View>

        <View style={styles.pinPadContainer}>
          <PinPad onComplete={handlePinComplete} error={error} />
        </View>

        {/* Step indicator */}
        <View style={styles.steps}>
          <View style={[styles.stepDot, step === 'current' && styles.stepDotActive]} />
          <View style={[styles.stepDot, step === 'new' && styles.stepDotActive]} />
          <View style={[styles.stepDot, step === 'confirm' && styles.stepDotActive]} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.darkBg },
  content: { flex: 1, alignItems: 'center', paddingTop: 40 },
  header: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 20, fontWeight: 'bold', color: Colors.dark.text, marginBottom: 8 },
  subtitle: { fontSize: 14, color: Colors.dark.textSecondary },
  pinPadContainer: { flex: 1, justifyContent: 'center' },
  steps: { flexDirection: 'row', gap: 8, paddingBottom: 40 },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.dark.border },
  stepDotActive: { backgroundColor: Colors.dark.tint },
});
```

- [ ] **Step 2: Commit**
```
git add app/(tabs)/settings/change-pin.tsx
git commit -m "feat: add change PIN screen"
```

---

## Task 6: Create security.tsx

**Files:**
- Create: `app/(tabs)/settings/security.tsx`

- [ ] **Step 1: Create security settings screen**

```tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { Toggle } from '@/components/ui/Toggle';

const AUTO_LOCK_OPTIONS = ['Immediately', '1 min', '5 min', '15 min'];

export default function SecuritySettings() {
  const router = useRouter();
  const [fingerprintEnabled, setFingerprintEnabled] = useState(true);
  const [autoLock, setAutoLock] = useState('Immediately');
  const [showAutoLockPicker, setShowAutoLockPicker] = useState(false);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        {/* Fingerprint */}
        <View style={styles.row}>
          <Text style={styles.icon}>👆</Text>
          <View style={styles.rowContent}>
            <Text style={styles.rowLabel}>Fingerprint Login</Text>
            <Text style={styles.rowHint}>Use fingerprint to unlock app</Text>
          </View>
          <Toggle value={fingerprintEnabled} onValueChange={setFingerprintEnabled} />
        </View>

        {/* Auto-lock Timer */}
        <TouchableOpacity style={styles.row} onPress={() => setShowAutoLockPicker(true)}>
          <Text style={styles.icon}>⏱️</Text>
          <View style={styles.rowContent}>
            <Text style={styles.rowLabel}>Auto-lock Timer</Text>
          </View>
          <View style={styles.rowValue}>
            <Text style={styles.valueText}>{autoLock}</Text>
            <Text style={styles.chevron}>›</Text>
          </View>
        </TouchableOpacity>

        {/* Change PIN */}
        <TouchableOpacity style={styles.row} onPress={() => router.push('/settings/change-pin')}>
          <Text style={styles.icon}>🔒</Text>
          <View style={styles.rowContent}>
            <Text style={styles.rowLabel}>Change PIN</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Auto-lock Picker Modal */}
      <Modal visible={showAutoLockPicker} transparent animationType="fade" onRequestClose={() => setShowAutoLockPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Auto-lock Timer</Text>
            {AUTO_LOCK_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.optionRow, autoLock === option && styles.optionRowSelected]}
                onPress={() => {
                  setAutoLock(option);
                  setShowAutoLockPicker(false);
                }}
              >
                <Text style={[styles.optionText, autoLock === option && styles.optionTextSelected]}>{option}</Text>
                {autoLock === option && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAutoLockPicker(false)}>
              <Text style={styles.cancelBtnText}>Batal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.darkBg },
  content: { flex: 1, paddingTop: 16 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.dark.border },
  icon: { fontSize: 20, marginRight: 12 },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: 15, color: Colors.dark.text },
  rowHint: { fontSize: 12, color: Colors.dark.textSecondary, marginTop: 2 },
  rowValue: { flexDirection: 'row', alignItems: 'center' },
  valueText: { fontSize: 14, color: Colors.dark.textSecondary, marginRight: 4 },
  chevron: { fontSize: 18, color: Colors.dark.textSecondary },
  optionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.dark.border },
  optionRowSelected: { backgroundColor: 'rgba(197, 255, 0, 0.1)' },
  optionText: { flex: 1, fontSize: 16, color: Colors.dark.text },
  optionTextSelected: { color: Colors.dark.tint, fontWeight: '600' },
  checkmark: { color: Colors.dark.tint, fontSize: 18 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', paddingHorizontal: 24 },
  modalCard: { backgroundColor: Colors.dark.cardBg, borderRadius: 20, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.dark.text, marginBottom: 20, textAlign: 'center' },
  cancelBtn: { marginTop: 12, paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { fontSize: 15, color: Colors.dark.textSecondary },
});
```

- [ ] **Step 2: Commit**
```
git add app/(tabs)/settings/security.tsx
git commit -m "feat: add security settings screen"
```

---

## Task 7: Create notifications.tsx

**Files:**
- Create: `app/(tabs)/settings/notifications.tsx`

- [ ] **Step 1: Create notifications settings screen**

```tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { Toggle } from '@/components/ui/Toggle';

interface NotificationRowProps {
  icon: string;
  label: string;
  value: boolean;
  onChange: (val: boolean) => void;
}

function NotificationRow({ icon, label, value, onChange }: NotificationRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.label}>{label}</Text>
      <Toggle value={value} onValueChange={onChange} />
    </View>
  );
}

export default function NotificationsSettings() {
  const [expenseAlerts, setExpenseAlerts] = useState(true);
  const [incomeAlerts, setIncomeAlerts] = useState(true);
  const [transferAlerts, setTransferAlerts] = useState(true);
  const [recurringReminders, setRecurringReminders] = useState(true);
  const [tabungMilestones, setTabungMilestones] = useState(true);
  const [cashflowAlerts, setCashflowAlerts] = useState(true);
  const [affirmationDaily, setAffirmationDaily] = useState(true);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Transactions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transactions</Text>
          <NotificationRow icon="💸" label="Expense alerts" value={expenseAlerts} onChange={setExpenseAlerts} />
          <NotificationRow icon="💰" label="Income alerts" value={incomeAlerts} onChange={setIncomeAlerts} />
          <NotificationRow icon="🔄" label="Transfer alerts" value={transferAlerts} onChange={setTransferAlerts} />
        </View>

        {/* Reminders Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reminders</Text>
          <NotificationRow icon="⏰" label="Recurring payment reminders" value={recurringReminders} onChange={setRecurringReminders} />
          <NotificationRow icon="🎯" label="Tabung milestone reminders" value={tabungMilestones} onChange={setTabungMilestones} />
        </View>

        {/* System Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System</Text>
          <NotificationRow icon="📊" label="Cash flow pattern alerts" value={cashflowAlerts} onChange={setCashflowAlerts} />
          <NotificationRow icon="✨" label="Affirmation daily reminders" value={affirmationDaily} onChange={setAffirmationDaily} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.darkBg },
  content: { paddingTop: 16 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 12, fontWeight: '600', color: Colors.dark.textSecondary, marginBottom: 8, paddingHorizontal: 16, textTransform: 'uppercase' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: Colors.dark.cardBg, borderBottomWidth: 1, borderBottomColor: Colors.dark.border },
  icon: { fontSize: 18, marginRight: 12 },
  label: { flex: 1, fontSize: 15, color: Colors.dark.text },
});
```

- [ ] **Step 2: Commit**
```
git add app/(tabs)/settings/notifications.tsx
git commit -m "feat: add notifications settings screen"
```

---

## Task 8: Create categories.tsx

**Files:**
- Create: `app/(tabs)/settings/categories.tsx`

- [ ] **Step 1: Create categories settings screen**

```tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';

const DEFAULT_EXPENSE = ['Food', 'Transport', 'Bills', 'Entertainment', 'Shopping', 'Health', 'Others'];
const DEFAULT_INCOME = ['Salary', 'Freelance', 'Investment', 'Gift', 'Others'];
const DEFAULT_TRANSFER = ['Bank Transfer', 'Wallet Transfer', 'Tabung Transfer'];

type CategoryType = 'expense' | 'income' | 'transfer';

const CATEGORY_ICONS: Record<string, string> = {
  Food: '🍔', Transport: '🚗', Bills: '📄', Entertainment: '🎬', Shopping: '🛍️', Health: '💊', Others: '📦',
  Salary: '💵', Freelance: '💻', Investment: '📈', Gift: '🎁',
  'Bank Transfer': '🏦', 'Wallet Transfer': '👛', 'Tabung Transfer': '🎯',
};

export default function CategoriesSettings() {
  const [activeTab, setActiveTab] = useState<CategoryType>('expense');
  const [categories, setCategories] = useState({
    expense: DEFAULT_EXPENSE,
    income: DEFAULT_INCOME,
    transfer: DEFAULT_TRANSFER,
  });
  const [newCategory, setNewCategory] = useState('');
  const [showAddInput, setShowAddInput] = useState(false);

  const currentCategories = categories[activeTab];

  const handleAddCategory = () => {
    const name = newCategory.trim();
    if (!name) return;
    setCategories(prev => ({
      ...prev,
      [activeTab]: [...prev[activeTab], name],
    }));
    setNewCategory('');
    setShowAddInput(false);
  };

  const handleDeleteCategory = (index: number) => {
    setCategories(prev => ({
      ...prev,
      [activeTab]: prev[activeTab].filter((_, i) => i !== index),
    }));
  };

  const renderCategory = ({ item, index }: { item: string; index: number }) => (
    <View style={styles.categoryRow}>
      <Text style={styles.categoryIcon}>{CATEGORY_ICONS[item] || '📂'}</Text>
      <Text style={styles.categoryName}>{item}</Text>
      <TouchableOpacity onPress={() => handleDeleteCategory(index)}>
        <Text style={styles.deleteBtn}>×</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {(['expense', 'income', 'transfer'] as CategoryType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Category List */}
      <FlatList
        data={currentCategories}
        keyExtractor={(item) => item}
        renderItem={renderCategory}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={
          showAddInput ? (
            <View style={styles.addInputContainer}>
              <TextInput
                style={styles.addInput}
                placeholder="Category name"
                placeholderTextColor={Colors.dark.textSecondary}
                value={newCategory}
                onChangeText={setNewCategory}
                autoFocus
              />
              <TouchableOpacity style={styles.addBtn} onPress={handleAddCategory}>
                <Text style={styles.addBtnText}>Add</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setShowAddInput(false); setNewCategory(''); }}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.addCategoryBtn} onPress={() => setShowAddInput(true)}>
              <Text style={styles.addCategoryText}>+ Add Category</Text>
            </TouchableOpacity>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.darkBg },
  tabBar: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8, backgroundColor: Colors.dark.cardBg },
  tabActive: { backgroundColor: Colors.dark.tint },
  tabText: { fontSize: 14, fontWeight: '500', color: Colors.dark.textSecondary },
  tabTextActive: { color: '#000', fontWeight: '600' },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.dark.border },
  categoryIcon: { fontSize: 18, marginRight: 12 },
  categoryName: { flex: 1, fontSize: 15, color: Colors.dark.text },
  deleteBtn: { fontSize: 24, color: Colors.dark.destructive, paddingHorizontal: 8 },
  addCategoryBtn: { paddingVertical: 16, alignItems: 'center' },
  addCategoryText: { fontSize: 14, color: Colors.dark.tint, fontWeight: '500' },
  addInputContainer: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 8 },
  addInput: { flex: 1, backgroundColor: Colors.dark.cardBg, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: Colors.dark.text },
  addBtn: { backgroundColor: Colors.dark.tint, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  addBtnText: { fontSize: 14, fontWeight: '600', color: '#000' },
  cancelText: { fontSize: 14, color: Colors.dark.textSecondary, paddingHorizontal: 8 },
});
```

- [ ] **Step 2: Commit**
```
git add app/(tabs)/settings/categories.tsx
git commit -m "feat: add categories settings screen"
```

---

## Task 9: Create recurring.tsx

**Files:**
- Create: `app/(tabs)/settings/recurring.tsx`

- [ ] **Step 1: Create recurring payments settings screen**

```tsx
import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Modal, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { Toggle } from '@/components/ui/Toggle';

interface RecurringItem {
  id: string;
  name: string;
  amount: number;
  frequency: 'Monthly' | 'Weekly' | 'Yearly';
  nextDate: string;
  active: boolean;
}

const MOCK_DATA: RecurringItem[] = [
  { id: '1', name: 'Unifi', amount: 89, frequency: 'Monthly', nextDate: '2026-06-01', active: true },
  { id: '2', name: 'Netflix', amount: 53, frequency: 'Monthly', nextDate: '2026-06-15', active: true },
  { id: '3', name: 'ASB Contribution', amount: 200, frequency: 'Monthly', nextDate: '2026-06-01', active: true },
];

const FREQUENCIES = ['Monthly', 'Weekly', 'Yearly'] as const;

export default function RecurringSettings() {
  const [items, setItems] = useState<RecurringItem[]>(MOCK_DATA);
  const [editingItem, setEditingItem] = useState<RecurringItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editFrequency, setEditFrequency] = useState<'Monthly' | 'Weekly' | 'Yearly'>('Monthly');
  const [editActive, setEditActive] = useState(true);

  const handleEdit = (item: RecurringItem) => {
    setEditingItem(item);
    setEditName(item.name);
    setEditAmount(item.amount.toString());
    setEditFrequency(item.frequency);
    setEditActive(item.active);
  };

  const handleSave = () => {
    if (!editingItem) return;
    setItems(prev => prev.map(item =>
      item.id === editingItem.id
        ? { ...item, name: editName, amount: parseFloat(editAmount) || 0, frequency: editFrequency, active: editActive }
        : item
    ));
    setEditingItem(null);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete recurring payment?', 'This action cannot be undone.', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: () => setItems(prev => prev.filter(item => item.id !== id)) },
    ]);
  };

  const renderItem = ({ item }: { item: RecurringItem }) => (
    <TouchableOpacity style={styles.itemRow} onPress={() => handleEdit(item)}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemDetails}>RM {item.amount.toFixed(2)} • {item.frequency} • Next: {item.nextDate}</Text>
      </View>
      <View style={[styles.statusBadge, item.active ? styles.statusActive : styles.statusPaused]}>
        <Text style={styles.statusText}>{item.active ? 'Active' : 'Paused'}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No recurring payments</Text>
          </View>
        }
      />

      {/* Edit Modal */}
      <Modal visible={!!editingItem} transparent animationType="slide" onRequestClose={() => setEditingItem(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Recurring</Text>

            <Text style={styles.inputLabel}>Name</Text>
            <TextInput style={styles.input} value={editName} onChangeText={setEditName} placeholder="Payment name" placeholderTextColor={Colors.dark.textSecondary} />

            <Text style={styles.inputLabel}>Amount (RM)</Text>
            <TextInput style={styles.input} value={editAmount} onChangeText={setEditAmount} keyboardType="numeric" placeholder="0.00" placeholderTextColor={Colors.dark.textSecondary} />

            <Text style={styles.inputLabel}>Frequency</Text>
            <View style={styles.frequencyRow}>
              {FREQUENCIES.map((freq) => (
                <TouchableOpacity
                  key={freq}
                  style={[styles.freqChip, editFrequency === freq && styles.freqChipActive]}
                  onPress={() => setEditFrequency(freq)}
                >
                  <Text style={[styles.freqChipText, editFrequency === freq && styles.freqChipTextActive]}>{freq}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.activeRow}>
              <Text style={styles.inputLabel}>Active</Text>
              <Toggle value={editActive} onValueChange={setEditActive} />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => { if (editingItem) handleDelete(editingItem.id); setEditingItem(null); }}>
                <Text style={styles.deleteBtnText}>Hapus</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>Simpan</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditingItem(null)}>
              <Text style={styles.cancelBtnText}>Batal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.darkBg },
  listContent: { paddingTop: 16, paddingHorizontal: 16, paddingBottom: 24 },
  itemRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.dark.cardBg, borderRadius: 12, padding: 16, marginBottom: 12 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', color: Colors.dark.text, marginBottom: 4 },
  itemDetails: { fontSize: 12, color: Colors.dark.textSecondary },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusActive: { backgroundColor: 'rgba(197, 255, 0, 0.2)' },
  statusPaused: { backgroundColor: 'rgba(255, 68, 68, 0.2)' },
  statusText: { fontSize: 11, fontWeight: '600', color: Colors.dark.text },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 14, color: Colors.dark.textSecondary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: Colors.dark.cardBg, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.dark.text, marginBottom: 20, textAlign: 'center' },
  inputLabel: { fontSize: 12, fontWeight: '600', color: Colors.dark.textSecondary, marginBottom: 8, textTransform: 'uppercase' },
  input: { backgroundColor: Colors.dark.inputBg, borderRadius: 12, padding: 14, fontSize: 15, color: Colors.dark.text, marginBottom: 16 },
  frequencyRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  freqChip: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8, backgroundColor: Colors.dark.border },
  freqChipActive: { backgroundColor: Colors.dark.tint },
  freqChipText: { fontSize: 13, color: Colors.dark.textSecondary },
  freqChipTextActive: { color: '#000', fontWeight: '600' },
  activeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  modalButtons: { flexDirection: 'row', gap: 12 },
  deleteBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: Colors.dark.destructive },
  deleteBtnText: { fontSize: 15, color: Colors.dark.destructive },
  saveBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 12, backgroundColor: Colors.dark.tint },
  saveBtnText: { fontSize: 15, fontWeight: '600', color: '#000' },
  cancelBtn: { marginTop: 12, paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { fontSize: 15, color: Colors.dark.textSecondary },
});
```

- [ ] **Step 2: Commit**
```
git add app/(tabs)/settings/recurring.tsx
git commit -m "feat: add recurring payments settings screen"
```

---

## Task 10: Create affirmations.tsx

**Files:**
- Create: `app/(tabs)/settings/affirmations.tsx`

- [ ] **Step 1: Create affirmations settings screen**

```tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { Toggle } from '@/components/ui/Toggle';

const CATEGORIES = ['All', 'Saving', 'Investing', 'Mindset', 'Awareness'];
const TIME_OPTIONS = ['7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM'];

export default function AffirmationsSettings() {
  const [showOnHome, setShowOnHome] = useState(true);
  const [dailyReminder, setDailyReminder] = useState(true);
  const [reminderTime, setReminderTime] = useState('9:00 AM');
  const [category, setCategory] = useState('All');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        {/* Show on Home */}
        <View style={styles.row}>
          <Text style={styles.icon}>🏠</Text>
          <View style={styles.rowContent}>
            <Text style={styles.rowLabel}>Show on Home</Text>
          </View>
          <Toggle value={showOnHome} onValueChange={setShowOnHome} />
        </View>

        {/* Daily Reminder */}
        <View style={styles.row}>
          <Text style={styles.icon}>⏰</Text>
          <View style={styles.rowContent}>
            <Text style={styles.rowLabel}>Daily Reminder</Text>
          </View>
          <Toggle value={dailyReminder} onValueChange={setDailyReminder} />
        </View>

        {/* Reminder Time */}
        {dailyReminder && (
          <TouchableOpacity style={styles.row} onPress={() => setShowTimePicker(true)}>
            <Text style={styles.icon}>🕐</Text>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Reminder Time</Text>
            </View>
            <View style={styles.rowValue}>
              <Text style={styles.valueText}>{reminderTime}</Text>
              <Text style={styles.chevron}>›</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Category Preference */}
        <TouchableOpacity style={styles.row} onPress={() => setShowCategoryPicker(true)}>
          <Text style={styles.icon}>📂</Text>
          <View style={styles.rowContent}>
            <Text style={styles.rowLabel}>Category Preference</Text>
          </View>
          <View style={styles.rowValue}>
            <Text style={styles.valueText}>{category}</Text>
            <Text style={styles.chevron}>›</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Time Picker Modal */}
      <Modal visible={showTimePicker} transparent animationType="fade" onRequestClose={() => setShowTimePicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Reminder Time</Text>
            {TIME_OPTIONS.map((time) => (
              <TouchableOpacity
                key={time}
                style={[styles.optionRow, reminderTime === time && styles.optionRowSelected]}
                onPress={() => { setReminderTime(time); setShowTimePicker(false); }}
              >
                <Text style={[styles.optionText, reminderTime === time && styles.optionTextSelected]}>{time}</Text>
                {reminderTime === time && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowTimePicker(false)}>
              <Text style={styles.cancelBtnText}>Batal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Category Picker Modal */}
      <Modal visible={showCategoryPicker} transparent animationType="fade" onRequestClose={() => setShowCategoryPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Category</Text>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.optionRow, category === cat && styles.optionRowSelected]}
                onPress={() => { setCategory(cat); setShowCategoryPicker(false); }}
              >
                <Text style={[styles.optionText, category === cat && styles.optionTextSelected]}>{cat}</Text>
                {category === cat && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCategoryPicker(false)}>
              <Text style={styles.cancelBtnText}>Batal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.darkBg },
  content: { flex: 1, paddingTop: 16 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.dark.border },
  icon: { fontSize: 20, marginRight: 12 },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: 15, color: Colors.dark.text },
  rowValue: { flexDirection: 'row', alignItems: 'center' },
  valueText: { fontSize: 14, color: Colors.dark.textSecondary, marginRight: 4 },
  chevron: { fontSize: 18, color: Colors.dark.textSecondary },
  optionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.dark.border },
  optionRowSelected: { backgroundColor: 'rgba(197, 255, 0, 0.1)' },
  optionText: { flex: 1, fontSize: 16, color: Colors.dark.text },
  optionTextSelected: { color: Colors.dark.tint, fontWeight: '600' },
  checkmark: { color: Colors.dark.tint, fontSize: 18 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', paddingHorizontal: 24 },
  modalCard: { backgroundColor: Colors.dark.cardBg, borderRadius: 20, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.dark.text, marginBottom: 20, textAlign: 'center' },
  cancelBtn: { marginTop: 12, paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { fontSize: 15, color: Colors.dark.textSecondary },
});
```

- [ ] **Step 2: Commit**
```
git add app/(tabs)/settings/affirmations.tsx
git commit -m "feat: add affirmations settings screen"
```

---

## Task 11: Create data.tsx

**Files:**
- Create: `app/(tabs)/settings/data.tsx`

- [ ] **Step 1: Create data management settings screen**

```tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function DataSettings() {
  const router = useRouter();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleExport = () => {
    // Mock export - create downloadable JSON
    const data = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      accounts: [],
      transactions: [],
      tabungs: [],
      settings: {},
    };
    Alert.alert('Export Data', `Data exported successfully!\n\n${JSON.stringify(data, null, 2).slice(0, 100)}...`);
  };

  const handleReset = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = () => {
    // Mock reset - clear storage and navigate to home
    Alert.alert('App Reset', 'All data has been cleared.', [
      { text: 'OK', onPress: () => router.replace('/') },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        {/* Export Data */}
        <TouchableOpacity style={styles.row} onPress={handleExport}>
          <Text style={styles.icon}>📥</Text>
          <View style={styles.rowContent}>
            <Text style={styles.rowLabel}>Export Data</Text>
            <Text style={styles.rowHint}>Download your data as JSON</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        {/* Reset App */}
        <TouchableOpacity style={[styles.row, styles.dangerRow]} onPress={handleReset}>
          <Text style={styles.icon}>⚠️</Text>
          <View style={styles.rowContent}>
            <Text style={styles.dangerText}>Reset App</Text>
            <Text style={styles.dangerHint}>Delete all data and start fresh</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Reset Confirm Modal */}
      <Modal visible={showResetConfirm} transparent animationType="fade" onRequestClose={() => setShowResetConfirm(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Reset App?</Text>
            <Text style={styles.modalSubtitle}>This will delete all your data including accounts, transactions, tabungs, and settings. This action cannot be undone.</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowResetConfirm(false)}>
                <Text style={styles.cancelBtnText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.resetBtn} onPress={confirmReset}>
                <Text style={styles.resetBtnText}>Reset</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.darkBg },
  content: { flex: 1, paddingTop: 16 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.dark.border, backgroundColor: Colors.dark.cardBg },
  icon: { fontSize: 20, marginRight: 12 },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: 15, color: Colors.dark.text },
  rowHint: { fontSize: 12, color: Colors.dark.textSecondary, marginTop: 2 },
  chevron: { fontSize: 18, color: Colors.dark.textSecondary },
  dangerRow: { borderBottomWidth: 0 },
  dangerText: { fontSize: 15, color: Colors.dark.destructive },
  dangerHint: { fontSize: 12, color: Colors.dark.destructive, opacity: 0.7, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', paddingHorizontal: 24 },
  modalCard: { backgroundColor: Colors.dark.cardBg, borderRadius: 20, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.dark.text, marginBottom: 12, textAlign: 'center' },
  modalSubtitle: { fontSize: 14, color: Colors.dark.textSecondary, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  modalButtons: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: Colors.dark.border },
  cancelBtnText: { fontSize: 15, color: Colors.dark.textSecondary },
  resetBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 12, backgroundColor: Colors.dark.destructive },
  resetBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});
```

- [ ] **Step 2: Commit**
```
git add app/(tabs)/settings/data.tsx
git commit -m "feat: add data management settings screen"
```

---

## Task 12: Update Main Settings Navigation

**Files:**
- Modify: `app/(tabs)/settings.tsx` (main settings page)
- Modify: `app/(tabs)/settings/_layout.tsx` (add child routes)

- [ ] **Step 1: Update the settings stack layout to include all sub-screens**

```tsx
// Update _layout.tsx to include all screen names
import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function SettingsStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: Colors.dark.cardBg,
        },
        headerTintColor: Colors.dark.text,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 16,
        },
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: Colors.dark.darkBg,
        },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="account" options={{ title: 'Account Settings' }} />
      <Stack.Screen name="change-pin" options={{ title: 'Change PIN' }} />
      <Stack.Screen name="security" options={{ title: 'Security' }} />
      <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
      <Stack.Screen name="categories" options={{ title: 'Categories' }} />
      <Stack.Screen name="recurring" options={{ title: 'Recurring Payments' }} />
      <Stack.Screen name="affirmations" options={{ title: 'Affirmations' }} />
      <Stack.Screen name="data" options={{ title: 'Data' }} />
    </Stack>
  );
}
```

- [ ] **Step 2: Update main settings.tsx to navigate to stack routes**

Update all `router.push('/settings/account')` etc. to use the stack route names (they should work as-is since stack is nested).

- [ ] **Step 3: Add a screenOptions.headerLeft for back button on sub-screens**

The stack handles this automatically via expo-router. No additional code needed.

- [ ] **Step 4: Commit**
```
git add app/(tabs)/settings/_layout.tsx app/(tabs)/settings.tsx
git commit -m "feat: wire up settings stack navigation"
```

---

## Task 13: Verify Implementation

- [ ] **Step 1: Check all files exist**
- [ ] **Step 2: Verify navigation works** (navigate from main settings to each sub-screen)
- [ ] **Step 3: Check mock data displays correctly**
- [ ] **Step 4: Verify dark theme consistency**

---

## Summary

| Task | Screen | File |
|---|---|---|
| 1 | Settings Stack Layout | `app/(tabs)/settings/_layout.tsx` |
| 2 | PinPad Component | `src/components/ui/PinPad.tsx` |
| 3 | Toggle Component | `src/components/ui/Toggle.tsx` |
| 4 | Account Settings | `app/(tabs)/settings/account.tsx` |
| 5 | Change PIN | `app/(tabs)/settings/change-pin.tsx` |
| 6 | Security Settings | `app/(tabs)/settings/security.tsx` |
| 7 | Notifications | `app/(tabs)/settings/notifications.tsx` |
| 8 | Categories | `app/(tabs)/settings/categories.tsx` |
| 9 | Recurring Payments | `app/(tabs)/settings/recurring.tsx` |
| 10 | Affirmations | `app/(tabs)/settings/affirmations.tsx` |
| 11 | Data Management | `app/(tabs)/settings/data.tsx` |
| 12 | Update Navigation | `_layout.tsx` + main `settings.tsx` |
| 13 | Verification | Manual check |

---

**Plan complete.** Saved to `docs/superpowers/plans/2026-05-23-settings-subpages-plan.md`.

**Two execution options:**

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**