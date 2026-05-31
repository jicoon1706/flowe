import { supabase } from '../lib/supabase';
import type { Result, SupabaseError } from '../utils/result';
import { fromSupabaseError } from '../utils/result';
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
        saved_amount: 0,
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

  async updateBankBalance(accountId: string, newBalance: number): Promise<Result<void, SupabaseError>> {
    const { error } = await supabase
      .from('bank_accounts')
      .update({ current_balance: newBalance })
      .eq('account_id', accountId);
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: undefined };
  },

  async updateWalletBalance(accountId: string, newBalance: number): Promise<Result<void, SupabaseError>> {
    const { error } = await supabase
      .from('wallet_accounts')
      .update({ current_balance: newBalance })
      .eq('account_id', accountId);
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: undefined };
  },

  async updateTabungGoal(
    accountId: string,
    patch: { name?: string; target_amount?: number; icon?: string; color?: string },
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
