# Affirmations Words Feature Design

## Overview

Add ability for user to create custom affirmation words/phrases that display on the Home screen, organized by category.

## Layout

```
[Affirmations Screen]
├── Show on Home (Toggle)
├── Daily Reminder (Time input)
├── Category Preference (Chips)
└── Affirmation Words
    ├── [Input field__________] [+]  ← same row
    └── [Word] [Category] [X]        ← chips below
```

## User Flow

1. User types an affirmation word/phrase in the input field
2. User optionally changes category (defaults to current categoryPreference)
3. User taps + button → word added to list below
4. Each word shows as a chip with category tag + X to delete

## Data Model

```typescript
// SettingsState['affirmations']
{
  showOnHome: boolean;
  dailyReminder: string;
  categoryPreference: 'All' | 'Saving' | 'Investing' | 'Mindset' | 'Awareness';
  words: Array<{
    id: string;
    text: string;
    category: 'Saving' | 'Investing' | 'Mindset' | 'Awareness';
  }>;
}
```

## Components

### Add Row
- TextInput: "Add affirmation..." placeholder, flex-1
- Plus icon button: right side of input, same row
- Uses existing Toggle component style for button

### Word Chip
- Card style with border
- Shows word text + small category badge + X icon
- Tap X removes word from list

## Categories

Same existing categories: Saving, Investing, Mindset, Awareness (All not used for words)