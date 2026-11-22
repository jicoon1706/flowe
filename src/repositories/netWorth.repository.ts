import { supabase } from '../lib/supabase';
import { fromSupabaseError, type Result, type SupabaseError } from '../utils/result';
import { parseNetWorthBreakdown } from '../lib/incomeSplit';
import type { NetWorthBreakdown } from '../types';

/**
 * Desktop K: net worth now — cash in accounts + assets by type (with share of
 * total assets) − liabilities. Computed once, by net_worth_breakdown()
 * (migration 20261123d); the hero, its breakdown and the Cashflow Net worth
 * card all read this.
 */
export const netWorthRepository = {
  async fetchBreakdown(): Promise<Result<NetWorthBreakdown, SupabaseError>> {
    const { data, error } = await supabase.rpc('net_worth_breakdown');
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: parseNetWorthBreakdown(data) };
  },
};
