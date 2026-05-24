# Data Settings Screen — Implementation Plan

**Goal:** Redesign `app/(main)/settings/data.tsx` with storage summary, export with format/date options, and typed-reset confirmation modal.

**Architecture:** Single standalone screen with local state (useState). No backend. Export button is UI-only. Reset dispatches to SettingsContext and navigates home.

**Tech Stack:** React Native, NativeWind, Expo Router, lucide-react-native

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Modify | `app/(main)/settings/data.tsx` | Full screen rewrite |

**No new files. No existing files to modify beyond data.tsx.**

---

## Task 1: State & Imports

- [ ] **Step 1: Rewrite imports**

```typescript
import { useState } from 'react';
import { View, Text, Pressable, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Download, AlertTriangle, Database, FileText, Check, X } from 'lucide-react-native';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { useSettings } from '@/context/SettingsContext';
```

- [ ] **Step 2: Add type aliases and constants**

```typescript
type ExportFormat = 'csv' | 'pdf';
type DateRange = '1m' | '3m' | '1y' | 'all';

const DATE_RANGE_LABELS: Record<DateRange, string> = {
  '1m': 'This Month',
  '3m': 'Last 3 Months',
  '1y': 'Last Year',
  'all': 'All Time',
};
```

- [ ] **Step 3: Add state declarations in component**

```typescript
const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
const [dateRange, setDateRange] = useState<DateRange>('1m');
const [exporting, setExporting] = useState(false);
const [exported, setExported] = useState(false);
const [showResetConfirm, setShowResetConfirm] = useState(false);
const [resetInput, setResetInput] = useState('');
```

- [ ] **Step 4: Commit**

```bash
git add app/(main)/settings/data.tsx
git commit -m "feat(data): add state, types and imports for redesigned screen"
```

---

## Task 2: Storage Summary Section

- [ ] **Step 1: Add Storage Summary JSX after ScreenHeader**

```tsx
{/* Storage Summary */}
<View className="bg-card border border-border rounded-2xl p-4 mb-6">
  <View className="flex-row items-center gap-3 mb-3">
    <Database size={20} color="#C5FF00" />
    <Text className="font-semibold text-foreground">Storage Summary</Text>
  </View>
  <View className="grid grid-cols-3 gap-3">
    <View className="bg-muted rounded-xl py-3 text-center">
      <Text className="text-lg font-bold text-primary">248</Text>
      <Text className="text-xs text-muted-foreground">Transactions</Text>
    </View>
    <View className="bg-muted rounded-xl py-3 text-center">
      <Text className="text-lg font-bold text-primary">12</Text>
      <Text className="text-xs text-muted-foreground">Categories</Text>
    </View>
    <View className="bg-muted rounded-xl py-3 text-center">
      <Text className="text-lg font-bold text-primary">5</Text>
      <Text className="text-xs text-muted-foreground">Recurring</Text>
    </View>
  </View>
</View>
```

- [ ] **Step 2: Commit**

```bash
git add app/(main)/settings/data.tsx
git commit -m "feat(data): add storage summary section"
```

---

## Task 3: Export Data Section

- [ ] **Step 1: Add Export Data section JSX after Storage Summary**

```tsx
{/* Export Data */}
<View className="mb-6">
  <Text className="text-sm font-medium text-muted-foreground mb-3 px-2">Export Data</Text>
  <View className="bg-card border border-border rounded-2xl p-4">
    {/* Format */}
    <View className="mb-4">
      <Text className="text-sm font-medium mb-2">Format</Text>
      <View className="flex flex-row gap-2">
        {(['csv', 'pdf'] as ExportFormat[]).map((fmt) => (
          <Pressable
            key={fmt}
            onPress={() => setExportFormat(fmt)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border font-semibold text-sm ${
              exportFormat === fmt
                ? 'bg-primary text-black border-primary'
                : 'bg-muted border-border text-muted-foreground'
            }`}
          >
            <FileText size={16} />
            <Text>{fmt.toUpperCase()}</Text>
          </Pressable>
        ))}
      </View>
    </View>

    {/* Date Range */}
    <View className="mb-5">
      <Text className="text-sm font-medium mb-2">Date Range</Text>
      <View className="grid grid-cols-2 gap-2">
        {(Object.keys(DATE_RANGE_LABELS) as DateRange[]).map((range) => (
          <Pressable
            key={range}
            onPress={() => setDateRange(range)}
            className={`py-2.5 px-3 rounded-xl text-sm border ${
              dateRange === range
                ? 'bg-primary/20 border-primary text-primary'
                : 'bg-muted border-border text-muted-foreground'
            }`}
          >
            <Text>{DATE_RANGE_LABELS[range]}</Text>
          </Pressable>
        ))}
      </View>
    </View>

    {/* Export Button */}
    <Pressable
      onPress={handleExport}
      disabled={exporting}
      className="w-full py-3.5 bg-primary text-black rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-70"
    >
      {exported ? (
        <View className="flex-row items-center gap-2">
          <Check size={20} color="#000" />
          <Text className="text-black font-semibold">Exported!</Text>
        </View>
      ) : exporting ? (
        <View className="flex-row items-center gap-2">
          <View className="w-5 h-5 border-2 border-black/40 border-t-black rounded-full animate-spin" />
          <Text className="text-black font-semibold">Exporting...</Text>
        </View>
      ) : (
        <View className="flex-row items-center gap-2">
          <Download size={20} color="#000" />
          <Text className="text-black font-semibold">Export {exportFormat.toUpperCase()}</Text>
        </View>
      )}
    </Pressable>
  </View>
