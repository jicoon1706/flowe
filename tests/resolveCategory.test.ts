/**
 * Tests for resolveCategory (src/utils/resolveCategory.ts).
 *
 * This helper backs the transaction tags shown on the calendar and the home
 * "Recent transactions" list. It must map a transaction onto the same icon +
 * label add-transaction.tsx uses: built-in categories are keyed by slug id,
 * user-defined custom categories are keyed by their readable name, transfers
 * are special-cased, and anything unknown falls back to a generic box.
 */

import { resolveCategory } from '@/src/utils/resolveCategory';
import type { Transaction, CustomCategory } from '@/src/types/database.types';

// --- Helpers ----------------------------------------------------------------

/** Build a Transaction with just the fields resolveCategory reads. */
function tx(overrides: Partial<Transaction>): Transaction {
  return {
    id: 't1',
    user_id: 'u1',
    type: 'expense',
    name: 'Test',
    amount: 10,
    date: '2026-06-18',
    is_recurring: false,
    created_at: '2026-06-18',
    updated_at: '2026-06-18',
    ...overrides,
  };
}

/** Build a CustomCategory keyed-by-name lookup from a list. */
function byName(...cats: CustomCategory[]): Record<string, CustomCategory> {
  return Object.fromEntries(cats.map((c) => [c.name, c]));
}

function customCat(overrides: Partial<CustomCategory>): CustomCategory {
  return {
    id: 'c1',
    user_id: 'u1',
    transaction_type: 'expense',
    name: 'Pets',
    icon: '🐶',
    color: '#fff',
    is_active: true,
    created_at: '2026-06-18',
    ...overrides,
  };
}

// --- Tests ------------------------------------------------------------------

describe('resolveCategory()', () => {
  it('returns the transfer icon/label for transfers, ignoring category', () => {
    // Transfers carry no real category; the type alone decides the tag.
    expect(resolveCategory(tx({ type: 'transfer', category: 'food' }), {})).toEqual({
      emoji: '🔄',
      name: 'Transfer',
    });
  });

  it('resolves a built-in expense category by its slug id', () => {
    expect(resolveCategory(tx({ type: 'expense', category: 'food' }), {})).toEqual({
      emoji: '🍔',
      name: 'Food & Drink',
    });
  });

  it('resolves a built-in income category by its slug id', () => {
    expect(resolveCategory(tx({ type: 'income', category: 'salary' }), {})).toEqual({
      emoji: '💼',
      name: 'Salary',
    });
  });

  it('resolves a custom category by its readable name, using its own icon', () => {
    const customByName = byName(customCat({ name: 'Pets', icon: '🐶' }));
    expect(resolveCategory(tx({ category: 'Pets' }), customByName)).toEqual({
      emoji: '🐶',
      name: 'Pets',
    });
  });

  it('falls back to a tag icon for a custom category with no icon set', () => {
    const customByName = byName(customCat({ name: 'Pets', icon: undefined }));
    expect(resolveCategory(tx({ category: 'Pets' }), customByName)).toEqual({
      emoji: '🏷️',
      name: 'Pets',
    });
  });

  it('prefers the built-in slug over a custom category of the same key', () => {
    // A slug match wins before the name lookup is consulted.
    const customByName = byName(customCat({ name: 'food', icon: '🐶' }));
    expect(resolveCategory(tx({ category: 'food' }), customByName)).toEqual({
      emoji: '🍔',
      name: 'Food & Drink',
    });
  });

  it('falls back to the generic box, keeping the raw category name, when unknown', () => {
    expect(resolveCategory(tx({ category: 'Mystery' }), {})).toEqual({
      emoji: '📦',
      name: 'Mystery',
    });
  });

  it('falls back to "Other" when the transaction has no category at all', () => {
    expect(resolveCategory(tx({ category: undefined }), {})).toEqual({
      emoji: '📦',
      name: 'Other',
    });
  });

  it('falls back to the generic box for an empty-string category with no matching custom category', () => {
    // `??` only fills in null/undefined, so an empty string is kept as-is for
    // the name (only a missing category becomes "Other").
    const customByName = byName(customCat({ name: 'Pets', icon: '🐶' }));
    expect(resolveCategory(tx({ category: '' }), customByName)).toEqual({
      emoji: '📦',
      name: '',
    });
  });
});
