import type { LucideIcon } from 'lucide-react-native';
import { Briefcase, Building2, Car, ChartPie, Coins, CreditCard, GraduationCap, HeartPulse, House, Landmark, LayoutGrid, Lock, Package, ShieldCheck, TrendingUp } from 'lucide-react-native';
import type { AssetType, LiabilityType } from '../src/types/database.types';

export interface BalanceTypeOption<T extends string> {
  value: T;
  label: string;
  icon: LucideIcon;
  /** Stored in the row's `icon` column (varchar). */
  iconKey: string;
}

/** Asset types (DB enum) in the type picker's order and icons (canvas mn-asset-type-picker). */
export const ASSET_TYPES: BalanceTypeOption<AssetType>[] = [
  { value: 'stocks', label: 'Stocks / ETF', icon: TrendingUp, iconKey: 'stocks' },
  { value: 'unit_trust', label: 'Unit trust', icon: ChartPie, iconKey: 'unit_trust' },
  { value: 'asb', label: 'ASB', icon: Landmark, iconKey: 'asb' },
  { value: 'fixed_deposit', label: 'Fixed deposit', icon: Lock, iconKey: 'fixed_deposit' },
  { value: 'gold', label: 'Gold', icon: Coins, iconKey: 'gold' },
  { value: 'real_estate', label: 'Property', icon: House, iconKey: 'real_estate' },
  { value: 'vehicle', label: 'Vehicle', icon: Car, iconKey: 'vehicle' },
  { value: 'business', label: 'Business', icon: Briefcase, iconKey: 'business' },
  { value: 'kwsp', label: 'KWSP / EPF', icon: ShieldCheck, iconKey: 'kwsp' },
  { value: 'others', label: 'Other', icon: LayoutGrid, iconKey: 'others' },
];

/** Types with their own form (mn-gold-*, mn-kwsp-*); the rest use the single-value sheet. */
export const VALUED_ASSET_TYPES: readonly AssetType[] = ['gold', 'kwsp'];

/** Assets held as a physical amount as well as ringgit (grams of gold). */
export const UNIT_FOR_ASSET: Partial<Record<AssetType, string>> = { gold: 'g' };

export const LIABILITY_TYPES: BalanceTypeOption<LiabilityType>[] = [
  { value: 'study_loan', label: 'Study loan', icon: GraduationCap, iconKey: 'study_loan' },
  { value: 'car_loan', label: 'Car loan', icon: Car, iconKey: 'car_loan' },
  { value: 'mortgage', label: 'Mortgage', icon: Building2, iconKey: 'mortgage' },
  { value: 'credit_card', label: 'Credit card', icon: CreditCard, iconKey: 'credit_card' },
  { value: 'business_loan', label: 'Business loan', icon: Briefcase, iconKey: 'business_loan' },
  { value: 'medical_loan', label: 'Medical loan', icon: HeartPulse, iconKey: 'medical_loan' },
  { value: 'others', label: 'Other', icon: Package, iconKey: 'others' },
];

export function assetTypeOption(t: string | undefined): BalanceTypeOption<AssetType> {
  return ASSET_TYPES.find((o) => o.value === t) ?? ASSET_TYPES[ASSET_TYPES.length - 1];
}

export function liabilityTypeOption(t: string | undefined): BalanceTypeOption<LiabilityType> {
  return LIABILITY_TYPES.find((o) => o.value === t) ?? LIABILITY_TYPES[LIABILITY_TYPES.length - 1];
}
