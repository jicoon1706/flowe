import { useCallback, useEffect, useRef, useState } from 'react';
import { accountsRepository } from '../repositories/accounts.repository';
import { assetsRepository } from '../repositories/assets.repository';
import { liabilitiesRepository } from '../repositories/liabilities.repository';
import { transactionsRepository } from '../repositories/transactions.repository';
import { accountBalance, type AnyAccount } from '../utils/accountDisplay';
import { monthStart, monthStartOfIso } from '../utils/monthStart';
import {
  coverRatio, entityValuesAsOf, financialClass, monthlyFlows, monthsEnding, netWorthTrend, passiveCoveragePct, spendByCategory,
  type BalanceEntity, type CategoryShare, type DatedBalanceRow, type FinancialClass, type NetWorthPoint, type ValuePoint,
} from '../lib/cashflow';
import { roundCents } from '../lib/money';
import type { Asset, Liability, Transaction } from '../types';
import type { SupabaseError } from '../utils/result';

/** Months drawn by the net worth trend (the selected one and the five before). */
export const TREND_MONTHS = 6;

export interface CashflowOverview {
  /** Selected month, 'YYYY-MM-01'. */
  month: string;
  assets: number;
  liabilities: number;
  netWorth: number;
  cash: number;
  /** Assets held in the month, largest first (diagram box detail). */
  assetLines: { name: string; amount: number }[];
  liabilityLines: { name: string; amount: number }[];
  cls: FinancialClass;
  /** assets ÷ liabilities, one decimal; null with no liabilities. */
  coverage: number | null;
  passive: { total: number; items: { name: string; amount: number }[] };
  repayments: { total: number; items: { name: string; amount: number }[] };
  /** Passive income ÷ expenses as a whole %; null with no expenses. */
  passivePct: number | null;
  income: number;
  incomeLines: { name: string; amount: number }[];
  expenses: number;
  spend: CategoryShare[];
  trend: NetWorthPoint[];
}

export interface CashflowErrors {
  /** Balance sheet (accounts, assets, liabilities, or the history a past month needs). */
  balance: SupabaseError | null;
  /** The month's transactions. */
  month: SupabaseError | null;
  /** Value history / transaction legs for the trend. */
  trend: SupabaseError | null;
}

const toEntity = (id: string, name: string, amount: number, sinceIso: string, monthly: number): BalanceEntity =>
  ({ id, name, amount: Number(amount), since: monthStartOfIso(sinceIso), monthly: Number(monthly || 0) });

/**
 * Everything the Cashflow tab draws for one month: net worth, its six-month
 * trend, the cash flow diagram, the class and the month's spending. Every card
 * reloads together when the month changes.
 */
export function useCashflowOverview(monthDate: Date) {
  const month = monthStart(monthDate);
  const [data, setData] = useState<CashflowOverview | null>(null);
  const [errors, setErrors] = useState<CashflowErrors>({ balance: null, month: null, trend: null });
  const [loading, setLoading] = useState(true);
  const latest = useRef(0);

  const load = useCallback(async () => {
    const request = ++latest.current;
    setLoading(true);
    const liveMonth = monthStart(new Date());
    const months = monthsEnding(month, TREND_MONTHS);
    const [y, m] = month.split('-').map(Number);
    const [accRes, assetRes, liabRes, txRes, aHistRes, lHistRes, legsRes] = await Promise.all([
      accountsRepository.fetchAllActive(),
      assetsRepository.fetchAll(),
      liabilitiesRepository.fetchAll(),
      transactionsRepository.fetchByMonth(y, m),
      assetsRepository.fetchValueHistory(),
      liabilitiesRepository.fetchValueHistory(),
      // Legs after the first trend month began roll cash back to each month end.
      transactionsRepository.fetchLegsSince(months[0]),
    ]);
    if (request !== latest.current) return;

    const balanceError = (!accRes.ok ? accRes.error : !assetRes.ok ? assetRes.error : !liabRes.ok ? liabRes.error : null);
    const trendError = (!aHistRes.ok ? aHistRes.error : !lHistRes.ok ? lHistRes.error : !legsRes.ok ? legsRes.error : null);
    const monthError = txRes.ok ? null : txRes.error;
    // A past month is rebuilt from the history, so it can't be shown without it.
    const pastNeedsHistory = month < liveMonth ? trendError : null;
    setErrors({ balance: balanceError ?? pastNeedsHistory, month: monthError, trend: trendError });
    if (balanceError || pastNeedsHistory || !accRes.ok || !assetRes.ok || !liabRes.ok) { setData(null); setLoading(false); return; }

    const accounts = accRes.data as AnyAccount[];
    const accountIds = accounts.map((a) => a.id);
    const cashNow = roundCents(accounts.reduce((s, a) => s + accountBalance(a), 0));
    const assets = (assetRes.data as Asset[]).map((a) => toEntity(a.id, a.name, a.current_value, a.date_acquired ?? a.created_at, a.monthly_income));
    const liabilities = (liabRes.data as Liability[]).map((l) => toEntity(l.id, l.name, l.amount_owed, l.created_at, l.monthly_payment));
    const assetHistory: ValuePoint[] = aHistRes.ok ? aHistRes.data : [];
    const liabilityHistory: ValuePoint[] = lHistRes.ok ? lHistRes.data : [];
    const legs: DatedBalanceRow[] = legsRes.ok ? legsRes.data : [];
    const input = { liveMonth, cashNow, accountIds, legs, assets, assetHistory, liabilities, liabilityHistory };

    const [point] = netWorthTrend({ ...input, months: [month] });
    const trend = trendError ? [] : netWorthTrend({ ...input, months });
    const assetValues = entityValuesAsOf(assets, assetHistory, month, liveMonth);
    const liabilityValues = entityValuesAsOf(liabilities, liabilityHistory, month, liveMonth);
    const lines = (list: BalanceEntity[], values: Map<string, number>) =>
      list.map((e) => ({ name: e.name, amount: values.get(e.id) ?? 0 })).filter((x) => x.amount > 0).sort((a, b) => b.amount - a.amount);

    const rows = txRes.ok ? (txRes.data as Transaction[]) : [];
    const { total: expenses, items: spend } = spendByCategory(rows);
    const incomeRows = rows.filter((t) => t.type === 'income');
    const income = roundCents(incomeRows.reduce((s, t) => s + Number(t.amount), 0));
    const incomeBy = new Map<string, number>();
    for (const t of incomeRows) incomeBy.set(t.category || 'others', (incomeBy.get(t.category || 'others') ?? 0) + Number(t.amount));
    const passive = monthlyFlows(assets, assetHistory, month, liveMonth);
    const repayments = monthlyFlows(liabilities, liabilityHistory, month, liveMonth);

    setData({
      month,
      assets: point.assets,
      liabilities: point.liabilities,
      netWorth: point.netWorth,
      cash: roundCents(point.assets - [...assetValues.values()].reduce((s, v) => s + v, 0)),
      assetLines: lines(assets, assetValues),
      liabilityLines: lines(liabilities, liabilityValues),
      cls: financialClass(point.assets, passive.total, expenses),
      coverage: coverRatio(point.assets, point.liabilities),
      passive,
      repayments,
      passivePct: passiveCoveragePct(passive.total, expenses),
      income,
      incomeLines: [...incomeBy.entries()].map(([name, amount]) => ({ name, amount: roundCents(amount) })).sort((a, b) => b.amount - a.amount),
      expenses,
      spend,
      trend,
    });
    setLoading(false);
  }, [month]);

  useEffect(() => { load(); }, [load]);

  return { data, errors, loading, refetch: load };
}
