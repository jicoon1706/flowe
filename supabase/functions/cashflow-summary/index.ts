import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface Asset {
  current_value: number;
  monthly_income: number;
  date_acquired: string | null;
  created_at: string;
}

interface Liability {
  amount_owed: number;
  created_at: string;
}

interface Transaction {
  type: string;
  name: string | null;
  category: string | null;
  amount: number;
  date: string;
}

interface TrendPoint {
  month: string;
  assets: number;
  liabilities: number;
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// First day (UTC) of the month after the given year/month — i.e. the exclusive end bound.
function monthExclusiveEnd(year: number, monthIdx0: number): Date {
  return new Date(Date.UTC(year, monthIdx0 + 1, 1));
}

function sumLines(txns: Transaction[]): { name: string; amount: number }[] {
  const map = new Map<string, number>();
  for (const t of txns) {
    const key = t.name || t.category || (t.type === 'income' ? 'Income' : 'Expense');
    map.set(key, (map.get(key) ?? 0) + Number(t.amount));
  }
  return [...map.entries()]
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { month } = await req.json().catch(() => ({ month: undefined }));
    if (typeof month !== 'string' || !/^\d{4}-\d{2}$/.test(month)) {
      return new Response(JSON.stringify({ error: 'Invalid or missing "month" (expected "YYYY-MM")' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Scope all queries to the calling user via RLS by forwarding their JWT.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const [year, mon] = month.split('-').map(Number);
    const monthIdx0 = mon - 1;
    const periodStart = new Date(Date.UTC(year, monthIdx0, 1));
    const periodEnd = monthExclusiveEnd(year, monthIdx0);
    const startStr = periodStart.toISOString().slice(0, 10);
    const endStr = periodEnd.toISOString().slice(0, 10);

    const [assetsRes, liabilitiesRes, txnsRes] = await Promise.all([
      supabase
        .from('assets')
        .select('current_value, monthly_income, date_acquired, created_at')
        .eq('is_active', true),
      supabase
        .from('liabilities')
        .select('amount_owed, created_at')
        .eq('is_active', true),
      supabase
        .from('transactions')
        .select('type, name, category, amount, date')
        .in('type', ['income', 'expense'])
        .gte('date', startStr)
        .lt('date', endStr),
    ]);

    if (assetsRes.error) throw assetsRes.error;
    if (liabilitiesRes.error) throw liabilitiesRes.error;
    if (txnsRes.error) throw txnsRes.error;

    const assets = (assetsRes.data ?? []) as Asset[];
    const liabilities = (liabilitiesRes.data ?? []) as Liability[];
    const txns = (txnsRes.data ?? []) as Transaction[];

    const total_assets = assets.reduce((s, a) => s + Number(a.current_value), 0);
    const total_liabilities = liabilities.reduce((s, l) => s + Number(l.amount_owed), 0);
    const net_worth = total_assets - total_liabilities;
    const passive_income = assets.reduce((s, a) => s + Number(a.monthly_income), 0);

    const incomeTxns = txns.filter((t) => t.type === 'income');
    const expenseTxns = txns.filter((t) => t.type === 'expense');
    const total_income = incomeTxns.reduce((s, t) => s + Number(t.amount), 0);
    const total_expenses = expenseTxns.reduce((s, t) => s + Number(t.amount), 0);
    const net_cash_flow = total_income - total_expenses;

    const financial_class =
      passive_income > total_expenses ? 'rich' : total_liabilities > 0 ? 'middle' : 'poor';

    // Reconstruct a net-worth trend for the last 6 months (including current).
    // No historical balance table exists, so each month-end is computed from the
    // assets held by then (date_acquired) and liabilities taken on by then (created_at).
    const monthly_trend: TrendPoint[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(Date.UTC(year, monthIdx0 - i, 1));
      const y = d.getUTCFullYear();
      const m0 = d.getUTCMonth();
      const cutoff = monthExclusiveEnd(y, m0);

      const monthAssets = assets
        .filter((a) => new Date(a.date_acquired ?? a.created_at) < cutoff)
        .reduce((s, a) => s + Number(a.current_value), 0);
      const monthLiabilities = liabilities
        .filter((l) => new Date(l.created_at) < cutoff)
        .reduce((s, l) => s + Number(l.amount_owed), 0);

      monthly_trend.push({
        month: MONTHS_SHORT[m0],
        assets: monthAssets,
        liabilities: monthLiabilities,
      });
    }

    const body = {
      financial_class,
      net_worth,
      passive_income,
      total_assets,
      total_liabilities,
      total_income,
      total_expenses,
      net_cash_flow,
      income: sumLines(incomeTxns),
      expenses: sumLines(expenseTxns),
      monthly_trend,
    };

    return new Response(JSON.stringify(body), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err?.message ?? err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
