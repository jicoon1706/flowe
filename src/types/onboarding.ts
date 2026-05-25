import type { TabungIcon } from '../../constants/banks';

export type DraftBank = {
  kind: 'bank';
  bankId: string;
  customName?: string;
  accountLast4?: string;
  openingBalance: number;
};

export type DraftTabung = {
  kind: 'tabung';
  name: string;
  icon: TabungIcon;
  target: number;
  fromDate: string;
  toDate: string;
  linkedBankId?: string;
};

export type DraftWallet = {
  kind: 'wallet';
  name: string;
  openingBalance: number;
};

export type DraftAccount = DraftBank | DraftTabung | DraftWallet;