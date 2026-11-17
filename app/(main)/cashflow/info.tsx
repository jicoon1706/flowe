import { useCallback, useMemo, useState } from 'react';
import { RefreshControl, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Plus, RefreshCw, Shield, Workflow } from 'lucide-react-native';
import { colors, radius } from '@/theme/tokens';
import { assetTypeOption, liabilityTypeOption } from '@/constants/balanceSheetTypes';
import { AssetSheet, type AssetInput } from '@/components/cashflow/AssetSheet';
import { CashFlowDiagram } from '@/components/cashflow/CashFlowDiagram';
import { CashFlowPatternDiagram } from '@/components/cashflow/CashFlowPatternDiagram';
import { StatementLine } from '@/components/cashflow/StatementLine';
import { LiabilitySheet, type LiabilityInput } from '@/components/cashflow/LiabilitySheet';
import { Button } from '@/components/ui/Button';
import { ConfirmSheet } from '@/components/ui/ConfirmSheet';
import { EmptyState } from '@/components/ui/EmptyState';
import { FullScreenModal } from '@/components/ui/FullScreenModal';
import { GlassChip } from '@/components/ui/GlassChip';
import { HeroScreen } from '@/components/ui/HeroScreen';
import { ResponsiveColumns } from '@/src/components/ui/ResponsiveGrid';
import { Money } from '@/components/ui/Money';
import { SettingsRow } from '@/components/ui/SettingsRow';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { TopBar } from '@/components/ui/TopBar';
import { TransactionRow } from '@/components/ui/TransactionRow';
import { useToast } from '@/components/ui/ToastProvider';
import { useAuth } from '@/context/AuthContext';
import { useLock } from '@/context/LockContext';
import { useAccounts } from '@/src/hooks/useAccounts';
import { useAssets } from '@/src/hooks/useAssets';
import { useLiabilities } from '@/src/hooks/useLiabilities';
import { useRecurring } from '@/src/hooks/useRecurring';
import { useTransactions } from '@/src/hooks/useTransactions';
import { transactionsRepository } from '@/src/repositories/transactions.repository';
import { CLASS_LABEL, coverRatio, financialClass } from '@/src/lib/cashflow';
import { formatRM } from '@/src/lib/money';
import { sumBalances, spendableAccounts, type AnyAccount } from '@/src/utils/accountDisplay';
import { localYMD } from '@/src/utils/date';
import type { Asset, Liability } from '@/src/types';

/**
 * cashflow/info — income statement + balance sheet, class badge on the hero
 * (tap → patterns), diagram card, Add asset / Add liability sheets.
 */
