import { createClient } from 'jsr:@supabase/supabase-js@2';

// analysis-monthly — totals, category breakdown and spend trend for one month.
//
//   POST { month: 'YYYY-MM' } → AnalysisMonthly (src/types)
//
// Runs as the caller (anon key + the caller's JWT), so RLS on transactions
// scopes every query to auth.uid().
//
// monthly_trend is the 12 months ENDING at `month` (oldest first). The client
// takes the last 3 / 6 / 12 of them, and the second-to-last is "last month".
// (Deployed v4 returned Jan–Dec of the year instead, which put future months
// at the end of the series and made the screen compare a month with itself.)

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const TREND_MONTHS = 12;

function ymOf(year: number, monthIndex: number): string {
  const d = new Date(Date.UTC(year, monthIndex, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function lastDay(year: number, month1: number): string {
  const d = new Date(Date.UTC(year, month1, 0));
  return d.toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    });

    const { month } = await req.json();
    if (typeof month !== 'string' || !/^\d{4}-\d{2}$/.test(month)) return json({ error: 'month must be YYYY-MM' }, 400);

    const [year, mon] = month.split('-').map(Number);
    const monthStart = `${month}-01`;
    const monthEnd = lastDay(year, mon);

    const { data: txs, error: txErr } = await supabase
      .from('transactions')
      .select('type, amount, category')
      .gte('date', monthStart)
      .lte('date', monthEnd);
    if (txErr) throw txErr;

    let income = 0;
    let expenses = 0;
    const incomeMap = new Map<string, number>();
    const expenseMap = new Map<string, number>();
    for (const t of txs ?? []) {
      const amt = Number(t.amount) || 0;
      const cat = t.category ?? 'Others';
      if (t.type === 'income') {
        income += amt;
        incomeMap.set(cat, (incomeMap.get(cat) ?? 0) + amt);
      } else if (t.type === 'expense') {
        expenses += amt;
        expenseMap.set(cat, (expenseMap.get(cat) ?? 0) + amt);
      }
    }
    const net_savings = income - expenses;
    const savings_rate = income > 0 ? Math.round((net_savings / income) * 100) : 0;

    const toBreakdown = (m: Map<string, number>, total: number) =>
      [...m.entries()]
        .map(([category, amount]) => ({ category, amount, percentage: total > 0 ? Math.round((amount / total) * 100) : 0 }))
        .sort((a, b) => b.amount - a.amount);

    // Trailing window: (month - 11) … month.
    const trend = Array.from({ length: TREND_MONTHS }, (_, i) => ({
      month: ymOf(year, mon - TREND_MONTHS + i),
      income: 0,
      expenses: 0,
    }));
    const index = new Map(trend.map((t, i) => [t.month, i]));

    const { data: windowTxs, error: wErr } = await supabase
      .from('transactions')
      .select('type, amount, date')
      .gte('date', `${trend[0].month}-01`)
      .lte('date', monthEnd);
    if (wErr) throw wErr;

    for (const t of windowTxs ?? []) {
      const i = index.get(String(t.date).slice(0, 7));
      if (i === undefined) continue;
      const amt = Number(t.amount) || 0;
      if (t.type === 'income') trend[i].income += amt;
      else if (t.type === 'expense') trend[i].expenses += amt;
    }

    return json({
      income,
      expenses,
      net_savings,
      savings_rate,
      expense_by_category: toBreakdown(expenseMap, expenses),
      income_by_category: toBreakdown(incomeMap, income),
      monthly_trend: trend,
    });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}
