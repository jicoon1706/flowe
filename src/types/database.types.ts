// ─── Enums ───
export type AccountType = 'bank' | 'tabung' | 'wallet';
export type TransactionType = 'expense' | 'income' | 'transfer' | 'tabung_topup' | 'tabung_withdraw';
export type RecurringFrequency = 'monthly' | 'weekly' | 'yearly';
export type RecurringStatus = 'active' | 'paused' | 'ended';
export type ReminderOffset = 'none' | 'same_day' | '1_day' | '3_days' | '1_week';
export type AssetType = 'real_estate' | 'stocks' | 'unit_trust' | 'fixed_deposit' | 'asb' | 'gold' | 'vehicle' | 'business' | 'others' | 'kwsp';
export type LiabilityType = 'mortgage' | 'car_loan' | 'credit_card' | 'study_loan' | 'medical_loan' | 'business_loan' | 'others';
export type NotificationType = 'expense' | 'income' | 'transfer' | 'recurring' | 'alert' | 'tabung' | 'milestone' | 'asset' | 'liability' | 'cashflow' | 'note' | 'affirmation' | 'project';
export type AffirmationCategory = 'saving' | 'investing' | 'mindset' | 'awareness';
export type FinancialIdentity = 'employee' | 'entrepreneur' | 'investor' | 'business_owner';
/** What the pinned Android live budget update shows. Migration 20261117. */
export type LiveBudgetMode = 'off' | 'daily' | 'monthly' | 'both';
/** How a Tabung ring is computed. Migration 20261117. */
export type TabungProgressMode = 'contributed' | 'balance';

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

export interface BankPreset {
  id: number;
  name: string;
  color?: string;
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
  /** Starting amount; the repair rebuilds saved_amount from it. Migration 20261121. */
  opening_amount?: number;
  from_date: string;
  to_date: string;
  linked_bank_id?: string;
  description?: string;
  icon?: string;
  color?: string;
  template_type?: string;
  auto_save: boolean;
  /** Migration 20261117. Defaults to 'contributed'. */
  progress_mode: TabungProgressMode;
  /** Planned monthly top-up (RM, > 0). Migration 20261124. */
  monthly_topup?: number | null;
  /** Cover photo path in the tabung-covers bucket. Migration 20261124. */
  cover_path?: string | null;
}

export interface WalletAccount {
  id: string;
  account_id: string;
  opening_balance: number;
  current_balance: number;
}

