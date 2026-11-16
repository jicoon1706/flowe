import { expenseCategories, incomeCategories } from '../../constants/categories';
import type { CustomCategory, Transaction } from '../types/database.types';
import { directionOf, type MoneyDirection } from '../lib/money';

const BUILTIN_LABEL: Record<string, string> = Object.fromEntries(
  [...expenseCategories, ...incomeCategories].map((c) => [c.id, c.name]),
);

/** Joined account names, when the query selected them. */
export type TxWithAccounts = Transaction & {
  from_account?: { id: string; name: string; type: string } | null;
  to_account?: { id: string; name: string; type: string } | null;
};

export interface TxDisplay {
  label: string;
  /** Built-in slug or custom icon key, for `categoryIcon`. */
  iconKey: string | null;
  kind?: 'transfer';
  direction: MoneyDirection;
}

/** Category label, icon key and sign for a transaction row. */
export function describeTransaction(tx: Transaction, custom: CustomCategory[] = []): TxDisplay {
  const direction = directionOf(tx.type);
  if (tx.type === 'transfer' && !tx.to_account_id) {
    return { label: tx.category ? `Investment · ${tx.category}` : 'Investment', iconKey: 'investment', direction };
  }
  if (tx.type === 'transfer') return { label: 'Transfer', iconKey: null, kind: 'transfer', direction };
  if (tx.type === 'tabung_topup') return { label: 'Tabung top-up', iconKey: 'piggy-bank', direction };
  if (tx.type === 'tabung_withdraw') return { label: 'Tabung pay-out', iconKey: 'piggy-bank', direction };
  const slug = tx.category ?? '';
  if (BUILTIN_LABEL[slug]) return { label: BUILTIN_LABEL[slug], iconKey: slug, direction };
  const c = custom.find((x) => x.name === slug);
  if (c) return { label: c.name, iconKey: c.icon ?? 'tag', direction };
  return { label: slug || 'Others', iconKey: 'others', direction };
}

/** 'HH:mm' (24h) from the row's created_at, local time. */
export function timeOf(tx: Pick<Transaction, 'created_at'>): string {
  const d = new Date(tx.created_at);
  if (Number.isNaN(d.getTime())) return '';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** 'Today', 'Yesterday', or 'Mon, 16 Nov'. `ymd` is a local 'YYYY-MM-DD'. */
export function dayLabel(ymd: string, now: Date = new Date()): string {
  const [y, m, d] = ymd.slice(0, 10).split('-').map(Number);
  const day = new Date(y, m - 1, d);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.round((today.getTime() - day.getTime()) / 86_400_000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return day.toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric', month: 'short' });
}

/** Groups rows by calendar day, keeping the input order (newest first). */
export function groupByDay<T extends Pick<Transaction, 'date'>>(rows: T[]): { day: string; items: T[] }[] {
  const out: { day: string; items: T[] }[] = [];
  for (const r of rows) {
    const day = r.date.slice(0, 10);
    const last = out[out.length - 1];
    if (last && last.day === day) last.items.push(r);
    else out.push({ day, items: [r] });
  }
  return out;
}

/** Route params add-transaction reads to open in edit mode. */
export function editParams(tx: Transaction): Record<string, string> {
  return {
    editId: tx.id,
    type: tx.type,
    name: tx.name,
    amount: String(tx.amount),
    category: tx.category ?? '',
    fromAccountId: tx.from_account_id ?? '',
    toAccountId: tx.to_account_id ?? '',
    assetId: tx.asset_id ?? '',
    date: tx.date,
    note: tx.note ?? '',
    nonce: String(Date.now()),
  };
}
