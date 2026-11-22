import { supabase } from '../lib/supabase';
import { fromSupabaseError, type Result, type SupabaseError } from '../utils/result';
import { DEFAULT_SPLIT_TARGETS, parseIncomeSplit, targetsProblem } from '../lib/incomeSplit';
import type { CategoryGroup, IncomeSplit, SplitGroup, SplitTargets } from '../types';

export interface CategoryGroupChange {
  /** transactions.category: a built-in slug or a custom category's name. */
  category: string;
  group: SplitGroup;
}

/**
 * Desktop L: the monthly income split, the user's category groups and split
 * targets. The split itself is computed once, by income_split(p_month)
 * (migration 20261123e); groups and targets are saved together by
 * save_income_split_groups, which rejects targets that don't add up to 100.
 */
export const incomeSplitRepository = {
  /** @param month any date in the month, 'YYYY-MM-DD' (normally 'YYYY-MM-01'). */
  async fetchSplit(month: string): Promise<Result<IncomeSplit, SupabaseError>> {
    const { data, error } = await supabase.rpc('income_split', { p_month: month });
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: parseIncomeSplit(data) };
  },

  /** The caller's groups. A category with no row counts as Skip. */
  async fetchGroups(): Promise<Result<CategoryGroup[], SupabaseError>> {
    const { data, error } = await supabase
      .from('category_groups')
      .select('id, user_id, category, split_group, created_at, updated_at')
      .order('category', { ascending: true });
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: (data ?? []) as CategoryGroup[] };
  },

  /** The caller's targets; 50 / 30 / 20 when they have no settings row yet. */
  async fetchTargets(): Promise<Result<SplitTargets, SupabaseError>> {
    const { data, error } = await supabase
      .from('settings')
      .select('split_needs_pct, split_wants_pct, split_invest_pct')
      .maybeSingle();
    if (error) return { ok: false, error: fromSupabaseError(error) };
    if (!data) return { ok: true, data: { ...DEFAULT_SPLIT_TARGETS } };
    return {
      ok: true,
      data: {
        needs: Number(data.split_needs_pct),
        wants: Number(data.split_wants_pct),
        invest: Number(data.split_invest_pct),
      },
    };
  },

  /**
   * Saves groups and targets in one transaction. Checks the targets here too
   * so a bad total never makes a request; the server enforces the same rule.
   */
  async saveGroups(groups: CategoryGroupChange[], targets: SplitTargets): Promise<Result<void, SupabaseError>> {
    const problem = targetsProblem(targets);
    if (problem) return { ok: false, error: { code: '23514', message: problem } };
    const { error } = await supabase.rpc('save_income_split_groups', {
      p_groups: groups.map((g) => ({ category: g.category, group: g.group })),
      p_needs: targets.needs,
      p_wants: targets.wants,
      p_invest: targets.invest,
    });
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: undefined };
  },
};