/** An `accounts` row as `accountsRepository.fetchAllActive` returns it, with its typed detail row joined. */
export interface AccountWithDetails extends Account {
  bank_accounts?: BankAccount | null;
  wallet_accounts?: WalletAccount | null;
  tabung_accounts?: TabungAccount | null;
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
  /** The asset an investment fed (a transfer with no destination account). Migration 20261116. */
  asset_id?: string | null;
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
  /**
   * Physical amount held, for an asset measured in something other than
   * ringgit — grams of gold, above all. Undefined for the rest.
   */
  quantity?: number;
  /** Unit for `quantity`, e.g. 'g'. */
  unit?: string;
  /** Gold only: 999 or 916. Migration 20261123b. */
  purity?: GoldPurity | null;
  /** Gold only: Public Gold buy-back (PG Buy) price per gram, RM. Null = unpriced (legacy) gold. */
  price_per_gram?: number | null;
  /** Gold only: date the price was saved, 'YYYY-MM-DD' (Asia/Kuala_Lumpur). */
  price_date?: string | null;
  /** Gold only, optional: what was paid. Gain/loss = current_value − cost. */
  cost?: number | null;
  /** KWSP only: Akaun Persaraan balance. current_value = the three accounts' sum. */
  kwsp_persaraan?: number | null;
  /** KWSP only: Akaun Sejahtera balance. */
  kwsp_sejahtera?: number | null;
  /** KWSP only: Akaun Fleksibel balance. */
  kwsp_fleksibel?: number | null;
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

/** A learn entry as fetchEntries returns it, attachments joined. */
export interface LearnEntryWithImages extends LearnEntry {
  learn_entry_images?: LearnEntryImage[];
}

/** A project as fetchProjects returns it, with entry summaries joined. */
export interface LearnProjectWithEntries extends LearnProject {
  learn_entries?: { id: string; body?: string; updated_at: string; learn_entry_images?: { id: string }[] }[];
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
  daily_reminder_time: string | null;
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
  /**
   * How much the user means to spend in a day, in ringgit. Null when they
   * haven't set one — the daily-budget widget shows no figure until they do.
   */
  daily_budget: number | null;
  /** Monthly spending limit in RM, null when unset. Migration 20261117. */
  monthly_budget: number | null;
  /** Pinned live budget update. Migration 20261117. */
  live_budget_mode: LiveBudgetMode;
  /** Income split targets, % of income; the three add up to 100. Migration 20261123c. */
  split_needs_pct: number;
  split_wants_pct: number;
  split_invest_pct: number;
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

/**
 * What an asset was worth as of a month. One row per (asset, month); months
 * with no row inherit the latest earlier one, so the trend only moves where
 * the user actually recorded a value.
 */
export interface AssetValue {
  id: string;
  asset_id: string;
  user_id: string;
  /** First day of the month, 'YYYY-MM-01'. */
  month: string;
  value: number;
  quantity?: number;
  created_at: string;
  updated_at: string;
}

/** Amount owed on a liability as of a month. Same carry-forward rule as `AssetValue`. */
export interface LiabilityValue {
  id: string;
  liability_id: string;
  user_id: string;
  /** First day of the month, 'YYYY-MM-01'. */
  month: string;
  amount_owed: number;
  created_at: string;
  updated_at: string;
}

/** Row of the tabung_monthly_flows view (migration 20261117). */
export interface TabungMonthlyFlow {
  user_id: string;
  account_id: string;
  /** First day of the month, YYYY-MM-01. */
  month: string;
  topped_up: number;
  paid_out: number;
}

// ─── Desktop K · Gold & KWSP valuation (migrations 20261123–20261123b) ───

export type GoldPurity = 999 | 916;

/**
 * Extension point (phase 2, NOT built): one month of KWSP contributions.
 * Planned as its own table keyed by asset_id + month that feeds asset_values;
 * nothing reads or writes this yet.
 */
export interface KwspContribution {
  asset_id: string;
  /** First day of the month, 'YYYY-MM-01'. */
  month: string;
  /** Employer (majikan) share, RM. */
  majikan: number;
  /** Member (ahli) share, RM. */
  ahli: number;
}

/** One asset type in the net worth breakdown; 'cash' = bank + wallet + Tabung balances. */
export interface NetWorthGroup {
  key: 'cash' | AssetType;
  total: number;
  count: number;
  /** Share of total assets, 1 dp; the groups add up to exactly 100.0. */
  share_pct: number;
}

/** net_worth_breakdown() (migration 20261123d): the one net worth computation. */
export interface NetWorthBreakdown {
  total_assets: number;
  total_liabilities: number;
  net_worth: number;
  cash_accounts: number;
  groups: NetWorthGroup[];
  liabilities: { id: string; name: string; type: LiabilityType; amount_owed: number }[];
}

// ─── Desktop L · Income split (migrations 20261123c, 20261123e) ───

export type SplitGroup = 'needs' | 'wants' | 'skip';

/** category_groups row: which group an expense category counts towards. No row = skip. */
export interface CategoryGroup {
  id: string;
  user_id: string;
  /** transactions.category: a built-in slug ('food') or a custom category's name. */
  category: string;
  split_group: SplitGroup;
  created_at: string;
  updated_at: string;
}

export interface SplitTargets {
  needs: number;
  wants: number;
  invest: number;
}

export interface SplitBucket {
  amount: number;
  /** % of the month's income, 1 dp. */
  pct: number;
}

export interface IncomeSplitRow {
  kind: 'category' | 'tabung' | 'asset';
  /** Stable key: the category, 'tabung:{account id}' or 'asset:{asset id}'. */
  key: string;
  /** Set for kind 'category'. */
  category: string | null;
  /** Set for kind 'tabung' ('Tabung · {name}') and 'asset' ('{name} top-up'). */
  label: string | null;
  group: 'needs' | 'wants' | 'invest';
  amount: number;
  pct: number;
}

export type IncomeSplitSuggestion =
  | { kind: 'invest_below_target'; amount: number; target_pct: number; current_pct: number; target_amount: number }
  | { kind: 'unassigned'; amount: number; pct: number }
  | { kind: 'needs_over_target'; category: string; amount: number; pct: number; target_pct: number }
  | { kind: 'wants_over_target'; category: string; amount: number; pct: number; target_pct: number };

/** income_split(p_month) (migration 20261123e): the one monthly split computation. */
export interface IncomeSplit {
  /** 'YYYY-MM-01'. */
  month: string;
  state: 'empty' | 'ok' | 'overspent';
  income: number;
  targets: SplitTargets;
  /** Null when state is 'empty'. The four pcts add up to exactly 100.0. */
  buckets: { needs: SplitBucket; wants: SplitBucket; invest: SplitBucket; left: SplitBucket } | null;
  rows: IncomeSplitRow[];
  /** At most 3, in rule order. */
  suggestions: IncomeSplitSuggestion[];
}