</View>
```

- [ ] **Step 2: Commit**

```bash
git add app/(main)/settings/data.tsx
git commit -m "feat(data): add export data section with format and date range selectors"
```

---

## Task 4: Danger Zone Section

- [ ] **Step 1: Add Danger Zone JSX after Export Data**

```tsx
{/* Danger Zone */}
<View className="mb-6">
  <Text className="text-sm font-medium text-red-400 mb-3 px-2">Danger Zone</Text>
  <View className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
    <View className="flex-row items-start gap-3 mb-4">
      <AlertTriangle size={20} color="#ff4444" className="flex-shrink-0 mt-0.5" />
      <View className="flex-1">
        <Text className="font-semibold text-red-400">Reset App</Text>
        <Text className="text-xs text-muted-foreground mt-1">
          This will permanently delete all your transactions, categories, settings and data. This action cannot be undone.
        </Text>
      </View>
    </View>
    <Pressable
      onPress={() => setShowResetConfirm(true)}
      className="w-full py-3 bg-red-500/20 text-red-400 border border-red-500/40 rounded-xl font-semibold text-sm"
    >
      <Text className="text-red-400 font-semibold text-sm text-center">Reset All Data</Text>
    </Pressable>
  </View>
</View>
```

- [ ] **Step 2: Commit**

```bash
git add app/(main)/settings/data.tsx
git commit -m "feat(data): add danger zone section with reset button"
```

---

## Task 5: Reset Confirmation Modal

- [ ] **Step 1: Add modal JSX after Danger Zone (inside ScrollView, before closing SafeAreaView)**

```tsx
{/* Reset Confirmation Modal */}
{showResetConfirm && (
  <View className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6">
    <View className="bg-background border border-border rounded-3xl p-6 w-full max-w-sm">
      {/* Icon */}
      <View className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertTriangle size={32} color="#ff4444" />
      </View>

      {/* Title & Description */}
      <View className="text-center mb-4">
        <Text className="text-lg font-bold text-foreground mb-2">Reset App?</Text>
        <Text className="text-sm text-muted-foreground">
          All data will be permanently deleted. Type <Text className="text-red-400 font-mono font-bold">reset</Text> to confirm.
        </Text>
      </View>

      {/* Input */}
      <TextInput
        value={resetInput}
        onChangeText={setResetInput}
        placeholder='Type "reset" to confirm'
        placeholderTextColor="#a0a0a0"
        className="w-full bg-card border border-border rounded-xl px-4 py-3 text-center text-foreground font-mono mb-4 focus:border-red-500"
        autoCapitalize="none"
        autoCorrect={false}
      />

      {/* Buttons */}
      <View className="flex flex-row gap-3">
        <Pressable
          onPress={() => { setShowResetConfirm(false); setResetInput(''); }}
          className="flex-1 py-3 bg-card border border-border rounded-xl"
        >
          <Text className="text-foreground font-semibold text-sm text-center">Cancel</Text>
        </Pressable>
        <Pressable
          onPress={handleReset}
          disabled={resetInput.toLowerCase() !== 'reset'}
          className="flex-1 py-3 bg-red-500 rounded-xl disabled:opacity-40"
        >
          <Text className="text-white font-semibold text-sm text-center">Reset</Text>
        </Pressable>
      </View>
    </View>
  </View>
)}
```

- [ ] **Step 2: Commit**

```bash
git add app/(main)/settings/data.tsx
git commit -m "feat(data): add reset confirmation modal with typed confirmation"
```

---

## Task 6: Verify Complete File

- [ ] **Step 1: Read the final file and verify it matches spec**

```bash
cat app/(main)/settings/data.tsx
```

Check all sections are present: Storage Summary, Export Data, Danger Zone, Reset Modal.

- [ ] **Step 2: Run lint check**

```bash
npm run lint
```

Expected: no errors

- [ ] **Step 3: Final commit**

```bash
git add app/(main)/settings/data.tsx
git commit -m "feat(data): complete redesigned data settings screen"
```

---

## Self-Review Checklist

- [ ] Storage Summary: 3-column grid, primary numbers, muted labels
- [ ] Export format selector: CSV/PDF pills with active state
- [ ] Date range selector: 2×2 grid with This Month/Last 3 Months/Last Year/All Time
- [ ] Export button: 3 states (default/loading/success), exports correct format
- [ ] Danger Zone: red tint, warning text, reset button
- [ ] Modal: centered, backdrop, typed confirmation, disable until "reset"
- [ ] `handleExport` — 1.5s simulated delay, 3s success display
- [ ] `handleReset` — only fires when input matches "reset" (case-insensitive)
- [ ] Reset: dispatches `RESET_ALL`, navigates to `/`
- [ ] No placeholders or TODOs in code