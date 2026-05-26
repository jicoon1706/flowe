export interface CashflowSummary {
  financial_class: 'rich' | 'middle' | 'poor';
  net_worth: number;
  passive_income: number;
  total_assets: number;
  total_liabilities: number;
  total_income: number;
  total_expenses: number;
  net_cash_flow: number;
  income?: Array<{ name: string; amount: number }>;
  expenses?: Array<{ name: string; amount: number }>;
  monthly_trend?: Array<{ month: string; assets: number; liabilities: number }>;
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
}

export interface MonthlyTrend {
  month: string;
  income: number;
  expenses: number;
}

export interface AnalysisMonthly {
  income: number;
  expenses: number;
  net_savings: number;
  savings_rate: number;
  expense_by_category: CategoryBreakdown[];
  income_by_category: CategoryBreakdown[];
  monthly_trend: MonthlyTrend[];
}