export default function CashflowInfoScreen() {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const { locked } = useLock();
  const now = new Date();
  const { income, expenses, loading: txLoading, refetch } = useTransactions(now.getFullYear(), now.getMonth() + 1);
  const { assets, loading: aLoading, error: aError, fetchAssets, createAsset, updateAsset, deleteAsset } = useAssets();
  const { liabilities, loading: lLoading, error: lError, fetchLiabilities, createLiability, updateLiability, deleteLiability } = useLiabilities();
  const { accounts, fetchAccounts } = useAccounts();
  const { createRecurring } = useRecurring();
  const [assetSheet, setAssetSheet] = useState<{ initial: Asset | null } | null>(null);
  const [liabSheet, setLiabSheet] = useState<{ initial: Liability | null } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ kind: 'asset' | 'liability'; id: string; name: string } | null>(null);
  const [diagram, setDiagram] = useState(false);
  const [patterns, setPatterns] = useState(false);
  const [fetched, setFetched] = useState(false);

  const load = useCallback(async () => {
    await Promise.all([fetchAssets(), fetchLiabilities(), fetchAccounts(), refetch()]);
    setFetched(true);
  }, [fetchAssets, fetchLiabilities, fetchAccounts, refetch]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const all = accounts as AnyAccount[];
  const cash = sumBalances(all);
  const assetValue = assets.reduce((s, a) => s + Number(a.current_value), 0);
  const totalAssets = cash + assetValue;
  const totalLiab = liabilities.reduce((s, l) => s + Number(l.amount_owed), 0);
  const passive = assets.reduce((s, a) => s + Number(a.monthly_income || 0), 0);
  const totalIncome = income.reduce((s, t) => s + Number(t.amount), 0);
  const totalExpenses = expenses.reduce((s, t) => s + Number(t.amount), 0);
  const cls = financialClass(totalAssets, passive, totalExpenses);
  const ratio = coverRatio(totalAssets, totalLiab);
  const monthShort = now.toLocaleDateString('en-MY', { month: 'short' });
  const incomeDetail = useMemo(() => {
    const by = new Map<string, number>();
    for (const t of income) by.set(t.category || 'Other', (by.get(t.category || 'Other') ?? 0) + Number(t.amount));
    return [...by.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k, v]) => `${k.charAt(0).toUpperCase()}${k.slice(1)} ${Math.round(v).toLocaleString('en-MY')}`).join(' · ') || 'No income yet';
  }, [income]);
  const assetsLabel = ['cash', ...assets.slice(0, 2).map((a) => a.name)].join(' + ');
  const liabLabel = liabilities.slice(0, 2).map((l) => l.name).join(' + ') || 'none';
  const firstLoad = (aLoading || lLoading || txLoading) && !fetched;

  const saveAsset = async (a: AssetInput) => {
    if (!user) return false;
    const editing = assetSheet?.initial;
    const res = editing
      ? await updateAsset(editing.id, { name: a.name, type: a.type, icon: a.iconKey, current_value: a.value, quantity: a.quantity, unit: a.unit, monthly_income: a.monthlyIncome, note: a.note }, a.asOfMonth)
      : await createAsset({ user_id: user.id, name: a.name, type: a.type, icon: a.iconKey, current_value: a.value, quantity: a.quantity, unit: a.unit, monthly_income: a.monthlyIncome, note: a.note, as_of_month: a.asOfMonth });
    if (!res.ok) { toast.failure(editing ? 'Couldn’t save asset' : 'Couldn’t add asset', { label: 'Retry', onPress: () => saveAsset(a) }); return false; }
    if (a.fundFromAccountId && a.contribution > 0) {
      const tx = await transactionsRepository.create({
        user_id: user.id, type: 'transfer', name: editing ? `Top-up ${a.name}` : `Into ${a.name}`, amount: a.contribution,
        category: a.name, from_account_id: a.fundFromAccountId, date: localYMD(new Date()), asset_id: editing ? editing.id : res.ok ? (res.data as Asset).id : undefined,
      });
      if (!tx.ok) toast.failure('Asset saved, but the account wasn’t charged');
    }
    toast.success(editing ? 'Asset updated' : `Asset added · ${a.name}`);
    load();
    return true;
  };

  const saveLiability = async (l: LiabilityInput) => {
    if (!user) return false;
    const editing = liabSheet?.initial;
    const res = editing
      ? await updateLiability(editing.id, { name: l.name, type: l.type, icon: l.iconKey, amount_owed: l.amountOwed, monthly_payment: l.monthlyPayment, interest_rate: l.interestRate }, l.asOfMonth)
      : await createLiability({ user_id: user.id, name: l.name, type: l.type, icon: l.iconKey, amount_owed: l.amountOwed, monthly_payment: l.monthlyPayment, interest_rate: l.interestRate, as_of_month: l.asOfMonth });
    if (!res.ok) { toast.failure(editing ? 'Couldn’t save liability' : 'Couldn’t add liability', { label: 'Retry', onPress: () => saveLiability(l) }); return false; }
    if (l.addRecurring) {
      const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const rule = await createRecurring({ user_id: user.id, type: 'expense', name: l.name, amount: l.monthlyPayment, category: 'bills', frequency: 'monthly', start_date: localYMD(next), next_date: localYMD(next) });
      if (!rule.ok) toast.failure('Saved, but the recurring bill wasn’t added');
    }
    toast.success(editing ? 'Liability updated' : `Liability added · ${l.name}`);
    load();
    return true;
  };

  const remove = async () => {
    if (!confirmDelete) return;
    const res = confirmDelete.kind === 'asset' ? await deleteAsset(confirmDelete.id) : await deleteLiability(confirmDelete.id);
    if (!res.ok) { toast.failure('Delete failed', { label: 'Retry', onPress: remove }); return; }
    setConfirmDelete(null);
    toast.success(`${confirmDelete.name} removed`);
    load();
  };

  return (
    <HeroScreen
      heroHeight={300}
      refreshControl={<RefreshControl refreshing={(aLoading || lLoading) && fetched} onRefresh={load} tintColor={colors['on-primary']} />}
      hero={
        <View>
          <TopBar title="Cashflow info" onBack={() => router.back()} />
          <View style={{ alignItems: 'center', gap: 12, marginTop: 28 }}>
            {firstLoad ? (
              <><Skeleton width={90} height={14} tone="glass" /><Skeleton width={240} height={56} tone="glass" /></>
            ) : (
              <>
                <Text variant="body-lg" tone="soft">Net worth</Text>
                <Money amount={totalAssets - totalLiab} variant="numeric-lg" on="gradient" smallCurrency masked={locked} />
                <GlassChip icon={Shield} label={`${CLASS_LABEL[cls]}${ratio ? ` · assets cover ${ratio}× debts` : ''}`} onPress={() => setPatterns(true)} accessibilityLabel={`${CLASS_LABEL[cls]}. Show cash flow patterns`} />
              </>
            )}
          </View>
        </View>
      }
      overlay={
        <>
          <AssetSheet visible={!!assetSheet} initial={assetSheet?.initial ?? null} accounts={spendableAccounts(all)} onClose={() => setAssetSheet(null)} onSubmit={saveAsset}
            onDelete={() => { const a = assetSheet?.initial; if (a) { setAssetSheet(null); setConfirmDelete({ kind: 'asset', id: a.id, name: a.name }); } }} />
          <LiabilitySheet visible={!!liabSheet} initial={liabSheet?.initial ?? null} onClose={() => setLiabSheet(null)} onSubmit={saveLiability}
            onDelete={() => { const l = liabSheet?.initial; if (l) { setLiabSheet(null); setConfirmDelete({ kind: 'liability', id: l.id, name: l.name }); } }} />
          <ConfirmSheet
            visible={!!confirmDelete}
            title={`Remove ${confirmDelete?.name ?? ''}?`}
            message={`It leaves your balance sheet and net worth. Transactions you made into it stay in your history.`}
            confirmLabel="Remove"
            loadingLabel="Removing…"
            onConfirm={remove}
            onCancel={() => setConfirmDelete(null)}
          />
          <FullScreenModal visible={diagram} title="Cash flow diagram" onClose={() => setDiagram(false)}>
            <CashFlowDiagram
              income={{ label: 'Income', amount: totalIncome, detail: incomeDetail }}
              expenses={{ label: 'Expenses', amount: totalExpenses, detail: totalExpenses ? 'Food, bills, transport…' : 'No spending yet' }}
              assets={{ label: 'Assets', amount: totalAssets, detail: [`Cash ${cash.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`, ...assets.slice(0, 2).map((a) => `${a.name} ${Math.round(Number(a.current_value)).toLocaleString('en-MY')}`)].join(' · ') }}
              liabilities={{ label: 'Liabilities', amount: totalLiab, detail: liabLabel }}
              assetFlow={passive > 0 ? `${assets.filter((a) => Number(a.monthly_income) > 0).map((a) => a.name).slice(0, 2).join(', ')} income` : null}
              liabilityFlow={liabilities.find((l) => Number(l.monthly_payment) > 0) ? `${liabilities.find((l) => Number(l.monthly_payment) > 0)?.name} ${formatRM(Number(liabilities.find((l) => Number(l.monthly_payment) > 0)?.monthly_payment))}/mo` : null}
              passiveIncome={passive}
              totalExpenses={totalExpenses}
            />
          </FullScreenModal>
          <FullScreenModal visible={patterns} title="Cash flow patterns" onClose={() => setPatterns(false)}>
            <CashFlowPatternDiagram current={cls} />
          </FullScreenModal>
        </>
      }
    >
      {(aError || lError) && !assets.length && !liabilities.length && fetched ? (
        <EmptyState icon={RefreshCw} title="Couldn’t load your balance sheet" body="Check your connection and try again." ctaLabel="Try again" onCta={load} />
      ) : null}
      <ResponsiveColumns>
        <View style={{ backgroundColor: colors['surface-container'], borderRadius: radius.md, padding: 16, gap: 10 }}>
          <Text variant="label-lg">Income statement · {monthShort}</Text>
          <StatementLine label="Income" amount={totalIncome} direction="income" masked={locked} />
          <StatementLine label="Expenses" amount={totalExpenses} direction="expense" masked={locked} />
          <View style={{ height: 1, backgroundColor: colors['surface-container-high'] }} />
          <StatementLine label="Net cashflow" amount={Math.abs(totalIncome - totalExpenses)} direction={totalIncome - totalExpenses >= 0 ? 'income' : 'expense'} masked={locked} />
        </View>
        <View style={{ backgroundColor: colors['surface-container'], borderRadius: radius.md, padding: 16, gap: 10 }}>
          <Text variant="label-lg">Balance sheet</Text>
          <StatementLine label={`Assets · ${assetsLabel}`} amount={totalAssets} masked={locked} />
          <StatementLine label={`Liabilities · ${liabLabel}`} amount={totalLiab} masked={locked} />
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
            <Button label="Add asset" icon={Plus} variant="white" height={44} onPress={() => setAssetSheet({ initial: null })} style={{ flex: 1 }} />
            <Button label="Add liability" icon={Plus} variant="white" height={44} onPress={() => setLiabSheet({ initial: null })} style={{ flex: 1 }} />
          </View>
        </View>
      </ResponsiveColumns>
      {assets.length || liabilities.length ? (
        <View>
          {assets.map((a) => (
            <TransactionRow key={a.id} title={a.name} meta={`${assetTypeOption(a.type).label}${Number(a.monthly_income) ? ` · ${formatRM(Number(a.monthly_income))}/mo` : ''}`} amount={Number(a.current_value)} direction="none" icon={assetTypeOption(a.type).icon} masked={locked} onPress={() => setAssetSheet({ initial: a })} />
          ))}
          {liabilities.map((l) => (
            <TransactionRow key={l.id} title={l.name} meta={`${liabilityTypeOption(l.type).label}${Number(l.monthly_payment) ? ` · ${formatRM(Number(l.monthly_payment))}/mo` : ''}`} amount={Number(l.amount_owed)} direction="expense" icon={liabilityTypeOption(l.type).icon} masked={locked} onPress={() => setLiabSheet({ initial: l })} />
          ))}
        </View>
      ) : null}
      <SettingsRow label="Cash flow diagram" value="How money moves between the four boxes" icon={Workflow} onPress={() => setDiagram(true)} />
    </HeroScreen>
  );
}

