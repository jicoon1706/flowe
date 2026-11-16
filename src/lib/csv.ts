/**
 * Flowe's transaction CSV: what Settings › Data exports and imports.
 * Columns: date,type,name,category,amount,from_account,to_account,note
 * Pure; shared with desktop.
 */
export const CSV_HEADER = ['date', 'type', 'name', 'category', 'amount', 'from_account', 'to_account', 'note'] as const;

export type CsvTxType = 'expense' | 'income' | 'transfer' | 'tabung_topup' | 'tabung_withdraw';

export interface CsvRow {
  date: string;
  type: CsvTxType;
  name: string;
  category: string;
  amount: number;
  from_account: string;
  to_account: string;
  note: string;
}

const TYPES: CsvTxType[] = ['expense', 'income', 'transfer', 'tabung_topup', 'tabung_withdraw'];

function escape(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function toCsv(rows: CsvRow[]): string {
  const lines = [CSV_HEADER.join(',')];
  for (const r of rows) {
    lines.push([r.date, r.type, r.name, r.category, r.amount.toFixed(2), r.from_account, r.to_account, r.note].map((v) => escape(String(v))).join(','));
  }
  return lines.join('\n') + '\n';
}

/** Splits CSV text into records, honouring quoted fields with commas, quotes and newlines. */
export function splitCsv(text: string): string[][] {
  const out: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((f) => f !== '')) out.push(row);
      row = [];
    } else field += ch;
  }
  row.push(field);
  if (row.some((f) => f !== '')) out.push(row);
  return out;
}

export interface CsvParseResult {
  rows: CsvRow[];
  /** 1-based line numbers that were skipped (bad date, type or amount). */
  skipped: number[];
}

/** Parses a Flowe CSV. Throws when the header isn't Flowe's. */
export function parseCsv(text: string): CsvParseResult {
  const records = splitCsv(text.replace(/^﻿/, ''));
  if (!records.length) return { rows: [], skipped: [] };
  const header = records[0].map((h) => h.trim().toLowerCase());
  const idx = Object.fromEntries(CSV_HEADER.map((h) => [h, header.indexOf(h)])) as Record<(typeof CSV_HEADER)[number], number>;
  if (idx.date < 0 || idx.type < 0 || idx.amount < 0 || idx.name < 0) throw new Error('Not a Flowe CSV');
  const rows: CsvRow[] = [];
  const skipped: number[] = [];
  records.slice(1).forEach((rec, i) => {
    const get = (k: (typeof CSV_HEADER)[number]) => (idx[k] >= 0 ? (rec[idx[k]] ?? '').trim() : '');
    const type = get('type') as CsvTxType;
    const amount = Number(get('amount').replace(/,/g, ''));
    const date = get('date');
    if (!TYPES.includes(type) || !Number.isFinite(amount) || amount <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      skipped.push(i + 2);
      return;
    }
    rows.push({ date, type, name: get('name') || type, category: get('category'), amount: Math.round(amount * 100) / 100, from_account: get('from_account'), to_account: get('to_account'), note: get('note') });
  });
  return { rows, skipped };
}

/** Largest CSV accepted for import (k-toast-file-too-large). */
export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
