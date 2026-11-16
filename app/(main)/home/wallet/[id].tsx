import { useLocalSearchParams } from 'expo-router';
import { AccountDetailScreen } from '@/components/accounts/AccountDetailScreen';

/** home/wallet/[id] — e-wallet detail; reloads show as transfers in (+, ↗). */
export default function WalletScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <AccountDetailScreen accountId={id ?? ''} kind="wallet" />;
}
