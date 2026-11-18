import { supabase } from '../lib/supabase';
import type { Result, SupabaseError } from '../utils/result';
import { fromSupabaseError } from '../utils/result';
import { roundCents } from '../lib/money';
import type {
  Account,
  BankAccount,
  TabungAccount,
  WalletAccount,
} from '../types';

export interface CreateBankAccountRequest {
  user_id: string;
  name: string;
  icon?: string;
  color?: string;
  bank_name: string;
  account_number?: string;
  opening_balance: number;
}

export interface CreateWalletAccountRequest {
  user_id: string;
  name: string;
  icon?: string;
  color?: string;
  opening_balance: number;
}

export interface CreateTabungAccountRequest {
  user_id: string;
  name: string;
  icon?: string;
  color?: string;
  target_amount: number;
  from_date: string;
  to_date: string;
  linked_bank_id?: string;
  description?: string;
  template_type?: string;
  auto_save?: boolean;
  monthly_amount?: number;
  /** Opening balance (money saved before Flowe). Not a contribution. */
  starting_amount?: number;
}

export const accountsRepository = {
  async fetchAllActive(): Promise<Result<Account[], SupabaseError>> {
    const { data, error } = await supabase
      .from('accounts')
      .select('*, bank_accounts(*), tabung_accounts(*), wallet_accounts(*)')
      .eq('is_active', true)
      .order('created_at');
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as Account[] };
  },

  async fetchById(id: string): Promise<Result<Account, SupabaseError>> {
    const { data, error } = await supabase
      .from('accounts')
      .select('*, bank_accounts(*), tabung_accounts(*), wallet_accounts(*)')
      .eq('id', id)
      .single();
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as Account };
  },

  async createBankAccount(req: CreateBankAccountRequest): Promise<Result<BankAccount, SupabaseError>> {
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .insert({ user_id: req.user_id, type: 'bank', name: req.name, icon: req.icon, color: req.color })
      .select()
      .single();
    if (accountError) return { ok: false, error: fromSupabaseError(accountError) };

    const { data: bankAccount, error: bankError } = await supabase
      .from('bank_accounts')
      .insert({
        account_id: account.id,
        bank_name: req.bank_name,
        account_number: req.account_number,
        opening_balance: req.opening_balance,
        current_balance: req.opening_balance,
      })
      .select()
      .single();
    if (bankError) {
      await supabase.from('accounts').delete().eq('id', account.id);
      return { ok: false, error: fromSupabaseError(bankError) };
    }

    return { ok: true, data: bankAccount };
  },

  async createWalletAccount(req: CreateWalletAccountRequest): Promise<Result<WalletAccount, SupabaseError>> {
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .insert({ user_id: req.user_id, type: 'wallet', name: req.name, icon: req.icon, color: req.color })
      .select()
      .single();
    if (accountError) return { ok: false, error: fromSupabaseError(accountError) };

    const { data: wallet, error: walletError } = await supabase
      .from('wallet_accounts')
      .insert({
        account_id: account.id,
        opening_balance: req.opening_balance,
        current_balance: req.opening_balance,
      })
      .select()
      .single();
    if (walletError) {
      await supabase.from('accounts').delete().eq('id', account.id);
      return { ok: false, error: fromSupabaseError(walletError) };
    }

    return { ok: true, data: wallet };
  },

  async createTabungAccount(req: CreateTabungAccountRequest): Promise<Result<TabungAccount, SupabaseError>> {
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .insert({ user_id: req.user_id, type: 'tabung', name: req.name, icon: req.icon, color: req.color })
      .select()
      .single();
    if (accountError) return { ok: false, error: fromSupabaseError(accountError) };

    const { data: tabung, error: tabungError } = await supabase
      .from('tabung_accounts')
      .insert({
        account_id: account.id,
        target_amount: req.target_amount,
        saved_amount: req.starting_amount ?? 0,
        // The starting amount is also the jar's opening amount, so Recalculate
        // balances (opening + Σ transactions) keeps it (AUDIT-2026-11 B10).
        // Sent only when set, so creating an empty jar doesn't depend on
        // migration 20261121 having added the column.
        ...(req.starting_amount ? { opening_amount: req.starting_amount } : {}),
        from_date: req.from_date,
        to_date: req.to_date,
        linked_bank_id: req.linked_bank_id,
        description: req.description,
        icon: req.icon,
        color: req.color,
        template_type: req.template_type,
        auto_save: req.auto_save ?? false,
      })
      .select()
      .single();
    if (tabungError) {
      await supabase.from('accounts').delete().eq('id', account.id);
      return { ok: false, error: fromSupabaseError(tabungError) };
    }

    return { ok: true, data: tabung };
  },

  async updateAccount(id: string, patch: Partial<Account>): Promise<Result<Account, SupabaseError>> {
    const { data, error } = await supabase
      .from('accounts')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as Account };
  },

  async softDeleteAccount(id: string): Promise<Result<void, SupabaseError>> {
    const { error } = await supabase
      .from('accounts')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: undefined };
  },

  async softDeleteAllAccounts(): Promise<Result<void, SupabaseError>> {
    const { error } = await supabase
      .from('accounts')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('is_active', true);
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: undefined };
  },

  /**
   * Sets a bank or wallet balance by hand (Account › Edit › Balance).
   *
   * Moves the opening balance by the same delta as the current balance, so
   * Settings › Data › Recalculate balances (opening + Σ transactions) lands on
   * the corrected figure instead of undoing it; and moves the current balance
   * through the atomic `adjust_account_balance` instead of overwriting it
   * (AUDIT-2026-11 B2). The delta is worked out from the stored balance read
   * here, not from what the screen showed, so a retry after a partial failure
   * finds nothing left to move instead of applying the correction twice.
   */
  async setBalance(accountId: string, type: 'bank' | 'wallet', newBalance: number): Promise<Result<void, SupabaseError>> {
    const table = type === 'bank' ? 'bank_accounts' : 'wallet_accounts';
    const { data: row, error: readError } = await supabase
      .from(table)
      .select('current_balance, opening_balance')
      .eq('account_id', accountId)
      .single();
    if (readError) return { ok: false, error: fromSupabaseError(readError) };

    const delta = roundCents(newBalance - (Number(row.current_balance) || 0));
    if (!delta) return { ok: true, data: undefined };
    const opening = Number(row.opening_balance) || 0;

    const { error: openingError } = await supabase
      .from(table)
      .update({ opening_balance: roundCents(opening + delta) })
      .eq('account_id', accountId);
    if (openingError) return { ok: false, error: fromSupabaseError(openingError) };

    const { error } = await supabase.rpc('adjust_account_balance', { p_account_id: accountId, p_delta: delta });
    if (error) {
      // Put the opening balance back so nothing has moved and a retry starts clean.
      await supabase.from(table).update({ opening_balance: opening }).eq('account_id', accountId);
      return { ok: false, error: fromSupabaseError(error) };
    }
    return { ok: true, data: undefined };
  },

  /**
   * Stores the last 4 digits of a bank account. Auto-detect matches these
   * against the digits a payment alert prints, which is the only way to tell
   * two accounts at the same bank apart. Pass an empty string to clear them.
   */
  async updateBankAccountNumber(accountId: string, last4: string): Promise<Result<void, SupabaseError>> {
    const digits = last4.replace(/\D/g, '').slice(-4);
    const { error } = await supabase
      .from('bank_accounts')
      .update({ account_number: digits || null })
      .eq('account_id', accountId);
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: undefined };
  },

  async updateTabungGoal(
    accountId: string,
    patch: { name?: string; target_amount?: number; icon?: string; color?: string; progress_mode?: 'contributed' | 'balance'; to_date?: string },
  ): Promise<Result<void, SupabaseError>> {
    // Update the parent `accounts` row (name/icon/color render from here).
    const accountPatch: Record<string, unknown> = {};
    if (patch.name !== undefined) accountPatch.name = patch.name;
    if (patch.icon !== undefined) accountPatch.icon = patch.icon;
    if (patch.color !== undefined) accountPatch.color = patch.color;
    if (Object.keys(accountPatch).length > 0) {
      const { error } = await supabase
        .from('accounts')
        .update({ ...accountPatch, updated_at: new Date().toISOString() })
        .eq('id', accountId);
      if (error) return { ok: false, error: fromSupabaseError(error) };
    }

    // Keep the `tabung_accounts` row in sync (icon/color stored in both on create).
    const tabungPatch: Record<string, unknown> = {};
    if (patch.target_amount !== undefined) tabungPatch.target_amount = patch.target_amount;
    if (patch.progress_mode !== undefined) tabungPatch.progress_mode = patch.progress_mode;
    if (patch.to_date !== undefined) tabungPatch.to_date = patch.to_date;
    if (patch.icon !== undefined) tabungPatch.icon = patch.icon;
    if (patch.color !== undefined) tabungPatch.color = patch.color;
    if (Object.keys(tabungPatch).length > 0) {
      const { error } = await supabase
        .from('tabung_accounts')
        .update(tabungPatch)
        .eq('account_id', accountId);
      if (error) return { ok: false, error: fromSupabaseError(error) };
    }
    return { ok: true, data: undefined };
  },
};
