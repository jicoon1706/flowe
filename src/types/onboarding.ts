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
  /** Icon key persisted to tabung_accounts.icon. */
  icon: string;
  /** Goal type (constants/tabungGoals). */
  templateType?: string;
  /** Money already saved before Flowe: becomes the opening balance, not a contribution. */
  startingAmount?: number;
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