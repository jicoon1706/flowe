export const expenseCategories = [
  { id: 'food', emoji: '🍔', name: 'Food & Drink', color: '#F97316' },
  { id: 'transport', emoji: '🚗', name: 'Transport', color: '#3B82F6' },
  { id: 'bills', emoji: '🧾', name: 'Bills', color: '#8B5CF6' },
  { id: 'shopping', emoji: '🛍️', name: 'Shopping', color: '#EC4899' },
  { id: 'health', emoji: '💊', name: 'Health', color: '#EF4444' },
  { id: 'entertainment', emoji: '🎬', name: 'Entertainment', color: '#F59E0B' },
  { id: 'others', emoji: '📦', name: 'Others', color: '#6B7280' },
] as const;

export const incomeCategories = [
  { id: 'salary', emoji: '💼', name: 'Salary', color: '#22C55E' },
  { id: 'freelance', emoji: '💻', name: 'Freelance', color: '#3B82F6' },
  { id: 'gift', emoji: '🎁', name: 'Gift', color: '#EC4899' },
  { id: 'allowance', emoji: '💰', name: 'Allowance', color: '#F59E0B' },
  { id: 'investment', emoji: '📈', name: 'Investment', color: '#6366F1' },
  { id: 'rental', emoji: '🏠', name: 'Rental', color: '#14B8A6' },
  { id: 'others', emoji: '📦', name: 'Others', color: '#6B7280' },
] as const;

export const bankColors: Record<string, string> = {
  maybank: '#ffd93d',
  cimb: '#ff6b6b',
  public_bank: '#00d4ff',
  rhb: '#6bcf7f',
  hong_leong: '#C5FF00',
  ambank: '#a78bfa',
  bank_islam: '#34d399',
  bank_rakyat: '#f472b6',
  bsn: '#60a5fa',
  affin_bank: '#fb923c',
  alliance_bank: '#c084fc',
  other: '#94a3b8',
};