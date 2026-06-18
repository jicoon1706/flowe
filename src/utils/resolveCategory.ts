import { expenseCategories, incomeCategories } from '../../constants/categories';
import type { Transaction, CustomCategory } from '../types/database.types';

// Built-in categories keyed by their slug id, mapping to the icon + display
// label add-transaction.tsx uses, so tags shown elsewhere match exactly.
const CATEGORY_META: Record<string, { emoji: string; name: string }> = Object.fromEntries(
  [...expenseCategories, ...incomeCategories].map((c) => [c.id, { emoji: c.emoji, name: c.name }])
);

/**
 * Resolve a transaction's icon + display label from the same category source
 * add-transaction.tsx uses. Transfers have no category, so they use the type
 * emoji/label used elsewhere for transfers.
 *
 * @param tx           the transaction whose category to resolve
 * @param customByName custom categories keyed by their readable `name` column
 */
export function resolveCategory(
  tx: Transaction,
  customByName: Record<string, CustomCategory>
): { emoji: string; name: string } {
  if (tx.type === 'transfer') return { emoji: '🔄', name: 'Transfer' };
  // Built-in categories are keyed by slug. Custom categories store their
  // readable name in the column, so look them up by name to use the icon the
  // user set on them.
  const builtin = CATEGORY_META[tx.category ?? ''];
  if (builtin) return builtin;
  const custom = customByName[tx.category ?? ''];
  if (custom) return { emoji: custom.icon ?? '🏷️', name: custom.name };
  return { emoji: '📦', name: tx.category ?? 'Other' };
}
