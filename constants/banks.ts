export type Bank = { id: string; name: string; color: string };

export const MALAYSIAN_BANKS: Bank[] = [
  { id: 'maybank', name: 'Maybank', color: '#ffd93d' },
  { id: 'cimb', name: 'CIMB Bank', color: '#ff6b6b' },
  { id: 'public', name: 'Public Bank', color: '#00d4ff' },
  { id: 'rhb', name: 'RHB Bank', color: '#6bcf7f' },
  { id: 'hong-leong', name: 'Hong Leong Bank', color: '#C5FF00' },
  { id: 'ambank', name: 'AmBank', color: '#a78bfa' },
  { id: 'bank-islam', name: 'Bank Islam', color: '#34d399' },
  { id: 'bank-rakyat', name: 'Bank Rakyat', color: '#f472b6' },
  { id: 'bsn', name: 'BSN', color: '#60a5fa' },
  { id: 'affin', name: 'Affin Bank', color: '#fb923c' },
  { id: 'alliance', name: 'Alliance Bank', color: '#c084fc' },
  { id: 'other', name: 'Other Bank', color: '#94a3b8' },
];

export const TABUNG_ICONS = ['piggy', 'coin', 'home', 'gift', 'car', 'rocket', 'palm', 'building', 'train', 'target'] as const;
export type TabungIcon = typeof TABUNG_ICONS[number];