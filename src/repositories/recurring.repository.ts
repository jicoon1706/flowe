import { supabase } from '../lib/supabase';
import { fromSupabaseError, type Result, type SupabaseError } from '../utils/result';
import type { RecurringRule, RecurringStatus, RecurringFrequency } from '../types';

/**
 * Whether a rule's pending occurrence (next_date, or start_date before the
 * first run) is on or before its end date. A rule with no end date never ends.
 * PostgREST can't compare two columns, so `fetchDue` applies this after the read.
 */
export function isWithinEndDate(rule: Pick<RecurringRule, 'next_date' | 'start_date' | 'end_date'>): boolean {
  if (!rule.end_date) return true;
  return (rule.next_date ?? rule.start_date) <= rule.end_date;
}

export interface CreateRecurringRuleRequest {
  user_id: string;
  type: 'expense' | 'income';
  name: string;
  amount: number;
  category?: string;
  from_account_id?: string;
  to_account_id?: string;
  frequency: RecurringFrequency;
  start_date: string;
  end_date?: string;
  next_date?: string;
  reminder_enabled?: boolean;
  reminder_offset?: 'none' | 'same_day' | '1_day' | '3_days' | '1_week';
  status?: RecurringStatus;
}

export const recurringRepository = {
  async fetchAllActive(): Promise<Result<RecurringRule[], SupabaseError>> {
    const { data, error } = await supabase
      .from('recurring_rules')
      .select()
      .in('status', ['active', 'paused'])
      .order('created_at', { ascending: false });
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as RecurringRule[] };
  },

  async create(req: CreateRecurringRuleRequest): Promise<Result<RecurringRule, SupabaseError>> {
    const { data, error } = await supabase
      .from('recurring_rules')
      .insert({
        user_id: req.user_id,
        type: req.type,
        name: req.name,
        amount: req.amount,
        category: req.category,
        from_account_id: req.from_account_id,
        to_account_id: req.to_account_id,
        frequency: req.frequency,
        start_date: req.start_date,
        end_date: req.end_date,
        next_date: req.next_date ?? req.start_date,
        reminder_enabled: req.reminder_enabled ?? false,
        reminder_offset: req.reminder_offset ?? 'none',
        status: req.status ?? 'active',
      })
      .select()
      .single();
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as RecurringRule };
  },

  /**
   * Active rules whose next occurrence is due (next_date on or before `today`,
   * a 'YYYY-MM-DD' string). Paused rules, and rules whose pending occurrence
   * falls after their end date, are skipped (AUDIT-2026-11 B1).
   */
  async fetchDue(today: string): Promise<Result<RecurringRule[], SupabaseError>> {
    const { data, error } = await supabase
      .from('recurring_rules')
      .select()
      .eq('status', 'active')
      .lte('next_date', today);
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: (data as RecurringRule[]).filter(isWithinEndDate) };
  },

  /**
   * Approves one occurrence in a single database transaction (AUDIT #21):
   * advances the rule to `nextDate`, inserts the dated transaction and moves
   * the account balance, all or nothing. Only acts while `occurrence` is
   * still the rule's pending date, so a repeat approval does nothing.
   * Resolves to the new transaction's id, or null when there was nothing to
   * approve (already approved or skipped, or the rule is gone).
   */
  async approveOccurrence(
    ruleId: string,
    occurrence: string,
    nextDate: string,
  ): Promise<Result<string | null, SupabaseError>> {
    const { data, error } = await supabase.rpc('approve_recurring_occurrence', {
      p_rule_id: ruleId,
      p_occurrence: occurrence,
      p_next_date: nextDate,
    });
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: (data as string | null) ?? null };
  },

  /**
   * Skip one occurrence: move the rule to `nextDate` without a transaction.
   * Like approveOccurrence, it only acts while `occurrence` is still the
   * rule's pending date (next_date, or start_date before the first run), so a
   * skip racing an approval from another device can't skip the next period.
   * Resolves to true when this call moved the rule.
   */
  async skipOccurrence(id: string, occurrence: string, nextDate: string): Promise<Result<boolean, SupabaseError>> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('recurring_rules')
      .update({ next_date: nextDate, last_applied_at: now, updated_at: now })
      .eq('id', id)
      .or(`next_date.eq.${occurrence},and(next_date.is.null,start_date.eq.${occurrence})`)
      .select('id');
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: (data ?? []).length > 0 };
  },

  /**
   * Edit an existing rule. `next_date` is passed explicitly rather than derived,
   * because moving a rule's payment day should move the *next* occurrence — not
   * silently re-run one the user already approved.
   */
  async update(
    id: string,
    patch: Partial<Pick<
      CreateRecurringRuleRequest,
      'name' | 'amount' | 'category' | 'frequency' | 'from_account_id' | 'to_account_id' | 'start_date' | 'end_date' | 'next_date'
    >>
  ): Promise<Result<RecurringRule, SupabaseError>> {
    const { data, error } = await supabase
      .from('recurring_rules')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as RecurringRule };
  },

  async updateStatus(id: string, status: RecurringStatus): Promise<Result<void, SupabaseError>> {
    const { error } = await supabase
      .from('recurring_rules')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: undefined };
  },

  async delete(id: string): Promise<Result<void, SupabaseError>> {
    const { error } = await supabase.from('recurring_rules').delete().eq('id', id);
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: undefined };
  },
};