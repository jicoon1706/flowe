import { MALAYSIAN_BANKS } from '../../constants/banks';

const FALLBACK = '#94a3b8';

export function accountColor(account: any): string {
  if (account?.type === 'bank') {
    const bankName = account?.bank_accounts?.bank_name?.toLowerCase();
    if (bankName) {
      const preset = MALAYSIAN_BANKS.find(
        (b) => b.id === bankName || b.name.toLowerCase() === bankName
      );
      if (preset) return preset.color;
    }
  }
  return account?.color ?? FALLBACK;
}
