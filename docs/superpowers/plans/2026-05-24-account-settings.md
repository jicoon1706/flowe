# Account Settings Screen - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Account Settings screen (`app/(main)/settings/account.tsx`) matching the design prototype — with Avatar picker, Display Name input, Financial Identity selector, and Save button.

**Architecture:** Single screen component using React Context for state, NativeWind for styling, @expo/vector-icons for icons. Follows existing patterns in the codebase.

**Tech Stack:** Expo, React Native, NativeWind, @expo/vector-icons (MaterialCommunityIcons for avatar icon), react-native-safe-area-context

---

## File Structure

**Files:**
- Modify: `app/(main)/settings/account.tsx` — Account Settings screen (already exists, needs enhancement)
- Modify: `context/SettingsContext.tsx` — Add Financial Identity state and UPDATE_PROFILE handling if needed

---

## Task 1: Enhance Account Settings Screen

**Files:**
- Modify: `app/(main)/settings/account.tsx`

### Step 1: Read existing implementation

```bash
Read: app/(main)/settings/account.tsx
```

### Step 2: Identify missing Financial Identity field

The User Journey specifies: "Avatar + Display Name + Financial Identity + Save"

Current implementation has: Avatar + Display Name + Save
**Missing:** Financial Identity picker (e.g., "Employee", "Entrepreneur", "Investor", "Business Owner")

### Step 3: Implement Financial Identity selector

Add below Display Name field a row of selectable chips (similar to category chips in Add Transaction):

```tsx
{/* Financial Identity */}
<Text className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1.5">
  Financial Identity
</Text>
<ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2 mb-4">
  {['Employee', 'Entrepreneur', 'Investor', 'Business Owner'].map((identity) => (
    <Pressable
      key={identity}
      onPress={() => setFinancialIdentity(identity)}
      className={financialIdentity === identity
        ? 'bg-primary/10 border border-primary rounded-full px-4 py-2'
        : 'bg-card border border-border rounded-full px-4 py-2'}
    >
      <Text className={financialIdentity === identity ? 'text-primary text-sm' : 'text-muted-foreground text-sm'}>
        {identity}
      </Text>
    </Pressable>
  ))}
</ScrollView>
```

### Step 4: Add state for Financial Identity

```tsx
const [name, setName] = useState(state.profile.displayName);
const [financialIdentity, setFinancialIdentity] = useState(state.profile.financialIdentity || 'Employee');
```

### Step 5: Update handleSave to persist Financial Identity

```tsx
const handleSave = () => {
  dispatch({ type: 'UPDATE_PROFILE', payload: { displayName: name, financialIdentity } });
  router.back();
};
```

### Step 6: Add Financial Identity to SettingsContext UPDATE_PROFILE

```bash
Read: context/SettingsContext.tsx
```

Find the `UPDATE_PROFILE` case in the reducer and ensure it handles `financialIdentity`.

### Step 7: Update ScreenHeader to show correct title

Current title is "Account" — this is correct per the design.

---

## Task 2: Verify Implementation

**Files:**
- Verify: `app/(main)/settings/account.tsx` — renders correctly with all fields

### Step 1: Run lint check

```bash
npm run lint -- app/(main)/settings/account.tsx
```

### Step 2: Verify in simulator (if available)

```bash
npx expo start --android
```

---

## Checklist

- [ ] Task 1 complete — Account Settings screen has all 4 sections (Avatar, Display Name, Financial Identity, Save)
- [ ] Task 2 complete — lint passes
- [ ] No placeholder content remaining