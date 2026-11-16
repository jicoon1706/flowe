import { useLocalSearchParams } from 'expo-router';
import { AccountDetailScreen } from '@/components/accounts/AccountDetailScreen';

/** home/account/[id] — bank account detail. */
export default function BankAccountScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <AccountDetailScreen accountId={id ?? ''} kind="bank" />;
}
