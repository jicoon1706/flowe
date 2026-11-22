import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { Landmark, PiggyBank, Plus, RefreshCw, Wallet } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { colors } from '@/theme/tokens';
import { tabungIcon } from '@/constants/tabungGoals';
import { AccountDraftForm } from '@/components/onboarding/AccountDraftForm';
import { EmptyState } from '@/components/ui/EmptyState';
import { GlassChip } from '@/components/ui/GlassChip';
import { GlassIconButton } from '@/components/ui/GlassIconButton';
import { HeroScreen } from '@/components/ui/HeroScreen';
import { ResponsiveGrid } from '@/components/ui/ResponsiveGrid';
import { Money } from '@/components/ui/Money';
import { Sheet } from '@/components/ui/Sheet';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { TopBar } from '@/components/ui/TopBar';
import { TransactionRow } from '@/components/ui/TransactionRow';
import { useToast } from '@/components/ui/ToastProvider';
import { useAuth } from '@/context/AuthContext';
import { useLock } from '@/context/LockContext';
import { useAccounts } from '@/src/hooks/useAccounts';
import { createAccountFromDraft } from '@/src/services/onboarding';
import { sourceAccounts } from '@/src/lib/detectPreferences';
import { formatRM } from '@/src/lib/money';
import { accountBalance, accountDomain, accountMask, ACCOUNT_GROUP_LABEL, sumBalances, type AnyAccount } from '@/src/utils/accountDisplay';
import type { DraftAccount } from '@/src/types/onboarding';
import * as FloweNotifications from '@/modules/flowe-notifications';

function detailHref(a: AnyAccount): Href {
  if (a.type === 'tabung') return `/home/tabung/${a.id}`;
  if (a.type === 'wallet') return `/home/wallet/${a.id}`;
  return `/home/account/${a.id}`;
}

