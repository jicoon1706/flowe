import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers inlined (rather than imported from ../_shared) so this function
// can be pasted straight into the Supabase dashboard editor, which bundles a
// single file and can't resolve sibling imports.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface Asset {
  id: string;
  current_value: number;
  monthly_income: number;
  date_acquired: string | null;
  created_at: string;
}

interface Liability {
  id: string;
  amount_owed: number;
  created_at: string;
}

/** One "worth X as of month M" record; `month` is the 1st of the month (YYYY-MM-DD). */
interface ValuePoint {
  month: string;
  amount: number;
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

/**
 * Value of one asset/liability as of a month: the latest history row at or
 * before that month. Nothing recorded yet → not owned yet → 0.
 * `history` must be sorted by month ascending.
 */
function valueAsOf(history: ValuePoint[], monthStart: string): number {
  let value = 0;
  for (const p of history) {
    if (p.month > monthStart) break;
    value = p.amount;
  }
  return value;
}

/**
 * Sums every entity's carried-forward value for the month. An entity with no
 * history at all (created before the history tables existed and somehow not
 * backfilled) falls back to the old rule: its present value, once it existed.
 */
function totalAsOf(
  byId: Map<string, ValuePoint[]>,
  monthStart: string,
  entities: { id: string; amount: number; since: string }[],
): number {
  let total = 0;
  for (const e of entities) {
    const history = byId.get(e.id);
    if (history?.length) total += valueAsOf(history, monthStart);
    else if (e.since <= monthStart) total += e.amount;
  }
  return total;
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

    const [assetsRes, liabilitiesRes, txnsRes, assetValuesRes, liabilityValuesRes] = await Promise.all([
      supabase
        .from('assets')
        .select('id, current_value, monthly_income, date_acquired, created_at')
        .eq('is_active', true),
      supabase
        .from('liabilities')
        .select('id, amount_owed, created_at')
        .eq('is_active', true),
      supabase
        .from('transactions')
        .select('type, name, category, amount, date')
        .in('type', ['income', 'expense'])
        .gte('date', startStr)
        .lt('date', endStr),
      supabase
        .from('asset_values')
        .select('asset_id, month, value')
        .order('month', { ascending: true }),
      supabase
        .from('liability_values')
        .select('liability_id, month, amount_owed')
        .order('month', { ascending: true }),
    ]);

    if (assetsRes.error) throw assetsRes.error;
    if (liabilitiesRes.error) throw liabilitiesRes.error;
    if (txnsRes.error) throw txnsRes.error;
    if (assetValuesRes.error) throw assetValuesRes.error;
    if (liabilityValuesRes.error) throw liabilityValuesRes.error;

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

    // Net-worth trend for the last 6 months (including current), built from
    // the recorded value history. Each month shows what the user last recorded
    // for each asset/liability at or before that month, so editing September
    // never touches August — the chart only moves where a value was entered.
    const assetHistory = new Map<string, ValuePoint[]>();
    for (const r of assetValuesRes.data ?? []) {
      const list = assetHistory.get(r.asset_id) ?? [];
      list.push({ month: r.month, amount: Number(r.value) });
      assetHistory.set(r.asset_id, list);
    }
    const liabilityHistory = new Map<string, ValuePoint[]>();
    for (const r of liabilityValuesRes.data ?? []) {
      const list = liabilityHistory.get(r.liability_id) ?? [];
      list.push({ month: r.month, amount: Number(r.amount_owed) });
      liabilityHistory.set(r.liability_id, list);
    }
    const assetEntities = assets.map((a) => ({
      id: a.id,
      amount: Number(a.current_value),
      since: (a.date_acquired ?? a.created_at).slice(0, 7) + '-01',
    }));
    const liabilityEntities = liabilities.map((l) => ({
      id: l.id,
      amount: Number(l.amount_owed),
      since: l.created_at.slice(0, 7) + '-01',
    }));

    const monthly_trend: TrendPoint[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(Date.UTC(year, monthIdx0 - i, 1));
      const monthStart = d.toISOString().slice(0, 10);

      monthly_trend.push({
        month: MONTHS_SHORT[d.getUTCMonth()],
        assets: totalAsOf(assetHistory, monthStart, assetEntities),
        liabilities: totalAsOf(liabilityHistory, monthStart, liabilityEntities),
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
