# Affirmations Words Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to add affirmation words with categories, displayed as chips with delete functionality.

**Architecture:** Extend SettingsContext affirmations state to include a `words` array. Add UI in affirmations.tsx with text input + add button row, and chips display below.

**Tech Stack:** React Native, expo-router, NativeWind, lucide-react-native

---

## Task 1: Update SettingsContext to add words array

**Files:**
- Modify: `context/SettingsContext.tsx`

- [ ] **Step 1: Add word type and update state**

In `context/SettingsContext.tsx`, add the word type and update the affirmations state:

```typescript
export interface AffirmationWord {
  id: string;
  text: string;
  category: 'Saving' | 'Investing' | 'Mindset' | 'Awareness';
}

export interface SettingsState {
  // ... existing fields ...
  affirmations: {
    showOnHome: boolean;
    dailyReminder: string;
    categoryPreference: 'All' | 'Saving' | 'Investing' | 'Mindset' | 'Awareness';
    words: AffirmationWord[];  // NEW
  };
  // ... existing fields ...
}
```

- [ ] **Step 2: Update initial state**

```typescript
const INITIAL_STATE: SettingsState = {
  // ... existing state ...
  affirmations: { showOnHome: true, dailyReminder: '08:00', categoryPreference: 'All', words: [] },
  // ... existing state ...
};
```

- [ ] **Step 3: Add action type and reducer case**

Add to SettingsAction:
```typescript
| { type: 'ADD_AFFIRMATION_WORD'; payload: AffirmationWord }
| { type: 'REMOVE_AFFIRMATION_WORD'; payload: string }  // id
```

In reducer, add cases:
```typescript
case 'ADD_AFFIRMATION_WORD':
  return { ...state, affirmations: { ...state.affirmations, words: [...state.affirmations.words, action.payload] } };
case 'REMOVE_AFFIRMATION_WORD':
  return { ...state, affirmations: { ...state.affirmations, words: state.affirmations.words.filter(w => w.id !== action.payload) } };
```

- [ ] **Step 4: Commit**

```bash
git add context/SettingsContext.tsx
git commit -m "feat(settings): add affirmation words to state"
```

---

## Task 2: Update AffirmationsScreen UI

**Files:**
- Modify: `app/(main)/settings/affirmations.tsx`

- [ ] **Step 1: Add state for input text and selected category**

```typescript
const [inputText, setInputText] = useState('');
const [selectedCategory, setSelectedCategory] = useState<typeof CATEGORIES[number]>(state.affirmations.categoryPreference);
```

- [ ] **Step 2: Add handler functions**

```typescript
const addWord = () => {
  if (inputText.trim()) {
    dispatch({
      type: 'ADD_AFFIRMATION_WORD',
      payload: { id: Date.now().toString(), text: inputText.trim(), category: selectedCategory as 'Saving' | 'Investing' | 'Mindset' | 'Awareness' }
    });
    setInputText('');
  }
};

const removeWord = (id: string) => {
  dispatch({ type: 'REMOVE_AFFIRMATION_WORD', payload: id });
};
```

- [ ] **Step 3: Add input row and words list below Category Preference**

After the Category Preference section (before closing `</View>`), add:

```tsx
<View className="border-t border-border my-1" />

{/* Add Affirmation Input */}
<View className="py-3">
  <Text className="text-foreground text-base mb-3">Affirmation Words</Text>
  <View className="flex-row items-center gap-2">
    <View className="flex-1 bg-input-background border border-border rounded-xl px-4 py-2">
      <TextInput
        value={inputText}
        onChangeText={setInputText}
        className="text-foreground text-sm outline-none"
        placeholder="Add affirmation..."
        placeholderTextColor="#a0a0a0"
      />
    </View>
    <TouchableOpacity onPress={addWord} className="bg-primary rounded-xl p-3">
      <Plus size={20} color="#000" />
    </TouchableOpacity>
  </View>
</View>

<View className="border-t border-border my-1" />

{/* Words List */}
<View className="py-3">
  <Text className="text-foreground text-base mb-3">Your Affirmations</Text>
  <View className="flex-row flex-wrap gap-2">
    {state.affirmations.words.map(word => (
      <View key={word.id} className="bg-card border border-border rounded-xl px-3 py-2 flex-row items-center gap-2">
        <Text className="text-foreground text-sm">{word.text}</Text>
        <View className="bg-primary/20 rounded-lg px-2 py-0.5">
          <Text className="text-primary text-xs">{word.category}</Text>
        </View>
        <TouchableOpacity onPress={() => removeWord(word.id)} className="ml-1">
          <X size={14} color="#a0a0a0" />
        </TouchableOpacity>
      </View>
    ))}
  </View>
</View>
```

- [ ] **Step 4: Add imports**

Add `useState` to React imports, add `Plus`, `X` to lucide-react-native imports, add `TouchableOpacity` to React Native imports.

- [ ] **Step 5: Commit**

```bash
git add app/(main)/settings/affirmations.tsx
git commit -m "feat(affirmations): add affirmation words input and list"
```

---

## Verification

Run the app and navigate to Settings > Affirmations to verify:
1. Input field and + button are on the same row
2. Typing and clicking + adds a word chip
3. Word chip shows text + category + X
4. Clicking X removes the word