import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { BellRing, RefreshCw, Search, X } from 'lucide-react-native';
import { TransactionDetail } from '@/components/home/TransactionDetail';
import { TransactionList } from '@/components/home/TransactionList';
import { EmptyState } from '@/components/ui/EmptyState';
import { GlassIconButton } from '@/components/ui/GlassIconButton';
import { HeroScreen } from '@/components/ui/HeroScreen';
import { TextInput } from '@/components/ui/TextInput';
import { TopBar } from '@/components/ui/TopBar';
import { colors } from '@/theme/tokens';
import { useAuth } from '@/context/AuthContext';
import { useLock } from '@/context/LockContext';
import { useAccounts } from '@/src/hooks/useAccounts';
import { useCustomCategories } from '@/src/hooks/useCustomCategories';
import { useTransactions } from '@/src/hooks/useTransactions';
import { describeTransaction, editParams, type TxWithAccounts } from '@/src/utils/transactionDisplay';
import type { AnyAccount } from '@/src/utils/accountDisplay';

/** "Recent Transactions" full list (core-home-scrolled → View All; st-recent-*). */
export default function TransactionsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { locked } = useLock();
  const params = useLocalSearchParams<{ category?: string; month?: string }>();
  const now = new Date();
  const [py, pm] = (params.month ?? '').split('-').map(Number);
  const year = py || now.getFullYear();
  const monthNum = pm || now.getMonth() + 1;
  const { transactions, loading, error, refetch } = useTransactions(year, monthNum);
  const { accounts, fetchAccounts } = useAccounts();
  const { categories: custom, fetchCategories } = useCustomCategories();
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [detail, setDetail] = useState<TxWithAccounts | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(useCallback(() => { refetch(); fetchAccounts(); }, [refetch, fetchAccounts]));
  useEffect(() => { if (user) fetchCategories(user.id); }, [user, fetchCategories]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = (transactions as TxWithAccounts[]).filter((t) => !params.category || (t.type === 'expense' && (t.category || 'others') === params.category));
    if (!q) return list;
    return list.filter((t) => t.name.toLowerCase().includes(q) || describeTransaction(t, custom).label.toLowerCase().includes(q) || (t.note ?? '').toLowerCase().includes(q));
  }, [transactions, query, custom, params.category]);

  const body = error && transactions.length === 0 ? (
    <EmptyState icon={RefreshCw} title="Couldn’t load transactions" body="Check your connection and try again." ctaLabel="Try again" ctaIcon={RefreshCw} onCta={refetch} />
  ) : !loading && transactions.length === 0 ? (
    <EmptyState
      icon={BellRing}
      title="No transactions yet"
      body="Turn on auto-detect and your bank alerts become one-tap confirmations."
      ctaLabel="Turn on auto-detect"
      ctaIcon={BellRing}
      onCta={() => router.push('/settings/auto-detect')}
    />
  ) : !loading && rows.length === 0 ? (
    <EmptyState icon={Search} title="Nothing matches" body={`No transactions this month match “${query}”.`} />
  ) : (
    <TransactionList transactions={rows} customCategories={custom} masked={locked} loading={loading} onPress={setDetail} />
  );

  return (
    <HeroScreen
      hero={
        <TopBar
          title={params.category ? describeTransaction({ type: 'expense', category: params.category } as TxWithAccounts, custom).label : 'Recent Transactions'}
          onBack={() => router.back()}
          right={<GlassIconButton icon={searching ? X : Search} accessibilityLabel={searching ? 'Close search' : 'Search transactions'} onPress={() => { setSearching((s) => !s); setQuery(''); }} />}
        />
      }
      heroHeight={200}
      refreshControl={<RefreshControl refreshing={refreshing} tintColor={colors['on-primary']} onRefresh={async () => { setRefreshing(true); await refetch(); setRefreshing(false); }} />}
      overlay={
        <TransactionDetail
          visible={!!detail}
          transaction={detail}
          accounts={accounts as AnyAccount[]}
          customCategories={custom}
          masked={locked}
          onClose={() => setDetail(null)}
          onChanged={() => { refetch(); fetchAccounts(); }}
          onEdit={(tx) => router.push({ pathname: '/add-transaction', params: editParams(tx) })}
        />
      }
    >
      {searching ? <TextInput value={query} onChangeText={setQuery} placeholder="Search name, category or note" autoFocus accessibilityLabel="Search transactions" returnKeyType="search" /> : null}
      {body}
    </HeroScreen>
  );
}
