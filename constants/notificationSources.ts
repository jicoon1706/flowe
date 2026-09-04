// Apps whose notifications Flowe can read to auto-detect transactions. The
// package name is what the Android NotificationListenerService filters on; the
// bank id links a detection back to the user's account (see resolveDetectedAccount).
export interface NotificationSource {
  /** Android package name. */
  packageId: string;
  /** Shown in Settings → Auto-detect. */
  label: string;
  /** Matching `MALAYSIAN_BANKS` id, when the app is a bank app. */
  bankId?: string;
  /** Wallet apps spend from an e-wallet rather than a bank account. */
  wallet?: boolean;
}

export const NOTIFICATION_SOURCES: NotificationSource[] = [
  { packageId: 'com.maybank2u.life', label: 'Maybank MAE', bankId: 'maybank' },
  { packageId: 'com.maybank2u.m2umobile', label: 'Maybank2u', bankId: 'maybank' },
  { packageId: 'com.cimb.cimbclicks', label: 'CIMB Clicks', bankId: 'cimb' },
  { packageId: 'com.cimb.octo', label: 'CIMB OCTO', bankId: 'cimb' },
  { packageId: 'com.pbb.pbengine', label: 'PB engage MY', bankId: 'public' },
  { packageId: 'com.rhbgroup.mobilebanking', label: 'RHB Mobile Banking', bankId: 'rhb' },
  { packageId: 'com.hlb.connect', label: 'HLB Connect', bankId: 'hong-leong' },
  { packageId: 'com.ambank.amonline', label: 'AmOnline', bankId: 'ambank' },
  { packageId: 'com.bankislam.bimb', label: 'Bank Islam GO', bankId: 'bank-islam' },
  { packageId: 'my.com.bsn.mybsn', label: 'myBSN', bankId: 'bsn' },
  { packageId: 'com.setel.mobile', label: 'Setel', wallet: true },
  { packageId: 'my.com.tngdigital.ewallet', label: "Touch 'n Go eWallet", wallet: true },
  { packageId: 'com.grabtaxi.passenger', label: 'Grab', wallet: true },
  { packageId: 'com.boost.consumer', label: 'Boost', wallet: true },
  { packageId: 'com.shopee.my', label: 'ShopeePay', wallet: true },
];

// There is no "watch everything" default: an app the user holds no account
// with can only produce detections they can't file, so Settings → Auto-detect
// seeds the watch list from the apps that actually map to one of their accounts.

export function sourceForPackage(packageId: string): NotificationSource | undefined {
  return NOTIFICATION_SOURCES.find((s) => s.packageId === packageId);
}
