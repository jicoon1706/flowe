// ─── Enums ───
export type AccountType = 'bank' | 'tabung' | 'wallet';
export type TransactionType = 'expense' | 'income' | 'transfer' | 'tabung_topup' | 'tabung_withdraw';
export type RecurringFrequency = 'monthly' | 'weekly' | 'yearly';
export type RecurringStatus = 'active' | 'paused' | 'ended';
export type ReminderOffset = 'none' | 'same_day' | '1_day' | '3_days' | '1_week';
export type AssetType = 'real_estate' | 'stocks' | 'unit_trust' | 'fixed_deposit' | 'asb' | 'gold' | 'vehicle' | 'business' | 'others';
export type LiabilityType = 'mortgage' | 'car_loan' | 'credit_card' | 'study_loan' | 'medical_loan' | 'business_loan' | 'others';
export type NotificationType = 'expense' | 'income' | 'transfer' | 'recurring' | 'alert' | 'tabung' | 'milestone' | 'asset' | 'cashflow' | 'note' | 'affirmation' | 'project';
export type AffirmationCategory = 'saving' | 'investing' | 'mindset' | 'awareness';
export type FinancialIdentity = 'employee' | 'entrepreneur' | 'investor' | 'business_owner';

// ─── Table Row Types ───
export interface Profile {
  id: string;
  display_name: string;
  financial_identity?: FinancialIdentity;
  avatar_url?: string;
  member_since: string;
  updated_at: string;
}

export interface AuthConfig {
  id: string;
  user_id: string;
  pin_hash: string;
  fingerprint_enabled: boolean;
  auto_lock_minutes: number | null;
  updated_at: string;
}

export interface Account {
  id: string;
  user_id: string;
  type: AccountType;
  name: string;
  icon?: string;
  color?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BankAccount {
  id: string;
  account_id: string;
  bank_name: string;
  account_number?: string;
  opening_balance: number;
  current_balance: number;
}

export interface TabungAccount {
  id: string;
  account_id: string;
  target_amount: number;
  saved_amount: number;
  from_date: string;
  to_date: string;
  linked_bank_id?: string;
  description?: string;
  icon?: string;
  color?: string;
  template_type?: string;
  auto_save: boolean;
}

export interface WalletAccount {
  id: string;
  account_id: string;
  opening_balance: number;
  current_balance: number;
}

export interface BankAccountFull extends Account {
  bank_accounts: BankAccount;
}

export interface TabungAccountFull extends Account {
  tabung_accounts: TabungAccount;
}

export interface WalletAccountFull extends Account {
  wallet_accounts: WalletAccount;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  name: string;
  amount: number;
  category?: string;
  from_account_id?: string;
  to_account_id?: string;
  date: string;
  note?: string;
  receipt_url?: string;
  is_recurring: boolean;
  recurring_id?: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionDetail extends Transaction {
  from_account?: { id: string; name: string; type: AccountType };
  to_account?: { id: string; name: string; type: AccountType };
  recurring?: {
    frequency: RecurringFrequency;
    start_date: string;
    end_date?: string;
    reminder_enabled: boolean;
  };
}

export interface RecurringRule {
  id: string;
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
  reminder_enabled: boolean;
  reminder_offset: ReminderOffset;
  status: RecurringStatus;
  last_applied_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: string;
  user_id: string;
  name: string;
  type: AssetType;
  icon?: string;
  current_value: number;
  monthly_income: number;
  date_acquired?: string;
  note?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Liability {
  id: string;
  user_id: string;
  name: string;
  type: LiabilityType;
  icon?: string;
  amount_owed: number;
  monthly_payment: number;
  interest_rate: number;
  note?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LearnProject {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface LearnEntry {
  id: string;
  project_id: string;
  user_id: string;
  body?: string;
  created_at: string;
  updated_at: string;
}

export interface LearnEntryImage {
  id: string;
  entry_id: string;
  storage_path: string;
  sort_order: number;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  emoji: string;
  message: string;
  sub_text?: string;
  is_read: boolean;
  related_entity_id?: string;
  created_at: string;
}

export interface Affirmation {
  id: string;
  category: AffirmationCategory;
  quote: string;
  is_active: boolean;
  created_at: string;
}

export interface AffirmationFavourite {
  id: string;
  user_id: string;
  affirmation_id: string;
  created_at: string;
}

export interface UserAffirmation {
  id: string;
  user_id: string;
  text: string;
  category: AffirmationCategory;
  is_active: boolean;
  created_at: string;
}

export interface Settings {
  id: string;
  user_id: string;
  currency: string;
  balance_visible: boolean;
  show_affirmations: boolean;
  daily_reminder_time: string;
  affirmation_category: string;
  notif_expense: boolean;
  notif_income: boolean;
  notif_transfer: boolean;
  notif_recurring: boolean;
  notif_alert: boolean;
  notif_tabung: boolean;
  notif_milestone: boolean;
  notif_asset: boolean;
  notif_cashflow: boolean;
  notif_affirmation: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomCategory {
  id: string;
  user_id: string;
  transaction_type: 'expense' | 'income';
  name: string;
  icon?: string;
  color?: string;
  is_active: boolean;
  created_at: string;
}