/** home/accounts — Banks / E-wallets / Tabung with subtotals; glass "+" adds an account. */
export default function AccountsScreen() {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const { locked } = useLock();
  const params = useLocalSearchParams<{ add?: string }>();
  const { accounts, loading, error, fetchAccounts } = useAccounts();
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [detectOn, setDetectOn] = useState<Set<string>>(new Set());
  const [fetched, setFetched] = useState(false);

  useFocusEffect(useCallback(() => { fetchAccounts().then(() => setFetched(true)); }, [fetchAccounts]));
  useEffect(() => { if (params.add === '1') setAdding(true); }, [params.add]);
  useEffect(() => {
    if (!FloweNotifications.isAvailable || !FloweNotifications.isEnabled()) return;
    sourceAccounts.all().then((map) => setDetectOn(new Set(Object.values(map).filter((v): v is string => !!v))));
  }, [accounts]);

  const all = accounts as AnyAccount[];
  const groups = useMemo(() => (['bank', 'wallet', 'tabung'] as const)
    .map((t) => ({ type: t, items: all.filter((a) => a.type === t) }))
    .filter((g) => g.items.length), [all]);
  const tabungCount = all.filter((a) => a.type === 'tabung').length;
  const otherCount = all.length - tabungCount;

  const newTabung = () => { setAdding(false); router.push('/tabung/new'); };

  const add = async (draft: DraftAccount) => {
    if (!user) return;
    setSaving(true);
    const res = await createAccountFromDraft(user.id, draft);
    setSaving(false);
    if (!res.ok) { toast.failure('Couldn’t add account', { label: 'Retry', onPress: () => add(draft) }); return; }
    setAdding(false);
    await fetchAccounts();
    toast.success(draft.kind === 'tabung' ? `Tabung created · ${draft.name}` : 'Account added');
  };

  const meta = (a: AnyAccount) => {
    if (a.type === 'tabung') {
      const t = a.tabung_accounts;
      return t && Number(t.target_amount) > 0 ? `Target ${formatRM(Number(t.target_amount))}` : 'Tabung';
    }
    return [accountMask(a), detectOn.has(a.id) ? 'auto-detect on' : null].filter(Boolean).join(' · ') || (a.type === 'wallet' ? 'E-wallet' : 'Bank');
  };

  const firstLoad = loading && !fetched;

  return (
    <HeroScreen
      heroHeight={330}
      refreshControl={<RefreshControl refreshing={loading && fetched} onRefresh={fetchAccounts} tintColor={colors['on-primary']} />}
      hero={
        <View>
          <TopBar title="Accounts" onBack={() => router.back()} right={<GlassIconButton icon={Plus} accessibilityLabel="Add account" onPress={() => setAdding(true)} />} />
          <View style={{ alignItems: 'center', gap: 12, marginTop: 36 }}>
            {firstLoad ? (
              <>
                <Skeleton width={160} height={14} tone="glass" />
                <Skeleton width={240} height={56} tone="glass" />
              </>
            ) : (
              <>
                <Text variant="body-lg" tone="soft">Net worth in accounts</Text>
                <Money amount={sumBalances(all)} variant="numeric-lg" on="gradient" smallCurrency masked={locked} />
                <GlassChip align="center" icon={Wallet} label={`${otherCount} account${otherCount === 1 ? '' : 's'} · ${tabungCount} Tabung`} />
              </>
            )}
          </View>
        </View>
      }
      overlay={
        <Sheet visible={adding} onClose={() => setAdding(false)} title="Add account" scroll dismissible={!saving}>
          <AccountDraftForm onAdd={add} submitLabel={saving ? 'Adding…' : 'Add account'} onNewTabung={newTabung} />
        </Sheet>
      }
    >
      {firstLoad ? (
        <View style={{ gap: 12 }} accessibilityLabel="Loading accounts">
          {/* One column on phone, two on tablet (t-q-skel-accounts). */}
          <ResponsiveGrid gap={16} rowGap={12}>
          {['Banks', 'E-wallets', 'Tabung'].map((g) => (
            <View key={g} style={{ gap: 8 }}>
              <Skeleton width={120} height={12} />
              {[0, 1].map((i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Skeleton width={40} height={40} />
                  <View style={{ flex: 1, gap: 6 }}><Skeleton width="50%" height={14} /><Skeleton width="30%" height={10} /></View>
                  <Skeleton width={80} height={14} />
                </View>
              ))}
            </View>
          ))}
          </ResponsiveGrid>
        </View>
      ) : error && all.length === 0 ? (
        <EmptyState icon={RefreshCw} title="Couldn’t load accounts" body="Check your connection and try again." ctaLabel="Try again" onCta={fetchAccounts} />
      ) : all.length === 0 ? (
        <EmptyState icon={Landmark} title="No accounts yet" body="Add a bank, e-wallet or Tabung to start." ctaLabel="Add account" ctaIcon={Plus} onCta={() => setAdding(true)} />
      ) : (
        groups.map((g) => (
          <View key={g.type} style={{ gap: 2 }}>
            <Text variant="label-sm" tone="muted" accessibilityRole="header">
              {ACCOUNT_GROUP_LABEL[g.type]} · {locked ? 'RM •••••' : formatRM(sumBalances(g.items))}
            </Text>
            <ResponsiveGrid gap={16} rowGap={2}>
              {g.items.map((a) => (
                <TransactionRow
                  key={a.id}
                  title={a.name}
                  meta={meta(a)}
                  amount={accountBalance(a)}
                  direction="none"
                  domain={accountDomain(a)}
                  icon={a.type === 'tabung' ? tabungIcon(a.tabung_accounts?.template_type, a.tabung_accounts?.icon) : a.type === 'wallet' ? Wallet : Landmark}
                  masked={locked}
                  onPress={() => router.push(detailHref(a))}
                  trailing={<Money amount={accountBalance(a)} weight={600} masked={locked} />}
                />
              ))}
            </ResponsiveGrid>
          </View>
        ))
      )}
      {/* Goal-first Tabung creation (journey §5.1.7): type → name, target, date. */}
      {!firstLoad && !(error && all.length === 0) ? (
        <Button label="New Tabung" variant="action" icon={PiggyBank} onPress={newTabung} fullWidth />
      ) : null}
    </HeroScreen>
  );
}
