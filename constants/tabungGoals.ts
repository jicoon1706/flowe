import type { LucideIcon } from 'lucide-react-native';
import { Building2, Car, Coins, Gift, GraduationCap, House, PiggyBank, Plane, Rocket, Sparkle, Target, TrainFront, TreePalm } from 'lucide-react-native';

export type TabungGoalKey = 'emergency' | 'travel' | 'raya' | 'education' | 'home' | 'custom';

export interface TabungGoal {
  key: TabungGoalKey;
  label: string;
  hint: string;
  icon: LucideIcon;
  /** Name pre-filled on the form (tabung/new/form). */
  defaultName: string;
}

/** Goal types from tabung/new (acc-tabung-new); onboarding shows the first four plus Home. */
export const TABUNG_GOALS: TabungGoal[] = [
  { key: 'emergency', label: 'Emergency', hint: '3–6 months of spend', icon: Target, defaultName: 'Emergency Fund' },
  { key: 'travel', label: 'Travel', hint: 'Trips and holidays', icon: Plane, defaultName: 'Travel' },
  { key: 'raya', label: 'Raya & festive', hint: 'Duit raya, balik kampung', icon: Sparkle, defaultName: 'Raya' },
  { key: 'education', label: 'Education', hint: 'Fees, courses', icon: GraduationCap, defaultName: 'Education' },
  { key: 'home', label: 'Home', hint: 'Deposit, renovation', icon: House, defaultName: 'Home' },
  { key: 'custom', label: 'Custom', hint: 'Anything else', icon: PiggyBank, defaultName: '' },
];

/** Older icon keys stored before v2 (constants/banks TABUNG_ICONS). */
const LEGACY: Record<string, LucideIcon> = {
  piggy: PiggyBank, coin: Coins, home: House, gift: Gift, car: Car, rocket: Rocket,
  palm: TreePalm, building: Building2, train: TrainFront, target: Target,
};

/** Icon for a tabung from its template type or stored icon key; PiggyBank otherwise. */
export function tabungIcon(templateType?: string | null, icon?: string | null): LucideIcon {
  const goal = TABUNG_GOALS.find((g) => g.key === templateType);
  if (goal) return goal.icon;
  return (icon && LEGACY[icon]) || PiggyBank;
}
